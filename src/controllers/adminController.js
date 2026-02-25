import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import Comment from "../models/commentModel.js";
import { logger } from "../config/logger.js";

export const adminController = {
  // ==================== DASHBOARD & STATISTICS ====================

  // GET /api/admin/stats/dashboard
  async getDashboardStats(req, res, next) {
    try {
      const [
        totalUsers,
        totalPosts,
        totalComments,
        bannedUsers,
        deletedPosts,
        deletedComments,
        adminUsers,
      ] = await Promise.all([
        User.countDocuments(),
        Post.countDocuments({ isDeleted: { $ne: true } }),
        Comment.countDocuments({ isDeleted: { $ne: true } }),
        User.countDocuments({ isBanned: true }),
        Post.countDocuments({ isDeleted: true }),
        Comment.countDocuments({ isDeleted: true }),
        User.countDocuments({ role: "admin" }),
      ]);

      // Active users (posted or commented in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [activePosters, activeCommenters] = await Promise.all([
        Post.distinct("user", {
          createdAt: { $gte: thirtyDaysAgo },
          isDeleted: { $ne: true },
        }),
        Comment.distinct("user", {
          createdAt: { $gte: thirtyDaysAgo },
          isDeleted: { $ne: true },
        }),
      ]);

      const activeUserIds = new Set([
        ...activePosters.map((id) => id.toString()),
        ...activeCommenters.map((id) => id.toString()),
      ]);

      // Top posts (most liked)
      const topPosts = await Post.find({ isDeleted: { $ne: true } })
        .sort({ likes_count: -1 })
        .limit(5)
        .populate("user", "name nickname profilePicture")
        .select("title likes_count comments_count saved_count createdAt");

      // Recent users
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name nickname email role isBanned createdAt");

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalPosts,
            totalComments,
            bannedUsers,
            deletedPosts,
            deletedComments,
            adminUsers,
            activeUsersLast30Days: activeUserIds.size,
          },
          topPosts,
          recentUsers,
        },
      });
    } catch (error) {
      logger.error(`Error getting dashboard stats: ${error.message}`);
      next(error);
    }
  },

  // GET /api/admin/stats/growth
  async getGrowthStats(req, res, next) {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [userGrowth, postGrowth, commentGrowth] = await Promise.all([
        User.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Post.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
              isDeleted: { $ne: true },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Comment.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
              isDeleted: { $ne: true },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      res.status(200).json({
        success: true,
        data: {
          period: `${days} days`,
          userGrowth,
          postGrowth,
          commentGrowth,
        },
      });
    } catch (error) {
      logger.error(`Error getting growth stats: ${error.message}`);
      next(error);
    }
  },

  // GET /api/admin/stats/engagement
  async getEngagementStats(req, res, next) {
    try {
      // Top users by post count
      const topPosters = await Post.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: "$user",
            postCount: { $sum: 1 },
            totalLikes: { $sum: "$likes_count" },
          },
        },
        { $sort: { postCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            name: "$user.name",
            nickname: "$user.nickname",
            postCount: 1,
            totalLikes: 1,
          },
        },
      ]);

      // Top users by comment count
      const topCommenters = await Comment.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: "$user", commentCount: { $sum: 1 } } },
        { $sort: { commentCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            name: "$user.name",
            nickname: "$user.nickname",
            commentCount: 1,
          },
        },
      ]);

      // Average engagement per post
      const avgEngagement = await Post.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            avgLikes: { $avg: "$likes_count" },
            avgSaves: { $avg: "$saved_count" },
            avgComments: { $avg: "$comments_count" },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          topPosters,
          topCommenters,
          averages: avgEngagement[0] || {
            avgLikes: 0,
            avgSaves: 0,
            avgComments: 0,
          },
        },
      });
    } catch (error) {
      logger.error(`Error getting engagement stats: ${error.message}`);
      next(error);
    }
  },

  // ==================== USER MANAGEMENT ====================

  // GET /api/admin/users
  async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search || "";
      const role = req.query.role;
      const banned = req.query.banned;

      // Build filter
      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { nickname: { $regex: search, $options: "i" } },
        ];
      }
      if (role) filter.role = role;
      if (banned !== undefined) filter.isBanned = banned === "true";

      const [users, total] = await Promise.all([
        User.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select("name nickname email role isBanned profilePicture createdAt"),
        User.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        count: users.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        data: users,
      });
    } catch (error) {
      logger.error(`Error getting all users: ${error.message}`);
      next(error);
    }
  },

  // GET /api/admin/users/:id
  async getUserById(req, res, next) {
    try {
      const user = await User.findById(req.params.id).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Get user's stats
      const [postCount, commentCount] = await Promise.all([
        Post.countDocuments({
          user: user._id,
          isDeleted: { $ne: true },
        }),
        Comment.countDocuments({
          user: user._id,
          isDeleted: { $ne: true },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          ...user.toObject(),
          stats: { postCount, commentCount },
        },
      });
    } catch (error) {
      logger.error(`Error getting user: ${error.message}`);
      next(error);
    }
  },

  // PUT /api/admin/users/:id/role
  async updateUserRole(req, res, next) {
    try {
      const { role } = req.body;

      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role must be "user" or "admin"',
        });
      }

      // Prevent self-demotion
      if (req.params.id === req.user.id && role !== "admin") {
        return res.status(400).json({
          success: false,
          message: "You cannot remove your own admin role",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true, runValidators: true },
      ).select("name nickname email role");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `User role updated to ${role}`,
        data: user,
      });
    } catch (error) {
      logger.error(`Error updating user role: ${error.message}`);
      next(error);
    }
  },

  // PUT /api/admin/users/:id/ban
  async toggleBanUser(req, res, next) {
    try {
      // Prevent self-ban
      if (req.params.id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: "You cannot ban yourself",
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Prevent banning other admins
      if (user.role === "admin") {
        return res.status(400).json({
          success: false,
          message: "Cannot ban an admin user",
        });
      }

      user.isBanned = !user.isBanned;
      await user.save();

      res.status(200).json({
        success: true,
        message: user.isBanned
          ? "User banned successfully"
          : "User unbanned successfully",
        data: {
          id: user._id,
          name: user.name,
          nickname: user.nickname,
          isBanned: user.isBanned,
        },
      });
    } catch (error) {
      logger.error(`Error toggling user ban: ${error.message}`);
      next(error);
    }
  },

  // DELETE /api/admin/users/:id
  async deleteUser(req, res, next) {
    try {
      // Prevent self-deletion
      if (req.params.id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: "You cannot delete your own account from admin panel",
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.role === "admin") {
        return res.status(400).json({
          success: false,
          message: "Cannot delete an admin user",
        });
      }

      // Soft delete all user's posts and comments
      await Promise.all([
        Post.updateMany(
          { user: user._id },
          { isDeleted: true, deletedAt: new Date(), deletedBy: req.user.id },
        ),
        Comment.updateMany(
          { user: user._id },
          { isDeleted: true, deletedAt: new Date(), deletedBy: req.user.id },
        ),
      ]);

      // Delete the user
      await User.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "User and all their content deleted successfully",
      });
    } catch (error) {
      logger.error(`Error deleting user: ${error.message}`);
      next(error);
    }
  },

  // ==================== POST MODERATION ====================

  // GET /api/admin/posts
  async getAllPosts(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search || "";
      const showDeleted = req.query.deleted === "true";

      const filter = {};
      if (showDeleted) {
        filter.isDeleted = true;
      }
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ];
      }

      const [posts, total] = await Promise.all([
        Post.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("user", "name nickname profilePicture"),
        Post.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        count: posts.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        data: posts,
      });
    } catch (error) {
      logger.error(`Error getting admin posts: ${error.message}`);
      next(error);
    }
  },

  // PUT /api/admin/posts/:id/restore
  async restorePost(req, res, next) {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (!post.isDeleted) {
        return res.status(400).json({
          success: false,
          message: "Post is not deleted",
        });
      }

      post.isDeleted = false;
      post.deletedAt = undefined;
      post.deletedBy = undefined;
      await post.save();

      res.status(200).json({
        success: true,
        message: "Post restored successfully",
        data: post,
      });
    } catch (error) {
      logger.error(`Error restoring post: ${error.message}`);
      next(error);
    }
  },

  // DELETE /api/admin/posts/:id
  async hardDeletePost(req, res, next) {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Delete all comments associated with this post
      await Comment.deleteMany({ post: post._id });

      // Remove post from users' likedPosts and savedPosts
      await User.updateMany(
        { $or: [{ likedPosts: post._id }, { savedPosts: post._id }] },
        { $pull: { likedPosts: post._id, savedPosts: post._id } },
      );

      await Post.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Post and all associated data permanently deleted",
      });
    } catch (error) {
      logger.error(`Error hard deleting post: ${error.message}`);
      next(error);
    }
  },

  // ==================== COMMENT MODERATION ====================

  // GET /api/admin/comments
  async getAllComments(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search || "";
      const showDeleted = req.query.deleted === "true";

      const filter = {};
      if (showDeleted) {
        filter.isDeleted = true;
      }
      if (search) {
        filter.content = { $regex: search, $options: "i" };
      }

      const [comments, total] = await Promise.all([
        Comment.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("user", "name nickname profilePicture")
          .populate("post", "title"),
        Comment.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        count: comments.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        data: comments,
      });
    } catch (error) {
      logger.error(`Error getting admin comments: ${error.message}`);
      next(error);
    }
  },

  // PUT /api/admin/comments/:id/restore
  async restoreComment(req, res, next) {
    try {
      const comment = await Comment.findById(req.params.id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      if (!comment.isDeleted) {
        return res.status(400).json({
          success: false,
          message: "Comment is not deleted",
        });
      }

      comment.isDeleted = false;
      comment.deletedAt = undefined;
      comment.deletedBy = undefined;
      await comment.save();

      res.status(200).json({
        success: true,
        message: "Comment restored successfully",
        data: comment,
      });
    } catch (error) {
      logger.error(`Error restoring comment: ${error.message}`);
      next(error);
    }
  },

  // DELETE /api/admin/comments/:id
  async hardDeleteComment(req, res, next) {
    try {
      const comment = await Comment.findById(req.params.id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      // Recursively hard delete replies
      async function hardDeleteReplies(commentId) {
        const replies = await Comment.find({ parent: commentId });
        for (const reply of replies) {
          await hardDeleteReplies(reply._id);
        }
        await Comment.deleteMany({ parent: commentId });
      }

      await hardDeleteReplies(comment._id);

      // If it was a top-level comment, decrement the post's comments_count
      if (!comment.parent) {
        await Post.findByIdAndUpdate(comment.post, {
          $inc: { comments_count: -1 },
        });
      }

      await Comment.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Comment and all replies permanently deleted",
      });
    } catch (error) {
      logger.error(`Error hard deleting comment: ${error.message}`);
      next(error);
    }
  },
};
