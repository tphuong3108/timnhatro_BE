import weaviate from 'weaviate-client'; 
import RoomModel from "~/models/Room.model.js";

const weaviateURL = process.env.WEAVIATE_URL;
const weaviateApiKey = process.env.WEAVIATE_API_KEY;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

let client = null; 

// Hàm khởi tạo Weaviate
export async function initWeaviate() {
  try {
    client = await weaviate.connectToWeaviateCloud(weaviateURL, {
      authCredentials: new weaviate.ApiKey(weaviateApiKey),
    });

    const isReady = await client.isReady();
    if (!isReady) {
      throw new Error("Weaviate client is not ready after connection.");
    }
    console.log("Weaviate Client is ready? true");
    console.log("Connected to Weaviate Cloud successfully.");

  } catch (err) {
    console.error("Weaviate connection error:", err.message);
    client = null;
    throw new Error("Weaviate initialization failed: " + err.message);
  }
}

export function getClient() {
  if (!client) {
    throw new Error("Weaviate client not initialized or connection failed.");
  }
  return client;
}

export async function createEmbedding(text) {
  
  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${errorData}`);
    }

    const embeddingVector = await response.json();
    
    if (!Array.isArray(embeddingVector) || embeddingVector.length === 0) {
      console.error("LỖI CẤU TRÚC: Giá trị vector không phải là mảng hoặc mảng rỗng.");
      throw new Error("Failed to create a valid embedding vector."); 
    }
    
    return embeddingVector;

  } catch (error) {
    console.error("Lỗi khi gọi HuggingFace API để tạo Embedding:", error.message);
    throw new Error("Embedding API call failed: " + error.message);
  }
}

export async function createRoomSchema() {
  const c = getClient();
  
  try {
    await c.collections.get("Room");
    return "Room schema already exists!";
  } catch (e) {
  }
  
  await c.collections.create({
    name: "Room",
    vectorizers: { none: {} },
    properties: [
      { name: "name", dataType: "string" },
      { name: "slug", dataType: "string" },
      { name: "address", dataType: "string" },
      { name: "price", dataType: "number" },
      { name: "description", dataType: "text" },
    ],
  });

  return "Room schema created!";
}

// Xóa và tạo lại schema (dùng khi cần update schema)
export async function resetRoomSchema() {
  const c = getClient();
  
  try {
    // Xóa collection cũ nếu tồn tại
    await c.collections.delete("Room");
    console.log("Deleted old Room collection");
  } catch (e) {
    console.log("No existing Room collection to delete");
  }
  
  // Tạo lại với schema mới
  await c.collections.create({
    name: "Room",
    vectorizers: { none: {} },
    properties: [
      { name: "name", dataType: "string" },
      { name: "slug", dataType: "string" },
      { name: "address", dataType: "string" },
      { name: "price", dataType: "number" },
      { name: "description", dataType: "text" },
    ],
  });

  return "Room schema reset successfully!";
}

export async function upsertAllRooms() {
  const c = getClient();
  
  const collection = c.collections.get("Room"); 
  const rooms = await RoomModel.find({ isDeleted: false });

  let successCount = 0;
  for (const room of rooms) {
    try {
        const text = `${room.name} ${room.address} ${room.description}`;
        const vector = await createEmbedding(text); 
        
        await collection.data.insert({
          properties: {
            name: room.name,
            slug: room.slug,
            address: room.address,
            price: room.price,
            description: room.description || '',
          },
          vector,
        });
        successCount++;
    } catch (e) {
        console.error(`Lỗi khi upsert phòng trọ ${room._id}:`, e.message);
    }
  }

  return `Rooms synced! Total ${successCount} objects saved / ${rooms.length} found.`;
}

export async function querySimilarRooms(queryText, topK = 5) {
  const c = getClient();
  

  
  let vector;
  try {
      vector = await createEmbedding(queryText);
      console.log("Embedding created successfully, vector length:", vector?.length);
  } catch (error) {
      console.error("Lỗi khi tạo embedding cho truy vấn:", error.message);
      return [];
  }

  try {
    const collection = c.collections.get("Room");
    
    // Tăng limit và thêm certainty threshold thấp để bắt nhiều kết quả hơn
    const result = await collection.query.nearVector(vector, {
      limit: topK,
      returnMetadata: ['distance']
    });

    console.log("Raw Weaviate result objects count:", result.objects?.length);
    
    if (result.objects && result.objects.length > 0) {
      console.log("First match details:", {
        name: result.objects[0].properties?.name,
        distance: result.objects[0].metadata?.distance
      });
    }

    const matches = result.objects.map(item => ({
      metadata: { 
          name: item.properties.name, 
          address: item.properties.address, 
          slug: item.properties.slug, 
          price: item.properties.price,
          description: item.properties.description
      },
      score: item.metadata?.distance ?? 0
    }));
    
    console.log("Query result from Weaviate:", matches.length, "matches found.");

    return matches ?? [];
  } catch (error) {
    console.error("Lỗi khi query Weaviate:", error.message);
    console.error("Full error:", error);
    return [];
  }
}


// Lấy tất cả phòng trong Weaviate (để debug)
export async function getAllRooms() {
  const c = getClient();
  
  try {
    const collection = c.collections.get("Room");
    const result = await collection.query.fetchObjects({ limit: 100 });
    
    return result.objects.map(item => ({
      name: item.properties.name,
      address: item.properties.address,
      slug: item.properties.slug,
      price: item.properties.price,
      description: item.properties.description?.substring(0, 100)
    }));
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phòng từ Weaviate:", error.message);
    return [];
  }
}

export const vectorService = {
  initWeaviate,
  createRoomSchema,
  resetRoomSchema,
  upsertAllRooms,
  querySimilarRooms,
  createEmbedding,
  getAllRooms,
};
