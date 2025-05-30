import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import StatsGrid from "@/components/stats-grid";
import SearchFilters from "@/components/search-filters";
import ClassCard from "@/components/class-card";
import Sidebar from "@/components/sidebar";
import { ClassWithDetails, UserStats } from "@shared/schema";
import { useState } from "react";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery<ClassWithDetails[]>({
    queryKey: ["/api/classes", selectedLanguage, selectedLevel, selectedTime],
    queryFn: ({ queryKey }) => {
      const [baseUrl, language, level, timeOfDay] = queryKey;
      const params = new URLSearchParams();
      if (language) params.append("language", language as string);
      if (level) params.append("level", level as string);
      if (timeOfDay) params.append("timeOfDay", timeOfDay as string);
      
      const url = params.toString() ? `${baseUrl}?${params}` : baseUrl as string;
      return fetch(url, { credentials: "include" }).then(res => res.json());
    },
  });

  const filteredClasses = classes.filter(classItem =>
    classItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classItem.instructor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classItem.instructor.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classItem.language.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      <Header user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.firstName || "User"}! 👋
          </h1>
          <p className="text-slate-600">Ready to continue your language learning journey?</p>
        </div>

        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Search and Filters */}
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          selectedTime={selectedTime}
          onTimeChange={setSelectedTime}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Class Listings */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Available Classes</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600">Sort by:</span>
                <select className="text-sm border border-slate-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option>Nearest</option>
                  <option>Soonest</option>
                  <option>Price: Low to High</option>
                  <option>Rating</option>
                </select>
              </div>
            </div>
            
            {classesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClasses.map((classItem) => (
                  <ClassCard key={classItem.id} classData={classItem} />
                ))}
                
                {filteredClasses.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-600">No classes found matching your criteria.</p>
                  </div>
                )}
                
                {filteredClasses.length > 0 && (
                  <div className="mt-6 text-center">
                    <button className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                      Load More Classes
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </main>
    </div>
  );
}
