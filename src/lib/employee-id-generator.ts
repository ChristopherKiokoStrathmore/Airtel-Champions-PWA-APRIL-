import { supabase } from '../utils/supabase/client';

/**
 * Generate a unique Employee ID based on role
 * Format: [ROLE_PREFIX][SEQUENTIAL_NUMBER]
 * Examples: SE001, ZSM012, ZBM003, HQ005, DIR001, DEV002
 */
export async function generateEmployeeId(role: string): Promise<string> {
  try {
    // Get role prefix
    const prefix = getRolePrefix(role);
    
    // Get all existing employee IDs for this role from database
    const { data: users } = await supabase
      .from('app_users')
      .select('employee_id')
      .like('employee_id', `${prefix}%`)
      .order('employee_id', { ascending: false });
    
    // Extract numbers from existing IDs and find the highest
    let maxNumber = 0;
    
    if (users && users.length > 0) {
      users.forEach((user: any) => {
        if (user.employee_id) {
          const numPart = user.employee_id.replace(prefix, '');
          const num = parseInt(numPart, 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      });
    }
    
    // Generate next ID
    const nextNumber = maxNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    const employeeId = `${prefix}${paddedNumber}`;
    
    console.log(`[EmployeeID] Generated ${employeeId} for role ${role} (previous max: ${maxNumber})`);
    
    return employeeId;
  } catch (error) {
    console.error('[EmployeeID] Error generating employee ID:', error);
    // Fallback to timestamp-based ID
    const prefix = getRolePrefix(role);
    return `${prefix}${Date.now().toString().slice(-3)}`;
  }
}

/**
 * Get role prefix for employee ID
 */
function getRolePrefix(role: string): string {
  switch (role) {
    case 'sales_executive':
      return 'SE';
    case 'zonal_sales_manager':
      return 'ZSM';
    case 'zonal_business_manager':
      return 'ZBM';
    case 'hq_staff':
    case 'hq_command_center':
      return 'HQ';
    case 'director':
      return 'DIR';
    case 'developer':
      return 'DEV';
    default:
      return 'USR';
  }
}

/**
 * Validate employee ID format
 */
export function validateEmployeeId(employeeId: string): boolean {
  // Should match pattern: [PREFIX][3-DIGIT-NUMBER]
  const pattern = /^(SE|ZSM|ZBM|HQ|DIR|DEV|USR)\d{3}$/;
  return pattern.test(employeeId);
}

/**
 * Check if employee ID already exists
 */
export async function employeeIdExists(employeeId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('id')
      .eq('employee_id', employeeId)
      .single();
    
    return !!data && !error;
  } catch {
    return false;
  }
}
