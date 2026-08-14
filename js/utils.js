export function formatDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? dateValue : date.toLocaleDateString('pt-BR');
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('');
}

export function showToast(message, type = 'info') {
  const stack = document.querySelector('.toast-stack') || createToastStack();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button class="btn secondary" aria-label="Fechar notificação">&times;</button>
  `;

  el.querySelector('button').addEventListener('click', () => el.remove());
  stack.appendChild(el);

  setTimeout(() => el.remove(), 3500);
}

function createToastStack() {
  const stack = document.createElement('div');
  stack.className = 'toast-stack';
  document.body.appendChild(stack);
  return stack;
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getStateBadge(status) {
  if (!status) return '<span class="pill warning">Desconhecido</span>';
  if (status === 'Ativo') return '<span class="pill success">Ativo</span>';
  if (status === 'Inativo') return '<span class="pill danger">Inativo</span>';
  return '<span class="pill warning">' + escapeHtml(status) + '</span>';
}

export function confirmDialog({
  title = 'Confirmar ação',
  message = 'Deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false
} = {}) {
  return new Promise(resolve => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
        <div class="modal-header">
          <h3 id="confirmTitle">${escapeHtml(title)}</h3>
          <button class="cell-action" data-close aria-label="Fechar"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">
          <p>${escapeHtml(message)}</p>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" data-cancel>${escapeHtml(cancelText)}</button>
          <button class="btn ${danger ? 'danger solid' : 'primary'}" data-confirm>${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    const close = value => {
      backdrop.remove();
      resolve(value);
    };

    backdrop.addEventListener('click', event => {
      if (event.target === backdrop) close(false);
    });
    backdrop.querySelector('[data-close]').addEventListener('click', () => close(false));
    backdrop.querySelector('[data-cancel]').addEventListener('click', () => close(false));
    backdrop.querySelector('[data-confirm]').addEventListener('click', () => close(true));
    document.body.appendChild(backdrop);
    window.lucide?.createIcons();
  });
}
