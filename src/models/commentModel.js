import { Schema } from "mongoose";
import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";
import sanitize from "mongoose-sanitize";

const commentSchema = new Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: [true, "Post is required"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"],
  },
  content: {
    type: String,
    required: [true, "Comment content is required"],
    trim: true,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  likes_count: {
    type: Number,
    default: 0,
  },
  // To track nested level for performance optimization
  level: {
    type: Number,
    default: 0,
  },
});

// Plugins
commentSchema.plugin(timestamps);
commentSchema.plugin(sanitize);

// Virtual field for replies
commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parent",
});

// Update likes count before saving
commentSchema.pre("save", function (next) {
  if (this.isModified("likes")) {
    this.likes_count = this.likes.length;
  }
  next();
});

// Set toJSON and toObject options
commentSchema.set("toJSON", { virtuals: true });
commentSchema.set("toObject", { virtuals: true });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
