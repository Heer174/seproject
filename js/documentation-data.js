/**
 * BugFlow SE - Software Engineering Documentation & Architecture Data
 * Contains SRS specification, UML diagrams in text/Mermaid,
 * comprehensive test cases suite, and Traceability Matrix.
 */

export const SE_DOCS = {
  srs: {
    title: 'Software Requirements Specification (SRS)',
    version: '1.0.0',
    system: 'BugFlow - Defect Tracking & QA Workflow System',
    purpose: 'To provide a structured, auditable, and collaborative platform for software development teams to capture, prioritize, assign, debug, and verify software defects across the SDLC lifecycle.',
    scope: 'Covers bug lifecycle management, role-based workflows (Admin, QA, Developer), severity & priority classification, automated SLA monitoring, audit logging, and defect metrics reporting.',
    functionalRequirements: [
      { id: 'FR-01', module: 'Bug Reporting', desc: 'System shall allow QA Testers to report bugs with title, module, severity, priority, reproduction steps, expected/actual results, and environment parameters.' },
      { id: 'FR-02', module: 'Workflow & Lifecycle', desc: 'System shall enforce defect state machine transitions: New -> Triage -> In Progress -> Resolved -> Verified / Closed, with reopen capabilities.' },
      { id: 'FR-03', module: 'Role-Based Access', desc: 'System shall support simulation of distinct roles: QA Tester (Log & Verify), Developer (Investigate & Fix), Project Manager (Triage & Metrics).' },
      { id: 'FR-04', module: 'Interactive Kanban', desc: 'System shall provide drag-and-drop or single-click status transitions across categorized workflow swimlanes.' },
      { id: 'FR-05', module: 'Audit Trail & Comments', desc: 'System shall record an immutable chronological event log for every state transition and allow timestamped collaboration notes.' },
      { id: 'FR-06', module: 'Analytics & Dashboards', desc: 'System shall compute real-time metrics including resolution efficiency, defect severity breakdown, and module defect density.' },
      { id: 'FR-07', module: 'Data Portability', desc: 'System shall support exporting bug datasets to CSV, JSON, and formatted printable project audit reports.' }
    ],
    nonFunctionalRequirements: [
      { id: 'NFR-01', category: 'Performance', desc: 'Sub-second search and instant client-side filtering across up to 10,000 bug entries with zero latency.' },
      { id: 'NFR-02', category: 'Usability', desc: 'Intuitive glassmorphic interface with accessible contrast ratios, visual severity badges, and responsive desktop/tablet layouts.' },
      { id: 'NFR-03', category: 'Reliability', desc: 'Zero data loss via resilient client-side LocalStorage synchronization with error boundaries and data reset fallback.' },
      { id: 'NFR-04', category: 'Security & Integrity', desc: 'Client-side sanitization of markdown and HTML strings preventing Cross-Site Scripting (XSS) attacks in descriptions.' }
    ]
  },

  diagrams: {
    useCase: `graph LR
    subgraph System Boundary ["BugFlow SE System"]
        UC1((Report New Defect))
        UC2((Triage & Prioritize))
        UC3((Assign to Developer))
        UC4((Update Status / Fix))
        UC5((Verify Fix & Close))
        UC6((Reopen Failed Fix))
        UC7((View Analytics Dashboard))
        UC8((Export Defect Reports))
        UC9((Add Discussion Comments))
    end

    Tester["QA Tester"] --> UC1
    Tester --> UC5
    Tester --> UC6
    Tester --> UC9

    Dev["Developer"] --> UC4
    Dev --> UC9
    Dev --> UC7

    Admin["Project Manager / Admin"] --> UC2
    Admin --> UC3
    Admin --> UC7
    Admin --> UC8`,

    stateMachine: `stateDiagram-v2
    [*] --> NEW : QA Logs Defect
    NEW --> TRIAGE : PM Reviews / Triages
    TRIAGE --> IN_PROGRESS : Assigned to Developer
    IN_PROGRESS --> RESOLVED : Developer Submits Fix
    RESOLVED --> VERIFIED : QA Tests & Passes
    RESOLVED --> IN_PROGRESS : QA Verification Fails (Reopen)
    VERIFIED --> [*] : Closed & Archived`,

    sequence: `sequenceDiagram
    autonumber
    actor QA as QA Tester
    participant App as BugFlow Client
    participant Store as State Manager (LocalStorage)
    actor Dev as Developer
    actor PM as Project Manager

    QA->>App: Submits Defect Form (BUG-101, Severity: Critical)
    App->>Store: Validates & saves bug with state=NEW
    Store-->>App: Logs Activity: "Reported new defect"
    App-->>QA: Toast Notification: "Defect Logged Successfully"

    PM->>App: Reviews Backlog & Assigns to Sarah Chen
    App->>Store: Updates status to TRIAGE / IN_PROGRESS
    Store-->>App: Dispatches event to Kanban Board

    Dev->>App: Implements Fix & Moves Card to RESOLVED
    Dev->>App: Adds comment: "Mutex lock queue deployed"
    App->>Store: Saves status & comment

    QA->>App: Executes Regression Test
    alt Fix Passes
        QA->>App: Marks Bug as VERIFIED & CLOSED
        App->>Store: Finalizes defect state
    else Fix Fails
        QA->>App: Reopens Bug -> IN_PROGRESS
        App->>Store: Logs reopen note
    end`,

    architecture: `flowchart TD
    subgraph Presentation_Layer ["Presentation Layer (UI/UX)"]
        UI_Dash[Dashboard & KPI Metrics]
        UI_Kanban[Kanban Workflow Board]
        UI_Table[Registry Table & Filters]
        UI_Modal[Defect Modal & Activity Logs]
        UI_Docs[SE Documentation Explorer]
    end

    subgraph Controller_Logic ["Application Controller Layer (Vanilla JS ES6)"]
        AppCtrl[App Controller app.js]
        ChartCtrl[Charts Engine charts.js]
        ExportEngine[CSV / JSON / Print Exporters]
    end

    subgraph Data_Storage ["Data & Persistence Layer"]
        Store[BugStore Store Engine]
        LStorage[(Browser LocalStorage Engine)]
        AuditLog[Activity Audit Trail]
    end

    Presentation_Layer <--> Controller_Logic
    Controller_Logic <--> Data_Storage`
  },

  testCases: [
    {
      id: 'TC-01',
      title: 'Verify Bug Creation with Valid Mandatory Fields',
      preconditions: 'User is on the Dashboard with QA role selected.',
      steps: '1. Click "+ Report Defect".\n2. Enter Title, select Module, Severity "Critical", Priority "P1".\n3. Fill Steps, Expected, and Actual results.\n4. Click "Submit Defect Report".',
      expectedResult: 'New bug is created with unique ID (e.g., BUG-109), appears in NEW column, and toast notifies user.',
      status: 'PASS',
      type: 'Functional'
    },
    {
      id: 'TC-02',
      title: 'Validation Guard on Empty Defect Title or Description',
      preconditions: 'Bug reporting modal is open.',
      steps: '1. Leave Title blank.\n2. Click "Submit Defect Report".',
      expectedResult: 'System highlights missing required field and prevents form submission.',
      status: 'PASS',
      type: 'Validation'
    },
    {
      id: 'TC-03',
      title: 'Status Transition via Kanban Drag/Select',
      preconditions: 'Defect exists in "NEW" state.',
      steps: '1. Locate defect card.\n2. Move or click action to transition to "IN_PROGRESS".',
      expectedResult: 'Card moves to In Progress column, audit log registers transition, timestamp updates.',
      status: 'PASS',
      type: 'Workflow'
    },
    {
      id: 'TC-04',
      title: 'Real-Time Multi-Filter by Severity and Search Term',
      preconditions: 'Multiple defects exist with varying severities.',
      steps: '1. Go to Defect Registry table.\n2. Filter by Severity: "CRITICAL".\n3. Type "Token" in search bar.',
      expectedResult: 'Only critical bugs matching keyword "Token" are displayed in table.',
      status: 'PASS',
      type: 'Integration'
    },
    {
      id: 'TC-05',
      title: 'Defect Audit Log and Comment Thread Persistence',
      preconditions: 'Defect detail modal is open.',
      steps: '1. Type comment: "Patch deployed to staging".\n2. Click "Post Note".\n3. Refresh browser window.',
      expectedResult: 'Comment persists with author and timestamp after page refresh.',
      status: 'PASS',
      type: 'Persistence'
    },
    {
      id: 'TC-06',
      title: 'Analytics Metrics & Chart Calculation Accuracy',
      preconditions: '8 seed defects loaded in system.',
      steps: '1. Check resolution rate percentage.\n2. Resolve an open bug.\n3. Verify KPI and Chart.js donut redraws.',
      expectedResult: 'KPI and donut chart percentages dynamically recalculate in real-time.',
      status: 'PASS',
      type: 'Analytics'
    },
    {
      id: 'TC-07',
      title: 'CSV Data Export Generation',
      preconditions: 'User is viewing the defect registry.',
      steps: '1. Click "Export CSV".\n2. Open downloaded CSV file in spreadsheet reader.',
      expectedResult: 'File contains all columns (ID, Title, Module, Severity, Priority, Status, Assignee, Date).',
      status: 'PASS',
      type: 'Portability'
    },
    {
      id: 'TC-08',
      title: 'Role Switcher Context Simulation',
      preconditions: 'Current user is Alex Rivera (QA Lead).',
      steps: '1. Select Sarah Chen (Developer) from top role switcher dropdown.',
      expectedResult: 'Current active user changes, new comments attribute to Sarah Chen, badge updates.',
      status: 'PASS',
      type: 'Role-Based'
    }
  ],

  traceabilityMatrix: [
    { reqId: 'FR-01', desc: 'Bug Reporting with full attributes', testCases: ['TC-01', 'TC-02'], coverage: '100%' },
    { reqId: 'FR-02', desc: 'Defect Lifecycle state machine', testCases: ['TC-03'], coverage: '100%' },
    { reqId: 'FR-03', desc: 'Role-based access & simulation', testCases: ['TC-08'], coverage: '100%' },
    { reqId: 'FR-04', desc: 'Interactive Kanban board transitions', testCases: ['TC-03'], coverage: '100%' },
    { reqId: 'FR-05', desc: 'Audit trail and persistent comments', testCases: ['TC-05'], coverage: '100%' },
    { reqId: 'FR-06', desc: 'Dynamic KPI & charts calculation', testCases: ['TC-06'], coverage: '100%' },
    { reqId: 'FR-07', desc: 'CSV, JSON & Print export', testCases: ['TC-07'], coverage: '100%' }
  ]
};
