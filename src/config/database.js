import mongoose from "mongoose";
import { logger } from "./logger.js";

export const connectDB = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri);
    logger.info("Conexão com o banco de dados estabelecida com sucesso");
  } catch (error) {
    logger.error(`Erro ao conectar ao banco de dados: ${error.message}`);
    process.exit(1);
  }
};