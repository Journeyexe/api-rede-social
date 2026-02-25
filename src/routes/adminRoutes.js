import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { adminController } from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect);
router.use(authorize("admin"));

// Statistics
router.get("/stats/dashboard", adminController.getDashboardStats);
router.get("/stats/growth", adminController.getGrowthStats);
router.get("/stats/engagement", adminController.getEngagementStats);

// User management
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id/role", adminController.updateUserRole);
router.put("/users/:id/ban", adminController.toggleBanUser);
router.delete("/users/:id", adminController.deleteUser);

// Post moderation
router.get("/posts", adminController.getAllPosts);
router.put("/posts/:id/restore", adminController.restorePost);
router.delete("/posts/:id", adminController.hardDeletePost);

// Comment moderation
router.get("/comments", adminController.getAllComments);
router.put("/comments/:id/restore", adminController.restoreComment);
router.delete("/comments/:id", adminController.hardDeleteComment);

export default router;
