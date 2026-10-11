# 🐞 BugFlow SE — Software Engineering Mini-Project

> **Enterprise-Grade Bug Tracking & Defect Lifecycle Management System**  
> Designed for Software Engineering (SE) academic coursework, mini-project presentations, and viva examinations.

---

## 🌟 Highlights & Features

- **📊 Live Defect Analytics Dashboard:** Real-time metrics ribbon (Total Bugs, Critical/Blockers, In-Progress, Resolution Rate) with Chart.js donut, bar, and polar visualizations.
- **📋 Interactive Kanban Board:** Drag-and-drop defect cards across 5 lifecycle stages: `New` → `Under Triage` → `In Progress` → `Resolved` → `Verified & Closed`.
- **📑 Defect Registry & Advanced Search:** Fast client-side filtering by Severity, Priority, Subsystem Module, and live full-text search.
- **🔍 Defect Detail Inspector:** Two-column modal featuring technical reproduction steps, expected vs. actual outcomes, environment info, and threaded discussion comments.
- **🎭 SDLC Role Switcher:** Switch between QA Lead, Fullstack Developer, Backend Developer, DevOps, and Project Manager personas.
- **📘 Embedded Software Engineering Explorer:** Dedicated in-app tab displaying the full SRS, dynamic Mermaid UML diagrams (Use Case, Sequence, State Machine, Architecture), 10 formal test cases, and the Requirements Traceability Matrix (RTM).
- **💾 Dual Persistence & Portability:** Automatic client-side `localStorage` sync with one-click **CSV Export**, **JSON Backup**, **Printable Project Audit**, and **Reset to Seed Data**.
- **🎨 Modern Glassmorphic Dark UI:** Built with Vanilla CSS (dark/light theme toggle, glowing accents, responsive layout).

---

## 🚀 How to Run the Project

You can run the project using either of the following methods:

### Method 1: Built-in Node Server (Recommended)
Node.js comes pre-installed in your environment. Run the server using native Node modules (no `npm install` needed):

```bash
node server.js
```
Then open your browser and navigate to:
```
http://localhost:3000
```

### Method 2: Direct Browser Launch
Simply double-click `index.html` or open it directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.

---

## 📁 Project Structure

```
se/
├── index.html                           # Semantic HTML5 application entrypoint
├── server.js                            # Zero-dependency local Node.js server
├── README.md                            # Project overview & running instructions
├── SOFTWARE_ENGINEERING_DOCUMENTATION.md # Academic Mini-Project Report (SRS, UML, Tests, Viva)
├── css/
│   └── styles.css                       # Glassmorphic Dark/Light Design System
└── js/
    ├── app.js                           # Application controller & event wiring
    ├── store.js                         # LocalStorage engine, seed bugs, audit ledger
    ├── charts.js                        # Chart.js metrics & visualization engine
    └── documentation-data.js            # SRS requirements, UML diagrams, test suite
```

---

## 🎓 Software Engineering Presentation & Viva Guide

When presenting this project to your professor or evaluator:

1. **Dashboard Tab:** Show the real-time KPI metrics and explain how the Defect Resolution Rate and Severity Breakdown update as bugs move through the workflow.
2. **Kanban Tab:** Demonstrate dragging a defect card from `New` to `In Progress` or `Resolved`, showing how the audit trail logs the change.
3. **Registry Tab:** Demonstrate searching by keyword (e.g., `"Token"` or `"Payment"`) and filtering by Severity (`Critical`).
4. **Detail Inspector:** Open `BUG-101`, review the reproduction steps and expected vs. actual results, and post a discussion note.
5. **SE Project Docs Tab:** Open this tab directly inside the app to showcase the **Software Requirements Specification (SRS)**, **Use Case Diagram**, **State Machine Lifecycle**, **Sequence Diagram**, and the **Requirements Traceability Matrix (RTM)**.
6. **Data Portability:** Click **"CSV Export"** to demonstrate report generation.

---

## 📄 License
Academic & Educational Project. Free to use, modify, and present for university coursework.
