import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { userController } from "../controllers/userController.js";

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// GET /api/users/:id/profile - Buscar perfil do usuário com seus posts
router.get("/:id/profile", userController.getProfile);

export default router;
