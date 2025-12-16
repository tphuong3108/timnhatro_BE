import { vectorService } from "./vector.service.js";
import RoomModel from "~/models/Room.model.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

function buildContext(rooms) {
  if (!rooms || !rooms.length) return "";

  return rooms
    .map((room, index) => {
      const priceFormatted = room.price 
        ? `${room.price.toLocaleString('vi-VN')}đ/tháng` 
        : 'Liên hệ';
      
      const description = room.description 
        ? room.description.substring(0, 200) + '...' 
        : '';
      
      const amenitiesList = room.amenities?.length > 0
        ? room.amenities.map(a => a.name).join(', ')
        : '';

      return `🏠 **Phòng ${index + 1}: ${room.name}**
📍 Địa chỉ: ${room.address}
💰 Giá: ${priceFormatted}
📝 Mô tả: ${description}
${amenitiesList ? `✨ Tiện ích: ${amenitiesList}` : ''}
🔗 Xem chi tiết: /phong-tro/${room.slug}`;
    })
    .join("\n\n---\n\n");
}

const SYSTEM_PROMPT = `Bạn là trợ lý tìm phòng trọ thông minh của website TimNhaTro.

NHIỆM VỤ: Giúp người dùng tìm phòng trọ phù hợp dựa trên dữ liệu thực tế.

QUY TẮC:
1. LUÔN liệt kê các phòng trọ cụ thể từ dữ liệu được cung cấp
2. KHÔNG hỏi lại câu hỏi chung chung
3. Trả lời ngắn gọn, tập trung vào thông tin phòng
4. Format rõ ràng với emoji
5. Cuối mỗi phòng, giữ nguyên link xem chi tiết`;

async function callGroqAPI(systemPrompt, userPrompt) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Không có phản hồi.";
}

async function searchRoomsFromDB(query, limit = 5) {
  try {
    const searchRegex = new RegExp(query, 'i');
    
    const rooms = await RoomModel.find({
      isDeleted: false,
      status: 'approved',
      $or: [
        { name: searchRegex },
        { address: searchRegex },
        { description: searchRegex }
      ]
    })
    .populate('amenities', 'name')
    .limit(limit)
    .lean();

    return rooms;
  } catch (error) {
    console.error("MongoDB search error:", error.message);
    return [];
  }
}

async function searchRoomsFromVector(query, limit = 5) {
  try {
    const matches = await vectorService.querySimilarRooms(query, limit);
    
    if (!matches || matches.length === 0) {
      return [];
    }

    const slugs = matches.map(m => m.metadata?.slug).filter(Boolean);
    
    const rooms = await RoomModel.find({
      slug: { $in: slugs },
      isDeleted: false
    })
    .populate('amenities', 'name')
    .lean();

    return rooms;
  } catch (error) {
    console.error("Vector search error:", error.message);
    return [];
  }
}

export const aiService = {
  sendMessage: async (message) => {
    try {
      if (!GROQ_API_KEY) {
        throw new Error("Chưa cấu hình GROQ_API_KEY trong .env");
      }

      let rooms = [];

      rooms = await searchRoomsFromVector(message, 5);
      
      if (rooms.length === 0) {
        rooms = await searchRoomsFromDB(message, 5);
      }

      if (rooms.length === 0) {
        rooms = await RoomModel.find({ 
          isDeleted: false, 
          status: 'approved' 
        })
        .populate('amenities', 'name')
        .limit(5)
        .lean();
      }

      const context = buildContext(rooms);
      
      let userPrompt;
      
      if (context && rooms.length > 0) {
        userPrompt = `DANH SÁCH PHÒNG TRỌ (${rooms.length} phòng):

${context}

---
CÂU HỎI: ${message}

Hãy giới thiệu các phòng trên một cách thân thiện. Giữ nguyên link xem chi tiết.`;
      } else {
        userPrompt = `Người dùng hỏi: ${message}

Hiện tại không có phòng trọ nào trong hệ thống. Hãy thông báo và gợi ý người dùng quay lại sau.`;
      }

      return await callGroqAPI(SYSTEM_PROMPT, userPrompt);
    } catch (err) {
      console.error("AI Service Error:", err.message);
      return "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.";
    }
  },
};