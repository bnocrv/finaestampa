import { supabase } from './supabase.js';
import { escapeHtml, formatNumber, showToast } from './utils.js';

const ids = {
  loadsToday: document.querySelector('#loadsToday'),
  volumesToday: document.querySelector('#volumesToday'),
  loadsMonth: document.querySelector('#loadsMonth'),
  volumesMonth: document.querySelector('#volumesMonth'),
  topEmployee: document.querySelector('#topEmployee'),
  dailyVolumesChart: document.querySelector('#dailyVolumesChart'),
  vehicleLoadsChart: document.querySelector('#vehicleLoadsChart'),
  employeeParticipationList: document.querySelector('#employeeParticipationList')
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthPrefix() {
  return todayISO().slice(0, 7);
}

async function loadDashboard() {
  const { data, error } = await supabase
    .from('loadings')
    .select('*, vehicles:vehicle_id (identification), mover:mover_employee_id (name), loader:loader_employee_id (name), organizer:organizer_employee_id (name)');

  if (error) {
    showToast(error.message || 'Erro ao carregar visão geral.', 'error');
    return;
  }

  const records = data || [];
  const today = todayISO();
  const month = monthPrefix();
  const todayRecords = records.filter(record => record.operation_date === today);
  const monthRecords = records.filter(record => record.operation_date?.startsWith(month));

  ids.loadsToday.textContent = formatNumber(todayRecords.length);
  ids.volumesToday.textContent = formatNumber(todayRecords.reduce((sum, item) => sum + Number(item.volumes || 0), 0));
  ids.loadsMonth.textContent = formatNumber(monthRecords.length);
  ids.volumesMonth.textContent = formatNumber(monthRecords.reduce((sum, item) => sum + Number(item.volumes || 0), 0));

  const employees = countEmployees(monthRecords);
  const top = [...employees.entries()].sort((a, b) => b[1] - a[1])[0];
  ids.topEmployee.textContent = top?.[0] || '-';

  renderDailyVolumes(records);
  renderVehicleLoads(monthRecords);
  renderEmployeeParticipation(employees);
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

function renderDailyVolumes(records) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
  const values = days.map(day => records.filter(record => record.operation_date === day).reduce((sum, record) => sum + Number(record.volumes || 0), 0));
  renderBars(ids.dailyVolumesChart, values);
}

function renderVehicleLoads(records) {
  const map = new Map();
  for (const record of records) {
    const name = record.vehicles?.identification || 'Sem veículo';
    map.set(name, (map.get(name) || 0) + 1);
  }
  renderBars(ids.vehicleLoadsChart, [...map.values()].sort((a, b) => b - a).slice(0, 7));
}

function renderBars(container, values) {
  const max = Math.max(...values, 1);
  container.innerHTML = values.length
    ? values.map(value => `<div class="bar" title="${value}" style="height:${Math.max((value / max) * 100, 8)}%"></div>`).join('')
    : '<div class="empty-state compact"><strong>Sem dados</strong></div>';
}

function renderEmployeeParticipation(employeeMap) {
  const entries = [...employeeMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(...entries.map(([, count]) => count), 1);

  ids.employeeParticipationList.innerHTML = entries.length ? entries.map(([name, count]) => `
    <div class="metric-row">
      <div><strong>${escapeHtml(name)}</strong><span>${count} participações</span></div>
      <div class="metric-track"><span style="width:${Math.max((count / max) * 100, 8)}%"></span></div>
    </div>
  `).join('') : '<div class="empty-state compact"><strong>Sem participação no período.</strong></div>';
}

loadDashboard();
