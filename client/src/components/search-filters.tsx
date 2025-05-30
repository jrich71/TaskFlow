import { Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Language } from "@shared/schema";

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
}

export default function SearchFilters({
  searchQuery,
  onSearchChange,
  selectedLanguage,
  onLanguageChange,
  selectedLevel,
  onLevelChange,
  selectedTime,
  onTimeChange,
}: SearchFiltersProps) {
  const { data: languages = [] } = useQuery<Language[]>({
    queryKey: ["/api/languages"],
  });

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search for classes, languages, or instructors..." 
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select 
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            <option value="">All Languages</option>
            {languages.map((language) => (
              <option key={language.id} value={language.name}>
                {language.name}
              </option>
            ))}
          </select>
          
          <select 
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={selectedLevel}
            onChange={(e) => onLevelChange(e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          
          <select 
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={selectedTime}
            onChange={(e) => onTimeChange(e.target.value)}
          >
            <option value="">All Times</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
          </select>
          
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Filter className="w-4 h-4 mr-2 inline" />
            Filters
          </button>
        </div>
      </div>
    </div>
  );
}
