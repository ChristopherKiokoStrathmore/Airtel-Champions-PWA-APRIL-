import React from 'react';

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const getRoleConfig = (role: string) => {
    const roleMap: Record<string, { text: string; bg: string; color: string; icon: string }> = {
      'sales_executive': { 
        text: 'Sales Executive', 
        bg: 'bg-gray-100', 
        color: 'text-gray-700',
        icon: '👤' 
      },
      'zonal_sales_manager': { 
        text: 'Zone Sales Manager', 
        bg: 'bg-blue-100', 
        color: 'text-blue-700',
        icon: '👔' 
      },
      'zonal_business_manager': { 
        text: 'Zonal Business Manager', 
        bg: 'bg-green-100', 
        color: 'text-green-700',
        icon: '🎯' 
      },
      'hq_staff': { 
        text: 'HQ Command Center', 
        bg: 'bg-orange-100', 
        color: 'text-orange-700',
        icon: '🏢' 
      },
      'hq_command_center': { 
        text: 'HQ Command Center', 
        bg: 'bg-orange-100', 
        color: 'text-orange-700',
        icon: '🏢' 
      },
      'director': { 
        text: 'Director', 
        bg: 'bg-purple-100', 
        color: 'text-purple-700',
        icon: '👑' 
      },
      'developer': { 
        text: 'Developer', 
        bg: 'bg-pink-100', 
        color: 'text-pink-700',
        icon: '💻' 
      }
    };
    return roleMap[role] || { text: role, bg: 'bg-gray-100', color: 'text-gray-700', icon: '👤' };
  };

  const config = getRoleConfig(role);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${config.bg} ${config.color} ${sizeClasses[size]} rounded-full font-medium`}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
}
