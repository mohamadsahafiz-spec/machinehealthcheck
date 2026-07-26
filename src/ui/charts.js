// src/ui/charts.js
export function createChart(ctx, config) {
  return new Chart(ctx, config);
}
export function destroyChart(chart) {
  if (chart) { chart.destroy(); }
}
export function destroyAllCharts() {
  // No-op — individual modules manage their own chart instances
}
