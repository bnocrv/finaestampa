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

  document.querySelector('#logoutBtn')?.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast(error.message || 'Erro ao sair.', 'error');
      return;
    }
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 300);
  });

  // Detectar página atual
  const isLoginPage = window.location.pathname.includes('login.html');
  const isRedirectPage = document.body.dataset.page === 'redirect';

  // Se for página de redirect (index.html), redirecionar com base em autenticação
  if (isRedirectPage) {
    const configured = await isSupabaseConfigured();
    if (!configured) {
      window.location.href = 'login.html';
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session && !error) {
        window.location.href = 'table.html';
      } else {
        window.location.href = 'login.html';
      }
    } catch (error) {
      console.warn('Session check error:', error.message);
      window.location.href = 'login.html';
    }
    return; // Não continuar se for página de redirect
  }

  // Para outras páginas (excluindo login)
  if (!isLoginPage) {
    const configured = await isSupabaseConfigured();
    if (!configured) {
      window.location.href = 'login.html';
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        window.location.href = 'login.html';
      }
    } catch (error) {
      console.warn('Session check error:', error.message);
      window.location.href = 'login.html';
    }
  } else {
    // Se estiver na página de login E houver uma sessão válida, redirecionar para principal
    const configured = await isSupabaseConfigured();
    if (configured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.location.href = 'table.html';
        }
      } catch (error) {
        console.warn('Session check on login page:', error.message);
      }
    }
  }
});
