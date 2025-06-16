import { logger } from "../config/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Erro interno do servidor",
  });
};
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: "Recurso não encontrado",
  });
};
