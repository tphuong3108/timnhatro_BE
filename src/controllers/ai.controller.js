import { aiService } from "../services/ai.service.js";

export const aiController = {
  chatWithAI: async (req, res) => {
    try {
      const { message } = req.body;
      const result = await aiService.sendMessage(message);
      res.json(result);
    } catch (err) {
      res.status(500).send("Error: " + err.message);
    }
  },
};
