import { Schema } from "mongoose";
import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";
import sanitize from "mongoose-sanitize";
import bcrypt from "bcryptjs";

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, "is invalid"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false, // Não retorna a senha em consultas
  },
  nickname: {
    type: String,
    required: [true, "Nickname is required"],
    trim: true,
    unique: true,
    minlength: [3, "Nickname must be at least 3 characters"],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  profilePicture: {
    type: String,
    default: function () {
      return `https://api.dicebear.com/9.x/dylan/png/seed=${this.nickname}`;
    },
  },
  likedPosts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  savedPosts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
});

// Plugins
userSchema.plugin(timestamps);
userSchema.plugin(sanitize);

// Hash da senha antes de salvar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
