/**
 * BugFlow SE - Main Application Controller
 * Handles user interactions, Kanban drag & drop, tab navigation,
 * filtering, modals, audit logs, and export mechanisms.
 */

import { BugStore, USERS, MODULES, SEVERITIES, PRIORITIES, STATUSES } from './store.js';
import { SE_DOCS } from './documentation-data.js';
import { ChartEngine } from './charts.js';

class BugFlowApp {
  constructor() {
    this.store = new BugStore();
    this.charts = new ChartEngine();
    this.currentTab = 'dashboard';
    this.currentDocsSection = 'srs';
    this.activeDetailBugId = null;

    // Filters for Defect Registry
    this.filters = {
      search: '',
      severity: 'ALL',
      status: 'ALL',
      module: 'ALL'
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.initRoleSwitcher();
    this.initTheme();
    this.renderAllViews();
    this.renderDocsSection('srs');
  }

  // ==========================================
  // Render Orchestration
  // ==========================================
  renderAllViews() {
    this.renderMetrics();
    this.renderKanban();
    this.renderRegistryTable();
    this.renderActivityLog();
    this.renderModuleList();
    
    // Defer chart update to allow DOM layout
    setTimeout(() => {
      this.charts.renderAll(this.store.getMetrics());
    }, 100);
  }

  renderMetrics() {
    const m = this.store.getMetrics();
    
    document.getElementById('kpi-total-val').textContent = m.total;
    document.getElementById('kpi-critical-val').textContent = m.critical;
    document.getElementById('kpi-progress-val').textContent = m.inProgress;
    document.getElementById('kpi-resolved-val').textContent = m.resolved;
    document.getElementById('kpi-rate-val').textContent = `${m.resolutionRate}%`;

    const fillBar = document.getElementById('kpi-rate-bar');
    if (fillBar) fillBar.style.width = `${m.resolutionRate}%`;

    // Update tab counters
    document.getElementById('tab-counter-kanban').textContent = m.total;
    document.getElementById('tab-counter-registry').textContent = m.total;
  }

  // ==========================================
  // Kanban Board Component
  // ==========================================
  renderKanban() {
    const bugs = this.store.getBugs();
    const columns = ['NEW', 'TRIAGE', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED'];

    columns.forEach(statusKey => {
      const container = document.getElementById(`kanban-list-${statusKey.toLowerCase()}`);
      const counter = document.getElementById(`kanban-count-${statusKey.toLowerCase()}`);
      if (!container) return;

      const columnBugs = bugs.filter(b => b.status === statusKey);
      if (counter) counter.textContent = columnBugs.length;

      if (columnBugs.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding: 2.5rem 1rem; color: var(--text-muted); font-size: 0.8rem;">
            No defects in this stage
          </div>
        `;
        return;
      }

      container.innerHTML = columnBugs.map(b => this.createKanbanCardHtml(b)).join('');
    });

    this.wireKanbanDragAndDrop();
  }

  createKanbanCardHtml(bug) {
    const sev = SEVERITIES[bug.severity] || SEVERITIES.MEDIUM;
    const pri = PRIORITIES[bug.priority] || PRIORITIES.P3;
    const dateFormatted = new Date(bug.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return `
      <div class="bug-card" id="card-${bug.id}" draggable="true" data-bug-id="${bug.id}">
        <div class="card-top">
          <span class="bug-id-tag">${bug.id}</span>
          <span class="severity-pill" style="background:${sev.bg}; color:${sev.color}; border: 1px solid ${sev.color}30;">
            ${sev.icon} ${sev.label}
          </span>
        </div>
        <div class="card-title" title="${this.escapeHtml(bug.title)}">${this.escapeHtml(bug.title)}</div>
        <div class="card-module">
          📁 ${this.escapeHtml(bug.module.split('&')[0].trim())}
        </div>
        <div class="card-footer">
          <div class="assignee-info">
            <span class="mini-avatar" title="Assignee: ${bug.assignee}">${bug.assignee.split(' ').map(n=>n[0]).join('').slice(0, 2)}</span>
            <span>${this.escapeHtml(bug.assignee.split(' ')[0])}</span>
          </div>
          <div class="card-meta-right">
            <span class="priority-flag" style="color: ${pri.color};" title="Priority: ${pri.label}">${bug.priority}</span>
            <span>${dateFormatted}</span>
          </div>
        </div>
      </div>
    `;
  }

  wireKanbanDragAndDrop() {
    const cards = document.querySelectorAll('.bug-card');
    const containers = document.querySelectorAll('.kanban-cards-container');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.bugId);
        card.classList.add('dragging');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });

      card.addEventListener('click', () => {
        this.openDetailModal(card.dataset.bugId);
      });
    });

    containers.forEach(container => {
      container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.classList.add('drag-over');
      });

      container.addEventListener('dragleave', () => {
        container.classList.remove('drag-over');
      });

      container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.classList.remove('drag-over');
        const bugId = e.dataTransfer.getData('text/plain');
        const targetStatus = container.dataset.status;

        if (bugId && targetStatus) {
          const bug = this.store.getBugById(bugId);
          if (bug && bug.status !== targetStatus) {
            this.store.updateBug(bugId, { status: targetStatus });
            this.renderAllViews();
            this.showToast(`Bug ${bugId} moved to ${STATUSES[targetStatus].label}`, 'success');
          }
        }
      });
    });
  }

  // ==========================================
  // Defect Registry Table Component
  // ==========================================
  renderRegistryTable() {
    const tableBody = document.getElementById('registry-table-body');
    if (!tableBody) return;

    let bugs = this.store.getBugs();

    // Apply Filter Criteria
    if (this.filters.search) {
      const q = this.filters.search.toLowerCase();
      bugs = bugs.filter(b => 
        b.id.toLowerCase().includes(q) || 
        b.title.toLowerCase().includes(q) || 
        b.module.toLowerCase().includes(q) ||
        b.assignee.toLowerCase().includes(q)
      );
    }
    if (this.filters.severity !== 'ALL') {
      bugs = bugs.filter(b => b.severity === this.filters.severity);
    }
    if (this.filters.status !== 'ALL') {
      bugs = bugs.filter(b => b.status === this.filters.status);
    }
    if (this.filters.module !== 'ALL') {
      bugs = bugs.filter(b => b.module === this.filters.module);
    }

    if (bugs.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">
            No defect reports match the current filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = bugs.map(b => {
      const sev = SEVERITIES[b.severity] || SEVERITIES.MEDIUM;
      const stat = STATUSES[b.status] || STATUSES.NEW;
      const pri = PRIORITIES[b.priority] || PRIORITIES.P3;
      const dateFormatted = new Date(b.createdAt).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      return `
        <tr data-bug-id="${b.id}">
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan);">${b.id}</td>
          <td style="font-weight: 600; max-width: 320px;">
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${this.escapeHtml(b.title)}">
              ${this.escapeHtml(b.title)}
            </div>
          </td>
          <td style="color: var(--text-secondary); font-size: 0.8rem;">${this.escapeHtml(b.module)}</td>
          <td>
            <span class="severity-pill" style="background:${sev.bg}; color:${sev.color}; border: 1px solid ${sev.color}30;">
              ${sev.icon} ${sev.label}
            </span>
          </td>
          <td>
            <span style="font-weight: 700; color: ${pri.color}; font-size: 0.8rem;">${pri.label}</span>
          </td>
          <td>
            <span style="display:inline-flex; align-items:center; gap: 0.35rem; font-weight: 600; font-size: 0.8rem; color: ${stat.color};">
              <span style="width: 7px; height: 7px; border-radius: 50%; background: ${stat.color};"></span>
              ${stat.label}
            </span>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem;">
              <span class="mini-avatar">${b.assignee.split(' ').map(n=>n[0]).join('').slice(0, 2)}</span>
              ${this.escapeHtml(b.assignee)}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Wire row click to open detail modal
    tableBody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.bugId;
        if (id) this.openDetailModal(id);
      });
    });
  }

  // ==========================================
  // Activity Audit Log
  // ==========================================
  renderActivityLog() {
    const list = document.getElementById('activity-feed-list');
    if (!list) return;

    const activities = this.store.getActivities();
    if (activities.length === 0) {
      list.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No recent audit records.</p>`;
      return;
    }

    list.innerHTML = activities.slice(0, 15).map(act => `
      <div class="activity-item">
        <div>
          <span class="activity-user">${this.escapeHtml(act.user)}</span>
          <span class="activity-action"> &bull; ${this.escapeHtml(act.action)}</span>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-cyan); margin-left: 0.4rem;">${act.bugId}</span>
        </div>
        <span class="activity-time">${act.time}</span>
      </div>
    `).join('');
  }

  renderModuleList() {
    const container = document.getElementById('module-health-list');
    if (!container) return;

    const metrics = this.store.getMetrics();
    container.innerHTML = Object.entries(metrics.byModule).map(([modName, count]) => `
      <div class="module-item">
        <span class="module-name">📁 ${this.escapeHtml(modName)}</span>
        <span class="module-badge">${count} defects</span>
      </div>
    `).join('');
  }

  // ==========================================
  // Modals & Forms
  // ==========================================
  openReportModal() {
    const modal = document.getElementById('modal-report-bug');
    const form = document.getElementById('form-report-bug');
    if (!modal || !form) return;

    form.reset();
    
    // Set default reporter to current user
    const reporterInput = document.getElementById('field-reporter');
    if (reporterInput) reporterInput.value = this.store.getCurrentUser().name;

    modal.classList.add('active');
  }

  closeReportModal() {
    const modal = document.getElementById('modal-report-bug');
    if (modal) modal.classList.remove('active');
  }

  submitReportForm(e) {
    e.preventDefault();
    const title = document.getElementById('field-title').value.trim();
    const module = document.getElementById('field-module').value;
    const severity = document.querySelector('input[name="severity"]:checked')?.value || 'MEDIUM';
    const priority = document.getElementById('field-priority').value;
    const assignee = document.getElementById('field-assignee').value;
    const environment = document.getElementById('field-environment').value.trim();
    const description = document.getElementById('field-description').value.trim();
    const stepsToReproduce = document.getElementById('field-steps').value.trim();
    const expectedResult = document.getElementById('field-expected').value.trim();
    const actualResult = document.getElementById('field-actual').value.trim();

    if (!title || !description) {
      this.showToast('Please fill in mandatory Title and Description fields.', 'error');
      return;
    }

    const newBug = this.store.createBug({
      title,
      module,
      severity,
      priority,
      assignee,
      environment,
      description,
      stepsToReproduce,
      expectedResult,
      actualResult
    });

    this.closeReportModal();
    this.renderAllViews();
    this.showToast(`Defect ${newBug.id} successfully created!`, 'success');
  }

  openDetailModal(bugId) {
    const bug = this.store.getBugById(bugId);
    if (!bug) return;

    this.activeDetailBugId = bugId;
    const modal = document.getElementById('modal-bug-detail');
    if (!modal) return;

    const sev = SEVERITIES[bug.severity] || SEVERITIES.MEDIUM;
    const pri = PRIORITIES[bug.priority] || PRIORITIES.P3;

    document.getElementById('detail-bug-id').textContent = bug.id;
    document.getElementById('detail-title').textContent = bug.title;
    document.getElementById('detail-module').textContent = bug.module;
    document.getElementById('detail-environment').textContent = bug.environment || 'N/A';
    document.getElementById('detail-description').textContent = bug.description;
    document.getElementById('detail-steps').textContent = bug.stepsToReproduce || 'None provided';
    document.getElementById('detail-expected').textContent = bug.expectedResult || 'None provided';
    document.getElementById('detail-actual').textContent = bug.actualResult || 'None provided';
    
    document.getElementById('detail-reporter').textContent = bug.reporter;
    document.getElementById('detail-created-at').textContent = new Date(bug.createdAt).toLocaleString();

    // Select dropdowns
    document.getElementById('detail-status-select').value = bug.status;
    document.getElementById('detail-assignee-select').value = bug.assignee;
    document.getElementById('detail-severity-select').value = bug.severity;

    // Severity & Priority badges
    const sevBadge = document.getElementById('detail-sev-badge');
    if (sevBadge) {
      sevBadge.textContent = `${sev.icon} ${sev.label}`;
      sevBadge.style.background = sev.bg;
      sevBadge.style.color = sev.color;
    }

    this.renderDetailComments(bug);
    modal.classList.add('active');
  }

  closeDetailModal() {
    const modal = document.getElementById('modal-bug-detail');
    if (modal) modal.classList.remove('active');
    this.activeDetailBugId = null;
  }

  renderDetailComments(bug) {
    const list = document.getElementById('detail-comments-list');
    if (!list) return;

    if (!bug.comments || bug.comments.length === 0) {
      list.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; padding: 0.5rem 0;">No comments logged yet.</div>`;
      return;
    }

    list.innerHTML = bug.comments.map(c => `
      <div class="comment-bubble">
        <div class="comment-meta">
          <span class="comment-author">💬 ${this.escapeHtml(c.author)}</span>
          <span class="comment-time">${new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div style="color: var(--text-primary); line-height: 1.4;">${this.escapeHtml(c.text)}</div>
      </div>
    `).join('');
  }

  addDetailComment() {
    if (!this.activeDetailBugId) return;
    const input = document.getElementById('detail-new-comment-input');
    const text = input.value.trim();
    if (!text) return;

    this.store.addComment(this.activeDetailBugId, text);
    input.value = '';
    const bug = this.store.getBugById(this.activeDetailBugId);
    this.renderDetailComments(bug);
    this.renderActivityLog();
    this.showToast('Note added to audit trail', 'success');
  }

  updateDetailField(field, value) {
    if (!this.activeDetailBugId) return;
    const updateObj = {};
    updateObj[field] = value;
    this.store.updateBug(this.activeDetailBugId, updateObj);
    this.renderAllViews();
    this.showToast(`Updated ${field} to ${value}`, 'success');
  }

  deleteCurrentDetailBug() {
    if (!this.activeDetailBugId) return;
    if (confirm(`Are you sure you want to permanently delete defect ${this.activeDetailBugId}?`)) {
      this.store.deleteBug(this.activeDetailBugId);
      this.closeDetailModal();
      this.renderAllViews();
      this.showToast(`Defect report deleted`, 'success');
    }
  }

  // ==========================================
  // Software Engineering Documentation Tab
  // ==========================================
  renderDocsSection(sectionKey) {
    this.currentDocsSection = sectionKey;
    const container = document.getElementById('docs-dynamic-pane');
    if (!container) return;

    // Highlight sidebar active button
    document.querySelectorAll('.docs-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === sectionKey);
    });

    if (sectionKey === 'srs') {
      container.innerHTML = `
        <div class="doc-section-card">
          <h2 class="doc-section-title">📘 ${SE_DOCS.srs.title}</h2>
          <p class="doc-lead">${SE_DOCS.srs.purpose}</p>
          
          <h3 style="margin: 1.5rem 0 0.75rem; color: var(--accent-cyan);">1. Functional Requirements (FR)</h3>
          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            ${SE_DOCS.srs.functionalRequirements.map(fr => `
              <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border-subtle); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
                <span style="font-family: var(--font-mono); font-weight: 700; color: var(--primary); margin-right: 0.5rem;">${fr.id} [${fr.module}]</span>
                <span style="color: var(--text-primary); font-size: 0.875rem;">${fr.desc}</span>
              </div>
            `).join('')}
          </div>

          <h3 style="margin: 2rem 0 0.75rem; color: var(--accent-cyan);">2. Non-Functional Requirements (NFR)</h3>
          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            ${SE_DOCS.srs.nonFunctionalRequirements.map(nfr => `
              <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border-subtle); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
                <span style="font-family: var(--font-mono); font-weight: 700; color: #10b981; margin-right: 0.5rem;">${nfr.id} [${nfr.category}]</span>
                <span style="color: var(--text-primary); font-size: 0.875rem;">${nfr.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (sectionKey === 'use-case') {
      container.innerHTML = `
        <div class="doc-section-card">
          <h2 class="doc-section-title">🎯 Use Case Model & Actor Roles</h2>
          <p class="doc-lead">Defines the functional boundary of BugFlow SE and how distinct SDLC actors interact with defect operations.</p>
          <div class="mermaid-diagram-box">
            <pre class="mermaid">${SE_DOCS.diagrams.useCase}</pre>
          </div>
        </div>
      `;
      this.reRunMermaid();
    } else if (sectionKey === 'lifecycle') {
      container.innerHTML = `
        <div class="doc-section-card">
          <h2 class="doc-section-title">🔄 Defect State Machine Lifecycle</h2>
          <p class="doc-lead">Formal finite-state automaton governing valid defect transitions from discovery to verification sign-off.</p>
          <div class="mermaid-diagram-box">
            <pre class="mermaid">${SE_DOCS.diagrams.stateMachine}</pre>
          </div>
        </div>
      `;
      this.reRunMermaid();
    } else if (sectionKey === 'sequence') {
      container.innerHTML = `
        <div class="doc-section-card">
          <h2 class="doc-section-title">⏱️ Defect Triage & Resolution Sequence</h2>
          <p class="doc-lead">Chronological message-passing sequence between QA, Product Manager, Application Store, and Developer.</p>
          <div class="mermaid-diagram-box">
            <pre class="mermaid">${SE_DOCS.diagrams.sequence}</pre>
          </div>
        </div>
      `;
      this.reRunMermaid();
    } else if (sectionKey === 'architecture') {
      container.innerHTML = `
        <div class="doc-section-card">
          <h2 class="doc-section-title">🏗️ High-Level System Architecture</h2>
          <p class="doc-lead">Multi-tier modular architectural design decoupling Presentation, Controller Logic, and Local Storage Persistence.</p>
          <div class="mermaid-diagram-box">
            <pre class="mermaid">${SE_DOCS.diagrams.architecture}</pre>
          </div>
        </div>
      `;
      this.reRunMermaid();
    } else if (sectionKey === 'test-cases') {
      container.innerHTML = `
        <div class="doc-section-card">
          <h2 class="doc-section-title">🧪 Comprehensive Verification Test Suite</h2>
          <p class="doc-lead">Formal software engineering test cases demonstrating black-box validation, boundary testing, and workflow regression.</p>
          <div class="table-responsive">
            <table class="tc-table">
              <thead>
                <tr>
                  <th>Test ID</th>
                  <th>Test Case Title</th>
                  <th>Type</th>
                  <th>Steps & Input</th>
                  <th>Expected Result</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${SE_DOCS.testCases.map(tc => `
                  <tr>
                    <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${tc.id}</td>
                    <td style="font-weight: 600;">${tc.title}</td>
                    <td><span style="font-size: 0.75rem; color: var(--accent-cyan);">${tc.type}</span></td>
                    <td style="white-space: pre-line;">${tc.steps}</td>
                    <td>${tc.expectedResult}</td>
                    <td><span class="tc-pass-badge">${tc.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <h3 style="margin: 2.5rem 0 1rem; color: var(--accent-cyan);">Requirements Traceability Matrix (RTM)</h3>
          <div class="table-responsive">
            <table class="tc-table">
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Requirement Summary</th>
                  <th>Mapped Test Cases</th>
                  <th>Test Coverage</th>
                </tr>
              </thead>
              <tbody>
                ${SE_DOCS.traceabilityMatrix.map(rtm => `
                  <tr>
                    <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${rtm.reqId}</td>
                    <td>${rtm.desc}</td>
                    <td style="font-family: var(--font-mono);">${rtm.testCases.join(', ')}</td>
                    <td style="font-weight: 700; color: #10b981;">${rtm.coverage}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

  reRunMermaid() {
    if (typeof mermaid !== 'undefined') {
      try {
        mermaid.run();
      } catch (e) {
        console.warn('Mermaid rendering trigger failed', e);
      }
    }
  }

  // ==========================================
  // Role Switcher & Theme Control
  // ==========================================
  initRoleSwitcher() {
    const select = document.getElementById('role-switcher-select');
    const avatar = document.getElementById('role-avatar-badge');
    if (!select || !avatar) return;

    select.innerHTML = USERS.map(u => `
      <option value="${u.id}">${u.name} (${u.role.split('/')[0].trim()})</option>
    `).join('');

    const current = this.store.getCurrentUser();
    select.value = current.id;
    avatar.textContent = current.avatar;
    avatar.style.background = current.color;

    select.addEventListener('change', (e) => {
      const selectedUser = USERS.find(u => u.id === e.target.value);
      if (selectedUser) {
        this.store.setCurrentUser(selectedUser);
        avatar.textContent = selectedUser.avatar;
        avatar.style.background = selectedUser.color;
        this.showToast(`Switched active session to: ${selectedUser.name}`, 'success');
      }
    });
  }

  initTheme() {
    const btn = document.getElementById('btn-theme-toggle');
    if (!btn) return;

    const savedTheme = localStorage.getItem('bugflow_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    btn.textContent = savedTheme === 'light' ? '🌙' : '☀️';

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('bugflow_theme', next);
      btn.textContent = next === 'light' ? '🌙' : '☀️';
      this.charts.renderAll(this.store.getMetrics());
    });
  }

  // ==========================================
  // Export Capabilities
  // ==========================================
  exportCSV() {
    const bugs = this.store.getBugs();
    const headers = ['Bug ID', 'Title', 'Module', 'Severity', 'Priority', 'Status', 'Reporter', 'Assignee', 'Created At'];
    
    const rows = bugs.map(b => [
      `"${b.id}"`,
      `"${b.title.replace(/"/g, '""')}"`,
      `"${b.module}"`,
      `"${b.severity}"`,
      `"${b.priority}"`,
      `"${b.status}"`,
      `"${b.reporter}"`,
      `"${b.assignee}"`,
      `"${b.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BugFlow_SE_Defect_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('CSV Report downloaded', 'success');
  }

  exportJSON() {
    const bugs = this.store.getBugs();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bugs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `BugFlow_SE_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast('JSON Dataset exported', 'success');
  }

  printReport() {
    window.print();
  }

  resetSeedData() {
    if (confirm('Reset BugFlow to initial academic project seed data? All custom entries will be restored to defaults.')) {
      this.store.resetToDefaults();
      this.renderAllViews();
      this.showToast('Reset to original seed data complete', 'success');
    }
  }

  // ==========================================
  // Event Listeners
  // ==========================================
  bindEvents() {
    // Tab switching
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        if (!targetTab) return;

        document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(`tab-panel-${targetTab}`);
        if (panel) panel.classList.add('active');

        this.currentTab = targetTab;
        if (targetTab === 'dashboard') {
          setTimeout(() => this.charts.renderAll(this.store.getMetrics()), 50);
        }
      });
    });

    // Docs sidebar switching
    document.querySelectorAll('.docs-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.renderDocsSection(btn.dataset.section);
      });
    });

    // Report Defect Modal triggers
    document.getElementById('btn-open-report')?.addEventListener('click', () => this.openReportModal());
    document.getElementById('btn-close-report')?.addEventListener('click', () => this.closeReportModal());
    document.getElementById('btn-cancel-report')?.addEventListener('click', () => this.closeReportModal());
    document.getElementById('form-report-bug')?.addEventListener('submit', (e) => this.submitReportForm(e));

    // Detail Modal triggers
    document.getElementById('btn-close-detail')?.addEventListener('click', () => this.closeDetailModal());
    document.getElementById('btn-add-comment')?.addEventListener('click', () => this.addDetailComment());
    document.getElementById('btn-delete-defect')?.addEventListener('click', () => this.deleteCurrentDetailBug());

    // Detail field updates
    document.getElementById('detail-status-select')?.addEventListener('change', (e) => {
      this.updateDetailField('status', e.target.value);
    });
    document.getElementById('detail-assignee-select')?.addEventListener('change', (e) => {
      this.updateDetailField('assignee', e.target.value);
    });
    document.getElementById('detail-severity-select')?.addEventListener('change', (e) => {
      this.updateDetailField('severity', e.target.value);
    });

    // Table Filters
    document.getElementById('filter-search')?.addEventListener('input', (e) => {
      this.filters.search = e.target.value;
      this.renderRegistryTable();
    });
    document.getElementById('filter-severity')?.addEventListener('change', (e) => {
      this.filters.severity = e.target.value;
      this.renderRegistryTable();
    });
    document.getElementById('filter-status')?.addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.renderRegistryTable();
    });
    document.getElementById('filter-module')?.addEventListener('change', (e) => {
      this.filters.module = e.target.value;
      this.renderRegistryTable();
    });

    // Export Buttons
    document.getElementById('btn-export-csv')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('btn-export-json')?.addEventListener('click', () => this.exportJSON());
    document.getElementById('btn-print-report')?.addEventListener('click', () => this.printReport());
    document.getElementById('btn-reset-seed')?.addEventListener('click', () => this.resetSeedData());

    // Populate Dynamic Selects in Forms
    this.populateFormSelects();
  }

  populateFormSelects() {
    const moduleSelects = [
      document.getElementById('field-module'),
      document.getElementById('filter-module')
    ];

    moduleSelects.forEach(sel => {
      if (!sel) return;
      MODULES.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        sel.appendChild(opt);
      });
    });

    const assigneeSelects = [
      document.getElementById('field-assignee'),
      document.getElementById('detail-assignee-select')
    ];

    assigneeSelects.forEach(sel => {
      if (!sel) return;
      USERS.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.name;
        opt.textContent = `${u.name} (${u.role.split('/')[0].trim()})`;
        sel.appendChild(opt);
      });
    });
  }

  // ==========================================
  // Toast Helper
  // ==========================================
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
      <span>${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BugFlowApp();
});
