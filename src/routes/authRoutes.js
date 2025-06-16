import express from "express";
import { authController } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

export const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", protect, authController.getMe);