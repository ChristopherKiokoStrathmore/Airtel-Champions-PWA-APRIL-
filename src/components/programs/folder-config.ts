/**
 * PROGRAM FOLDERS CONFIGURATION
 * Define folders purely in the app - no database needed!
 * Programs are automatically grouped by their category field
 */

export interface FolderConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string; // Match with program.category
  order: number;
}

/**
 * PROGRAM OVERRIDE MAPPING
 * Map specific programs to folders by title/ID (without changing database)
 * This overrides the category field from the database
 */
export const PROGRAM_FOLDER_OVERRIDES: Record<string, string> = {
  // Map program titles (case-insensitive) to folder categories
  'check in': 'MINI-ROAD SHOW',
  'check-in': 'MINI-ROAD SHOW',
  'checkin': 'MINI-ROAD SHOW',
  'check out': 'MINI-ROAD SHOW',
  'check-out': 'MINI-ROAD SHOW',
  'checkout': 'MINI-ROAD SHOW',
  'mini road show check in': 'MINI-ROAD SHOW',
  'mini road show check out': 'MINI-ROAD SHOW',
  'road show check in': 'MINI-ROAD SHOW',
  'road show check out': 'MINI-ROAD SHOW',
};

/**
 * Define your folder structure here
 * Edit this array to add/remove/modify folders
 */
export const FOLDER_CONFIG: FolderConfig[] = [
  {
    id: 'mini-road-show',
    name: 'MINI-ROAD SHOW',
    description: 'Road show check-in and check-out programs',
    icon: '🚗',
    color: 'red',
    category: 'MINI-ROAD SHOW', // Programs with category="MINI-ROAD SHOW" go here
    order: 1
  },
  {
    id: 'sales',
    name: 'Sales Programs',
    description: 'Programs focused on sales activities and targets',
    icon: '💰',
    color: 'green',
    category: 'Sales', // Programs with category="Sales" go here
    order: 2
  },
  {
    id: 'customer',
    name: 'Customer Experience',
    description: 'Programs for improving customer satisfaction',
    icon: '😊',
    color: 'blue',
    category: 'Customer Experience',
    order: 3
  },
  {
    id: 'network',
    name: 'Network Quality',
    description: 'Programs for network testing and feedback',
    icon: '📡',
    color: 'purple',
    category: 'Network Experience',
    order: 4
  },
  {
    id: 'training',
    name: 'Training & Development',
    description: 'Learning and skill development programs',
    icon: '📚',
    color: 'orange',
    category: 'Training',
    order: 5
  },
  {
    id: 'data',
    name: 'Data & Analytics',
    description: 'Programs for data collection and insights',
    icon: '📊',
    color: 'pink',
    category: 'Data',
    order: 6
  }
];

/**
 * Get folder for a program based on its category
 * Checks override mapping first, then falls back to database category
 */
export function getFolderForProgram(programCategory?: string, programTitle?: string): FolderConfig | null {
  // Check if program title has an override mapping
  if (programTitle) {
    const titleLower = programTitle.toLowerCase().trim();
    const overrideCategory = PROGRAM_FOLDER_OVERRIDES[titleLower];
    if (overrideCategory) {
      const folder = FOLDER_CONFIG.find(f => f.category === overrideCategory);
      console.log(`[Override] ✅ "${programTitle}" → ${overrideCategory} folder`);
      return folder || null;
    }
  }
  
  // Fall back to database category
  if (!programCategory) return null;
  return FOLDER_CONFIG.find(f => f.category === programCategory) || null;
}

/**
 * Group programs by folder
 */
export function groupProgramsByFolder<T extends { category?: string; title?: string }>(programs: T[]) {
  const grouped: Record<string, { folder: FolderConfig | null; programs: T[] }> = {};
  
  // Initialize all folders
  FOLDER_CONFIG.forEach(folder => {
    grouped[folder.id] = { folder, programs: [] };
  });
  
  // Add unfoldered category
  grouped['unfoldered'] = { folder: null, programs: [] };
  
  // Group programs
  programs.forEach(program => {
    // Pass both category and title to check overrides
    const folder = getFolderForProgram(program.category, program.title);
    
    // 🔍 Debug logging to see what's happening
    console.log(`[Folder Mapping] Program: "${program.title}" | Category: "${program.category}" | Mapped to: ${folder ? folder.name : 'Unfoldered'}`);
    
    if (folder) {
      grouped[folder.id].programs.push(program);
    } else {
      grouped['unfoldered'].programs.push(program);
    }
  });
  
  return grouped;
}

/**
 * Get color classes for a folder
 */
export function getFolderColorClasses(color: string) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    pink: 'bg-pink-50 border-pink-200 text-pink-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };
  return colorMap[color] || 'bg-gray-50 border-gray-200 text-gray-700';
}
