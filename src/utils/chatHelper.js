import mongoose from "mongoose";

export function normalizeRoomId(roomId) {
  if (!roomId || roomId === "null" || roomId === "undefined" || roomId === "") {
    return null;
  }

  if (roomId instanceof mongoose.Types.ObjectId) return roomId;

  try {
    return new mongoose.Types.ObjectId(roomId);
  } catch {
    return null;
  }
}

export function buildChatQuery(senderId, receiverId, roomId) {
  const normalizedRoom = normalizeRoomId(roomId);


  return {
    participants: { $all: [senderId, receiverId], $size: 2 },
    roomId: normalizedRoom,
  };
}
