import { useAppState } from "../contexts/AppStateContext";
import { Users, TrendingUp, DollarSign, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const StatCard = ({ icon: Icon, label, value, colorClass, animationDelay }) => (
  <motion.div
    className="card flex flex-col items-center justify-center p-4 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: animationDelay, duration: 0.5 }}
  >
    <Icon className={`w-8 h-8 mb-2 ${colorClass}`} />
    <p className="text-sm text-text-secondary">{label}</p>
    <p className="text-2xl font-bold text-text-primary mt-1">
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>
  </motion.div>
);

export default function PlatformStats() {
  const { platformStats } = useAppState();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        icon={DollarSign}
        label="Total Payouts"
        value={`KES ${Math.floor(platformStats?.totalPayouts || 0).toLocaleString()}`}
        colorClass="text-success"
        animationDelay={0}
      />
      <StatCard
        icon={Users}
        label="Active Users"
        value={platformStats?.activeUsers || 0}
        colorClass="text-primary"
        animationDelay={0.1}
      />
      <StatCard
        icon={CheckCircle}
        label="Tasks Completed"
        value={platformStats?.tasksCompleted || 0}
        colorClass="text-emerald-400"
        animationDelay={0.2}
      />
      <StatCard
        icon={TrendingUp}
        label="Total Earnings"
        value={`KES ${Math.floor(platformStats?.totalEarnings || 0).toLocaleString()}`}
        colorClass="text-indigo-400"
        animationDelay={0.3}
      />
    </div>
  );
}