import { supabase } from './supabase.js';
import { escapeHtml, getStateBadge, showToast } from './utils.js';

const form = document.querySelector('#employeeForm');
const tableBody = document.querySelector('#employeeTableBody');
const searchInput = document.querySelector('#employeeSearch');

let employees = [];

async function fetchEmployees() {
  const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
  if (error) {
    showToast(error.message || 'Erro ao carregar funcionários.', 'error');
    return;
  }

  employees = data || [];
  renderTable();
}

function renderTable() {
  const search = (searchInput?.value || '').trim().toLowerCase();
  const filtered = employees.filter(employee => !search || [employee.name, employee.notes].join(' ').toLowerCase().includes(search));

  if (!filtered.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <strong>Nenhum funcionário encontrado.</strong>
            <p>Cadastre o primeiro colaborador para começar.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(employee => `
    <tr>
      <td>${escapeHtml(employee.name)}</td>
      <td>${getStateBadge(employee.status)}</td>
      <td>${escapeHtml(employee.notes || '-')}</td>
      <td>${new Date(employee.created_at).toLocaleDateString('pt-BR')}</td>
      <td>
        <button class="cell-action" data-action="edit" data-id="${employee.id}" title="Editar"><i data-lucide="pencil"></i></button>
        <button class="cell-action" data-action="toggle" data-id="${employee.id}" title="Inativar/Ativar"><i data-lucide="power"></i></button>
      </td>
    </tr>
  `).join('');

  tableBody.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', () => handleEmployeeAction(button.dataset.action, button.dataset.id));
  });

  window.lucide?.createIcons();
}

async function handleEmployeeAction(action, id) {
  const employee = employees.find(item => item.id === id);
  if (!employee) return;

  if (action === 'edit') {
    document.querySelector('#employeeName').value = employee.name;
    document.querySelector('#employeeStatus').value = employee.status;
    document.querySelector('#employeeNotes').value = employee.notes || '';
    form.dataset.editId = id;
  }

  if (action === 'toggle') {
    const nextStatus = employee.status === 'Ativo' ? 'Inativo' : 'Ativo';
    const { error } = await supabase.from('employees').update({ status: nextStatus }).eq('id', id);
    if (error) {
      showToast(error.message || 'Erro ao atualizar status.', 'error');
      return;
    }

    showToast('Status atualizado.', 'success');
    await fetchEmployees();
  }
}

form?.addEventListener('submit', async event => {
  event.preventDefault();
  const payload = {
    name: document.querySelector('#employeeName').value.trim(),
    status: document.querySelector('#employeeStatus').value,
    notes: document.querySelector('#employeeNotes').value.trim()
  };

  if (!payload.name) {
    showToast('Informe o nome do funcionário.', 'error');
    return;
  }

  if (form.dataset.editId) {
    const { error } = await supabase.from('employees').update(payload).eq('id', form.dataset.editId);
    if (error) {
      showToast(error.message || 'Erro ao editar funcionário.', 'error');
      return;
    }

    showToast('Funcionário atualizado.', 'success');
  } else {
    const { error } = await supabase.from('employees').insert([payload]);
    if (error) {
      showToast(error.message || 'Erro ao cadastrar funcionário.', 'error');
      return;
    }

    showToast('Funcionário cadastrado.', 'success');
  }

  form.reset();
  delete form.dataset.editId;
  await fetchEmployees();
});

searchInput?.addEventListener('input', renderTable);

document.querySelector('#newEmployeeBtn')?.addEventListener('click', () => {
  form.reset();
  delete form.dataset.editId;
  document.querySelector('#employeeName')?.focus();
});

fetchEmployees();
