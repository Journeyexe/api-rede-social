import Comment from "../models/commentModel.js";
import Post from "../models/postModel.js";
import { logger } from "../config/logger.js";

// Create a new comment on a post
export const createComment = async (req, res, next) => {
  try {
    const { content, parentId } = req.body;
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Create comment object
    const commentData = {
      post: postId,
      user: userId,
      content,
    };

    // If it's a reply to another comment
    if (parentId) {
      const parentComment = await Comment.findById(parentId);

      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: "Parent comment not found",
        });
      }

      commentData.parent = parentId;
      commentData.level = parentComment.level + 1;
    }

    const comment = new Comment(commentData);
    await comment.save();

    // If it's a top-level comment, increment the post's comments_count
    if (!parentId) {
      await Post.findByIdAndUpdate(postId, { $inc: { comments_count: 1 } });
    }

    // Populate user data
    await comment.populate("user", "name nickname profilePicture");

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    logger.error(`Error creating comment: ${error.message}`);
    next(error);
  }
};

// Get all comments for a post
export const getPostComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Get ALL comments for the post (including replies)
    const allComments = await Comment.find({
      post: postId,
    })
      .sort({ createdAt: -1 })
      .populate("user", "name nickname profilePicture");

    // Organize comments hierarchically
    const commentMap = new Map();
    const topLevelComments = [];

    // First pass: create map of all comments and identify top-level ones
    allComments.forEach((comment) => {
      const commentObj = comment.toObject();
      commentObj.replies = [];
      commentMap.set(comment._id.toString(), commentObj);

      if (!comment.parent) {
        topLevelComments.push(commentObj);
      }
    });

    // Second pass: organize replies under their parents
    allComments.forEach((comment) => {
      if (comment.parent) {
        const parentComment = commentMap.get(comment.parent.toString());
        if (parentComment) {
          parentComment.replies.push(commentMap.get(comment._id.toString()));
        }
      }
    });

    // Apply pagination to top-level comments only
    const paginatedTopLevel = topLevelComments.slice(skip, skip + limit);
    const total = topLevelComments.length;

    res.status(200).json({
      success: true,
      count: paginatedTopLevel.length,
      total,
      pages: Math.ceil(total / limit),
      data: paginatedTopLevel,
    });
  } catch (error) {
    logger.error(`Error getting post comments: ${error.message}`);
    next(error);
  }
};

// Get replies to a comment
export const getCommentReplies = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const replies = await Comment.find({ parent: commentId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name nickname profilePicture");

    const total = await Comment.countDocuments({ parent: commentId });

    res.status(200).json({
      success: true,
      count: replies.length,
      total,
      pages: Math.ceil(total / limit),
      data: replies,
    });
  } catch (error) {
    logger.error(`Error getting comment replies: ${error.message}`);
    next(error);
  }
};

// Update a comment
export const updateComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const { commentId } = req.params;
    const userId = req.user.id;

    // Find comment
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if the user is the owner of the comment
    if (comment.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this comment",
      });
    }

    // Update the comment
    comment.content = content;
    await comment.save();

    // Populate user data
    await comment.populate("user", "name nickname profilePicture");

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    logger.error(`Error updating comment: ${error.message}`);
    next(error);
  }
};

// Delete a comment
export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Find comment
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if the user is the owner of the comment
    if (comment.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    // Delete replies recursively
    async function deleteReplies(commentId) {
      const replies = await Comment.find({ parent: commentId });

      for (const reply of replies) {
        await deleteReplies(reply._id);
      }

      await Comment.deleteMany({ parent: commentId });
    }

    // Delete all replies
    await deleteReplies(commentId);

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // If it was a top-level comment, decrement the post's comments_count
    if (!comment.parent) {
      await Post.findByIdAndUpdate(comment.post, {
        $inc: { comments_count: -1 },
      });
    }

    res.status(200).json({
      success: true,
      message: "Comment and all replies deleted successfully",
    });
  } catch (error) {
    logger.error(`Error deleting comment: ${error.message}`);
    next(error);
  }
};

// Like or unlike a comment
export const likeComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if the comment is already liked by the user
    const isLiked = comment.likes.some((id) => id.toString() === userId);

    if (isLiked) {
      // Unlike the comment
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
    } else {
      // Like the comment
      comment.likes.push(userId);
    }

    await comment.save();

    res.status(200).json({
      success: true,
      liked: !isLiked,
      likesCount: comment.likes_count,
      data: comment,
    });
  } catch (error) {
    logger.error(`Error liking comment: ${error.message}`);
    next(error);
  }
};

// Alternative method: Get all comments for a post (flat structure with level indication)
export const getAllPostCommentsFlat = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // Get ALL comments for the post, sorted by creation date
    const comments = await Comment.find({
      post: postId,
    })
      .sort({ createdAt: 1 }) // Ascending order to maintain conversation flow
      .skip(skip)
      .limit(limit)
      .populate("user", "name nickname profilePicture");

    const total = await Comment.countDocuments({ post: postId });

    res.status(200).json({
      success: true,
      count: comments.length,
      total,
      pages: Math.ceil(total / limit),
      data: comments,
    });
  } catch (error) {
    logger.error(`Error getting all post comments: ${error.message}`);
    next(error);
  }
};
