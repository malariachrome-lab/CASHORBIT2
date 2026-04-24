import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  CheckCircle2,
  Zap,
  TrendingUp,
  Bell,
  AlertCircle,
  Clock,
  Gift,
  Users,
  ChevronRight,
} from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";
import AuthModal from "../components/AuthModal";

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const {
    user,
    isAuthenticated,
    isPending,
    isActive,
    isLoading: authLoading,
  } = useAuth();
  const {
    tasks,
    activityFeed,
    dailyStreak,
    claimDailyBonus,
    globalConfig,
    dailyTasksLeft,
  } = useAppState();
  const navigate = useNavigate();

  const handleStartTaskClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    } else if (isPending) {
      navigate("/activate");
    } else {
      navigate("/tasks");
    }
  };

  const handleClaimDailyBonus = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (isPending) {
      navigate("/activate");
      return;
    }
    try {
      const result = await claimDailyBonus();
      if (result.success) {
        alert(
          `You claimed your daily bonus of KES ${result.bonus}! Streak: ${dailyStreak.current}`
        );
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("Failed to claim daily bonus: " + error.message);
    }
  };

  const lastClaimDate = dailyStreak.lastClaim
    ? new Date(dailyStreak.lastClaim)
    : null;
  const nextClaimTime = lastClaimDate
    ? new Date(
        lastClaimDate.getTime() +
          globalConfig.dailyBonusResetHours * 60 * 60 * 1000
      )
    : null;
  const now = new Date();

  const timeRemaining =
    nextClaimTime && nextClaimTime > now
      ? `${Math.ceil((nextClaimTime - now) / (1000 * 60 * 60))}h left`
      : "Ready!";

  const isDailyBonusClaimable =
    !lastClaimDate || now.getTime() >= nextClaimTime.getTime();

  const recentActivities = activityFeed.slice(0, 6);

  const isLoadingContent = authLoading;

  return (
    <div className="min-h-[calc(100vh-80px)] pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <p className="text-white/50 text-sm">
            {new Date().getHours() < 12
              ? "Good morning"
              : new Date().getHours() < 18
              ? "Good afternoon"
              : "Good evening"}
            ,
          </p>
          <h1 className="text-white text-xl font-bold">
            {user?.name?.split(" ")[0] || "Guest"}
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
          <Bell className="w-5 h-5 text-white/70" />
        </div>
      </motion.header>

      {isLoadingContent ? (
        <SkeletonLoader count={3} height="120px" className="mb-4" />
      ) : (
        <>
          {user && isPending && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-2xl bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-amber-200 text-sm font-medium">
                  Account pending activation
                </p>
              </div>
              <Link
                to="/activate"
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
              >
                Activate
              </Link>
            </motion.div>
          )}

          {/* Glowing Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl p-6 mb-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_60px_rgba(0,123,255,0.12)]"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-white/50" />
                <p className="text-white/60 text-sm">Total Balance</p>
              </div>
              <h2 className="text-4xl font-extrabold text-white tracking-tight mt-1">
                KES {user?.balance?.toLocaleString() || "0"}
              </h2>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-medium">
                    +12.5%
                  </span>
                </div>
                <span className="text-white/30 text-xs">this week</span>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3 mb-8"
          >
            <button
              onClick={() => navigate("/withdraw")}
              className="group flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 active:scale-95 transition-all hover:bg-white/[0.08] hover:border-white/20"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/25 transition-colors">
                <ArrowUpRight className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-semibold">Withdraw</p>
                <p className="text-white/40 text-xs">Cash out</p>
              </div>
            </button>
            <button
              onClick={handleStartTaskClick}
              className="group flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 active:scale-95 transition-all hover:bg-white/[0.08] hover:border-white/20"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
                <ArrowDownRight className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-semibold">Deposit</p>
                <p className="text-white/40 text-xs">Earn & add</p>
              </div>
            </button>
          </motion.div>

          {/* Stats Row */}
          {isAuthenticated && isActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-3 gap-3 mb-8"
            >
              <div className="p-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 text-center">
                <Gift className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <p className="text-white text-sm font-bold">
                  {dailyStreak.current}
                </p>
                <p className="text-white/40 text-[10px]">Day Streak</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-white text-sm font-bold">
                  {7 - dailyTasksLeft}
                </p>
                <p className="text-white/40 text-[10px]">Tasks Done</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 text-center">
                <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-white text-sm font-bold">
                  {user?.referrals || 0}
                </p>
                <p className="text-white/40 text-[10px]">Referrals</p>
              </div>
            </motion.div>
          )}

          {/* Active Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">
                Active Tasks
              </h3>
              <Link
                to="/tasks"
                className="text-blue-400 text-xs flex items-center gap-0.5 hover:text-blue-300 transition-colors"
              >
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {tasks.slice(0, 4).map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  onClick={handleStartTaskClick}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 active:scale-[0.98] transition-transform cursor-pointer hover:bg-white/[0.07] hover:border-white/15"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 text-blue-400 ml-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {task.name}
                    </p>
                    <p className="text-white/40 text-xs">
                      {task.duration} &bull; {task.type === "video" ? "Video" : "Survey"}
                    </p>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    <span className="text-emerald-400 text-xs font-semibold">
                      KES {task.baseEarnings}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">
                Recent Activity
              </h3>
              <span className="text-white/30 text-xs">Live</span>
            </div>
            <div className="space-y-2">
              {recentActivities.length === 0 && (
                <div className="p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 text-center">
                  <p className="text-white/40 text-xs">No recent activity</p>
                </div>
              )}
              {recentActivities.map((activity, i) => (
                <motion.div
                  key={activity.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/5"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      activity.type === "task_completed"
                        ? "bg-emerald-500/10"
                        : activity.type === "withdrawal"
                        ? "bg-red-500/10"
                        : activity.type === "bonus_claimed"
                        ? "bg-purple-500/10"
                        : "bg-white/5"
                    }`}
                  >
                    {activity.type === "task_completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : activity.type === "withdrawal" ? (
                      <ArrowUpRight className="w-4 h-4 text-red-400" />
                    ) : activity.type === "bonus_claimed" ? (
                      <Zap className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Zap className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">
                      {activity.message}
                    </p>
                    <p className="text-white/30 text-[11px]">
                      {new Date(activity.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {activity.amount && (
                    <span
                      className={`text-xs font-bold shrink-0 ${
                        activity.type === "withdrawal"
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {activity.type === "withdrawal" ? "-" : "+"}KES{" "}
                      {activity.amount.toLocaleString()}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
