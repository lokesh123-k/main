const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
require("dotenv").config();

const Contact = require("./models/Contact");
const Application = require("./models/application");

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- MONGODB -------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

/* -------------------- NODEMAILER -------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

transporter.verify((err) => {
  if (err) console.error("❌ Email error:", err);
  else console.log("✅ Email server ready");
});

/* -------------------- MULTER (MEMORY STORAGE FOR VERCEL) -------------------- */
const upload = multer({ storage: multer.memoryStorage() });

/* -------------------- HEALTH CHECK -------------------- */
app.get("/", (req, res) => {
  res.send("🌐 Server is running");
});

/* -------------------- CONTACT FORM -------------------- */
app.post("/api/contact", async (req, res) => {
  try {
    const { user_name, user_phone, user_email, message } = req.body;

    if (!user_name || !user_email || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    await Contact.create({
      user_name,
      user_phone,
      user_email,
      message,
    });

    await transporter.sendMail({
      from: `"Website Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: user_email,
      subject: "New Contact Form Submission",
      html: `
        <h3>New Contact Message</h3>
        <p><b>Name:</b> ${user_name}</p>
        <p><b>Email:</b> ${user_email}</p>
        <p><b>Phone:</b> ${user_phone}</p>
        <p><b>Message:</b><br/>${message}</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("❌ Contact Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while sending message",
    });
  }
});

/* -------------------- APPLICATION FORM -------------------- */
app.post(
  "/api/applications",
  upload.fields([
    { name: "certificate", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, email, position, experience } = req.body;

      if (!req.files?.certificate || !req.files?.resume) {
        return res.status(400).json({ error: "Files missing" });
      }

      const certificate = req.files.certificate[0];
      const resume = req.files.resume[0];

      const application = new Application({
        name,
        email,
        position,
        experience,
        certificate: {
          data: certificate.buffer,
          contentType: certificate.mimetype,
          filename: certificate.originalname,
        },
        resume: {
          data: resume.buffer,
          contentType: resume.mimetype,
          filename: resume.originalname,
        },
      });

      await application.save();

      await transporter.sendMail({
        from: `"CeiTCS Careers" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Application Received – CeiTCS",
        html: `
          <h2>Hello ${name},</h2>
          <p>Your application has been received successfully.</p>
          <p><b>Position:</b> ${position}</p>
          <p><b>Experience:</b> ${experience}</p>
          <p>Our HR team will contact you soon.</p>
          <br/>
          <p>Regards,<br/>CeiTCS Team</p>
        `,
      });

      res.status(201).json({
        success: true,
        message: "Application submitted and email sent",
      });
    } catch (err) {
      console.error("❌ Application error:", err);
      res.status(500).json({ error: "Application submission failed" });
    }
  }
);

/* -------------------- SERVER (Vercel Compatible) -------------------- */
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
}

module.exports = app;
