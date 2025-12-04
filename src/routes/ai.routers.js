import express from "express";
import { aiController } from "../controllers/ai.controller.js";
import { weaviateController } from "../controllers/weaviate.controller.js";

const Router = express.Router();

Router.post("/chat", aiController.chatWithAI);

export const aiRoute = Router;
