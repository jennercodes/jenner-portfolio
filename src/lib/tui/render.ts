/*
 * DOM del modo terminal. Todo el texto entra con textContent: nunca HTML.
 * Estilos en global.css (.tui-*), con los colores de la marca.
 */

import type { Line, Token } from './types';

export function isExternal(href: string): boolean {
  return /^(https?:|mailto:|tel:)/.test(href);
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** href real del enlace: los internos apuntan a su página para que funcionen abrir en pestaña y similares */
export type HrefFor = (href: string) => string;

function renderToken(token: Token, hrefFor: HrefFor): Node {
  if (token.href) {
    const a = el('a', 'tui-link', token.text);
    a.href = hrefFor(token.href);
    a.dataset.href = token.href;
    if (isExternal(token.href)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    return a;
  }
  if (!token.tone && !token.bold) return document.createTextNode(token.text);
  return el('span', `tui-${token.tone ?? 'fg'}${token.bold ? ' tui-bold' : ''}`, token.text);
}

export function renderLine(line: Line, hrefFor: HrefFor): HTMLElement {
  const row = el('div', 'tui-line');
  for (const token of line) row.append(renderToken(token, hrefFor));
  if (!line.length) row.append('​');
  return row;
}

export interface Shell {
  root: HTMLElement;
  log: HTMLElement;
  form: HTMLFormElement;
  input: HTMLInputElement;
  menu: HTMLElement;
  hint: HTMLElement;
  exit: HTMLButtonElement;
}

export function buildShell(root: HTMLElement): Shell {
  root.replaceChildren();
  root.className = 'tui';
  root.setAttribute('aria-label', 'jenner.codes en modo terminal');

  const log = el('div', 'tui-log');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  log.setAttribute('aria-label', 'Conversación');

  const dock = el('div', 'tui-dock');

  const form = el('form', 'tui-prompt');
  const caret = el('span', 'tui-caret', '>');
  caret.setAttribute('aria-hidden', 'true');
  const input = el('input', 'tui-input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('enterkeyhint', 'send');
  input.setAttribute('aria-label', 'Escribe un comando o una pregunta');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', 'tui-menu');
  input.setAttribute('aria-expanded', 'false');
  input.placeholder = 'Escribe / o pregunta algo';
  form.append(caret, input);

  const menu = el('ul', 'tui-menu');
  menu.id = 'tui-menu';
  menu.setAttribute('role', 'listbox');
  menu.hidden = true;

  const foot = el('div', 'tui-foot');
  const hint = el('span', 'tui-hint', '/ comandos · @ archivos · ↑↓ historial');
  const exit = el('button', 'tui-exit', '/exit  volver al modo normal');
  exit.type = 'button';
  foot.append(hint, exit);

  dock.append(form, menu, foot);
  root.append(log, dock);
  return { root, log, form, input, menu, hint, exit };
}
