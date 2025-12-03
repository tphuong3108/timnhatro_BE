import express from "express";
import { weaviateController } from "../controllers/weaviate.controller.js";
import { aiController } from "../controllers/ai.controller.js";

const Router = express.Router();

Router.get("/weaviate/init", weaviateController.initSchema);
Router.get("/weaviate/sync", weaviateController.syncRooms);

Router.post("/chat", aiController.chatWithAI);

export default Router;
