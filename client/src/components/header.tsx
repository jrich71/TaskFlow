import { Bell, ChevronDown, Languages } from "lucide-react";
import { User } from "@shared/schema";

interface HeaderProps {
  user?: User;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Languages className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold text-slate-900">LinguaConnect</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Classes</a>
            <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Workshops</a>
            <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Instructors</a>
            <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">My Bookings</a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button className="relative">
              <Bell className="text-slate-400 hover:text-slate-600 transition-colors w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
            </button>
            
            <div className="flex items-center space-x-2">
              {user?.profileImage && (
                <img 
                  src={user.profileImage}
                  alt="User profile" 
                  className="w-8 h-8 rounded-full" 
                />
              )}
              <span className="text-sm font-medium text-slate-700">
                {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
              </span>
              <ChevronDown className="text-slate-400 w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
