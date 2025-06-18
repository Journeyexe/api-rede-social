import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createComment,
  getPostComments,
  getCommentReplies,
  updateComment,
  deleteComment,
  likeComment,
} from "../controllers/commentController.js";

const router = express.Router({ mergeParams: true }); // mergeParams to access params from parent router

// All routes require authentication
router.use(protect);

// Comments for a post
router.route("/").post(createComment).get(getPostComments);

// Operations on a specific comment
router.route("/:commentId").put(updateComment).delete(deleteComment);

// Get replies to a comment
router.route("/:commentId/replies").get(getCommentReplies);

// Like/unlike a comment
router.route("/:commentId/like").post(likeComment);

export default router;
