import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createPost,
  getAllPosts,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
} from "../controllers/postController.js";

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// Post routes
router.route("/").post(createPost).get(getAllPosts);

router.route("/:id").get(getPostById).put(updatePost).delete(deletePost);

router.route("/user/:userId").get(getUserPosts);
router.route("/:id/like").post(likePost);

export default router;
