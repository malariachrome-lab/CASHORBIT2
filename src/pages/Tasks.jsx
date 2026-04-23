import { useState } from "react";
import TaskCard from "../components/TaskCard";
import AuthModal from "../components/AuthModal";
import TaskModal from "../components/TaskModal";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { dataService } from "../services/dataService";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Tasks() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const { user, isAuthenticated, isPending, updateBalance, isLoading: authLoading } = useAuth();
  const { tasks, completeTask, dailyTasksLeft } = useAppState();
  const navigate = useNavigate();

  const handleStartTaskClick = (task) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    } else if (isPending) {
      navigate("/activate");
    } else {
      setActiveTask(task);
    }
  };

  const handleTaskComplete = async (task) => {
    const earnings = task.baseEarnings;
    try {
      // Update balance in Supabase and get the new balance
      const newBalance = await dataService.handleTaskCompletion(user.id, earnings);
      // Optimistically update local user state for immediate UI feedback
      updateBalance(newBalance);
      // Track task completion locally
      completeTask(task.id, earnings);
    } catch (err) {
      console.error("Failed to complete task:", err);
      alert("Failed to update earnings. Please try again.");
    }
  };

  const getTaskIcon = (iconName) => {
    const Icon = LucideIcons[iconName];
    return Icon ? <Icon className="w-5 h-5 mr-2" /> : null;
  };

  const isLoadingContent = authLoading;

  if (!user && !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-text-secondary">
        <p className="text-lg mb-4">Please log in or register to view tasks.</p>
        <Link to="/login" className="btn-primary">Login / Register</Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-16"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-text-primary text-center md:text-left">
          Available Tasks to Earn
        </h1>
        <div className="card bg-surface-light px-4 py-2 flex items-center gap-3">
          <LucideIcons.Clock className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm text-text-secondary">Daily Tasks Left</p>
            <p className="text-lg font-bold text-primary">{dailyTasksLeft} / 7</p>
          </div>
        </div>
      </div>

      {isLoadingContent ? (
        <SkeletonLoader count={5} height="80px" className="mb-4" />
      ) : (
        <>
          {user && isPending && (
            <div className="card bg-warning/20 border-warning text-warning-dark p-4 rounded-xl flex items-center justify-between">
              <p className="font-semibold">
                Your account is <span className="font-bold">PENDING ACTIVATION</span>. Please activate to start earning.
              </p>
              <Link to="/activate" className="btn-primary py-2 px-4 text-sm">
                Activate Now
              </Link>
            </div>
          )}

          {dailyTasksLeft <= 0 && (
            <div className="card bg-error/10 border-error/20 p-4 rounded-xl flex items-center gap-3">
              <LucideIcons.AlertCircle className="w-5 h-5 text-error" />
              <p className="text-error text-sm">
                You have reached your daily task limit (7/7). Come back tomorrow!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div key={task.id} className="card flex flex-col justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-lg bg-surface-light border border-white/10">
                      {getTaskIcon(task.icon)}
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary">{task.name}</h3>
                  </div>
                  <p className="text-text-secondary mb-4">{task.description}</p>
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between text-sm text-text-muted mb-2">
                    <span>Earnings: <span className="text-success font-semibold">KES {task.baseEarnings}</span></span>
                    <span>Time: <span className="font-semibold">{task.duration}</span></span>
                  </div>
                  <button
                    onClick={() => handleStartTaskClick(task)}
                    className="btn-primary w-full"
                    disabled={!task.available || (isAuthenticated && isPending) || dailyTasksLeft <= 0}
                  >
                    {isAuthenticated && isPending
                      ? "Activate Account"
                      : dailyTasksLeft <= 0
                      ? "Daily Limit Reached"
                      : task.available
                      ? "Start Task"
                      : "Unavailable"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <TaskModal
        isOpen={!!activeTask}
        onClose={() => setActiveTask(null)}
        task={activeTask}
        onComplete={handleTaskComplete}
        dailyTasksLeft={dailyTasksLeft}
      />
    </motion.div>
  );
}
