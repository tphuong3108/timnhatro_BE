import { aiService } from "../services/ai.service.js";

export const aiController = {
  chatWithAI: async (req, res) => {
    try {
      const { message } = req.body;
      const reply = await aiService.sendMessage(message);
      res.json({ reply });
    } catch (err) {
      res.status(500).send("Error: " + err.message);
    }
  },
};
