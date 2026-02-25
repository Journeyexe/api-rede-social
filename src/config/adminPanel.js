import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import session from "express-session";
import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import Comment from "../models/commentModel.js";

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

const adminJs = new AdminJS({
  resources: [
    {
      resource: User,
      options: {
        navigation: { name: "Gerenciamento de Usuários", icon: "User" },
        listProperties: [
          "name",
          "nickname",
          "email",
          "role",
          "isBanned",
          "createdAt",
        ],
        filterProperties: ["name", "nickname", "email", "role", "isBanned"],
        editProperties: [
          "name",
          "nickname",
          "email",
          "role",
          "isBanned",
          "profilePicture",
        ],
        showProperties: [
          "name",
          "nickname",
          "email",
          "role",
          "isBanned",
          "profilePicture",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          password: { isVisible: false },
          _id: {
            isVisible: {
              list: false,
              filter: false,
              show: true,
              edit: false,
            },
          },
        },
      },
    },
    {
      resource: Post,
      options: {
        navigation: { name: "Conteúdo", icon: "Document" },
        listProperties: [
          "title",
          "user",
          "likes_count",
          "comments_count",
          "isDeleted",
          "createdAt",
        ],
        filterProperties: ["title", "user", "isDeleted", "createdAt"],
        editProperties: ["title", "content", "media_url", "isDeleted"],
        properties: {
          content: { type: "textarea" },
        },
      },
    },
    {
      resource: Comment,
      options: {
        navigation: { name: "Conteúdo", icon: "Chat" },
        listProperties: [
          "content",
          "user",
          "post",
          "likes_count",
          "isDeleted",
          "createdAt",
        ],
        filterProperties: ["user", "post", "isDeleted", "createdAt"],
        editProperties: ["content", "isDeleted"],
      },
    },
  ],
  rootPath: "/admin",
  branding: {
    companyName: "Rede Social - Painel Admin",
    softwareBrothers: false,
    logo: false,
  },
});

export const setupAdminPanel = (app) => {
  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      authenticate: async (email, password) => {
        const user = await User.findOne({ email }).select("+password");
        if (user && user.role === "admin" && !user.isBanned) {
          const isValid = await user.comparePassword(password);
          if (isValid) {
            return { email: user.email, id: user._id, role: user.role };
          }
        }
        return null;
      },
      cookieName: "adminjs",
      cookiePassword:
        process.env.ADMIN_COOKIE_SECRET ||
        "super-secret-and-long-session-key-for-admin-panel",
    },
    null,
    {
      resave: false,
      saveUninitialized: false,
      secret:
        process.env.SESSION_SECRET ||
        "session-secret-key-change-in-production",
    }
  );

  app.use(adminJs.options.rootPath, adminRouter);
  return adminJs;
};
