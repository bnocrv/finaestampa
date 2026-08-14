import { supabase, isSupabaseConfigured } from './supabase.js';
import { showToast } from './utils.js';

let redirectionInProgress = false;

async function checkAuthAndRedirect() {
  if (redirectionInProgress) return;
  redirectionInProgress = true;

  const currentPage = window.location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
  const isLoginPage = currentPage === 'login';
  const isRedirectPage = document.body.dataset.page === 'redirect';

  // Página de redirect (index.html)
  if (isRedirectPage) {
    const configured = await isSupabaseConfigured();
    
    if (!configured) {
      console.warn('Supabase not configured, redirecting to login');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 500);
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session && !error) {
        console.log('Session found, redirecting to table');
        setTimeout(() => {
          window.location.href = 'table.html';
        }, 500);
      } else {
        console.warn('No session, redirecting to login');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 500);
      }
    } catch (error) {
      console.error('Session check error:', error.message);
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 500);
    }
    return;
  }

  // Página de login
  if (isLoginPage) {
    const configured = await isSupabaseConfigured();
    
    if (!configured) {
      console.warn('Supabase not configured on login page');
      redirectionInProgress = false;
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Session found on login page, redirecting to table');
        setTimeout(() => {
          window.location.href = 'table.html';
        }, 500);
        return;
      }
    } catch (error) {
      console.error('Session check on login page:', error.message);
    }
    redirectionInProgress = false;
    return;
  }

  // Páginas protegidas (table, employees, vehicles, reports, etc)
  const configured = await isSupabaseConfigured();
  
  if (!configured) {
    console.warn('Supabase not configured on protected page');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
    return;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      console.warn('No valid session on protected page, redirecting to login');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 500);
    }
  } catch (error) {
    console.error('Session check error on protected page:', error.message);
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
  }
}

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
    redirectionInProgress = true;
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast(error.message || 'Erro ao sair.', 'error');
      redirectionInProgress = false;
      return;
    }
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
  });

  // Executar check de autenticação com delay pequeno
  setTimeout(() => {
    checkAuthAndRedirect();
  }, 100);
});
