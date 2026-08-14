import { supabase } from './supabase.js';
import { escapeHtml, getStateBadge, showToast } from './utils.js';

const form = document.querySelector('#vehicleForm');
const tableBody = document.querySelector('#vehicleTableBody');
const searchInput = document.querySelector('#vehicleSearch');

let vehicles = [];

async function fetchVehicles() {
  const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
  if (error) {
    showToast(error.message || 'Erro ao carregar veículos.', 'error');
    return;
  }

  vehicles = data || [];
  renderTable();
}

function renderTable() {
  const search = (searchInput?.value || '').trim().toLowerCase();
  const filtered = vehicles.filter(vehicle => !search || [vehicle.identification, vehicle.plate, vehicle.model, vehicle.notes].join(' ').toLowerCase().includes(search));

  if (!filtered.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <strong>Nenhum veículo encontrado.</strong>
            <p>Cadastre o primeiro veículo para operar.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(vehicle => `
    <tr>
      <td>${escapeHtml(vehicle.identification)}</td>
      <td>${escapeHtml(vehicle.plate || '-')}</td>
      <td>${escapeHtml(vehicle.model || '-')}</td>
      <td>${getStateBadge(vehicle.status)}</td>
      <td>${escapeHtml(vehicle.notes || '-')}</td>
      <td>
        <button class="cell-action" data-action="edit" data-id="${vehicle.id}" title="Editar"><i data-lucide="pencil"></i></button>
        <button class="cell-action" data-action="toggle" data-id="${vehicle.id}" title="Inativar/Ativar"><i data-lucide="power"></i></button>
      </td>
    </tr>
  `).join('');

  tableBody.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', () => handleVehicleAction(button.dataset.action, button.dataset.id));
  });

  window.lucide?.createIcons();
}

async function handleVehicleAction(action, id) {
  const vehicle = vehicles.find(item => item.id === id);
  if (!vehicle) return;

  if (action === 'edit') {
    document.querySelector('#vehicleIdentification').value = vehicle.identification;
    document.querySelector('#vehiclePlate').value = vehicle.plate || '';
    document.querySelector('#vehicleModel').value = vehicle.model || '';
    document.querySelector('#vehicleStatus').value = vehicle.status;
    document.querySelector('#vehicleNotes').value = vehicle.notes || '';
    form.dataset.editId = id;
  }

  if (action === 'toggle') {
    const nextStatus = vehicle.status === 'Ativo' ? 'Inativo' : 'Ativo';
    const { error } = await supabase.from('vehicles').update({ status: nextStatus }).eq('id', id);
    if (error) {
      showToast(error.message || 'Erro ao atualizar status.', 'error');
      return;
    }

    showToast('Status atualizado.', 'success');
    await fetchVehicles();
  }
}

form?.addEventListener('submit', async event => {
  event.preventDefault();
  const payload = {
    identification: document.querySelector('#vehicleIdentification').value.trim(),
    plate: document.querySelector('#vehiclePlate').value.trim(),
    model: document.querySelector('#vehicleModel').value.trim(),
    status: document.querySelector('#vehicleStatus').value,
    notes: document.querySelector('#vehicleNotes').value.trim()
  };

  if (!payload.identification) {
    showToast('Informe a identificação do veículo.', 'error');
    return;
  }

  if (form.dataset.editId) {
    const { error } = await supabase.from('vehicles').update(payload).eq('id', form.dataset.editId);
    if (error) {
      showToast(error.message || 'Erro ao editar veículo.', 'error');
      return;
    }

    showToast('Veículo atualizado.', 'success');
  } else {
    const { error } = await supabase.from('vehicles').insert([payload]);
    if (error) {
      showToast(error.message || 'Erro ao cadastrar veículo.', 'error');
      return;
    }

    showToast('Veículo cadastrado.', 'success');
  }

  form.reset();
  delete form.dataset.editId;
  await fetchVehicles();
});

searchInput?.addEventListener('input', renderTable);

document.querySelector('#newVehicleBtn')?.addEventListener('click', () => {
  form.reset();
  delete form.dataset.editId;
  document.querySelector('#vehicleIdentification')?.focus();
});

fetchVehicles();
