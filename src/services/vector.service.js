import weaviate from "weaviate-ts-client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import RoomModel from "~/models/Room.model.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let client = null;

export async function initWeaviate() {
  try {
    client = await weaviate.connectToWeaviateCloud(
      process.env.WEAVIATE_URL,
      {
        apiKey: process.env.WEAVIATE_API_KEY
      }
    );

    console.log(" Connected to Weaviate Cloud");
  } catch (err) {
    console.error(" Weaviate connect error:", err.message);
  }
}

export function getClient() {
  return client;
}

export async function createEmbedding(text) {
  const model = genAI.getGenerativeModel({
    model: "models/text-embedding-004",
  });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function createRoomSchema() {
  const c = getClient();
  if (!c) throw new Error("Weaviate client not initialized");

  await c.collections.create({
    name: "Room",
    vectorizers: { none: {} },
    properties: [
      { name: "name", dataType: "string" },
      { name: "slug", dataType: "string" },
      { name: "address", dataType: "string" },
      { name: "price", dataType: "number" },
    ],
  });

  return "Room schema created!";
}

export async function upsertAllRooms() {
  const c = getClient();
  if (!c) throw new Error("Weaviate client not initialized");

  const collection = c.collections.get("Room");
  const rooms = await RoomModel.find({ isDeleted: false });

  for (const room of rooms) {
    const text = `${room.name} ${room.address} ${room.description}`;
    const vector = await createEmbedding(text);

    await collection.data.insert({
      id: room._id.toString(),
      properties: {
        name: room.name,
        slug: room.slug,
        address: room.address,
        price: room.price,
      },
      vector,
    });
  }

  return "Rooms synced!";
}

export async function querySimilarRooms(queryText, topK = 5) {
  const c = getClient();
  if (!c) return [];

  const vector = await createEmbedding(queryText);

  const result = await c.collections.get("Room").query.nearVector({
    vector,
    limit: topK,
  });

  return result.objects ?? [];
}

export const vectorService = {
  initWeaviate,
  createRoomSchema,
  upsertAllRooms,
  querySimilarRooms,
  createEmbedding,
};
