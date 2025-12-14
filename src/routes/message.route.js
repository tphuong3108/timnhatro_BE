import express from "express";
import { messageController } from "../controllers/message.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
const Router = express.Router();
Router.use(verifyToken);
Router.get("/:chatId", messageController.getMessages);
Router.post("/", messageController.sendMessage);
Router.delete("/:chatId", messageController.deleteMessages);

export const messageRoute = Router;
