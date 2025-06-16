import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import { logger } from "./src/config/logger.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { connectDB } from "./src/config/database.js";
import { router as authRoutes } from "./src/routes/authRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);

// Error handling
app.use(errorHandler);

// Inicialização do servidor
const startServer = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      logger.info(`Servidor rodando na porta ${port}`);
    });
  } catch (error) {
    logger.error(`Erro ao iniciar o servidor: ${error.message}`);
    process.exit(1);
  }
};

startServer();
