import mongoose from "mongoose";
import Application from "../backend/models/application";

export const config = {
  api: {
    bodyParser: false, // IMPORTANT for file upload
  },
};

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    const application = new Application({
      name: req.body.name,
      email: req.body.email,
      position: req.body.position,
      experience: req.body.experience,
    });

    await application.save();

    res.status(200).json({ message: "Application submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Application submission failed" });
  }
}
