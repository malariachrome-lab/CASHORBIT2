import { useAppState } from "../contexts/AppStateContext";
import { formatDistanceToNowStrict } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const activityMessages = {
  task_completed: (user, amount) => `${user} completed a task and earned KES ${amount}.`, 
  withdrawal: (user, amount) => `${user} withdrew KES ${amount}.`, 
  referral: (user) => `${user} referred a new user.`, 
  bonus_claimed: (user) => `${user} claimed their daily bonus.`, 
  activation: (user) => `${user} just joined Cash Orbit.`, 
  funds_added: (user, amount) => `${user} had KES ${amount} added to their balance.`,
  activation_approved: (user) => `Admin approved ${user}'s account.`,
  activation_rejected: (user) => `Admin rejected ${user}'s account activation.`,
};

export default function LiveActivityFeed({ count = 5 }) {
  const { activityFeed } = useAppState();

  return (
    <div className="card h-full flex flex-col">
      <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <span className="live-dot animate-pulse bg-success"></span> Live Activity
      </h2>
      <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence initial={false}>
          {activityFeed.slice(0, count).map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-3 bg-surface-light p-3 rounded-lg border border-white/5"
            >
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5 animate-pulse-slow"></div>
              <div className="flex-grow">
                <p className="text-sm text-text-secondary leading-snug">
                  {activityMessages[activity.type] ? activityMessages[activity.type](activity.user || "A user", activity.amount) : activity.message}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {formatDistanceToNowStrict(new Date(activity.timestamp), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
