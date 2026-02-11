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
        message: "Application submitted and email sent",
      });
    } catch (err) {
      console.error("❌ Application error:", err);
      res.status(500).json({ error: "Application submission failed" });
    }
  }
);
