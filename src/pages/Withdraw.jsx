import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { withdrawalService } from "../services/withdrawalService";
import { liveActivityService } from "../services/liveActivityService";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Banknote, Clock, CheckCircle, Wallet, AlertCircle, History, X, ArrowUpRight } from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Withdraw() {
  const { user, updateBalance } = useAuth();
  const { globalConfig } = useAppState();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [mpesaName, setMpesaName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const currentBalance = user?.balance || 0;
  const minAmount = globalConfig.minWithdrawal;
  const maxAmount = globalConfig.maxWithdrawal;
  const withdrawalProgress = (currentBalance / minAmount) * 100;

  useEffect(() => {
    if (user?.id) {
      loadWithdrawals();
    }
  }, [user?.id]);

  const loadWithdrawals = async () => {
    try {
      const data = await withdrawalService.getUserWithdrawals(user.id);
      setWithdrawals(data);
    } catch (err) {
      console.error("Failed to load withdrawals:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError("Please enter a valid amount.");
      setLoading(false);
      return;
    }

    if (currentBalance < minAmount) {
      setError(`Minimum withdrawal amount is KES ${minAmount.toLocaleString()}.`);
      setLoading(false);
      return;
    }

    if (withdrawAmount > currentBalance) {
      setError("Withdrawal amount cannot exceed your balance.");
      setLoading(false);
      return;
    }

    if (withdrawAmount < minAmount) {
      setError(`Amount must be at least KES ${minAmount.toLocaleString()}.`);
      setLoading(false);
      return;
    }

    if (withdrawAmount > maxAmount) {
      setError(`Maximum withdrawal amount is KES ${maxAmount.toLocaleString()}.`);
      setLoading(false);
      return;
    }

    if (!phone || phone.length < 10) {
      setError("Please enter a valid M-Pesa phone number.");
      setLoading(false);
      return;
    }

    try {
      // Create withdrawal request in Supabase (pending)
      await withdrawalService.createWithdrawal(user.id, withdrawAmount, phone, mpesaName || user.name);

      // Deduct from balance immediately
      const newBalance = currentBalance - withdrawAmount;
      updateBalance(newBalance);

      // Create live activity for withdrawal
      await liveActivityService.createWithdrawalActivity(user.name || "User", withdrawAmount);

      setMessage(`Withdrawal request of KES ${withdrawAmount.toLocaleString()} submitted! Admin will review and process it shortly.`);
      setAmount("");
      setPhone("");
      setMpesaName("");

      // Reload withdrawals
      await loadWithdrawals();
    } catch (err) {
      setError(err.message || "An unexpected error occurred during withdrawal.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "rejected": return "text-red-400 bg-red-500/10 border-red-500/20";
      default: return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SkeletonLoader count={1} height="200px" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto space-y-6 pb-16 px-4">
      <h1 className="text-3xl font-bold text-text-primary text-center mb-6">Withdraw Funds</h1>

      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-lg text-text-secondary">Current Balance:</p>
          <p className="text-3xl font-bold text-success">KES {currentBalance.toLocaleString()}</p>
        </div>

        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Banknote className="w-4 h-4 text-primary" /> Withdrawal Info
            </h2>
            <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-primary flex items-center gap-1 hover:text-primary/80">
              <History className="w-3 h-3" /> {showHistory ? "Hide" : "History"}
            </button>
          </div>
          <p className="text-text-secondary text-xs mb-1">Minimum: <span className="font-semibold">KES {minAmount.toLocaleString()}</span></p>
          <p className="text-text-secondary text-xs mb-1">Maximum: <span className="font-semibold">KES {maxAmount.toLocaleString()}</span></p>
          <p className="text-text-secondary text-xs mb-3">Method: <span className="font-semibold">M-Pesa</span></p>

          <div className="mt-2">
            <p className="text-xs text-text-secondary mb-1">Progress to Minimum:</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(100, withdrawalProgress)}%` }}></div>
            </div>
            <p className="text-right text-xs text-text-muted mt-1">
              {currentBalance >= minAmount ? "Eligible for withdrawal!" : `KES ${minAmount - currentBalance} more to go`}
            </p>
          </div>
        </div>

        {/* Withdrawal History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/5 pt-4">
              <h3 className="text-xs font-bold text-white mb-2">Your Withdrawals</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {withdrawals.length === 0 && <p className="text-white/30 text-xs text-center">No withdrawals yet</p>}
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <div>
                      <p className="text-white text-xs font-medium">KES {Number(w.amount).toLocaleString()}</p>
                      <p className="text-white/30 text-[10px]">{new Date(w.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(w.status)}`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4 border-t border-white/5 pt-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-2">Amount (KES)</label>
            <input type="number" id="amount" className="input-field" placeholder="e.g., 1500"
              value={amount} onChange={(e) => setAmount(e.target.value)} min={minAmount} max={maxAmount} step="100" required />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-2">M-Pesa Phone Number</label>
            <input type="tel" id="phone" className="input-field" placeholder="e.g., 0712345678"
              value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="mpesaName" className="block text-sm font-medium text-text-secondary mb-2">M-Pesa Account Name (optional)</label>
            <input type="text" id="mpesaName" className="input-field" placeholder="Your M-Pesa registered name"
              value={mpesaName} onChange={(e) => setMpesaName(e.target.value)} />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-xs">{error}</p>
            </motion.div>
          )}

          {message && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-emerald-400 text-xs">{message}</p>
            </motion.div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading || currentBalance < minAmount}>
            {loading ? "Submitting..." : "Request Withdrawal"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
