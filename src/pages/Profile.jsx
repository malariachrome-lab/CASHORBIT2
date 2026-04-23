import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { authService } from "../services/authService";
import { motion } from "framer-motion";
import { User, Mail, Phone, Wallet, Briefcase, Plus, Edit, Trash2 } from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Profile() {
  const { user, updateUserStatus, updateUserDetails } = useAuth();
  const { addFunds } = useAppState(); // Changed from addBusinessTill as it was not defined in AppStateContext
  const [newTillName, setNewTillName] = useState("");
  const [newTillNumber, setNewTillNumber] = useState("");
  const [isAddingTill, setIsAddingTill] = useState(false);
  const [loadingTill, setLoadingTill] = useState(false);
  const [tillError, setTillError] = useState(null);

  const handleAddBusinessTill = async (e) => {
    e.preventDefault();
    setLoadingTill(true);
    setTillError(null);

    if (!newTillName || !newTillNumber) {
      setTillError("Please fill in both till name and number.");
      setLoadingTill(false);
      return;
    }

    try {
      if (user) {
        const updatedTills = await authService.addBusinessTill(user.id, newTillName, newTillNumber);
        updateUserDetails(user.id, { businessTills: updatedTills }); // Update user in AuthContext
        alert("Business Till added successfully!");
        setNewTillName("");
        setNewTillNumber("");
        setIsAddingTill(false);
      }
    } catch (err) {
      setTillError(err.message || "Failed to add business till.");
    } finally {
      setLoadingTill(false);
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
      className="max-w-4xl mx-auto space-y-8 pb-16"
    >
      <h1 className="text-3xl font-bold text-text-primary text-center mb-6">
        My Profile
      </h1>

      <div className="card p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary mb-5 flex items-center gap-3">
            <User className="w-7 h-7 text-primary" /> Personal Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-muted">Name</p>
              <p className="text-lg font-medium text-text-primary">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Email</p>
              <p className="text-lg font-medium text-text-primary">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Phone</p>
              <p className="text-lg font-medium text-text-primary">{user.phone}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Member Since</p>
              <p className="text-lg font-medium text-text-primary">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Account Status</p>
              <span
                className={`badge ${
                  user.status === "active" ? "badge-success" : "badge-warning"
                }`}
              >
                {user.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-text-primary mb-5 flex items-center gap-3">
            <Wallet className="w-7 h-7 text-success" /> Financial Overview
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-muted">Current Balance</p>
              <p className="text-3xl font-bold text-success">KES {user.balance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Total Referrals</p>
              <p className="text-xl font-medium text-primary">{user.referrals || 0}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Referral Code</p>
              <p className="text-xl font-medium text-primary">{user.referralCode}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-indigo-400" /> Business Tills
          </div>
          <button onClick={() => setIsAddingTill(!isAddingTill)} className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> {isAddingTill ? "Cancel" : "Add New Till"}
          </button>
        </h2>

        {isAddingTill && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleAddBusinessTill}
            className="mt-6 p-6 bg-surface-light rounded-xl space-y-4 border border-white/10"
          >
            <div>
              <label htmlFor="tillName" className="block text-sm font-medium text-text-secondary mb-2">
                Business Name
              </label>
              <input
                type="text"
                id="tillName"
                className="input-field"
                placeholder="My Shop"
                value={newTillName}
                onChange={(e) => setNewTillName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="tillNumber" className="block text-sm font-medium text-text-secondary mb-2">
                Till Number
              </label>
              <input
                type="text"
                id="tillNumber"
                className="input-field"
                placeholder="e.g., 999888"
                value={newTillNumber}
                onChange={(e) => setNewTillNumber(e.target.value)}
                required
              />
            </div>
            {tillError && <p className="text-error text-sm text-center">{tillError}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loadingTill}>
              {loadingTill ? "Adding..." : "Save Business Till"}
            </button>
          </motion.form>
        )}

        <div className="mt-6 space-y-4">
          {user.businessTills && user.businessTills.length > 0 ? (
            user.businessTills.map((till) => (
              <div key={till.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-text-primary">{till.name}</p>
                  <p className="text-sm text-text-secondary">Till No: {till.number}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full hover:bg-surface-light text-text-secondary">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-error/20 text-error">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-text-muted text-center py-4">No business tills registered yet.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}