import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Play, Clock, AlertCircle } from "lucide-react";
import VideoTask from "./VideoTask";
import SurveyTask from "./SurveyTask";

export default function TaskModal({ isOpen, onClose, task, onComplete, dailyTasksLeft }) {
  const [step, setStep] = useState("intro"); // intro, active, completed
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("intro");
      setTimer(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // If modal is closed or no task, render nothing (but hooks already ran safely above)
  if (!isOpen || !task) {
    return null;
  }

  const taskType = task.type || "";
  const isVideo = taskType === "video" || taskType === "watch_video";
  const isSurvey = taskType === "survey" || taskType === "take_survey";

  // Default duration for intro display
  const duration = isVideo ? 30 : isSurvey ? 60 : 30;

  const startTask = () => {
    if (dailyTasksLeft <= 0) {
      alert("You have reached your daily task limit (7 tasks). Come back tomorrow!");
      return;
    }
    setStep("active");
    setTimer(duration);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleComplete = () => {
    setStep("completed");
    onComplete(task);

    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div>
              <h2 className="text-xl font-bold text-text-primary">{task.name}</h2>
              <p className="text-sm text-text-secondary mt-1">Earn KES {task.baseEarnings}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 text-text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === "intro" && (
              <div className="space-y-4">
                <div className="card bg-surface-light p-4">
                  <p className="text-text-secondary">{task.description}</p>
                </div>

                <div className="flex items-center gap-2 text-text-muted">
                  <Clock className="w-4 h-4" />
                  <span>Estimated time: {duration} seconds</span>
                </div>

                {dailyTasksLeft <= 0 && (
                  <div className="card bg-error/10 border-error/20 p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-error" />
                    <p className="text-error text-sm">Daily task limit reached (7/7). Come back tomorrow!</p>
                  </div>
                )}

                <button
                  onClick={startTask}
                  disabled={dailyTasksLeft <= 0}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  {dailyTasksLeft <= 0 ? "Daily Limit Reached" : "Start Task"}
                </button>
              </div>
            )}

            {step === "active" && (
              <div className="space-y-4">
                {/* Timer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Clock className="w-4 h-4" />
                    <span>Time remaining: {formatTime(timer)}</span>
                  </div>
                  <div className="text-sm text-text-muted">
                    Tasks left today: {dailyTasksLeft}
                  </div>
                </div>

                {/* Video Task */}
                {isVideo && (
                  <VideoTask task={task} onComplete={handleComplete} />
                )}

                {/* Survey Task */}
                {isSurvey && (
                  <SurveyTask task={task} onComplete={handleComplete} />
                )}

                {/* Unknown / fallback */}
                {!isVideo && !isSurvey && (
                  <div className="space-y-4">
                    <div className="card bg-surface-light p-6 text-center space-y-4">
                      <h3 className="text-lg font-semibold text-text-primary">
                        {task.name}
                      </h3>
                      <p className="text-text-secondary">
                        Complete this task by waiting for the timer to finish.
                      </p>
                      <div className="text-3xl font-bold text-primary">
                        {formatTime(timer)}
                      </div>
                    </div>
                    <button
                      onClick={handleComplete}
                      disabled={timer > 0}
                      className="btn-success w-full flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {timer > 0 ? `Wait ${formatTime(timer)}` : "Complete Task"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === "completed" && (
              <div className="text-center space-y-4 py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-10 h-10 text-success" />
                </motion.div>
                <h3 className="text-2xl font-bold text-text-primary">Task Completed!</h3>
                <p className="text-text-secondary">
                  You earned <span className="text-success font-bold">KES {task.baseEarnings}</span>
                </p>
                <p className="text-sm text-text-muted">
                  Tasks remaining today: {Math.max(0, dailyTasksLeft - 1)}/7
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
