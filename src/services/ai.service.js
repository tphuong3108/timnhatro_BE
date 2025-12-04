import { GoogleGenerativeAI } from "@google/generative-ai";
import { vectorService } from "./vector.service.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function buildContext(matches) {
  if (!matches.length) return "";

  return matches
    .map(
      (m) => `- ${m.metadata.name} | ${m.metadata.address} | score: ${m.score.toFixed(3)}`
    )
    .join("\n");
}

export const aiService = {
  sendMessage: async (message) => {
    try {
      const matches = await vectorService.querySimilarRooms(message, 5);

      const context = buildContext(matches);

      const prompt = `
      Tôi là trợ lý tìm phòng trọ.
      ${context}

      Câu hỏi: ${message}
      `;

      const model = genAI.getGenerativeModel({
        model: "models/gemini-2.0-flash",
      });

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      return " Lỗi hệ thống: " + err.message;
    }
  },
};
