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
  comments_count: {
    type: Number,
    default: 0,
  },
});

// Plugins
postSchema.plugin(timestamps);
postSchema.plugin(sanitize);

// Middleware to update likes_count before saving
postSchema.pre("save", function (next) {
  if (this.isModified("likes")) {
    this.likes_count = this.likes.length;
  }
  next();
});

const Post = mongoose.model("Post", postSchema);

export default Post;
