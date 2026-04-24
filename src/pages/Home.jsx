import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Star,
  Flame,
  Trophy,
  LogIn,
  UserPlus,
  Youtube,
  FileText,
  Headphones,
  Share2,
  MonitorPlay,
  BarChart3,
} from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";
import AuthModal from "../components/AuthModal";

// Task image mapping with vibrant gradients and icons
const taskVisuals = [
  { gradient: "from-pink-500 via-rose-500 to-orange-500", icon: Youtube, color: "text-pink-400", bgGlow: "bg-pink-500/10" },
  { gradient: "from-cyan-500 via-blue-500 to-purple-500", icon: MonitorPlay, color: "text-cyan-400", bgGlow: "bg-cyan-500/10" },
  { gradient: "from-emerald-500 via-teal-500 to-cyan-500", icon: FileText, color: "text-emerald-400", bgGlow: "bg-emerald-500/10" },
  { gradient: "from-violet-500 via-purple-500 to-pink-500", icon: Headphones, color: "text-violet-400", bgGlow: "bg-violet-500/10" },
  { gradient: "from-amber-500 via-orange-500 to-red-500", icon: Share2, color: "text-amber-400", bgGlow: "bg-amber-500/10" },
  { gradient: "from-blue-500 via-indigo-500 to-purple-500", icon: BarChart3, color: "text-blue-400", bgGlow: "bg-blue-500/10" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showActivatedBanner, setShowActivatedBanner] = useState(false);
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

  // Show activation banner when user becomes active
  useEffect(() => {
    if (isActive && user?.status === "active") {
      const timer = setTimeout(() => setShowActivatedBanner(true), 500);
      const hideTimer = setTimeout(() => setShowActivatedBanner(false), 6000);
      return () => { clearTimeout(timer); clearTimeout(hideTimer); };
    }
  }, [isActive, user?.status]);

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

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: SunIcon };
    if (hour < 18) return { text: "Good afternoon", icon: SunIcon };
    return { text: "Good evening", icon: Star };
  };

  const greeting = getGreeting();

  return (
    <div className="min-h-[calc(100vh-80px)] pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Activation Success Banner */}
      <AnimatePresence>
        {showActivatedBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-20 left-4 right-4 z-50 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-500/30 shadow-glow-success"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center animate-bounce">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-300 font-bold text-sm">Account Activated!</p>
                <p className="text-emerald-400/70 text-xs">Welcome aboard! Start earning now.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <div className="flex items-center gap-2">
            <greeting.icon className="w-4 h-4 text-neon-cyan" />
            <p className="text-white/50 text-sm">
              {greeting.text},
            </p>
          </div>
          <h1 className="text-white text-xl font-bold">
            {user?.name?.split(" ")[0] || "Guest"}
          </h1>
        </div>
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
        >
          <Bell className="w-5 h-5 text-white/70" />
        </motion.div>
      </motion.header>

      {/* Login/Register Banner for Unauthenticated Users */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-5 rounded-3xl bg-gradient-to-br from-neon-pink/10 via-neon-purple/10 to-primary/10 backdrop-blur-xl border border-white/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-neon-cyan/10 rounded-full blur-3xl -ml-10 -mb-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-neon-pink" />
              <h2 className="text-white font-bold text-lg">Join Cash Orbit</h2>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Start earning money by completing simple tasks. Register now and get started!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
              <Link
                to="/register"
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-neon-pink via-neon-purple to-primary text-white font-semibold text-sm text-center hover:shadow-glow-pink transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </Link>
            </div>
          </div>
        </motion.div>
      )}

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
            className="relative overflow-hidden rounded-3xl p-6 mb-6 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/10 shadow-[0_0_60px_rgba(0,123,255,0.15)]"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-neon-purple/10 rounded-full blur-2xl pointer-events-none" />
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => isAuthenticated ? navigate("/withdraw") : setIsAuthModalOpen(true)}
              className="group flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 transition-all hover:bg-white/[0.08] hover:border-white/20 hover:shadow-glow"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-colors">
                <ArrowUpRight className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-semibold">Withdraw</p>
                <p className="text-white/40 text-xs">Cash out</p>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartTaskClick}
              className="group flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 transition-all hover:bg-white/[0.08] hover:border-white/20 hover:shadow-glow-success"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-colors">
                <ArrowDownRight className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-semibold">
                  {isAuthenticated ? "Earn Now" : "Start Earning"}
                </p>
                <p className="text-white/40 text-xs">
                  {isAuthenticated ? "Complete tasks" : "Join & earn"}
                </p>
              </div>
            </motion.button>
          </motion.div>

          {/* Daily Bonus Card */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 backdrop-blur-xl border border-amber-500/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Daily Bonus</p>
                    <p className="text-white/40 text-xs">{timeRemaining}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClaimDailyBonus}
                  disabled={!isDailyBonusClaimable}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isDailyBonusClaimable
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-glow hover:shadow-lg"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  }`}
                >
                  {isDailyBonusClaimable ? "Claim" : "Claimed"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Stats Row */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-3 gap-3 mb-8"
            >
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                className="p-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 text-center hover:border-purple-500/30 transition-all"
              >
                <Gift className="w-4 h-4 text-neon-purple mx-auto mb-1" />
                <p className="text-white text-sm font-bold">
                  {dailyStreak.current}
                </p>
                <p className="text-white/40 text-[10px]">Day Streak</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                className="p-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 text-center hover:border-emerald-500/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-white text-sm font-bold">
                  {7 - dailyTasksLeft}
                </p>
                <p className="text-white/40 text-[10px]">Tasks Done</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                className="p-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 text-center hover:border-blue-500/30 transition-all"
              >
                <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-white text-sm font-bold">
                  {user?.referrals || 0}
                </p>
                <p className="text-white/40 text-[10px]">Referrals</p>
              </motion.div>
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
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-neon-cyan" />
                <h3 className="text-white font-semibold text-sm">
                  Active Tasks
                </h3>
              </div>
              <Link
                to="/tasks"
                className="text-neon-cyan text-xs flex items-center gap-0.5 hover:text-cyan-300 transition-colors"
              >
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {tasks.slice(0, 4).map((task, i) => {
                const visual = taskVisuals[i % taskVisuals.length];
                const IconComponent = visual.icon;
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartTaskClick}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 cursor-pointer hover:bg-white/[0.07] hover:border-white/15 transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${visual.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <IconComponent className="w-5 h-5 text-white" />
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
                );
              })}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neon-pink" />
                <h3 className="text-white font-semibold text-sm">
                  Recent Activity
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white/30 text-xs">Live</span>
              </div>
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
                  whileHover={{ scale: 1.01, x: 2 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all"
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

          {/* Leaderboard Teaser */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-yellow-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">Top Earner</p>
                  <p className="text-white/40 text-xs">Keep completing tasks to climb the ranks!</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 text-xs font-bold">#1</p>
                  <p className="text-white/30 text-[10px]">You</p>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

// Sun icon component
function SunIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}
