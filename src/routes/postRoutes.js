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
  savePost,
  getSavedPosts,
  getLikedPosts,
} from "../controllers/postController.js";
import commentRoutes from "./commentRoutes.js";

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// Post routes
router.route("/").post(createPost).get(getAllPosts);

router.route("/:id").get(getPostById).put(updatePost).delete(deletePost);

router.route("/user/:userId").get(getUserPosts);
router.route("/:id/like").post(likePost);
router.route("/:id/save").post(savePost);
router.route("/saved").get(getSavedPosts);
router.route("/liked").get(getLikedPosts);

// Nest comment routes under posts
router.use("/:postId/comments", commentRoutes);

export default router;
