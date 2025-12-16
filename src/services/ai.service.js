import { vectorService } from "./vector.service.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

function buildContext(matches) {
  if (!matches || !matches.length) return "";

  return matches
    .map((m, index) => {
      const room = m.metadata;
      const priceFormatted = room.price ? `${room.price.toLocaleString('vi-VN')}đ/tháng` : 'Liên hệ';
      const description = room.description ? room.description.substring(0, 150) + '...' : '';
      const amenities = room.amenities || '';
      
      return `**Phòng ${index + 1}:**
- Tên: ${room.name}
- Địa chỉ: ${room.address}
- Giá: ${priceFormatted}
- Mô tả: ${description}
${amenities ? `- Tiện ích: ${amenities}` : ''}
- Link: /phong-tro/${room.slug}`;
    })
    .join("\n\n");
}

const SYSTEM_PROMPT = `Bạn là trợ lý tìm phòng trọ thông minh của website TimNhaTro.
NHIỆM VỤ CHÍNH: Giúp người dùng tìm phòng trọ phù hợp dựa trên dữ liệu thực tế được cung cấp.

QUY TẮC QUAN TRỌNG:
1. LUÔN LUÔN trả về danh sách phòng trọ cụ thể từ dữ liệu được cung cấp
2. KHÔNG BAO GIỜ hỏi lại câu hỏi chung chung như "bạn muốn giá bao nhiêu?", "bạn cần tiện ích gì?"
3. Nếu có dữ liệu phòng, hãy LIỆT KÊ NGAY các phòng phù hợp nhất
4. Nếu không có dữ liệu phòng, hãy nói "Hiện tại chưa có phòng trọ phù hợp trong hệ thống"
5. Trả lời ngắn gọn, súc tích, tập trung vào thông tin phòng
6. Khi liệt kê phòng, sử dụng format rõ ràng với emoji để dễ đọc
7. Cuối mỗi phòng, thêm link để người dùng có thể xem chi tiết`;

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

export const aiService = {
  sendMessage: async (message) => {
    try {
      let matches = [];
      let context = "";
      
      try {
        matches = await vectorService.querySimilarRooms(message, 5);
        context = buildContext(matches);
        if (matches.length > 0) {
        }
      } catch (vectorError) {
      }

      let userPrompt;
      
      if (context && matches.length > 0) {
        userPrompt = `DANH SÁCH PHÒNG TRỌ TÌM ĐƯỢC (${matches.length} phòng):

${context}

---
CÂU HỎI CỦA NGƯỜI DÙNG: ${message}

Hãy giới thiệu các phòng trọ trên một cách thân thiện, ngắn gọn. Liệt kê từng phòng với giá và địa chỉ.`;
      } else {
        userPrompt = `Người dùng hỏi: ${message}

Lưu ý: Hiện tại không tìm thấy phòng trọ phù hợp trong hệ thống. Hãy thông báo cho người dùng và gợi ý họ thử tìm kiếm với từ khóa khác.`;
      }

      if (!GROQ_API_KEY) {
        throw new Error("Chưa cấu hình GROQ_API_KEY trong .env");
      }

      return await callGroqAPI(SYSTEM_PROMPT, userPrompt);
    } catch (err) {
      console.error("AI Service Error:", err);
      return "Lỗi hệ thống: " + err.message;
    }
  },
};