import React, { useState, useRef } from "react";
import "../styles/applicationform.css";
import axios from "axios";

/* -------- Custom Dropdown -------- */
const CustomDropdown = ({ selected, setSelected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = ["fresher", "experienced", "internship"];

  return (
    <div className="dropdown-wrapper">
      <label>
        Experience <span className="required-star">*</span>
      </label>

      <div
        className="dropdown-selected"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected || "Select One..."}
      </div>

      {isOpen && (
        <ul className="dropdown-list">
          {options.map((opt) => (
            <li
              key={opt}
              onClick={() => {
                setSelected(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* -------- Application Form -------- */
const ApplicationForm = () => {
  const formRef = useRef();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [experience, setExperience] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
    certificate: null,
    resume: null,
  });

  /* -------- File Validation -------- */
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files && files[0]) {
      const file = files[0];

      // Max 4MB (mobile safe)
      if (file.size > 4 * 1024 * 1024) {
        alert("File must be less than 4MB.");
        return;
      }

      // Allow only PDF or images
      if (
        file.type !== "application/pdf" &&
        !file.type.startsWith("image/")
      ) {
        alert("Only PDF or image files allowed.");
        return;
      }
    }

    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  /* -------- Submit -------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!experience) {
      alert("Select experience");
      return;
    }

    if (!formData.certificate || !formData.resume) {
      alert("Please upload both files");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("position", formData.position);
      data.append("experience", experience);
      data.append("certificate", formData.certificate);
      data.append("resume", formData.resume);

      await axios.post(
        "https://main-ten-pied.vercel.app/api/applications",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 60000, // 60 sec for mobile
        }
      );

      setSubmitted(true);
      formRef.current.reset();
      setExperience("");
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error("FULL ERROR:", err.response || err.message || err);
      alert("❌ Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      {submitted && (
        <div className="popup-message">
          ✅ Application submitted successfully!
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit}>
        <h2>Application Form</h2>

        <input
          name="name"
          placeholder="Name"
          required
          onChange={handleChange}
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          onChange={handleChange}
        />

        <input
          name="position"
          placeholder="Position"
          required
          onChange={handleChange}
        />

        <CustomDropdown
          selected={experience}
          setSelected={setExperience}
        />

        <input
          type="file"
          name="certificate"
          accept=".pdf,image/jpeg,image/png"
          required
          onChange={handleChange}
        />

        <input
          type="file"
          name="resume"
          accept=".pdf,image/jpeg,image/png"
          required
          onChange={handleChange}
        />

        <button disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default ApplicationForm;
