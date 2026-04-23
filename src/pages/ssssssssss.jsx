import { useState } from "react";
import PlatformStats from "../components/PlatformStats";
import TaskCard from "../components/TaskCard";
import LiveActivityFeed from "../components/LiveActivityFeed";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { Link, useNavigate } from "react-router-dom";
import { DollarSign, Gift, Clock, CheckCircle, ClipboardList, AlertCircle } from "lucide-react";
import { formatDistanceStrict } from "date-fns";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Dashboard() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, isAuthenticated, isPending, isActive, isLoading: authLoading } = useAuth();
  const { tasks, platformStats, dailyStreak, claimDailyBonus, globalConfig, dailyTasksLeft } = useAppState();
  const navigate = useNavigate();

  const handleStartTaskClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    } else if (isPending) {
      navigate("/activate");
    } else {
      // Logic to start task, possibly navigate to /tasks or a task detail page
      // For now, redirect to tasks page
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
        alert(`You claimed your daily bonus of KES ${result.bonus}! Streak: ${dailyStreak.current}`);
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("Failed to claim daily bonus: " + error.message);
    } finally {
      // setLoading(false) if there was a local loading state
    }
  };

  // Calculate time remaining for daily bonus
  const lastClaimDate = dailyStreak.lastClaim ? new Date(dailyStreak.lastClaim) : null;
  const nextClaimTime = lastClaimDate ? new Date(lastClaimDate.getTime() + globalConfig.dailyBonusResetHours * 60 * 60 * 1000) : null;
  const now = new Date();

  const timeRemaining = nextClaimTime && nextClaimTime > now
    ? formatDistanceStrict(nextClaimTime, now, { unit: "hour", addSuffix: true })
    : "Ready!";

  const isDailyBonusClaimable = !lastClaimDate || now.getTime() >= nextClaimTime.getTime();

  // Loading state for the dashboard elements
  const isLoadingContent = authLoading; // Can combine with app state loading if implemented

  return (
    <div className="space-y-8 pb-16">
      <h1 className="text-3xl font-bold text-text-primary mb-4">
        Welcome{user ? `, ${user.name?.split(" ")[0]}` : ""} to Cash Orbit!
      </h1>

      {isLoadingContent ? (
        <SkeletonLoader count={3} height="100px" className="mb-4" />
      ) : (
        <>
          {user && isPending && (
            <div className="card bg-warning/20 border-warning text-warning-dark p-4 rounded-xl flex items-center justify-between">
              <p className="font-semibold">
                Your account is <span className="font-bold">PENDING ACTIVATION</span>. Please complete your payment.
              </p>
              <Link to="/activate" className="btn-primary py-2 px-4 text-sm">
                Activate Now
              </Link>
            </div>
          )}

          <PlatformStats />

          {isAuthenticated && isActive && ( 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card flex flex-col justify-between items-start">
                <div>
                  <p className="text-lg text-text-secondary mb-2">Current Balance</p>
                  <p className="text-4xl font-bold text-success mb-4">
                    KES {user?.balance?.toLocaleString() || "0"}
                  </p>
                </div>
                <Link to="/withdraw" className="btn-primary w-full text-center">
                  <DollarSign className="w-5 h-5 mr-2" /> Withdraw Funds
                </Link>
              </div>

              <div className="card flex flex-col items-start">
                <h3 className="text-lg font-semibold text-text-primary mb-3">Daily Streak Bonus</h3>
                <p className="text-text-secondary text-sm mb-2">
                  Maintain your streak for higher bonuses!
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-xl font-bold text-primary">{dailyStreak.current} Day Streak</span>
                  <span className="badge badge-info text-xs">x{dailyStreak.multiplier.toFixed(1)} Bonus</span>
                </div>
                <button
                  onClick={handleClaimDailyBonus}
                  className="btn-success w-full flex items-center justify-center"
                  disabled={!isDailyBonusClaimable}
                >
                  {isDailyBonusClaimable ? (
                    <Clock className="w-5 h-5 mr-2" />
                  ) : (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  )}
                  {isDailyBonusClaimable ? `Claim Bonus (${timeRemaining})` : "Claimed Today!"}
                </button>
              </div>

              <div className="card flex flex-col items-start">
                <h3 className="text-lg font-semibold text-text-primary mb-3">Referral Program</h3>
                <p className="text-text-secondary text-sm mb-2">
                  Invite friends and earn rewards!
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-5 h-5 text-yellow-400" />
                  <span className="text-xl font-bold text-primary">{user?.referrals || 0} Referrals</span>
                </div>
                <Link to="/referral" className="btn-secondary w-full text-center">
                  View My Referrals
                </Link>
              </div>

              <div className="card flex flex-col items-start">
                <h3 className="text-lg font-semibold text-text-primary mb-3">Daily Tasks</h3>
                <p className="text-text-secondary text-sm mb-2">
                  Complete up to 7 tasks per day to earn!
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <span className="text-xl font-bold text-primary">{7 - dailyTasksLeft} / 7 Completed</span>
                </div>
                {dailyTasksLeft > 0 ? (
                  <Link to="/tasks" className="btn-primary w-full text-center">
                    Start Earning
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 text-warning text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Daily limit reached</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Available Tasks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.slice(0, 6).map((task) => (
                <TaskCard key={task.id} task={task} onStartTask={handleStartTaskClick} />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link to="/tasks" className="btn-outline px-8 py-3">
                View All Tasks
              </Link>
            </div>
          </section>

          <section>
            <LiveActivityFeed count={10} />
          </section>
        </>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}