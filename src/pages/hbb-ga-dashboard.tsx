// Example: src/pages/hbb-ga-dashboard.tsx
// Integration example - how to use the GA Dashboard Router

import React from 'react';
import { HBBGADashboardRouter } from '@/components/hbb/hbb-ga-dashboard-router';

/**
 * HBB GA Dashboard Page
 * 
 * This page serves as the entry point for the HBB GA Dashboard system.
 * It automatically handles:
 * - User authentication and role detection
 * - Routing to appropriate dashboard based on role
 * - Session management and caching
 * 
 * Usage:
 * 1. Add route: <Route path="/hbb-ga" element={<HBBGADashboardPage />} />
 * 2. User navigates to /hbb-ga
 * 3. System prompts for phone number (or retrieves from cache)
 * 4. Appropriate dashboard loads based on user role
 */
export function HBBGADashboardPage() {
  return <HBBGADashboardRouter />;
}

export default HBBGADashboardPage;
