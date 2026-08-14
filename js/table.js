import { supabase } from './supabase.js';
import { confirmDialog, escapeHtml, showToast } from './utils.js';

const tableBody = document.querySelector('#tableBody');
const globalSearch = document.querySelector('#globalSearch');
const addRecordBtn = document.querySelector('#addRecordBtn');
const newRowBtn = document.querySelector('#newRowBtn');
const todayBtn = document.querySelector('#todayBtn');
const refreshBtn = document.querySelector('#refreshBtn');
const exportCsvBtn = document.querySelector('#exportCsvBtn');
const activeFiltersLabel = document.querySelector('#activeFiltersLabel');
const filterBar = document.querySelector('#filterBar');
const prevPageBtn = document.querySelector('#prevPageBtn');
const nextPageBtn = document.querySelector('#nextPageBtn');
const pageInfo = document.querySelector('#pageInfo');
const tableCount = document.querySelector('#tableCount');

let records = [];
let employees = [];
let vehicles = [];
let page = 1;
let realtimeChannel;
const pageSize = 10;
let filters = {
  vehicleId: '',
  employeeId: '',
  role: '',
  period: ''
};

async function fetchEmployees() {
  const { data, error } = await supabase.from('employees').select('*').order('name');
  if (!error) employees = data || [];
}

async function fetchVehicles() {
  const { data, error } = await supabase.from('vehicles').select('*').order('identification');
  if (!error) vehicles = data || [];
}

async function fetchLoadings() {
  const { data, error } = await supabase
    .from('loadings')
    .select('*, vehicles:vehicle_id (id, identification), mover:mover_employee_id (id, name), loader:loader_employee_id (id, name), organizer:organizer_employee_id (id, name)')
    .order('operation_date', { ascending: false });

  if (error) {
    showToast(error.message || 'Erro ao carregar registros.', 'error');
    return;
  }

  records = data || [];
  renderTable();
}

function activeEmployees() {
  return employees.filter(employee => employee.status === 'Ativo');
}

function activeVehicles() {
  return vehicles.filter(vehicle => vehicle.status === 'Ativo');
}

function getDisplayName(employee) {
  return employee?.name || '-';
}

function filteredRecords() {
  const query = (globalSearch?.value || '').trim().toLowerCase();
  const today = new Date().toISOString().slice(0, 10);

  return records.filter(record => {
    const matchesText = !query || [
      record.operation_date,
      record.volumes,
      getDisplayName(record.mover),
      getDisplayName(record.loader),
      getDisplayName(record.organizer),
      record.vehicles?.identification || ''
    ].join(' ').toLowerCase().includes(query);

    const matchesVehicle = !filters.vehicleId || record.vehicle_id === filters.vehicleId;
    const matchesEmployee = !filters.employeeId || [
      record.mover_employee_id,
      record.loader_employee_id,
      record.organizer_employee_id
    ].includes(filters.employeeId);
    const matchesRole = !filters.role || record[filters.role] === filters.employeeId || !filters.employeeId;
    const matchesPeriod = !filters.period || (filters.period === 'today' ? record.operation_date === today : true);

    return matchesText && matchesVehicle && matchesEmployee && matchesRole && matchesPeriod;
  });
}

function renderTable() {
  const data = filteredRecords();
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  page = Math.min(page, totalPages);
  const start = (page - 1) * pageSize;
  const paginated = data.slice(start, start + pageSize);

  tableCount.textContent = `${data.length} registros`;
  pageInfo.textContent = `Página ${page} de ${totalPages}`;
  prevPageBtn.disabled = page <= 1;
  nextPageBtn.disabled = page >= totalPages;

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (globalSearch?.value ? 1 : 0);
  activeFiltersLabel.textContent = activeFilterCount ? `${activeFilterCount} filtros ativos` : 'Sem filtros';

  if (!paginated.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <strong>Nenhum carregamento registrado.</strong>
            <p>Adicione o primeiro registro para começar a operar.</p>
            <button class="btn primary" id="emptyAddBtn">Adicionar primeiro registro</button>
          </div>
        </td>
      </tr>
    `;
    document.querySelector('#emptyAddBtn')?.addEventListener('click', addBlankRow);
    return;
  }

  tableBody.innerHTML = paginated.map(record => `
    <tr data-id="${record.id}" class="table-row">
      <td><input class="table-input" type="date" value="${record.operation_date || ''}" data-field="operation_date" data-id="${record.id}" /></td>
      <td>
        <select class="table-select" data-field="vehicle_id" data-id="${record.id}">
          <option value="">Selecione</option>
          ${buildOptions(vehicleChoices(record), record.vehicle_id, 'identification')}
        </select>
      </td>
      <td><input class="table-input" type="number" min="1" step="1" value="${record.volumes || 1}" data-field="volumes" data-id="${record.id}" /></td>
      <td>
        <select class="table-select" data-field="mover_employee_id" data-id="${record.id}">
          <option value="">Selecione</option>
          ${buildOptions(employeeChoices(record.mover, record.mover_employee_id), record.mover_employee_id, 'name')}
        </select>
      </td>
      <td>
        <select class="table-select" data-field="loader_employee_id" data-id="${record.id}">
          <option value="">Selecione</option>
          ${buildOptions(employeeChoices(record.loader, record.loader_employee_id), record.loader_employee_id, 'name')}
        </select>
      </td>
      <td>
        <select class="table-select" data-field="organizer_employee_id" data-id="${record.id}">
          <option value="">Selecione</option>
          ${buildOptions(employeeChoices(record.organizer, record.organizer_employee_id), record.organizer_employee_id, 'name')}
        </select>
      </td>
      <td><button class="cell-action" data-delete-id="${record.id}" title="Excluir"><i data-lucide="trash-2"></i></button></td>
    </tr>
  `).join('');

  tableBody.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', handleCellEdit);
    el.addEventListener('focus', () => selectRow(el.dataset.id));
    el.addEventListener('keydown', handleKeyNavigation);
  });

  tableBody.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', () => deleteLoading(btn.dataset.deleteId));
  });

  window.lucide?.createIcons();
}

function buildOptions(items, selectedId, labelKey) {
  return items.map(item => `<option value="${item.id}" ${selectedId === item.id ? 'selected' : ''}>${escapeHtml(item[labelKey])}</option>`).join('');
}

function employeeChoices(currentEmployee, selectedId) {
  const choices = [...activeEmployees()];
  if (selectedId && currentEmployee && !choices.some(employee => employee.id === selectedId)) {
    choices.push({ id: selectedId, name: `${currentEmployee.name} (inativo)` });
  }
  return choices;
}

function vehicleChoices(record) {
  const choices = [...activeVehicles()];
  if (record.vehicle_id && record.vehicles && !choices.some(vehicle => vehicle.id === record.vehicle_id)) {
    choices.push({ id: record.vehicle_id, identification: `${record.vehicles.identification} (inativo)` });
  }
  return choices;
}

function selectRow(id) {
  tableBody.querySelectorAll('tr').forEach(row => row.classList.toggle('selected', row.dataset.id === id));
}

async function handleCellEdit(event) {
  const id = event.target.dataset.id;
  const field = event.target.dataset.field;
  const value = event.target.value;

  if (field === 'volumes' && (!Number.isInteger(Number(value)) || Number(value) < 1)) {
    showToast('Volumes deve ser um inteiro positivo.', 'error');
    await fetchLoadings();
    return;
  }

  const payload = { [field]: field === 'volumes' ? Number(value) : value || null };
  const { error } = await supabase.from('loadings').update(payload).eq('id', id);

  if (error) {
    showToast(error.message || 'Erro ao salvar alteração.', 'error');
    return;
  }

  showToast('Registro salvo.', 'success');
}

async function addBlankRow() {
  const newRecord = {
    operation_date: new Date().toISOString().slice(0, 10),
    vehicle_id: activeVehicles()[0]?.id || null,
    volumes: 1,
    mover_employee_id: activeEmployees()[0]?.id || null,
    loader_employee_id: activeEmployees()[0]?.id || null,
    organizer_employee_id: activeEmployees()[0]?.id || null
  };

  const { error } = await supabase.from('loadings').insert([newRecord]).select();
  if (error) {
    showToast(error.message || 'Erro ao criar registro.', 'error');
    return;
  }

  showToast('Registro criado.', 'success');
  await fetchLoadings();
}

async function deleteLoading(id) {
  const shouldDelete = await confirmDialog({
    title: 'Excluir carregamento',
    message: 'Deseja realmente excluir este carregamento?',
    confirmText: 'Excluir',
    danger: true
  });
  if (!shouldDelete) return;

  const { error } = await supabase.from('loadings').delete().eq('id', id);
  if (error) {
    showToast(error.message || 'Erro ao excluir.', 'error');
    return;
  }

  showToast('Registro excluído.', 'success');
  await fetchLoadings();
}

function handleKeyNavigation(event) {
  if (!['Enter', 'Tab', 'Escape'].includes(event.key)) return;

  if (event.key === 'Escape') {
    event.target.blur();
    return;
  }

  if (event.key === 'Enter' || event.key === 'Tab') {
    event.preventDefault();
    const inputs = [...tableBody.querySelectorAll('input, select')];
    const index = inputs.indexOf(event.target);
    const step = event.shiftKey ? -1 : 1;
    inputs[index + step]?.focus();
  }
}

function setupFilters() {
  filterBar.innerHTML = `
    <select class="select" data-filter="period" style="max-width:170px;">
      <option value="">Todos os períodos</option>
      <option value="today">Hoje</option>
    </select>
    <select class="select" data-filter="vehicleId" style="max-width:200px;">
      <option value="">Todos os veículos</option>
      ${activeVehicles().map(vehicle => `<option value="${vehicle.id}">${escapeHtml(vehicle.identification)}</option>`).join('')}
    </select>
    <select class="select" data-filter="employeeId" style="max-width:220px;">
      <option value="">Todos os funcionários</option>
      ${activeEmployees().map(employee => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join('')}
    </select>
    <select class="select" data-filter="role" style="max-width:210px;">
      <option value="">Todas as funções</option>
      <option value="mover_employee_id">Movimentador</option>
      <option value="loader_employee_id">Carregador</option>
      <option value="organizer_employee_id">Organizador</option>
    </select>
    <button class="btn secondary" id="clearFiltersBtn">Limpar filtros</button>
  `;

  filterBar.querySelectorAll('[data-filter]').forEach(el => {
    el.addEventListener('change', event => {
      filters[event.target.dataset.filter] = event.target.value;
      page = 1;
      renderTable();
    });
  });

  document.querySelector('#clearFiltersBtn')?.addEventListener('click', () => {
    filters = { vehicleId: '', employeeId: '', role: '', period: '' };
    filterBar.querySelectorAll('[data-filter]').forEach(input => { input.value = ''; });
    globalSearch.value = '';
    page = 1;
    renderTable();
  });
}

function exportCsv() {
  const data = filteredRecords();
  const rows = [
    ['Data', 'Veículo', 'Volumes', 'Movimentador', 'Carregador', 'Organizador'],
    ...data.map(record => [
      record.operation_date,
      record.vehicles?.identification || '',
      record.volumes,
      getDisplayName(record.mover),
      getDisplayName(record.loader),
      getDisplayName(record.organizer)
    ])
  ];

  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'carregamentos.csv';
  link.click();
  URL.revokeObjectURL(url);
  showToast('CSV exportado.', 'success');
}

function setupRealtime() {
  realtimeChannel = supabase
    .channel('loadings-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'loadings' }, fetchLoadings)
    .subscribe();
}

async function initialize() {
  await fetchEmployees();
  await fetchVehicles();
  await fetchLoadings();
  setupFilters();
  setupRealtime();

  addRecordBtn?.addEventListener('click', addBlankRow);
  newRowBtn?.addEventListener('click', addBlankRow);
  todayBtn?.addEventListener('click', () => {
    filters.period = 'today';
    filterBar.querySelector('[data-filter="period"]').value = 'today';
    page = 1;
    renderTable();
  });
  refreshBtn?.addEventListener('click', fetchLoadings);
  exportCsvBtn?.addEventListener('click', exportCsv);
  globalSearch?.addEventListener('input', () => {
    page = 1;
    renderTable();
  });

  prevPageBtn?.addEventListener('click', () => {
    if (page > 1) {
      page -= 1;
      renderTable();
    }
  });

  nextPageBtn?.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(filteredRecords().length / pageSize));
    if (page < totalPages) {
      page += 1;
      renderTable();
    }
  });

  // Modal de Funcionários
  const manageEmployeesBtn = document.querySelector('#manageEmployeesBtn');
  const employeesModal = document.querySelector('#employeesModal');
  const closeEmployeesModal = document.querySelector('#closeEmployeesModal');
  const employeeForm = document.querySelector('#employeeForm');

  if (manageEmployeesBtn && employeesModal) {
    manageEmployeesBtn.addEventListener('click', async () => {
      employeesModal.style.display = 'flex';
      await renderEmployeesList();
    });

    closeEmployeesModal?.addEventListener('click', () => {
      employeesModal.style.display = 'none';
    });

    employeeForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.querySelector('#employeeName').value.trim();
      const status = document.querySelector('#employeeStatus').value;

      if (!name) {
        showToast('Nome é obrigatório.', 'error');
        return;
      }

      const { error } = await supabase.from('employees').insert([{ name, status }]);
      if (error) {
        showToast(error.message || 'Erro ao adicionar funcionário.', 'error');
        return;
      }

      showToast('Funcionário adicionado.', 'success');
      employeeForm.reset();
      await fetchEmployees();
      await renderEmployeesList();
      await fetchLoadings();
    });
  }

  // Modal de Veículos
  const manageVehiclesBtn = document.querySelector('#manageVehiclesBtn');
  const vehiclesModal = document.querySelector('#vehiclesModal');
  const closeVehiclesModal = document.querySelector('#closeVehiclesModal');
  const vehicleForm = document.querySelector('#vehicleForm');

  if (manageVehiclesBtn && vehiclesModal) {
    manageVehiclesBtn.addEventListener('click', async () => {
      vehiclesModal.style.display = 'flex';
      await renderVehiclesList();
    });

    closeVehiclesModal?.addEventListener('click', () => {
      vehiclesModal.style.display = 'none';
    });

    vehicleForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identification = document.querySelector('#vehiclePlate').value.trim();
      const status = document.querySelector('#vehicleStatus').value;

      if (!identification) {
        showToast('Placa é obrigatória.', 'error');
        return;
      }

      const { error } = await supabase.from('vehicles').insert([{ identification, status }]);
      if (error) {
        showToast(error.message || 'Erro ao adicionar veículo.', 'error');
        return;
      }

      showToast('Veículo adicionado.', 'success');
      vehicleForm.reset();
      await fetchVehicles();
      await renderVehiclesList();
      await fetchLoadings();
    });
  }

  async function renderEmployeesList() {
    const list = document.querySelector('#employeesList');
    const active = employees.filter(e => e.status === 'Ativo').slice(0, 5);
    
    if (!active.length) {
      list.innerHTML = '<p style="opacity:0.6;font-size:0.9rem;">Nenhum funcionário ativo.</p>';
      return;
    }

    list.innerHTML = `
      <div style="font-size:0.85rem;opacity:0.7;margin-bottom:8px;">Funcionários ativos:</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${active.map(e => `<span style="background:rgba(255,0,0,0.1);padding:4px 8px;border-radius:6px;font-size:0.85rem;">${escapeHtml(e.name)}</span>`).join('')}
      </div>
    `;
  }

  async function renderVehiclesList() {
    const list = document.querySelector('#vehiclesList');
    const active = vehicles.filter(v => v.status === 'Ativo').slice(0, 5);
    
    if (!active.length) {
      list.innerHTML = '<p style="opacity:0.6;font-size:0.9rem;">Nenhum veículo ativo.</p>';
      return;
    }

    list.innerHTML = `
      <div style="font-size:0.85rem;opacity:0.7;margin-bottom:8px;">Veículos ativos:</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${active.map(v => `<span style="background:rgba(255,0,0,0.1);padding:4px 8px;border-radius:6px;font-size:0.85rem;">${escapeHtml(v.identification)}</span>`).join('')}
      </div>
    `;
  }

  window.addEventListener('beforeunload', () => {
    realtimeChannel?.unsubscribe?.();
  });
}

initialize();
