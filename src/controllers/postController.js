import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { logger } from "../config/logger.js";

// Create a new post
export const createPost = async (req, res, next) => {
  try {
    const { title, content, media_url } = req.body;
    const userId = req.user.id;

    const post = new Post({
      user: userId,
      title,
      content,
      media_url,
    });

    await post.save();

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error(`Error creating post: ${error.message}`);
    next(error);
  }
};

// Get all posts (with pagination)
export const getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name nickname profilePicture");

    const total = await Post.countDocuments();

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      pages: Math.ceil(total / limit),
      data: posts,
    });
  } catch (error) {
    logger.error(`Error getting posts: ${error.message}`);
    next(error);
  }
};

// Get posts from a specific user
export const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name nickname profilePicture");

    const total = await Post.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      pages: Math.ceil(total / limit),
      data: posts,
    });
  } catch (error) {
    logger.error(`Error getting user posts: ${error.message}`);
    next(error);
  }
};

// Get a single post by ID
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "user",
      "name nickname profilePicture"
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error(`Error getting post: ${error.message}`);
    next(error);
  }
};

// Update a post
export const updatePost = async (req, res, next) => {
  try {
    const { title, content, media_url } = req.body;
    const postId = req.params.id;

    // Find post and check if user is the owner
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if the user is the owner of the post
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this post",
      });
    }

    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        title,
        content,
        media_url,
      },
      { new: true, runValidators: true }
    ).populate("user", "name nickname profilePicture");

    res.status(200).json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    logger.error(`Error updating post: ${error.message}`);
    next(error);
  }
};

// Delete a post
export const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;

    // Find post and check if user is the owner
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if the user is the owner of the post
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this post",
      });
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    logger.error(`Error deleting post: ${error.message}`);
    next(error);
  }
};

// Like/Unlike a post
export const likePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    const user = await User.findById(userId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the post is already liked by the user
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike the post
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      user.likedPosts = user.likedPosts.filter(
        (id) => id.toString() !== postId
      );
    } else {
      // Like the post
      post.likes.push(userId);
      user.likedPosts.push(postId);
    }

    await post.save();
    await user.save();

    res.status(200).json({
      success: true,
      liked: !isLiked,
      likesCount: post.likes_count,
      data: post,
    });
  } catch (error) {
    logger.error(`Error liking post: ${error.message}`);
    next(error);
  }
};

// Save/Unsave a post
export const savePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    const user = await User.findById(userId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the post is already saved by the user
    const isSaved = user.savedPosts.includes(postId);

    if (isSaved) {
      // Unsave the post
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== postId
      );
    } else {
      // Save the post
      user.savedPosts.push(postId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      saved: !isSaved,
      message: isSaved
        ? "Post unsaved successfully"
        : "Post saved successfully",
    });
  } catch (error) {
    logger.error(`Error saving post: ${error.message}`);
    next(error);
  }
};

// Get user's saved posts
export const getSavedPosts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId).populate({
      path: "savedPosts",
      populate: {
        path: "user",
        select: "name nickname profilePicture",
      },
      options: {
        sort: { createdAt: -1 },
        skip: skip,
        limit: limit,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const total = user.savedPosts.length;

    res.status(200).json({
      success: true,
      count: user.savedPosts.length,
      total,
      pages: Math.ceil(total / limit),
      data: user.savedPosts,
    });
  } catch (error) {
    logger.error(`Error getting saved posts: ${error.message}`);
    next(error);
  }
};

// Get user's liked posts
export const getLikedPosts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId).populate({
      path: "likedPosts",
      populate: {
        path: "user",
        select: "name nickname profilePicture",
      },
      options: {
        sort: { createdAt: -1 },
        skip: skip,
        limit: limit,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const total = user.likedPosts.length;

    res.status(200).json({
      success: true,
      count: user.likedPosts.length,
      total,
      pages: Math.ceil(total / limit),
      data: user.likedPosts,
    });
  } catch (error) {
    logger.error(`Error getting liked posts: ${error.message}`);
    next(error);
  }
};
