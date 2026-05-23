# 🧪 TESTING GUIDE

**Sales Intelligence Network - Airtel Kenya**  
**Version**: 1.0.0  
**Last Updated**: December 28, 2024

---

## 📋 TABLE OF CONTENTS

1. [Testing Strategy](#testing-strategy)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Performance Testing](#performance-testing)
6. [Security Testing](#security-testing)
7. [User Acceptance Testing](#user-acceptance-testing)
8. [Test Data](#test-data)
9. [CI/CD Testing](#cicd-testing)

---

## 🎯 TESTING STRATEGY

### **Testing Pyramid**:

```
        /\
       /E2E\        10% - End-to-End (Critical flows)
      /------\
     /  Int   \     30% - Integration (API + DB)
    /----------\
   /    Unit    \   60% - Unit (Functions, components)
  /--------------\
```

### **Coverage Goals**:
- **Unit Tests**: >80% coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user journeys
- **Performance Tests**: All key queries
- **Security Tests**: All auth flows

---

## 🔬 UNIT TESTING

### **Frontend Components**

**Setup** (using Vitest + React Testing Library):

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Test Example** (`/tests/components/SubmissionCard.test.tsx`):

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubmissionCard } from '../../components/SubmissionCard';

describe('SubmissionCard', () => {
  it('renders submission data correctly', () => {
    const submission = {
      id: '123',
      user: { name: 'John Doe' },
      mission_type: { name: 'Network Experience' },
      points_awarded: 100,
      status: 'approved'
    };

    render(<SubmissionCard submission={submission} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Network Experience')).toBeInTheDocument();
    expect(screen.getByText('100 pts')).toBeInTheDocument();
  });

  it('shows pending status correctly', () => {
    const submission = {
      id: '123',
      status: 'pending',
      // ...
    };

    render(<SubmissionCard submission={submission} />);

    const statusBadge = screen.getByText('Pending');
    expect(statusBadge).toHaveClass('bg-yellow-100');
  });
});
```

**Run Tests**:

```bash
npm run test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

### **Utility Functions**

**Test Example** (`/tests/utils/validation.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { validatePhone, sanitizeHtml } from '../../lib/validation';

describe('Phone Validation', () => {
  it('accepts valid Kenyan phone numbers', () => {
    expect(validatePhone('+254712345678')).toBe(true);
    expect(validatePhone('0712345678')).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    expect(validatePhone('123')).toBe(false);
    expect(validatePhone('+1234567890')).toBe(false);
    expect(validatePhone('')).toBe(false);
  });
});

describe('HTML Sanitization', () => {
  it('removes script tags', () => {
    const dirty = '<script>alert("xss")</script>Hello';
    const clean = sanitizeHtml(dirty);
    expect(clean).toBe('Hello');
    expect(clean).not.toContain('<script>');
  });

  it('removes event handlers', () => {
    const dirty = '<div onclick="alert()">Click me</div>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('onclick');
  });
});
```

---

## 🔗 INTEGRATION TESTING

### **API Endpoint Testing**

**Test Database Setup** (`/tests/setup.ts`):

```typescript
import { createClient } from '@supabase/supabase-js';

export const testSupabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Clean up test data before each test
export async function cleanupTestData() {
  await testSupabase.from('submissions').delete().ilike('notes', '%TEST%');
  await testSupabase.from('users').delete().ilike('phone', '+254700%'); // Test numbers
}
```

**API Test Example** (`/tests/api/submissions.test.ts`):

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testSupabase, cleanupTestData } from '../setup';

describe('Submissions API', () => {
  let testUserId: string;
  let authToken: string;

  beforeEach(async () => {
    await cleanupTestData();

    // Create test user
    const { data: user } = await testSupabase
      .from('users')
      .insert({
        phone: '+254700000001',
        full_name: 'Test User',
        role: 'se',
        region: 'Nairobi'
      })
      .select()
      .single();

    testUserId = user.id;

    // Get auth token
    const { data: { session } } = await testSupabase.auth.signInWithPassword({
      phone: '+254700000001',
      password: 'test123'
    });
    authToken = session.access_token;
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('creates submission successfully', async () => {
    const { data, error } = await testSupabase
      .from('submissions')
      .insert({
        user_id: testUserId,
        mission_type_id: 'mission-uuid',
        location_name: 'TEST Location',
        notes: 'TEST submission'
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.status).toBe('pending');
    expect(data.user_id).toBe(testUserId);
  });

  it('prevents unauthorized access', async () => {
    const { data, error } = await testSupabase
      .from('submissions')
      .select()
      .eq('user_id', 'other-user-id'); // Try to access other user's data

    // Should be blocked by RLS
    expect(data).toEqual([]);
  });
});
```

---

### **Edge Function Testing**

**Test Example** (`/tests/edge-functions/approve.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';

const BASE_URL = 'https://your-project.supabase.co/functions/v1/make-server-28f2f653';

describe('Approve Submission Endpoint', () => {
  it('approves submission with valid data', async () => {
    const response = await fetch(`${BASE_URL}/submissions/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        submissionId: 'test-submission-uuid',
        pointsAwarded: 100,
        reviewNotes: 'Great work!'
      })
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('approved');
    expect(data.data.points_awarded).toBe(100);
  });

  it('rejects request without authentication', async () => {
    const response = await fetch(`${BASE_URL}/submissions/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId: 'test-uuid',
        pointsAwarded: 100
      })
    });

    expect(response.status).toBe(401);
  });

  it('validates point range', async () => {
    const response = await fetch(`${BASE_URL}/submissions/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        submissionId: 'test-uuid',
        pointsAwarded: 2000 // Exceeds max 1000
      })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('1000');
  });

  it('respects rate limiting', async () => {
    const requests = [];

    // Send 101 requests (limit is 100/min)
    for (let i = 0; i < 101; i++) {
      requests.push(
        fetch(`${BASE_URL}/submissions/approve`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            submissionId: 'test-uuid',
            pointsAwarded: 100
          })
        })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimitedCount = responses.filter(r => r.status === 429).length;

    expect(rateLimitedCount).toBeGreaterThan(0);
  });
});
```

---

## 🌐 END-TO-END TESTING

### **Setup** (using Playwright):

```bash
npm install -D @playwright/test
npx playwright install
```

**E2E Test Example** (`/tests/e2e/admin-workflow.spec.ts`):

```typescript
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Workflow', () => {
  test('complete submission review flow', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:5173');
    await page.fill('input[name="phone"]', '+254712000001');
    await page.fill('input[name="pin"]', '1234');
    await page.click('button:has-text("Login")');

    // Wait for dashboard to load
    await expect(page.locator('h1')).toContainText('Dashboard');

    // 2. Navigate to Submission Review
    await page.click('text=Submission Review');
    await expect(page).toHaveURL(/.*submission-review/);

    // 3. Review pending submission
    const firstSubmission = page.locator('[data-testid="submission-card"]').first();
    await firstSubmission.click();

    // 4. Approve submission
    await page.fill('input[name="points"]', '100');
    await page.fill('textarea[name="notes"]', 'Good work!');
    await page.click('button:has-text("Approve")');

    // 5. Verify success notification
    await expect(page.locator('.toast')).toContainText('approved successfully');

    // 6. Verify submission moved to approved list
    await page.click('button:has-text("Approved")');
    await expect(page.locator('[data-testid="submission-card"]').first())
      .toContainText('Approved');
  });

  test('bulk approve multiple submissions', async ({ page }) => {
    await page.goto('http://localhost:5173/submission-review');

    // Select multiple submissions
    await page.click('[data-testid="submission-checkbox"]:nth-child(1)');
    await page.click('[data-testid="submission-checkbox"]:nth-child(2)');
    await page.click('[data-testid="submission-checkbox"]:nth-child(3)');

    // Bulk approve
    await page.click('button:has-text("Bulk Approve")');
    await page.fill('input[name="bulk-points"]', '100');
    await page.click('button:has-text("Confirm")');

    // Verify success
    await expect(page.locator('.toast')).toContainText('3 submissions approved');
  });

  test('leaderboard updates in real-time', async ({ page, context }) => {
    // Open two pages (admin + SE view)
    const adminPage = page;
    const sePage = await context.newPage();

    // Admin approves submission
    await adminPage.goto('http://localhost:5173/submission-review');
    await adminPage.click('button:has-text("Approve")');

    // SE's leaderboard should update automatically
    await sePage.goto('http://localhost:5173/leaderboard');
    
    // Wait for real-time update (via WebSocket)
    await sePage.waitForTimeout(1000);

    // Verify leaderboard changed
    const points = await sePage.locator('[data-testid="user-points"]').first().textContent();
    expect(parseInt(points || '0')).toBeGreaterThan(0);
  });
});
```

**Run E2E Tests**:

```bash
# Run all tests
npx playwright test

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/admin-workflow.spec.ts

# Debug mode
npx playwright test --debug
```

---

## ⚡ PERFORMANCE TESTING

### **Database Query Performance**:

```sql
-- Test leaderboard query performance
EXPLAIN ANALYZE
SELECT * FROM get_leaderboard('weekly') LIMIT 10;

-- Expected: <10ms execution time

-- Test phone lookup performance
EXPLAIN ANALYZE
SELECT * FROM users WHERE phone = '+254712345678';

-- Expected: <5ms execution time

-- Test submission filtering
EXPLAIN ANALYZE
SELECT * FROM submissions 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 50;

-- Expected: <20ms execution time
```

### **Load Testing** (using Artillery):

**Setup**:

```bash
npm install -g artillery
```

**Test Config** (`load-test.yml`):

```yaml
config:
  target: 'https://your-project.supabase.co/functions/v1/make-server-28f2f653'
  phases:
    # Warm-up: 10 requests/sec for 1 minute
    - duration: 60
      arrivalRate: 10
      name: "Warm-up"
    
    # Ramp-up: increase to 50 requests/sec
    - duration: 120
      arrivalRate: 10
      rampTo: 50
      name: "Ramp-up"
    
    # Sustained load: 50 requests/sec for 5 minutes
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    
    # Spike: 100 requests/sec for 1 minute
    - duration: 60
      arrivalRate: 100
      name: "Spike"

  processor: "./auth-processor.js"

scenarios:
  - name: "Health Check"
    weight: 10
    flow:
      - get:
          url: "/health"
  
  - name: "Get Leaderboard"
    weight: 30
    flow:
      - get:
          url: "/leaderboard?timeframe=weekly"
          headers:
            Authorization: "Bearer {{ authToken }}"
  
  - name: "Approve Submission"
    weight: 20
    flow:
      - post:
          url: "/submissions/approve"
          headers:
            Authorization: "Bearer {{ authToken }}"
            Content-Type: "application/json"
          json:
            submissionId: "{{ submissionId }}"
            pointsAwarded: 100
```

**Run Load Test**:

```bash
artillery run load-test.yml

# Output should show:
# - Success rate: >99%
# - p95 latency: <500ms
# - p99 latency: <1000ms
# - No errors
```

---

## 🔒 SECURITY TESTING

### **Authentication Tests**:

```typescript
describe('Security Tests', () => {
  it('prevents SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('phone', maliciousInput);

    // Should not execute SQL, just return empty
    expect(data).toEqual([]);
    
    // Verify tables still exist
    const { data: users } = await supabase.from('users').select('count');
    expect(users).toBeDefined();
  });

  it('prevents XSS attacks', () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    const sanitized = sanitizeHtml(maliciousInput);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
  });

  it('enforces rate limiting', async () => {
    const responses = [];
    
    // Send 150 requests
    for (let i = 0; i < 150; i++) {
      responses.push(fetch('/api/endpoint'));
    }
    
    const results = await Promise.all(responses);
    const rateLimited = results.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it('validates JWT tokens', async () => {
    const response = await fetch('/api/protected', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    expect(response.status).toBe(401);
  });

  it('prevents CSRF attacks', async () => {
    // Attempt to submit form from different origin
    const response = await fetch('/api/sensitive', {
      method: 'POST',
      headers: {
        'Origin': 'https://malicious-site.com'
      }
    });

    expect(response.status).toBe(403);
  });
});
```

---

## 👥 USER ACCEPTANCE TESTING

### **UAT Checklist**:

#### **Admin Dashboard** (10 screens):

**1. Dashboard Overview** ✅
- [ ] All stats cards display correct numbers
- [ ] Recent submissions load
- [ ] Charts render properly
- [ ] No console errors

**2. Submission Review** ✅
- [ ] Pending submissions list loads
- [ ] Photos display correctly
- [ ] Approve button works
- [ ] Reject with reason works
- [ ] Bulk actions work
- [ ] Filters work (status, region, mission type)
- [ ] Pagination works

**3. Leaderboard** ✅
- [ ] Rankings display correctly
- [ ] Points calculated accurately
- [ ] Region filter works
- [ ] Time filter works (daily/weekly/monthly)
- [ ] Pagination works
- [ ] Real-time updates work

**4. Point Configuration** ✅
- [ ] Mission types list loads
- [ ] Edit points modal works
- [ ] Save updates database
- [ ] Validation works (min/max)

**5. Announcements** ✅
- [ ] Create announcement works
- [ ] Priority levels work
- [ ] Target audience filter works
- [ ] Delete works
- [ ] Expiry date validation works

**6. Daily Challenges** ✅
- [ ] Create challenge works
- [ ] Date range validation works
- [ ] Activate/deactivate works
- [ ] Progress tracking works

**7. Battle Map** ✅
- [ ] Hotspots display on map
- [ ] Competitor sightings show
- [ ] Recent activity updates
- [ ] Filters work

**8. SE Profile Viewer** ✅
- [ ] Search by name/phone works
- [ ] Profile details load
- [ ] Stats calculate correctly
- [ ] Submission history shows
- [ ] Achievements display

**9. Achievement System** ✅
- [ ] All achievements list
- [ ] Filter by category works
- [ ] Filter by tier works
- [ ] Unlock statistics accurate
- [ ] Manual award works

**10. Analytics Dashboard** ✅
- [ ] Key metrics display
- [ ] Charts render correctly
- [ ] Time filters work
- [ ] Export CSV works
- [ ] Top performers list accurate

---

## 📝 TEST DATA

### **Create Test Users**:

```sql
-- Admin user
INSERT INTO users (phone, full_name, role, region, pin_hash) VALUES
('+254700000001', 'Test Admin', 'admin', 'Nairobi', '$2a$10$...');

-- Sales Executive
INSERT INTO users (phone, full_name, role, region, employee_id, pin_hash) VALUES
('+254700000002', 'Test SE', 'se', 'Nairobi', 'SE-TEST-0001', '$2a$10$...');

-- Manager
INSERT INTO users (phone, full_name, role, region, pin_hash) VALUES
('+254700000003', 'Test ZSM', 'zsm', 'Nairobi', '$2a$10$...');
```

### **Create Test Submissions**:

```sql
INSERT INTO submissions (user_id, mission_type_id, status, points_awarded, location_name, notes)
SELECT 
  (SELECT id FROM users WHERE phone = '+254700000002'),
  (SELECT id FROM mission_types WHERE code = 'NETWORK_EXPERIENCE'),
  'pending',
  0,
  'TEST Location ' || generate_series(1, 10),
  'TEST submission ' || generate_series(1, 10);
```

### **Cleanup Test Data**:

```sql
DELETE FROM submissions WHERE notes LIKE '%TEST%';
DELETE FROM users WHERE phone LIKE '+25470%';
```

---

## 🤖 CI/CD TESTING

### **GitHub Actions Workflow** (`.github/workflows/test.yml`):

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Build
        run: npm run build
```

---

## 📊 TEST COVERAGE REPORT

### **Generate Coverage**:

```bash
npm run test:coverage

# Output:
# ------------------------|---------|----------|---------|---------|
# File                    | % Stmts | % Branch | % Funcs | % Lines |
# ------------------------|---------|----------|---------|---------|
# All files               |   85.23 |    78.45 |   82.11 |   86.92 |
#  components/            |   88.12 |    81.23 |   85.67 |   89.45 |
#  lib/                   |   82.45 |    75.67 |   78.89 |   84.23 |
#  utils/                 |   91.23 |    87.45 |   89.12 |   92.34 |
# ------------------------|---------|----------|---------|---------|
```

### **View Coverage Report**:

```bash
open coverage/index.html
```

---

**Last Updated**: December 28, 2024  
**Version**: 1.0.0  
**Maintained by**: Airtel Kenya Quality Assurance Team
