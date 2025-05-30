import { useQuery } from "@tanstack/react-query";
import { Plus, Calendar, UserPlus } from "lucide-react";
import { Booking, Activity, ClassWithDetails } from "@shared/schema";

export default function Sidebar() {
  const { data: bookings = [] } = useQuery<(Booking & { class: ClassWithDetails })[]>({
    queryKey: ["/api/user/bookings"],
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/user/activities"],
  });

  const upcomingBookings = bookings
    .filter(booking => new Date(booking.sessionDate) > new Date())
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
    .slice(0, 3);

  const formatBookingDate = (date: Date | string) => {
    const bookingDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
    
    let dayText = "";
    let bgColor = "bg-slate-400";
    
    if (bookingDay.getTime() === today.getTime()) {
      dayText = "TODAY";
      bgColor = "bg-primary";
    } else if (bookingDay.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
      dayText = "TOM";
      bgColor = "bg-slate-400";
    } else {
      dayText = bookingDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
      bgColor = "bg-slate-400";
    }
    
    const timeText = bookingDate.toLocaleTimeString("en-US", { 
      hour: "numeric",
      hour12: true 
    }).replace(" ", "");
    
    return { dayText, timeText, bgColor };
  };

  const formatActivityTime = (timestamp: Date | string) => {
    const activityDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - activityDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      return "Just now";
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    }
  };

  const getActivityDotColor = (type: string) => {
    switch (type) {
      case "completed":
        return "bg-secondary";
      case "booked":
        return "bg-primary";
      case "achievement":
        return "bg-accent";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Upcoming Classes */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Upcoming Classes</h3>
        <div className="space-y-4">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => {
              const { dayText, timeText, bgColor } = formatBookingDate(booking.sessionDate);
              return (
                <div key={booking.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <div className={`${bgColor} text-white rounded-lg p-2 text-center min-w-12`}>
                    <div className="text-xs font-medium">{dayText}</div>
                    <div className="text-lg font-bold">{timeText}</div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{booking.class.title}</p>
                    <p className="text-sm text-slate-600">
                      with {booking.class.instructor.firstName} {booking.class.instructor.lastName}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-600 text-sm">No upcoming classes</p>
            </div>
          )}
        </div>
        
        <button className="w-full mt-4 text-primary hover:text-blue-700 font-medium text-sm transition-colors">
          View All Bookings
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activities.slice(0, 3).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-2 h-2 ${getActivityDotColor(activity.type)} rounded-full mt-2`}></div>
              <div>
                <p className="text-sm text-slate-900">{activity.text}</p>
                <p className="text-xs text-slate-500">
                  {activity.timestamp ? formatActivityTime(activity.timestamp) : "Recently"}
                </p>
              </div>
            </div>
          ))}
          
          {activities.length === 0 && (
            <div className="text-center py-4">
              <p className="text-slate-600 text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center space-x-3 p-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            <span>Find New Classes</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 p-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            <Calendar className="w-5 h-5" />
            <span>View Schedule</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 p-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            <UserPlus className="w-5 h-5" />
            <span>Find Study Partners</span>
          </button>
        </div>
      </div>
    </div>
  );
}
