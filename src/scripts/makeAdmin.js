import mongoose from "mongoose";
import "dotenv/config";
import User from "../models/userModel.js";

const email = process.argv[2];

if (!email) {
  console.log("Uso: node src/scripts/makeAdmin.js <email>");
  console.log("Exemplo: node src/scripts/makeAdmin.js admin@email.com");
  process.exit(1);
}

async function makeAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOneAndUpdate(
      { email },
      { role: "admin" },
      { new: true }
    );

    if (!user) {
      console.log(`❌ Usuário com email "${email}" não encontrado.`);
    } else {
      console.log(`✅ Usuário "${user.name}" (${user.email}) agora é admin!`);
    }
  } catch (error) {
    console.error("Erro:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

makeAdmin();
