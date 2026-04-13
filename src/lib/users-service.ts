// Real database users service for TAI application
// Fetches users from Supabase app_users table

import { supabase } from '../utils/supabase/client';

export interface User {
  id: string;
  employee_id: string;
  full_name: string;
  role: 'director' | 'hq_command_center' | 'hq_staff' | 'zonal_business_manager' | 'zonal_sales_manager' | 'sales_executive' | 'field_agent';
  zone: string;
  reporting_to?: string;
  profile_photo?: string | null;
  email?: string;
  phone_number?: string;
  rank?: string;
  total_points?: number;
}

// Cache for users to avoid repeated database calls
let usersCache: User[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get all users from database
export async function getAllUsers(): Promise<User[]> {
  // Return cached data if fresh
  if (usersCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return usersCache;
  }

  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, employee_id, full_name, role, zone, email, phone_number, rank, total_points')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    usersCache = data || [];
    cacheTimestamp = Date.now();
    return usersCache;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Clear cache (call when users are updated)
export function clearUsersCache() {
  usersCache = null;
  cacheTimestamp = 0;
}

// Get users by role
export async function getUsersByRole(role: User['role']): Promise<User[]> {
  const allUsers = await getAllUsers();
  return allUsers.filter(user => user.role === role);
}

// Get users by zone
export async function getUsersByZone(zone: string): Promise<User[]> {
  const allUsers = await getAllUsers();
  return allUsers.filter(user => user.zone === zone);
}

// Get user by ID
export async function getUserById(id: string): Promise<User | undefined> {
  const allUsers = await getAllUsers();
  return allUsers.find(user => user.id === id);
}

// Get team members under a specific manager (ZSM)
export async function getTeamMembers(managerId: string): Promise<User[]> {
  const allUsers = await getAllUsers();
  return allUsers.filter(user => user.reporting_to === managerId);
}

// Get users that a specific user can see based on their role
export async function getVisibleUsers(currentUser: User): Promise<User[]> {
  const allUsers = await getAllUsers();
  
  switch (currentUser.role) {
    case 'director':
      // Directors can see everyone
      return allUsers;
    
    case 'hq_command_center':
    case 'hq_staff':
      // HQ can see everyone
      return allUsers;
    
    case 'zonal_business_manager':
      // ZBMs can see everyone in their zone + all managers
      return allUsers.filter(u => 
        u.zone === currentUser.zone || 
        u.role === 'zonal_business_manager' || 
        u.role === 'zonal_sales_manager'
      );
    
    case 'zonal_sales_manager':
      // ZSMs can see SEs in their zone + other ZSMs
      return allUsers.filter(u => 
        (u.role === 'sales_executive' && u.zone === currentUser.zone) ||
        u.role === 'zonal_sales_manager'
      );
    
    case 'sales_executive':
    case 'field_agent':
      // SEs can only see other SEs in their zone
      return allUsers.filter(u => 
        (u.role === 'sales_executive' || u.role === 'field_agent') && 
        u.zone === currentUser.zone
      );
    
    default:
      return allUsers.filter(u => u.id === currentUser.id);
  }
}

// Get unique zones from database
export async function getZones(): Promise<string[]> {
  const allUsers = await getAllUsers();
  const zones = [...new Set(allUsers.map(u => u.zone))].filter(z => z && z !== 'Unassigned');
  return zones.sort();
}

// Get SEs count by zone
export async function getSECountByZone(zone: string): Promise<number> {
  const allUsers = await getAllUsers();
  return allUsers.filter(u => (u.role === 'sales_executive' || u.role === 'field_agent') && u.zone === zone).length;
}

// Get team count for a ZSM
export async function getTeamCount(zsmId: string): Promise<number> {
  const allUsers = await getAllUsers();
  return allUsers.filter(u => u.reporting_to === zsmId).length;
}

// Get all ZSMs from database
export async function getZSMs(): Promise<User[]> {
  return await getUsersByRole('zonal_sales_manager');
}

// Get all SEs by zone
export async function getSEsByZone(zone: string): Promise<User[]> {
  const allUsers = await getAllUsers();
  return allUsers.filter(u => (u.role === 'sales_executive' || u.role === 'field_agent') && u.zone === zone);
}