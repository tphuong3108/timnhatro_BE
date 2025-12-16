import express from "express";
import { weaviateController } from "../controllers/weaviate.controller.js";
import { aiController } from "../controllers/ai.controller.js";

const Router = express.Router();

Router.get("/init", weaviateController.initSchema);
Router.get("/sync", weaviateController.syncRooms);
Router.get("/reset", weaviateController.resetAndSync);

Router.post("/chat", aiController.chatWithAI);

export default Router;
