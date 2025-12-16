import { vectorService } from "../services/vector.service.js";

export const weaviateController = {
  initSchema: async (req, res) => {
    try {
      await vectorService.createRoomSchema();
      res.send("Room collection created!");
    } catch (err) {
      res.status(500).send("Error: " + err.message);
    }
  },

  syncRooms: async (req, res) => {
    try {
      const result = await vectorService.upsertAllRooms();
      res.json({ message: result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  resetAndSync: async (req, res) => {
    try {
      await vectorService.resetRoomSchema();
      const result = await vectorService.upsertAllRooms();
      res.json({ message: "Schema reset thành công! " + result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
