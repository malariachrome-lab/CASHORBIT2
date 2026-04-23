import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Register({ onLoginClick, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [loading, setLoading] = useState(false);
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      const { confirmPassword, ...dataToRegister } = formData;
      const result = await register(dataToRegister);

      if (result.success) {
        onRegisterSuccess && onRegisterSuccess();
      } else {
        // Error is already set in AuthContext
      }
    } catch (err) {
      // Error is already set in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mx-auto max-w-md"
    >
      <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">
        Create Your Cash Orbit Account
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            className="input-field"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            className="input-field"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            className="input-field"
            placeholder="+2547XXXXXXXX"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            className="input-field"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            className="input-field"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label
            htmlFor="referralCode"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Referral Code (Optional)
          </label>
          <input
            type="text"
            id="referralCode"
            className="input-field"
            placeholder="e.g., FRIEND123"
            value={formData.referralCode}
            onChange={handleChange}
          />
        </div>
        {error && <p className="text-error text-sm text-center">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p className="text-center text-sm text-text-secondary mt-6">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => {
            if (onLoginClick) {
              onLoginClick();
            } else {
              navigate("/login");
            }
          }}
          className="text-primary hover:underline font-medium"
        >
          Login Here
        </button>
      </p>
    </motion.div>
  );
}