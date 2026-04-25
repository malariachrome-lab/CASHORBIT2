import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { authService } from "../services/authService";
import { dataService } from "../services/dataService";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Info, Copy } from "lucide-react";

export default function Activate() {
  const { user, updateBalance, updateUserStatus, fetchUser } = useAuth();
  const { globalConfig, pendingActivations } = useAppState();
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!user) {
      setError("User not logged in.");
      setLoading(false);
      return;
    }

    try {
      const result = await authService.submitActivationPayment(user.id, transactionId);
      if (result.success) {
        setMessage("Payment submitted successfully! Awaiting admin approval.");
        // Optimistically update pendingActivations in AppStateContext if possible
        // For now, relies on admin polling
        // Optionally: updateUserStatus(user.id, 'submitted_for_approval');
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

  const handleCheckApproval = async () => {
    setCheckingStatus(true);
    setError(null);
    
    try {
      // Force fresh fetch from database directly
      const { data: freshUserData } = await authService.getUserById(user.id);
      
      if (freshUserData && freshUserData.status === "active") {
        // Update local state completely
        const validUser = authService.normalizeProfile(freshUserData);
        localStorage.setItem("cashorbit_user", JSON.stringify(validUser));
        
        setMessage("✅ ACCOUNT APPROVED! Redirecting you to dashboard...");
        
        // Full page reload to reset entire app state
        setTimeout(() => {
          window.location.replace("/");
        }, 800);
      } else {
        setMessage("⏳ Still waiting for admin approval. Please check again later.");
      }
    } catch (err) {
      setError("Failed to check approval status. Please try again.");
    } finally {
      setCheckingStatus(false);
    }
  };

  // Redirect if user is already active
  if (user && user.status === "active") {
    navigate("/dashboard");
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
           {!user.transaction_id ? (
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
               {message && <p className="text-success text-sm text-center"><CheckCircle className="inline-block w-4 h-4 mr-1" />{message}</p>}
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Transaction ID"}
                </button>
             </>
           ) : (
             <div className="text-center space-y-4 py-6">
               <CheckCircle className="w-16 h-16 text-success mx-auto animate-pulse" />
               <h3 className="text-xl font-bold text-text-primary">Payment Code Submitted</h3>
               <p className="text-text-secondary">
                 Your payment code has been sent for verification. Admin will activate your account shortly.
               </p>
               <div className="bg-surface-light p-4 rounded-xl">
                 <p className="text-white/40 text-xs mb-1">SUBMITTED CODE:</p>
                 <p className="text-primary font-mono text-lg">{user.transaction_id}</p>
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