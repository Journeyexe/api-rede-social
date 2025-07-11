import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { logger } from "../config/logger.js";

// Gerar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

// Opções do cookie
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
};

export const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password, nickname, profilePicture } = req.body;

      const user = await User.create({
        name,
        email,
        password,
        nickname: nickname.toLowerCase(),
        profilePicture,
      });

      const token = generateToken(user._id);

      res.cookie("jwt", token, cookieOptions);

      res.status(201).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token,
        },
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: "Email ou Nickname já está em uso",
        });
      }
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+password");

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          error: "Credenciais inválidas",
        });
      }

      const token = generateToken(user._id);

      res.cookie("jwt", token, cookieOptions);

      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res) {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({
      success: true,
      message: "Logout realizado com sucesso",
    });
  },

  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { name, nickname, profilePicture } = req.body;
      const userId = req.user.id;

      // Validar se pelo menos um campo foi fornecido
      if (!name && !nickname && !profilePicture) {
        return res.status(400).json({
          success: false,
          error: "Pelo menos um campo deve ser fornecido para atualização",
        });
      }

      // Preparar os dados para atualização
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (nickname) updateData.nickname = nickname.trim().toLowerCase();
      if (profilePicture) updateData.profilePicture = profilePicture;

      // Verificar se o nickname já está em uso por outro usuário
      if (nickname) {
        const existingUser = await User.findOne({
          nickname: nickname.trim().toLowerCase(),
          _id: { $ne: userId },
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: "Este nickname já está em uso",
          });
        }
      }

      // Atualizar o usuário
      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: "Usuário não encontrado",
        });
      }

      logger.info(`Perfil atualizado para usuário ${userId}`, {
        updatedFields: Object.keys(updateData),
      });

      res.status(200).json({
        success: true,
        message: "Perfil atualizado com sucesso",
        data: updatedUser,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: "Nickname já está em uso",
        });
      }
      next(error);
    }
  },
};
