/**
 * BugFlow SE - Data Store & State Management
 * Handles LocalStorage persistence, seed data initialization,
 * CRUD operations, audit logging, and role-based actions.
 */

const STORAGE_KEYS = {
  BUGS: 'bugflow_bugs_v1',
  ACTIVITIES: 'bugflow_activities_v1',
  CURRENT_USER: 'bugflow_current_user_v1',
  THEME: 'bugflow_theme_v1'
};

// Available System Users & Roles
export const USERS = [
  { id: 'usr-1', name: 'Alex Rivera', role: 'QA Lead / Reporter', avatar: 'AR', color: '#38bdf8' },
  { id: 'usr-2', name: 'Sarah Chen', role: 'Fullstack Developer', avatar: 'SC', color: '#a855f7' },
  { id: 'usr-3', name: 'David Kumar', role: 'Backend Developer', avatar: 'DK', color: '#ec4899' },
  { id: 'usr-4', name: 'Elena Rostova', role: 'DevOps / QA Tester', avatar: 'ER', color: '#10b981' },
  { id: 'usr-5', name: 'Marcus Vance', role: 'Project Manager / Admin', avatar: 'MV', color: '#f59e0b' }
];

export const MODULES = [
  'User Authentication & JWT',
  'Payment & Checkout Gateway',
  'Dashboard & Metrics Analytics',
  'User Profile & Preferences',
  'REST API & Webhooks',
  'Database & Migration Layer',
  'Notification Engine (Email/SMS)',
  'Reporting & Export (PDF/CSV)'
];

export const SEVERITIES = {
  CRITICAL: { label: 'Critical', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: '🔥' },
  HIGH: { label: 'High', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', icon: '⚠️' },
  MEDIUM: { label: 'Medium', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', icon: '⚡' },
  LOW: { label: 'Low', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: 'ℹ️' }
};

export const PRIORITIES = {
  P1: { label: 'P1 - Blocker', color: '#dc2626' },
  P2: { label: 'P2 - High', color: '#ea580c' },
  P3: { label: 'P3 - Medium', color: '#ca8a04' },
  P4: { label: 'P4 - Low', color: '#16a34a' }
};

export const STATUSES = {
  NEW: { id: 'NEW', label: 'New / Logged', order: 1, color: '#64748b' },
  TRIAGE: { id: 'TRIAGE', label: 'Under Triage', order: 2, color: '#3b82f6' },
  IN_PROGRESS: { id: 'IN_PROGRESS', label: 'In Progress', order: 3, color: '#8b5cf6' },
  RESOLVED: { id: 'RESOLVED', label: 'Resolved / Fixed', order: 4, color: '#06b6d4' },
  VERIFIED: { id: 'VERIFIED', label: 'Verified & Closed', order: 5, color: '#10b981' }
};

// Initial realistic seed bugs for software engineering demonstration
const INITIAL_BUGS = [
  {
    id: 'BUG-101',
    title: 'JWT Refresh Token race condition causing random session termination',
    module: 'User Authentication & JWT',
    severity: 'CRITICAL',
    priority: 'P1',
    status: 'IN_PROGRESS',
    reporter: 'Alex Rivera',
    assignee: 'Sarah Chen',
    environment: 'Production / Chrome 124 / Node 20',
    description: 'When multiple parallel fetch calls trigger token refresh simultaneously, the rotation token is consumed more than once, triggering automatic token theft invalidation.',
    stepsToReproduce: '1. Login with valid user credentials.\n2. Navigate to Dashboard.\n3. Open 4 tabs simultaneously on slow 3G simulation.\n4. Observe 401 Unauthorized redirect to login on 3 of the 4 tabs.',
    expectedResult: 'Token refresh queue handles concurrent requests by deduplicating refresh calls and sharing the same token.',
    actualResult: 'Concurrent calls invalidate the refresh token family, logging out active user.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    comments: [
      {
        id: 'c-1',
        author: 'Sarah Chen',
        text: 'Reproduced in staging. Implementing a mutex lock queue for pending refresh requests.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
      }
    ]
  },
  {
    id: 'BUG-102',
    title: 'Double billing when customer double-clicks "Confirm Payment" button',
    module: 'Payment & Checkout Gateway',
    severity: 'CRITICAL',
    priority: 'P1',
    status: 'RESOLVED',
    reporter: 'Alex Rivera',
    assignee: 'David Kumar',
    environment: 'Staging / Edge & Safari / Stripe API v2024',
    description: 'Submit button on checkout modal is not immediately disabled upon initial click, allowing rapid double-clicks to post duplicate idempotency keys.',
    stepsToReproduce: '1. Add item to cart and proceed to Checkout.\n2. Fill card details.\n3. Rapidly double-click "Complete Order".',
    expectedResult: 'Button enters loading state and disables after first click with client-side idempotency lock.',
    actualResult: 'Two checkout charge requests are posted; customer is billed twice.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    comments: [
      {
        id: 'c-2',
        author: 'David Kumar',
        text: 'Added client-side debounce + disabled state + backend UUID idempotency key verification.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
      },
      {
        id: 'c-3',
        author: 'Alex Rivera',
        text: 'Fix deployed to QA environment. Ready for regression testing verification.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
      }
    ]
  },
  {
    id: 'BUG-103',
    title: 'Memory leak in real-time notification WebSocket heartbeat listener',
    module: 'Notification Engine (Email/SMS)',
    severity: 'HIGH',
    priority: 'P2',
    status: 'TRIAGE',
    reporter: 'Elena Rostova',
    assignee: 'David Kumar',
    environment: 'Staging Cluster / Kubernetes Pods / WS 8.1',
    description: 'Event listeners on socket reconnect are not garbage collected, causing memory consumption to scale by 150MB per hour.',
    stepsToReproduce: '1. Connect 100 synthetic WS clients.\n2. Force network disconnect every 30 seconds.\n3. Inspect heap snapshot in Chrome DevTools / Node Inspector.',
    expectedResult: 'Disconnect cleans up all event listeners and ping interval handles.',
    actualResult: 'Heap snapshot retains PingTimeout listeners indefinitely.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    comments: []
  },
  {
    id: 'BUG-104',
    title: 'PDF Export fails with 504 Gateway Timeout for datasets exceeding 5,000 records',
    module: 'Reporting & Export (PDF/CSV)',
    severity: 'HIGH',
    priority: 'P2',
    status: 'IN_PROGRESS',
    reporter: 'Marcus Vance',
    assignee: 'David Kumar',
    environment: 'Production / Nginx / Chromium Puppeteer',
    description: 'Synchronous PDF rendering blocks the main Node thread for large tables, hitting Nginx 60s reverse proxy timeout.',
    stepsToReproduce: '1. Navigate to Reports module.\n2. Filter date range to "Past 1 Year" (7,800 records).\n3. Click "Export as PDF".',
    expectedResult: 'Task offloaded to background worker queue with progress indicator or stream generator.',
    actualResult: 'Browser hangs for 60 seconds followed by 504 Bad Gateway modal.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    comments: []
  },
  {
    id: 'BUG-105',
    title: 'Profile avatar crop canvas distorted on High DPI Retina displays',
    module: 'User Profile & Preferences',
    severity: 'LOW',
    priority: 'P4',
    status: 'NEW',
    reporter: 'Alex Rivera',
    assignee: 'Sarah Chen',
    environment: 'macOS Sonoma / Safari 17 / Retina 2x',
    description: 'HTML5 Canvas does not scale for window.devicePixelRatio, causing uploaded avatars to appear blurry and offset by 50% coordinate translation.',
    stepsToReproduce: '1. Go to User Settings -> Profile.\n2. Upload 1000x1000 photo on a Retina display.\n3. Use circular crop slider and click Save.',
    expectedResult: 'Cropped preview is crisp and perfectly centered.',
    actualResult: 'Image is pixelated and cropped into top-left quadrant.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    comments: []
  },
  {
    id: 'BUG-106',
    title: 'Database connection pool exhausted during daily analytics cron job',
    module: 'Database & Migration Layer',
    severity: 'CRITICAL',
    priority: 'P1',
    status: 'VERIFIED',
    reporter: 'Elena Rostova',
    assignee: 'David Kumar',
    environment: 'PostgreSQL 16 / AWS RDS / Connection Pool 20',
    description: 'Unclosed transactional client instances inside nested loop in aggregation script exhausted all 20 pooled client slots.',
    stepsToReproduce: '1. Trigger manual run of midnight analytics cron: `npm run cron:analytics`.\n2. Simultaneously make 15 web API requests.',
    expectedResult: 'Connections are released back to pool in `finally` blocks.',
    actualResult: 'All connections remain in "idle in transaction" state, freezing entire web application.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    comments: [
      {
        id: 'c-4',
        author: 'David Kumar',
        text: 'Wrapped database client checkouts in auto-releasing connection helpers and added pg-bouncer.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 'c-5',
        author: 'Elena Rostova',
        text: 'Verified under 100 req/sec stress test. Connection pool remains steady at 4-6 active clients.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      }
    ]
  },
  {
    id: 'BUG-107',
    title: 'XSS vulnerability in bug description markdown preview rendering',
    module: 'REST API & Webhooks',
    severity: 'CRITICAL',
    priority: 'P1',
    status: 'VERIFIED',
    reporter: 'Alex Rivera',
    assignee: 'Sarah Chen',
    environment: 'All Browsers / Frontend UI',
    description: 'Unsanitized HTML injection via `img onerror` inside bug notes allowed execution of arbitrary JavaScript in reviewer context.',
    stepsToReproduce: '1. Create bug with `<img src=x onerror=alert(1)>` in description.\n2. Open detail view.',
    expectedResult: 'Raw markup is escaped using DOMPurify / text sanitization.',
    actualResult: 'Alert dialog executed in session context.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 150).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    comments: [
      {
        id: 'c-6',
        author: 'Sarah Chen',
        text: 'Applied strict DOMPurify and HTML encoding across all dynamic comment and description renders.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString()
      }
    ]
  },
  {
    id: 'BUG-108',
    title: 'Dashboard KPI cards display negative resolution percentage if closed < created',
    module: 'Dashboard & Metrics Analytics',
    severity: 'MEDIUM',
    priority: 'P3',
    status: 'NEW',
    reporter: 'Marcus Vance',
    assignee: 'Sarah Chen',
    environment: 'All Browsers / Production',
    description: 'Mathematical delta calculation formula omitted `Math.max(0, ...)` boundary check when backlog size increases faster than sprint closures.',
    stepsToReproduce: '1. Have 10 new bugs filed in 24 hours with 2 closures.\n2. Check dashboard metric widget.',
    expectedResult: 'Displays 0% or accurate net throughput ratio.',
    actualResult: 'Displays "-34.8% Resolution Efficiency".',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    comments: []
  }
];

const INITIAL_ACTIVITIES = [
  { id: 'act-1', bugId: 'BUG-108', user: 'Marcus Vance', action: 'Created bug report', time: '6 hours ago' },
  { id: 'act-2', bugId: 'BUG-106', user: 'Elena Rostova', action: 'Verified & Closed bug after stress testing', time: '2 hours ago' },
  { id: 'act-3', bugId: 'BUG-102', user: 'Alex Rivera', action: 'Moved status to Resolved for regression sign-off', time: '8 hours ago' },
  { id: 'act-4', bugId: 'BUG-101', user: 'Sarah Chen', action: 'Updated status to In Progress (reproduced race condition)', time: '5 hours ago' }
];

export class BugStore {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.BUGS)) {
      this.resetToDefaults();
    }
  }

  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.BUGS, JSON.stringify(INITIAL_BUGS));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(USERS[0]));
    return true;
  }

  getBugs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUGS);
      return data ? JSON.parse(data) : INITIAL_BUGS;
    } catch (e) {
      console.error('Failed to load bugs from localStorage', e);
      return INITIAL_BUGS;
    }
  }

  getBugById(id) {
    const bugs = this.getBugs();
    return bugs.find(b => b.id === id) || null;
  }

  saveBugs(bugs) {
    localStorage.setItem(STORAGE_KEYS.BUGS, JSON.stringify(bugs));
  }

  getCurrentUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : USERS[0];
    } catch (e) {
      return USERS[0];
    }
  }

  setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  getActivities() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return data ? JSON.parse(data) : INITIAL_ACTIVITIES;
    } catch (e) {
      return INITIAL_ACTIVITIES;
    }
  }

  logActivity(bugId, action, user = null) {
    const currentUser = user || this.getCurrentUser();
    const activities = this.getActivities();
    const newActivity = {
      id: 'act-' + Date.now(),
      bugId,
      user: currentUser.name,
      action,
      time: 'Just now'
    };
    activities.unshift(newActivity);
    if (activities.length > 50) activities.pop();
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }

  createBug(bugData) {
    const bugs = this.getBugs();
    const nextNum = bugs.length > 0 
      ? Math.max(...bugs.map(b => parseInt(b.id.replace('BUG-', '') || '100', 10))) + 1 
      : 101;
    const bugId = `BUG-${nextNum}`;

    const newBug = {
      id: bugId,
      title: bugData.title.trim(),
      module: bugData.module,
      severity: bugData.severity,
      priority: bugData.priority,
      status: 'NEW',
      reporter: bugData.reporter || this.getCurrentUser().name,
      assignee: bugData.assignee || 'Unassigned',
      environment: bugData.environment || 'Testing / Chrome v125',
      description: bugData.description.trim(),
      stepsToReproduce: bugData.stepsToReproduce.trim(),
      expectedResult: bugData.expectedResult.trim(),
      actualResult: bugData.actualResult.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: []
    };

    bugs.unshift(newBug);
    this.saveBugs(bugs);
    this.logActivity(bugId, `Reported new defect: "${newBug.title.slice(0, 35)}..."`);
    return newBug;
  }

  updateBug(id, updateData) {
    const bugs = this.getBugs();
    const index = bugs.findIndex(b => b.id === id);
    if (index === -1) return null;

    const oldBug = bugs[index];
    const updated = {
      ...oldBug,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    bugs[index] = updated;
    this.saveBugs(bugs);

    if (updateData.status && updateData.status !== oldBug.status) {
      this.logActivity(id, `Transitioned status from ${STATUSES[oldBug.status]?.label || oldBug.status} to ${STATUSES[updateData.status]?.label || updateData.status}`);
    } else {
      this.logActivity(id, `Updated defect attributes`);
    }

    return updated;
  }

  deleteBug(id) {
    const bugs = this.getBugs();
    const filtered = bugs.filter(b => b.id !== id);
    if (filtered.length !== bugs.length) {
      this.saveBugs(filtered);
      this.logActivity(id, `Deleted defect report`);
      return true;
    }
    return false;
  }

  addComment(bugId, text) {
    const bugs = this.getBugs();
    const bug = bugs.find(b => b.id === bugId);
    if (!bug) return null;

    const user = this.getCurrentUser();
    const newComment = {
      id: 'c-' + Date.now(),
      author: user.name,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    if (!bug.comments) bug.comments = [];
    bug.comments.push(newComment);
    bug.updatedAt = new Date().toISOString();

    this.saveBugs(bugs);
    this.logActivity(bugId, `Posted note: "${text.slice(0, 30)}..."`);
    return newComment;
  }

  getMetrics() {
    const bugs = this.getBugs();
    const total = bugs.length;
    const critical = bugs.filter(b => b.severity === 'CRITICAL').length;
    const inProgress = bugs.filter(b => b.status === 'IN_PROGRESS').length;
    const resolved = bugs.filter(b => b.status === 'RESOLVED' || b.status === 'VERIFIED').length;
    const newBugs = bugs.filter(b => b.status === 'NEW').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Severity breakdown
    const bySeverity = {
      CRITICAL: bugs.filter(b => b.severity === 'CRITICAL').length,
      HIGH: bugs.filter(b => b.severity === 'HIGH').length,
      MEDIUM: bugs.filter(b => b.severity === 'MEDIUM').length,
      LOW: bugs.filter(b => b.severity === 'LOW').length
    };

    // Status breakdown
    const byStatus = {
      NEW: bugs.filter(b => b.status === 'NEW').length,
      TRIAGE: bugs.filter(b => b.status === 'TRIAGE').length,
      IN_PROGRESS: inProgress,
      RESOLVED: bugs.filter(b => b.status === 'RESOLVED').length,
      VERIFIED: bugs.filter(b => b.status === 'VERIFIED').length
    };

    // By Module breakdown
    const byModule = {};
    MODULES.forEach(m => {
      byModule[m] = bugs.filter(b => b.module === m).length;
    });

    return {
      total,
      critical,
      inProgress,
      resolved,
      newBugs,
      resolutionRate,
      bySeverity,
      byStatus,
      byModule
    };
  }
}
