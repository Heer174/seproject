/**
 * BugFlow SE - Analytics & Charts Engine
 * Uses Chart.js to render defect metrics, severity breakdowns,
 * and status pipelines with dark-mode aesthetic styling.
 */

export class ChartEngine {
  constructor() {
    this.severityChart = null;
    this.statusChart = null;
    this.moduleChart = null;
  }

  isDarkTheme() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }

  getTextColor() {
    return this.isDarkTheme() ? '#94a3b8' : '#475569';
  }

  getGridColor() {
    return this.isDarkTheme() ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  }

  renderAll(metrics) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library is not yet loaded.');
      return;
    }
    this.renderSeverityChart(metrics.bySeverity);
    this.renderStatusChart(metrics.byStatus);
    this.renderModuleChart(metrics.byModule);
  }

  renderSeverityChart(bySeverity) {
    const ctx = document.getElementById('chart-severity');
    if (!ctx) return;

    if (this.severityChart) {
      this.severityChart.destroy();
    }

    const data = [
      bySeverity.CRITICAL || 0,
      bySeverity.HIGH || 0,
      bySeverity.MEDIUM || 0,
      bySeverity.LOW || 0
    ];

    this.severityChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Critical (P1)', 'High (P2)', 'Medium (P3)', 'Low (P4)'],
        datasets: [{
          data: data,
          backgroundColor: [
            '#ef4444', // Red
            '#f97316', // Orange
            '#eab308', // Yellow
            '#10b981'  // Green
          ],
          borderColor: this.isDarkTheme() ? '#0f172a' : '#ffffff',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: this.getTextColor(),
              font: { family: 'Inter', size: 12, weight: '500' },
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            padding: 10,
            cornerRadius: 8,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
          }
        },
        cutout: '72%'
      }
    });
  }

  renderStatusChart(byStatus) {
    const ctx = document.getElementById('chart-status');
    if (!ctx) return;

    if (this.statusChart) {
      this.statusChart.destroy();
    }

    const labels = ['New', 'Triage', 'In Progress', 'Resolved', 'Verified'];
    const data = [
      byStatus.NEW || 0,
      byStatus.TRIAGE || 0,
      byStatus.IN_PROGRESS || 0,
      byStatus.RESOLVED || 0,
      byStatus.VERIFIED || 0
    ];

    this.statusChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Defects Count',
          data: data,
          backgroundColor: [
            '#64748b',
            '#3b82f6',
            '#8b5cf6',
            '#06b6d4',
            '#10b981'
          ],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this.getTextColor(), font: { family: 'Inter', size: 11 } }
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: this.getTextColor(), font: { family: 'Inter', size: 11 } },
            grid: { color: this.getGridColor() }
          }
        }
      }
    });
  }

  renderModuleChart(byModule) {
    const ctx = document.getElementById('chart-module');
    if (!ctx) return;

    if (this.moduleChart) {
      this.moduleChart.destroy();
    }

    const labels = Object.keys(byModule).map(m => m.split('&')[0].trim()); // shorten label
    const data = Object.values(byModule);

    this.moduleChart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(99, 102, 241, 0.6)',
            'rgba(239, 68, 68, 0.6)',
            'rgba(249, 115, 22, 0.6)',
            'rgba(234, 179, 8, 0.6)',
            'rgba(6, 182, 212, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(168, 85, 247, 0.6)',
            'rgba(236, 72, 153, 0.6)'
          ],
          borderWidth: 1,
          borderColor: this.isDarkTheme() ? '#0f172a' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: this.getTextColor(),
              font: { family: 'Inter', size: 11 },
              boxWidth: 12
            }
          }
        },
        scales: {
          r: {
            grid: { color: this.getGridColor() },
            ticks: { display: false }
          }
        }
      }
    });
  }
}
