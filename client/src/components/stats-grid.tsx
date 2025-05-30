import { BookOpen, Clock, Flame, Users } from "lucide-react";
import { UserStats } from "@shared/schema";

interface StatsGridProps {
  stats?: UserStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const statsData = [
    {
      label: "Active Classes",
      value: stats?.activeClasses || 0,
      icon: BookOpen,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Hours This Week",
      value: stats?.hoursThisWeek || 0,
      icon: Clock,
      bgColor: "bg-secondary/10",
      iconColor: "text-secondary",
    },
    {
      label: "Streak",
      value: stats?.streak || "0 days",
      icon: Flame,
      bgColor: "bg-accent/10",
      iconColor: "text-accent",
    },
    {
      label: "Available Classes",
      value: stats?.availableClasses || 0,
      icon: Users,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
            <div className={`${stat.bgColor} p-3 rounded-lg`}>
              <stat.icon className={`${stat.iconColor} w-5 h-5`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
