import { supabase, isSupabaseConfigured } from './supabase.js';
import { showToast } from './utils.js';

window.addEventListener('DOMContentLoaded', async () => {
  const appName = document.body.dataset.appName || 'Carregamento Operacional';
  document.title = appName;

  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) {
    favicon.href = window.APP_PATHS?.favicon || 'assets/icons/favicon.png';
    favicon.type = 'image/png';
  }

  document.querySelectorAll('img[data-brand-logo]').forEach(img => {
    img.src = window.APP_PATHS?.logo || 'assets/images/logo.png';
  });

  document.querySelectorAll('[data-nav-group]').forEach(group => {
    const key = `navGroup:${group.dataset.navGroup || 'default'}`;
    const toggle = group.querySelector('[data-nav-group-toggle]');
    const savedState = localStorage.getItem(key);
    const collapsed = savedState === 'collapsed';

    group.classList.toggle('is-collapsed', collapsed);
    toggle?.setAttribute('aria-expanded', String(!collapsed));
    if (toggle) {
      toggle.title = collapsed ? 'Expandir Carregamento' : 'Recolher Carregamento';
      toggle.setAttribute('aria-label', toggle.title);
    }

    toggle?.addEventListener('click', () => {
      const isCollapsed = group.classList.toggle('is-collapsed');
      localStorage.setItem(key, isCollapsed ? 'collapsed' : 'expanded');
      toggle.setAttribute('aria-expanded', String(!isCollapsed));
      toggle.title = isCollapsed ? 'Expandir Carregamento' : 'Recolher Carregamento';
      toggle.setAttribute('aria-label', toggle.title);
    });
  });

  document.querySelector('#logoutBtn')?.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast(error.message || 'Erro ao sair.', 'error');
      return;
    }
    window.location.href = 'login.html';
  });

  const configured = await isSupabaseConfigured();
  if (!configured) {
    showToast('Configure as variáveis do Supabase para conectar ao sistema.', 'info');
  }

  try {
    const session = await supabase.auth.getSession();
    const isLoginPage = window.location.pathname.includes('login.html');

    if (!session?.data?.session && !isLoginPage) {
      window.location.href = 'login.html';
    }

    if (isLoginPage && session?.data?.session) {
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.warn('Session check skipped:', error.message);
  }
});
