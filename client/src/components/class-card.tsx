import { Calendar, Clock, MapPin, Star, Users, BarChart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClassWithDetails } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ClassCardProps {
  classData: ClassWithDetails;
}

export default function ClassCard({ classData }: ClassCardProps) {
  const [isBooked, setIsBooked] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const bookClassMutation = useMutation({
    mutationFn: (classId: number) => apiRequest("POST", `/api/classes/${classId}/book`),
    onSuccess: () => {
      setIsBooked(true);
      toast({
        title: "Class booked successfully!",
        description: `You've booked ${classData.title}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/activities"] });
    },
    onError: () => {
      toast({
        title: "Booking failed",
        description: "Unable to book this class. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatNextSession = (date: Date | string) => {
    const sessionDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
    
    let dayText = "";
    if (sessionDay.getTime() === today.getTime()) {
      dayText = "Today";
    } else if (sessionDay.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
      dayText = "Tomorrow";
    } else {
      dayText = sessionDate.toLocaleDateString("en-US", { weekday: "short" });
    }
    
    const timeText = sessionDate.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    });
    
    return `${dayText}, ${timeText}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "text-secondary";
      case "few_spots":
        return "text-accent";
      default:
        return "text-slate-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "● Available";
      case "few_spots":
        return "● Few spots left";
      default:
        return "● Full";
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <img 
              src={classData.instructor.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48"}
              alt={`Instructor ${classData.instructor.firstName}`}
              className="w-12 h-12 rounded-full" 
            />
            <div>
              <h3 className="font-semibold text-slate-900">{classData.title}</h3>
              <p className="text-sm text-slate-600">
                with {classData.instructor.firstName} {classData.instructor.lastName}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <BarChart className="text-slate-400 w-4 h-4" />
              <span className="text-sm text-slate-600">{classData.level}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="text-slate-400 w-4 h-4" />
              <span className="text-sm text-slate-600">
                {Math.floor(classData.duration / 60)} 
                {classData.duration % 60 !== 0 && `.${classData.duration % 60}`} hour{classData.duration !== 60 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="text-slate-400 w-4 h-4" />
              <span className="text-sm text-slate-600">{classData.distance} mi</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="text-slate-400 w-4 h-4" />
              <span className="text-sm text-slate-600">
                {classData.currentStudents}/{classData.maxStudents} spots
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-slate-600">
                  {classData.rating} ({classData.reviewCount})
                </span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(classData.status)}`}>
                {getStatusText(classData.status)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-slate-900">${classData.price}</p>
              <p className="text-sm text-slate-600">per session</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="text-slate-400 w-4 h-4" />
          <span className="text-sm text-slate-600">
            Next: {classData.nextSession ? formatNextSession(classData.nextSession) : "TBD"}
          </span>
        </div>
        <button 
          className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
            isBooked
              ? "bg-secondary text-white hover:bg-green-700"
              : "bg-primary text-white hover:bg-blue-700"
          }`}
          onClick={() => !isBooked && bookClassMutation.mutate(classData.id)}
          disabled={bookClassMutation.isPending || isBooked}
        >
          {bookClassMutation.isPending ? "Booking..." : isBooked ? "Booked!" : "Book Now"}
        </button>
      </div>
    </div>
  );
}
