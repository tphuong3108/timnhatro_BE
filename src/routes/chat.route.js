import express from "express";
import { chatController } from "../controllers/chat.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
const Router = express.Router();
Router.use(verifyToken);
Router.get("/", chatController.getUserChats);
Router.post("/", chatController.createOrGetChat);
Router.delete("/:id", chatController.deleteChat);

export const chatRoute = Router;
