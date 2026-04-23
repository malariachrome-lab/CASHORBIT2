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
  const [localError, setLocalError] = useState(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setLocalError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);

    try {
      if (formData.password !== formData.confirmPassword) {
        setLocalError("Passwords do not match");
        setLoading(false);
        return;
      }

      const { confirmPassword, ...dataToRegister } = formData;
      const result = await register(dataToRegister);

      if (result.success) {
        // Clear form and show success
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          referralCode: "",
        });
        onRegisterSuccess && onRegisterSuccess();
      } else {
        // Handle specific error messages
        if (result.error && result.error.includes("too many")) {
          setLocalError(
            "Too many registration attempts. Please wait a few minutes before trying again."
          );
          // Show countdown timer
          let countdown = 5; // minutes
          const timer = setInterval(() => {
            countdown--;
            setRetryCountdown(countdown);
            if (countdown <= 0) {
              clearInterval(timer);
              setRetryCountdown(0);
              setLocalError(null);
            }
          }, 60000); // Update every minute
        } else {
          setLocalError(result.error || "Registration failed. Please try again.");
        }
      }
    } catch (err) {
      if (err.message && err.message.includes("too many")) {
        setLocalError(
          "Too many registration attempts. Please wait a few minutes before trying again."
        );
      } else {
        setLocalError(err.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isRetryLimited = retryCountdown > 0;
  const displayError = localError || error;

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
            disabled={isRetryLimited}
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
            disabled={isRetryLimited}
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
            disabled={isRetryLimited}
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
            disabled={isRetryLimited}
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
            disabled={isRetryLimited}
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
            disabled={isRetryLimited}
          />
        </div>

        {displayError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-error text-sm">
            <p>{displayError}</p>
            {retryCountdown > 0 && (
              <p className="mt-2 text-xs font-semibold">
                Try again in {retryCountdown} minute{retryCountdown > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading || isRetryLimited}
        >
          {loading ? "Registering..." : isRetryLimited ? `Retry in ${retryCountdown}m` : "Register"}
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
