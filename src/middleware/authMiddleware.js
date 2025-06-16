import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { logger } from "../config/logger.js";

export const protect = async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Não autorizado - Token não fornecido",
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = await User.findById(decoded.id).select("-password");
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }
    
    next();
  } catch (error) {
    logger.error(error);
    res.status(401).json({
      success: false,
      error: "Não autorizado - Token inválido",
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Usuário com role ${req.user.role} não tem acesso a este recurso`,
      });
    }
    next();
  };
};