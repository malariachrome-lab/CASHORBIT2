import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Login({ onRegisterClick, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(identifier, password);
      if (result.success) {
        const destination = identifier === "admin@cashorbit.com" ? "/admin-control-portal" : "/dashboard";
        navigate(destination, { replace: true });
        onLoginSuccess && onLoginSuccess();
      } else {
        console.error('Login failed:', result.error);
      }
    } catch (err) {
      console.error('Login error:', err);
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
        Sign In to Your Account
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-text-secondary mb-2">
            Phone Number / Username
          </label>
          <input
            type="text"
            id="identifier"
            className="input-field"
            placeholder="e.g +2547XXXXXXXX"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {/* Error message from AuthContext is not directly used here but can be added if needed */}
        {/* {error && <p className="text-error text-sm text-center">{error}</p>} */}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Logging In..." : "Login"}
        </button>
      </form>
      <p className="text-center text-sm text-text-secondary mt-6">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={() => {
            if (onRegisterClick) {
              onRegisterClick();
            } else {
              navigate("/register");
            }
          }}
          className="text-primary hover:underline font-medium"
        >
          Register Now
        </button>
      </p>
    </motion.div>
  );
}
