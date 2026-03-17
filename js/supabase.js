import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = 'https://cuiznbvvlqtwcoocehnd.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1aXpuYnZ2bHF0d2Nvb2NlaG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzI0NTUsImV4cCI6MjA4OTI0ODQ1NX0.QXAjvDdvih1ue1W8BaoqBfBr_fUJb9W5FYFZSC_JI8w';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

/* ── Language helpers ─────────────────────────────────────── */
const SUPPORTED_LANGS = ['en', 'ru', 'tk'];
const DEFAULT_LANG    = 'en';

export function detectLang() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const fromURL  = SUPPORTED_LANGS.find(l => segments[0] === l);
  if (fromURL) {
    localStorage.setItem('maobai_lang', fromURL);
    return fromURL;
  }
  const fromStorage = localStorage.getItem('maobai_lang');
  if (SUPPORTED_LANGS.includes(fromStorage)) return fromStorage;
  return DEFAULT_LANG;
}

export function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  localStorage.setItem('maobai_lang', lang);
  const newPath = window.location.pathname.replace(
    /^\/(en|ru|tk)(\/|$)/,
    `/${lang}$2`
  );
  window.location.href = newPath.startsWith(`/${lang}`)
    ? newPath
    : `/${lang}${newPath}`;
}

export function dashboardURL(lang) {
  return `/${lang}/app/dashboard.html`;
}

/* ── Auth ─────────────────────────────────────────────────── */
export async function signUp(email, password, lang) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const user = data.user;
  if (user) {
    const username = email.split('@')[0];
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id:                 user.id,
        email,
        username,
        preferred_language: lang,
      });
    if (profileError) console.warn('Profile insert warning:', profileError.message);
  }
  return data;
}

export async function logIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
