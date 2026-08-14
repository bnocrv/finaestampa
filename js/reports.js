import { supabase } from './supabase.js';
import { escapeHtml, formatNumber, showToast } from './utils.js';

const totalLoadsEl = document.querySelector('#reportTotalLoads');
const totalVolumesEl = document.querySelector('#reportTotalVolumes');
const averageEl = document.querySelector('#reportAverage');
const vehiclesReportList = document.querySelector('#vehiclesReportList');
const employeesReportList = document.querySelector('#employeesReportList');
const startInput = document.querySelector('#reportStart');
const endInput = document.querySelector('#reportEnd');
const exportBtn = document.querySelector('#exportReportBtn');

let reportRecords = [];

async function loadReports() {
  const { data, error } = await supabase
    .from('loadings')
    .select('*, vehicles:vehicle_id (identification), mover:mover_employee_id (name), loader:loader_employee_id (name), organizer:organizer_employee_id (name)');

  if (error) {
    showToast(error.message || 'Erro ao carregar relatórios.', 'error');
    return;
  }

  reportRecords = data || [];
  renderReports();
}

function filteredRecords() {
  const start = startInput?.value || '';
  const end = endInput?.value || '';
  return reportRecords.filter(record => {
    const date = record.operation_date || '';
    return (!start || date >= start) && (!end || date <= end);
  });
}

function renderReports() {
  const records = filteredRecords();
  const totalLoads = records.length;
  const totalVolumes = records.reduce((sum, item) => sum + Number(item.volumes || 0), 0);
  const average = totalLoads ? (totalVolumes / totalLoads).toFixed(1) : 0;

  totalLoadsEl.textContent = formatNumber(totalLoads);
  totalVolumesEl.textContent = formatNumber(totalVolumes);
  averageEl.textContent = String(average);

  renderMetricList(vehiclesReportList, countBy(records, record => record.vehicles?.identification || 'Sem veículo'));
  renderMetricList(employeesReportList, countEmployees(records));
}

function countBy(records, getKey) {
  const map = new Map();
  for (const record of records) {
    const key = getKey(record);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

function countEmployees(records) {
  const map = new Map();
  for (const record of records) {
    [record.mover?.name, record.loader?.name, record.organizer?.name].filter(Boolean).forEach(name => {
      map.set(name, (map.get(name) || 0) + 1);
    });
  }
  return map;
}

function renderMetricList(container, map) {
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(...entries.map(([, count]) => count), 1);
  container.innerHTML = entries.length ? entries.map(([name, count]) => `
    <div class="metric-row">
      <div><strong>${escapeHtml(name)}</strong><span>${count} registros</span></div>
      <div class="metric-track"><span style="width:${Math.max((count / max) * 100, 8)}%"></span></div>
    </div>
  `).join('') : '<div class="empty-state compact"><strong>Sem dados para o período.</strong></div>';
}

function exportCsv() {
  const rows = [
    ['Data', 'Veículo', 'Volumes', 'Movimentador', 'Carregador', 'Organizador'],
    ...filteredRecords().map(record => [
      record.operation_date,
      record.vehicles?.identification || '',
      record.volumes,
      record.mover?.name || '',
      record.loader?.name || '',
      record.organizer?.name || ''
    ])
  ];

  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'relatorio-carregamentos.csv';
  link.click();
  URL.revokeObjectURL(url);
  showToast('Relatório exportado.', 'success');
}

startInput?.addEventListener('change', renderReports);
endInput?.addEventListener('change', renderReports);
exportBtn?.addEventListener('click', exportCsv);

loadReports();
