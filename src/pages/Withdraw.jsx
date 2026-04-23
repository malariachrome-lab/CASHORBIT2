import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { dataService } from "../services/dataService";
import { motion } from "framer-motion";
import { DollarSign, Banknote, Clock, CheckCircle, Wallet } from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Withdraw() {
  const { user, updateBalance } = useAuth();
  const { globalConfig } = useAppState();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const currentBalance = user?.balance || 0;
  const minAmount = globalConfig.minWithdrawal;
  const maxAmount = globalConfig.maxWithdrawal;
  const withdrawalProgress = (currentBalance / minAmount) * 100;

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

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Deduct from user balance (mocking)
      const newBalance = currentBalance - withdrawAmount;
      updateBalance(newBalance);

      // Add to activity feed (mocking)
      // In a real app, this would be handled by backend events

      setMessage(`Withdrawal of KES ${withdrawAmount.toLocaleString()} successful! Funds will be processed in ${dataService.withdrawalConfig.processingTime}.`);
      setAmount("");
    } catch (err) {
      setError(err.message || "An unexpected error occurred during withdrawal.");
    } finally {
      setLoading(false);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto space-y-8 pb-16"
    >
      <h1 className="text-3xl font-bold text-text-primary text-center mb-6">
        Withdraw Funds
      </h1>

      <div className="card p-8 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-lg text-text-secondary">Current Balance:</p>
          <p className="text-3xl font-bold text-success">KES {currentBalance.toLocaleString()}</p>
        </div>

        <div className="border-t border-white/5 pt-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-primary" /> Withdrawal Details
          </h2>
          <p className="text-text-secondary mb-2">
            Minimum Withdrawal: <span className="font-semibold">KES {minAmount.toLocaleString()}</span>
          </p>
          <p className="text-text-secondary mb-2">
            Maximum Withdrawal: <span className="font-semibold">KES {maxAmount.toLocaleString()}</span>
          </p>
          <p className="text-text-secondary mb-2">
            Processing Time: <span className="font-semibold">{dataService.withdrawalConfig.processingTime}</span>
          </p>
          <p className="text-text-secondary mb-4">
            Method: <span className="font-semibold">{dataService.withdrawalConfig.methods.join(", ")}</span>
          </p>

          <div className="mt-4">
            <p className="text-sm text-text-secondary mb-2">Progress to Minimum Withdrawal:</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, withdrawalProgress)}%` }}
              ></div>
            </div>
            <p className="text-right text-xs text-text-muted mt-1">
              {currentBalance >= minAmount ? "Eligible for withdrawal!" : `KES ${minAmount - currentBalance} more to go`}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 border-t border-white/5 pt-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-2">
              Amount to Withdraw (KES)
            </label>
            <input
              type="number"
              id="amount"
              className="input-field"
              placeholder="e.g., 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={minAmount}
              max={maxAmount}
              step="100"
              required
            />
          </div>
          {error && <p className="text-error text-sm text-center">{error}</p>}
          {message && <p className="text-success text-sm text-center"><CheckCircle className="inline-block w-4 h-4 mr-1" />{message}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading || currentBalance < minAmount}>
            {loading ? "Processing..." : "Initiate Withdrawal"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}