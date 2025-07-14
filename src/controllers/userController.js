import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import { logger } from "../config/logger.js";

export const userController = {
  async getProfile(req, res, next) {
    try {
      const { id } = req.params;

      // Buscar o usuário por ID, excluindo informações sensíveis
      const user = await User.findById(id).select(
        "name nickname profilePicture"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuário não encontrado",
        });
      }

      // Buscar todos os posts do usuário
      const posts = await Post.find({ user: id })
        .populate("user", "name nickname profilePicture")
        .sort({ createdAt: -1 }); // Ordenar por data de criação (mais recente primeiro)

      res.status(200).json({
        success: true,
        data: {
          profile: {
            id: user._id,
            name: user.name,
            nickname: user.nickname,
            profilePicture: user.profilePicture,
          },
          posts: posts,
          postsCount: posts.length,
        },
      });
    } catch (error) {
      logger.error(`Erro ao buscar perfil: ${error.message}`);
      next(error);
    }
  },
};
