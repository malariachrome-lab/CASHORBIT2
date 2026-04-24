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

// Vibrant task category visuals with gradients and icons
const taskCategoryVisuals = [
  { 
    gradient: "from-pink-500 via-rose-500 to-orange-500", 
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    iconColor: "text-pink-400",
    shadow: "shadow-pink-500/20",
    pattern: "radial-gradient(circle at 20% 50%, rgba(255,45,149,0.1) 0%, transparent 50%)"
  },
  { 
    gradient: "from-cyan-500 via-blue-500 to-purple-500", 
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    iconColor: "text-cyan-400",
    shadow: "shadow-cyan-500/20",
    pattern: "radial-gradient(circle at 80% 20%, rgba(0,240,255,0.1) 0%, transparent 50%)"
  },
  { 
    gradient: "from-emerald-500 via-teal-500 to-cyan-500", 
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    shadow: "shadow-emerald-500/20",
    pattern: "radial-gradient(circle at 50% 80%, rgba(16,185,129,0.1) 0%, transparent 50%)"
  },
  { 
    gradient: "from-violet-500 via-purple-500 to-pink-500", 
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    iconColor: "text-violet-400",
    shadow: "shadow-violet-500/20",
    pattern: "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.1) 0%, transparent 50%)"
  },
  { 
    gradient: "from-amber-500 via-orange-500 to-red-500", 
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    iconColor: "text-amber-400",
    shadow: "shadow-amber-500/20",
    pattern: "radial-gradient(circle at 70% 70%, rgba(245,158,11,0.1) 0%, transparent 50%)"
  },
  { 
    gradient: "from-blue-500 via-indigo-500 to-purple-500", 
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    iconColor: "text-blue-400",
    shadow: "shadow-blue-500/20",
    pattern: "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.1) 0%, transparent 50%)"
  },
];

// Floating particles component for decoration
function FloatingParticles({ color }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1 h-1 rounded-full ${color}`}
          style={{
            left: `${20 + i * 30}%`,
            top: `${30 + i * 20}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}

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
    const Icon = LucideIcons[iconName] || LucideIcons.HelpCircle;
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-text-primary text-center md:text-left gradient-text-rainbow"
          >
            Available Tasks to Earn
          </motion.h1>
          <p className="text-text-secondary text-sm mt-1">Complete tasks and start earning real money today!</p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          className="card bg-surface-light px-4 py-2 flex items-center gap-3 border border-neon-cyan/20"
        >
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
            <LucideIcons.Clock className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Daily Tasks Left</p>
            <p className="text-lg font-bold text-neon-cyan">{dailyTasksLeft} / 7</p>
          </div>
        </motion.div>
      </div>

      {isLoadingContent ? (
        <SkeletonLoader count={5} height="80px" className="mb-4" />
      ) : (
        <>
          {user && isPending && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card bg-warning/20 border-warning text-warning-dark p-4 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <LucideIcons.AlertTriangle className="w-6 h-6 text-warning" />
                <p className="font-semibold">
                  Your account is <span className="font-bold">PENDING ACTIVATION</span>. Please activate to start earning.
                </p>
              </div>
              <Link to="/activate" className="btn-primary py-2 px-4 text-sm whitespace-nowrap">
                Activate Now
              </Link>
            </motion.div>
          )}

          {dailyTasksLeft <= 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card bg-error/10 border-error/20 p-4 rounded-xl flex items-center gap-3"
            >
              <LucideIcons.AlertCircle className="w-5 h-5 text-error" />
              <p className="text-error text-sm">
                You have reached your daily task limit (7/7). Come back tomorrow!
              </p>
            </motion.div>
          )}

          {/* Tasks Grid with Visuals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task, index) => {
              const visual = taskCategoryVisuals[index % taskCategoryVisuals.length];
              const Icon = LucideIcons[task.icon] || LucideIcons.HelpCircle;
              
              return (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${visual.gradient} p-[1px] group cursor-pointer`}
                  onClick={() => handleStartTaskClick(task)}
                >
                  <div className="relative h-full rounded-2xl bg-surface p-5 flex flex-col justify-between overflow-hidden">
                    {/* Background Pattern */}
                    <div 
                      className="absolute inset-0 opacity-50"
                      style={{ background: visual.pattern }}
                    />
                    <FloatingParticles color={visual.iconColor.replace('text-', 'bg-').replace('/10', '/40')} />
                    
                    {/* Top Section */}
                    <div className="relative z-10">
                      {/* Task Image/Icon Area */}
                      <div className="flex items-start justify-between mb-4">
                        <motion.div 
                          whileHover={{ rotate: 10, scale: 1.1 }}
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${visual.gradient} flex items-center justify-center shadow-lg ${visual.shadow}`}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </motion.div>
                        <div className={`px-3 py-1 rounded-full ${visual.bgColor} border ${visual.borderColor}`}>
                          <span className={`text-xs font-bold ${visual.iconColor}`}>
                            KES {task.baseEarnings}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-text-primary mb-2">{task.name}</h3>
                      <p className="text-text-secondary text-sm mb-4 line-clamp-2">{task.description}</p>
                      
                      {/* Task Meta Info */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1.5">
                          <LucideIcons.Clock className={`w-3.5 h-3.5 ${visual.iconColor}`} />
                          <span className="text-xs text-text-muted">{task.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <LucideIcons.BarChart3 className={`w-3.5 h-3.5 ${visual.iconColor}`} />
                          <span className="text-xs text-text-muted">{task.type === "video" ? "Video" : "Survey"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="relative z-10">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-3 rounded-xl bg-gradient-to-r ${visual.gradient} text-white font-semibold text-sm shadow-lg ${visual.shadow} hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={!task.available || (isAuthenticated && isPending) || dailyTasksLeft <= 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTaskClick(task);
                        }}
                      >
                        {isAuthenticated && isPending
                          ? "Activate Account"
                          : dailyTasksLeft <= 0
                          ? "Daily Limit Reached"
                          : task.available
                          ? (
                            <span className="flex items-center justify-center gap-2">
                              Start Task <LucideIcons.ArrowRight className="w-4 h-4" />
                            </span>
                          )
                          : "Unavailable"}
                      </motion.button>
                    </div>
                    
                    {/* Decorative Corner */}
                    <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full ${visual.bgColor} blur-2xl opacity-50`} />
                  </div>
                </motion.div>
              );
            })}
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
