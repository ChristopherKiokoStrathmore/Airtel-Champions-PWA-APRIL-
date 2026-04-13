import { BookOpen } from 'lucide-react';

interface ResearchPlannerButtonProps {
  onClick: () => void;
}

export function ResearchPlannerButton({ onClick }: ResearchPlannerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 z-50 group"
    >
      <div className="relative">
        {/* Pulsing effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse opacity-75"></div>
        
        {/* Main button */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
          <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap">
            📚 Research Paper Planner
            <div className="text-xs text-gray-400 mt-1">ML Integration Guide</div>
          </div>
        </div>
        
        {/* Badge */}
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
          !
        </div>
      </div>
    </button>
  );
}

// Alternative: Simple menu item version
export function ResearchPlannerMenuItem({ onClick }: ResearchPlannerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full px-6 py-4 flex items-center gap-4 hover:bg-purple-50 transition-colors border-l-4 border-transparent hover:border-purple-600 group"
    >
      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
        <BookOpen className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 text-left">
        <div className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
          Research Paper Planner
        </div>
        <div className="text-sm text-gray-500">
          ML Integration • CRISP-DM • 8 Models
        </div>
      </div>
      <div className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
        NEW
      </div>
    </button>
  );
}
