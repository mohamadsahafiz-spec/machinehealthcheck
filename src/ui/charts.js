// src/ui/charts.js
// Thin wrappers around Chart.js (assumed loaded globally via CDN)

export function createChart(ctx, config) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded');
    return null;
  }
  return new Chart(ctx, config);
}

export function destroyChart(chart) {
  if (chart) {
    chart.destroy();
  }
}

export function destroyAllCharts() {
  if (typeof Chart === 'undefined') return;
  const charts = Chart.instances;
  Object.keys(charts).forEach(key => {
    charts[key].destroy();
  });
}
