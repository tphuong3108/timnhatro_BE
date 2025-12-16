import weaviate from 'weaviate-ts-client'; 
import RoomModel from "~/models/Room.model.js";

const weaviateURL = process.env.WEAVIATE_URL;
const weaviateApiKey = process.env.WEAVIATE_API_KEY;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

let client = null; 

export async function initWeaviate() {
  try {
    client = weaviate.client({
      scheme: 'https',
      host: weaviateURL.replace('https://', '').replace('http://', ''),
      apiKey: new weaviate.ApiKey(weaviateApiKey),
    });

    const meta = await client.misc.metaGetter().do();
    if (!meta) {
      throw new Error("Weaviate client is not ready.");
    }

  } catch (err) {
    client = null;
    throw new Error("Weaviate initialization failed: " + err.message);
  }
}

export function getClient() {
  if (!client) {
    throw new Error("Weaviate client not initialized.");
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
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const embeddingVector = await response.json();
    
    if (!Array.isArray(embeddingVector) || embeddingVector.length === 0) {
      throw new Error("Invalid embedding vector."); 
    }
    
    return embeddingVector;
  } catch (error) {
    throw new Error("Embedding API failed: " + error.message);
  }
}

export async function createRoomSchema() {
  const c = getClient();
  
  try {
    const schema = await c.schema.classGetter().withClassName("Room").do();
    if (schema) {
      return "Room schema already exists!";
    }
  } catch (e) {
  }
  
  await c.schema.classCreator().withClass({
    class: "Room",
    vectorizer: "none",
    properties: [
      { name: "name", dataType: ["string"] },
      { name: "slug", dataType: ["string"] },
      { name: "address", dataType: ["string"] },
      { name: "price", dataType: ["number"] },
      { name: "description", dataType: ["text"] },
    ],
  }).do();

  return "Room schema created!";
}

export async function resetRoomSchema() {
  const c = getClient();
  
  try {
    await c.schema.classDeleter().withClassName("Room").do();
  } catch (e) {
  }
  
  await c.schema.classCreator().withClass({
    class: "Room",
    vectorizer: "none",
    properties: [
      { name: "name", dataType: ["string"] },
      { name: "slug", dataType: ["string"] },
      { name: "address", dataType: ["string"] },
      { name: "price", dataType: ["number"] },
      { name: "description", dataType: ["text"] },
    ],
  }).do();

  return "Room schema reset successfully!";
}

export async function upsertAllRooms() {
  const c = getClient();
  const rooms = await RoomModel.find({ isDeleted: false });

  let successCount = 0;
  for (const room of rooms) {
    try {
      const text = `${room.name} ${room.address} ${room.description}`;
      const vector = await createEmbedding(text); 
      
      await c.data.creator()
        .withClassName("Room")
        .withProperties({
          name: room.name,
          slug: room.slug,
          address: room.address,
          price: room.price,
          description: room.description || '',
        })
        .withVector(vector)
        .do();
      
      successCount++;
    } catch (e) {
    }
  }

  return `Rooms synced! Total ${successCount} objects saved / ${rooms.length} found.`;
}

export async function querySimilarRooms(queryText, topK = 5) {
  const c = getClient();

  let vector;
  try {
    vector = await createEmbedding(queryText);
  } catch (error) {
    return [];
  }

  try {
    const result = await c.graphql
      .get()
      .withClassName("Room")
      .withFields("name slug address price description")
      .withNearVector({ vector })
      .withLimit(topK)
      .do();

    const rooms = result?.data?.Get?.Room || [];
    
    return rooms.map(item => ({
      metadata: { 
        name: item.name, 
        address: item.address, 
        slug: item.slug, 
        price: item.price,
        description: item.description
      },
      score: 0
    }));
  } catch (error) {
    return [];
  }
}

export async function getAllRooms() {
  const c = getClient();
  
  try {
    const result = await c.graphql
      .get()
      .withClassName("Room")
      .withFields("name slug address price description")
      .withLimit(100)
      .do();

    return result?.data?.Get?.Room || [];
  } catch (error) {
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
