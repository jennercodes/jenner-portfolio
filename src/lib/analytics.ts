/*
 * Google Analytics 4 con consentimiento (ConsentBanner.astro).
 * Modo básico de Consent Mode v2: gtag.js no se descarga hasta que el visitante acepta,
 * así que sin aceptar no hay cookies, ni pings ni JS extra. Solo en producción.
 */

import { site } from '../data/site';

export type Consent = 'granted' | 'denied';

const KEY = 'consent';
const PROD_HOST = new URL(site.url).hostname;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Consent) {
  try {
    localStorage.setItem(KEY, value);
  } catch {}
  if (value === 'granted') loadGa();
  else revokeGa();
}

let loaded = false;

export function loadGa() {
  if (loaded || location.hostname !== PROD_HOST) return;
  loaded = true;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // gtag necesita el objeto `arguments`, no un array
    // biome-ignore lint/complexity/noArguments: API de gtag
    window.dataLayer?.push(arguments);
  };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('config', site.gaId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${site.gaId}`;
  document.head.append(script);

  trackContact();
}

/** Si cambia de opinión: GA deja de guardar y se borran sus cookies */
function revokeGa() {
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  const domain = `.${PROD_HOST}`;
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim();
    if (name === '_ga' || name.startsWith('_ga_')) {
      // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API aún sin soporte amplio en Safari
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
      // biome-ignore lint/suspicious/noDocumentCookie: ídem, por si quedó sin dominio
      document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  }
}

/** Clic en correo o WhatsApp: el evento que importa (generate_lead) */
function trackContact() {
  document.addEventListener('click', (e) => {
    const link = (e.target as Element | null)?.closest?.('a[href]');
    if (!(link instanceof HTMLAnchorElement)) return;
    const href = link.href;
    const method = href.startsWith('mailto:')
      ? 'email'
      : href.includes('wa.me/')
        ? 'whatsapp'
        : null;
    if (method) window.gtag?.('event', 'generate_lead', { method, page_path: location.pathname });
  });
}
