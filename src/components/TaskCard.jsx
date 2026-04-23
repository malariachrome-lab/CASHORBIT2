import { ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function TaskCard({ task, onStartTask }) {
  const { isAuthenticated, isPending } = useAuth();
  const Icon = LucideIcons[task.icon] || LucideIcons.HelpCircle;

  const handleClick = () => {
    onStartTask();
  };

  return (
    <div
      className={`card card-hover flex items-center justify-between p-4 cursor-pointer transition-all duration-300 
        ${!task.available || isPending && isAuthenticated ? "opacity-60 cursor-not-allowed" : ""} `}
      onClick={handleClick}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-surface-light border border-white/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{task.name}</h3>
          <p className="text-sm text-text-secondary mt-1">
            Earn <span className="text-success font-medium">KES {task.baseEarnings}</span> •{" "}
            <span className="text-text-muted">{task.duration}</span>
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-text-secondary" />
    </div>
  );
}