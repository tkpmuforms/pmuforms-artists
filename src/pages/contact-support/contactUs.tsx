import React, { useState } from "react";
import "./contact-us.scss";
import toast from "react-hot-toast";
import { sendMessage } from "../../services/artistServices";
import useAuth from "../../context/useAuth";

interface FormData {
  email: string;
  firstName: string;
  subject: string;
  message: string;
}

const LIMITS = {
  firstName: 50,
  subject: 100,
  message: 1000,
} as const;

type LimitedField = keyof typeof LIMITS;

const ContactUs: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: user?.email || "",
    firstName: user?.firstName || "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const field = name as keyof FormData;
    const limit = LIMITS[field as LimitedField];

    if (limit !== undefined && value.length > limit) return;

    setFormData((prev) => ({ ...prev, [field]: value }));

    if (limit !== undefined) {
      if (value.length >= limit) {
        setErrors((prev) => ({
          ...prev,
          [field]: `Maximum ${limit} characters reached`,
        }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length > LIMITS.firstName) {
      newErrors.firstName = `Maximum ${LIMITS.firstName} characters reached`;
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.length > LIMITS.subject) {
      newErrors.subject = `Maximum ${LIMITS.subject} characters reached`;
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length > LIMITS.message) {
      newErrors.message = `Maximum ${LIMITS.message} characters reached`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await sendMessage(formData);
      setFormData({
        email: user?.email || "",
        firstName: user?.firstName || "",
        subject: "",
        message: "",
      });
      setErrors({});
      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const CharCounter = ({
    field,
  }: {
    field: LimitedField;
  }) => {
    const len = formData[field].length;
    const limit = LIMITS[field];
    return (
      <span className={`char-counter${len >= limit ? " char-counter--limit" : ""}`}>
        {len}/{limit}
      </span>
    );
  };

  return (
    <div className="contact-us">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={!!user?.email}
            placeholder="Enter your email"
            maxLength={254}
          />
        </div>

        <div className="form-group">
          <label htmlFor="firstName">First Name:</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            placeholder="Enter your first name"
            maxLength={LIMITS.firstName}
            className={errors.firstName ? "error" : ""}
          />
          <div className="field-footer">
            {errors.firstName ? (
              <span className="field-error">{errors.firstName}</span>
            ) : (
              <span />
            )}
            <CharCounter field="firstName" />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject:</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            placeholder="Enter subject"
            maxLength={LIMITS.subject}
            className={errors.subject ? "error" : ""}
          />
          <div className="field-footer">
            {errors.subject ? (
              <span className="field-error">{errors.subject}</span>
            ) : (
              <span />
            )}
            <CharCounter field="subject" />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            placeholder="Enter your message"
            maxLength={LIMITS.message}
            className={errors.message ? "error" : ""}
          />
          <div className="field-footer">
            {errors.message ? (
              <span className="field-error">{errors.message}</span>
            ) : (
              <span />
            )}
            <CharCounter field="message" />
          </div>
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default ContactUs;
