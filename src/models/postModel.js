import { Schema } from "mongoose";
import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";
import sanitize from "mongoose-sanitize";

const postSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"],
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"],
  },
  content: {
    type: String,
    required: [true, "Content is required"],
    trim: true,
  },
  media_url: {
    type: String,
    trim: true,
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
  saved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  saved_count: {
    type: Number,
    default: 0,
  },
  comments_count: {
    type: Number,
    default: 0,
  },
});

// Plugins
postSchema.plugin(timestamps);
postSchema.plugin(sanitize);

// Middleware to update likes_count and saved_count before saving
postSchema.pre("save", function (next) {
  if (this.isModified("likes")) {
    this.likes_count = this.likes.length;
  }
  if (this.isModified("saved")) {
    this.saved_count = this.saved.length;
  }
  next();
});

const Post = mongoose.model("Post", postSchema);

export default Post;
