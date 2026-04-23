import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { mockDataService } from "../services/dataService";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Gift, Share2, QrCode, Copy } from "lucide-react";
import QRCode from "qrcode.react";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Referral() {
  const { user, isAuthenticated, isPending } = useAuth();
  const { globalConfig } = useAppState();
  const navigate = useNavigate();

  const referralLink = user ? `${window.location.origin}/register?ref=${user.referralCode}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    alert("Referral link copied to clipboard!");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-text-secondary">
        <p className="text-lg mb-4">Please log in to view your referral information.</p>
        <Link to="/login" className="btn-primary">Login</Link>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="card bg-warning/20 border-warning text-warning-dark p-4 rounded-xl flex items-center justify-between mx-auto max-w-xl mt-10">
        <p className="font-semibold">
          Your account is <span className="font-bold">PENDING ACTIVATION</span>. Activate to access referral features.
        </p>
        <Link to="/activate" className="btn-primary py-2 px-4 text-sm">
          Activate Now
        </Link>
      </div>
    );
  }

  const getReferralTier = (numReferrals) => {
    // Using mockDataService for tier definitions, but can be moved to globalConfig
    const { tierBonuses } = mockDataService.referralRewards;
    if (numReferrals >= tierBonuses.gold.min) {
      return { tier: "Gold", bonus: tierBonuses.gold.bonusPerReferral, color: "text-yellow-500" };
    } else if (numReferrals >= tierBonuses.silver.min) {
      return { tier: "Silver", bonus: tierBonuses.silver.bonusPerReferral, color: "text-slate-400" };
    } else {
      return { tier: "Bronze", bonus: tierBonuses.bronze.bonusPerReferral, color: "text-amber-700" };
    }
  };

  const userReferralCount = user?.referrals || 0; // Assuming 'referrals' count is on user object
  const currentTier = getReferralTier(userReferralCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-16"
    >
      <h1 className="text-3xl font-bold text-text-primary text-center mb-6">
        Cash Orbit Referral Program
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Referral Stats */}
        <div className="card p-8 flex flex-col items-center justify-center text-center">
          <Gift className="w-12 h-12 text-primary mb-4" />
          <p className="text-lg text-text-secondary">Total Referrals</p>
          <p className="text-5xl font-bold text-success mt-2">{userReferralCount}</p>
          <p className="text-md text-text-muted mt-4">You earn KES {globalConfig.referralBonus} for each active referral!</p>
        </div>

        {/* Referral Link & QR Code */}
        <div className="card p-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-3">
            <Share2 className="w-7 h-7 text-emerald-400" /> Share Your Link
          </h2>
          <p className="text-text-secondary mb-4">
            Invite your friends to Cash Orbit and earn rewards when they activate their account!
          </p>

          <div className="flex items-center bg-surface-light rounded-xl p-3 mb-4 border border-white/10">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="input-field flex-grow bg-transparent border-none focus:ring-0 px-0"
            />
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-surface hover:bg-surface-light transition-colors text-text-secondary"
              title="Copy Link"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            <p className="text-text-secondary">Or share via QR Code:</p>
            <div className="p-4 bg-white rounded-lg shadow-lg">
              <QRCode value={referralLink} size={180} level="H" />
            </div>
            <p className="text-sm text-text-muted text-center max-w-xs">
              Scan this QR code or click the link to register with your referral.
            </p>
          </div>
        </div>
      </div>

      {/* Referral Tiers */}
      <div className="card p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-3">
          <Gift className="w-7 h-7 text-purple-400" /> Referral Tiers
        </h2>
        <p className="text-text-secondary mb-6">
          Unlock higher earning potential as you refer more users. Your current tier is{" "}
          <span className={`font-bold ${currentTier.color}`}>{currentTier.tier}</span>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {Object.entries(mockDataService.referralRewards.tierBonuses).map(([tierName, tierData]) => (
            <div
              key={tierName}
              className={`card p-6 flex flex-col items-center transition-all duration-300 ${currentTier.tier.toLowerCase() === tierName ? "border-primary shadow-glow" : ""}`}
            >
              <h3 className={`text-xl font-bold mb-2 capitalize ${currentTier.tier.toLowerCase() === tierName ? "gradient-text" : "text-text-primary"}`}>
                {tierName} Tier
              </h3>
              <p className="text-4xl font-bold text-success mb-3">
                KES {tierData.bonusPerReferral}
              </p>
              <p className="text-sm text-text-muted">Bonus per referral</p>
              <p className="text-sm text-text-secondary mt-2">
                {tierData.min === 0 ? "0+" : `${tierData.min}-`} {tierData.max === Infinity ? "Active Referrals" : `${tierData.max} Active Referrals`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}