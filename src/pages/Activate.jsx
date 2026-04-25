import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { authService } from "../services/authService";
import { dataService } from "../services/dataService";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Info, Copy, Radio } from "lucide-react";

export default function Activate() {
  const { user } = useAuth();
  const { globalConfig } = useAppState();
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);
  const navigate = useNavigate();

  // Clean Supabase Realtime listener
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-activation-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new;
          // The moment the user becomes active, redirect immediately
          if (newRow?.status === "active" || newRow?.is_active === true) {
            navigate("/dashboard", { replace: true });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setListening(true);
        }
      });

    return () => {
      setListening(false);
      supabase.removeChannel(channel);
    };
  }, [user?.id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      setError("User not logged in.");
      setLoading(false);
      return;
    }

    try {
      const result = await authService.submitActivationPayment(user.id, transactionId);
      if (result.success) {
        setVerifying(true);
      } else {
        setError(result.error || "Failed to submit payment.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTillNumber = () => {
    navigator.clipboard.writeText(globalConfig.tillNumber);
    alert("Till Number copied to clipboard!");
  };

  // Redirect if user is already active
  if (user && user.status === "active") {
    navigate("/dashboard", { replace: true });
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <h1 className="text-3xl font-bold text-text-primary text-center">
        Account Activation
      </h1>

      <div className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <Info className="w-7 h-7 text-primary" />
          <h2 className="text-xl font-semibold text-text-primary">Step 1: Make Payment</h2>
        </div>
        
        <p className="text-text-secondary mb-4">
          To activate your Cash Orbit account and start earning, please make a payment of{" "}
          <span className="text-success font-bold">KES {globalConfig.activationFee.toLocaleString()}</span> to the Till Number below:
        </p>

        <div className="flex items-center justify-between card bg-surface-light p-4 rounded-xl border border-white/10 mb-6">
          <p className="text-2xl font-bold text-primary tracking-wider">
            {globalConfig.tillNumber}
          </p>
          <button
            onClick={handleCopyTillNumber}
            className="p-2 rounded-lg bg-surface hover:bg-surface-light transition-colors text-text-secondary"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-semibold text-text-primary mb-3">M-Pesa Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-text-secondary mb-8">
          {dataService.activationConfig.instructions.map((instruction, index) => (
            <li key={index}>{instruction}</li>
          ))}
        </ol>

        <div className="flex items-center gap-3 mb-6">
          <CheckCircle className="w-7 h-7 text-success" />
          <h2 className="text-xl font-semibold text-text-primary">Step 2: Verify Payment</h2>
        </div>

        <p className="text-text-secondary mb-4">
          After making the payment, enter the M-Pesa Transaction ID (e.g., "NGI76TYU9J") from the SMS confirmation below to verify your payment. This allows our admins to approve your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!user.transaction_id && !verifying ? (
            <>
              <div>
                <label htmlFor="transactionId" className="block text-sm font-medium text-text-secondary mb-2">
                  M-Pesa Transaction ID
                </label>
                <input
                  type="text"
                  id="transactionId"
                  className="input-field"
                  placeholder="Enter M-Pesa Transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                  required
                />
              </div>
              {error && <p className="text-error text-sm text-center">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Transaction ID"}
              </button>
            </>
          ) : (
            <div className="text-center space-y-4 py-6">
              <CheckCircle className="w-16 h-16 text-success mx-auto animate-pulse" />
              <h3 className="text-xl font-bold text-text-primary">Verifying Payment...</h3>
              <p className="text-text-secondary">
                Your payment is being verified. You will be automatically redirected once your account is activated.
              </p>
              {user.transaction_id && (
                <div className="bg-surface-light p-4 rounded-xl">
                  <p className="text-white/40 text-xs mb-1">SUBMITTED CODE:</p>
                  <p className="text-primary font-mono text-lg">{user.transaction_id}</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-success text-sm">
                <Radio className={`w-4 h-4 ${listening ? "animate-pulse" : ""}`} />
                <span>
                  {listening
                    ? "Listening for admin approval in real-time..."
                    : "Connecting to real-time updates..."}
                </span>
              </div>
              <p className="text-white/40 text-sm">
                ⏳ Please wait. You will be automatically redirected once your account is activated.
              </p>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
}
