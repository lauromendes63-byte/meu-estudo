import { normalizeText } from '../domain/notes-parser.js';
import { canonicalizeIconKey } from '../domain/storage-adapter.js';

export const APP_CREST_SVG = `<svg viewBox="0 0 512 512" class="app-crest-svg" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g transform="translate(256, 256) scale(1.26) translate(-256, -255)">
    <path d="M 350 144 C 368 144, 380 155, 380 172 L 380 364 C 380 381, 367 394, 350 394 L 170 394 C 151 394, 139 381, 139 364 L 139 344 L 350 344 Z" fill="#ECEFF6" stroke="#162654" stroke-width="18" stroke-linejoin="round"/>
    <rect x="132" y="116" width="232" height="260" rx="28" fill="#162654"/>
    <path d="M 160 116 L 178 116 L 178 376 L 160 376 C 144 376, 132 364, 132 348 L 132 144 C 132 128, 144 116, 160 116 Z" fill="#223A7A"/>
    <path d="M 292 114 L 292 184 L 311 168 L 330 184 L 330 114 Z" fill="#FFFFFF"/>
    <path d="M 186 258 L 212 258 L 226 230 L 245 294 L 268 190 L 290 300 L 306 244 L 320 258 L 344 258" stroke="#FFFFFF" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

export const UI_ICONS = {
  search: `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>`,
  book: `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>`,
  repeat: `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>`,
  check: `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
  chevronLeft: `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>`,
  close: `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>`
};

// Minimalist Duotone Medical Anatomies (32x32):
// Primary outline: Deep Editorial Ink (#162654)
// Secondary accent fill & clinical callout: currentColor (per-module inkHex)
export const MEDICAL_ICONS = [
  {
    key: 'heart',
    label: 'Cardio',
    defaultColor: 'crimson',
    keywords: ['cardio', 'coracao', 'coração', 'ecg', 'arritmia', 'hemodinamica', 'vascular'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.2 10.6V6.6C10.2 5.4 12.6 5.4 12.6 6.6V10" fill="currentColor" fill-opacity="0.18" stroke="#162654" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.2 9.8V6.8C15.2 4.8 17.4 3.6 20.0 4.0C22.2 4.4 23.6 5.8 23.6 7.6C23.6 8.8 21.2 8.8 21.0 7.6C20.8 6.6 19.8 6.1 18.8 6.1C17.8 6.1 17.5 6.8 17.5 7.8V9.8" stroke="#162654" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.4 12.4C13.4 10.2 9.6 10.0 7.2 12.2C4.6 14.6 4.8 18.8 7.4 22.6C10.2 26.6 14.8 28.8 17.6 28.8C20.4 28.8 24.8 25.0 26.0 20.2C27.2 15.6 25.2 11.4 21.6 10.8C19.0 10.4 16.8 11.0 15.4 12.4Z" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.8 19.2H12.4L14.4 14.4L17.0 23.4L19.2 17.4L20.6 19.2H23.6" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  },
  {
    key: 'brain',
    label: 'Neuro',
    defaultColor: 'purple',
    keywords: ['neuro', 'cerebro', 'cérebro', 'avc', 'cefaleia', 'epilepsia', 'snc'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 6.5a4.2 4.2 0 1 0 -8.2 .3a5.2 5.2 0 0 0 -3.3 7.6a5.2 5.2 0 0 0 .8 8.6a5 5 0 1 0 10.7 -.2V6.5z" fill="currentColor" fill-opacity="0.16" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 6.5a4.2 4.2 0 1 1 8.2 .3a5.2 5.2 0 0 1 3.3 7.6a5.2 5.2 0 0 1 -.8 8.6a5 5 0 1 1 -10.7 -.2V6.5z" fill="currentColor" fill-opacity="0.24" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 11c1.4 .7 2.8 1.4 3.9 .9M8.2 16c1.6 -.6 3.5 -.6 5 .4M10 21.5c1.1 -.8 2.5 -1.2 3.8 -.6" stroke="#162654" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.65"/><path d="M22.5 10.5c-1.5 .8 -3 1.8 -4.2 1.2M24 16c-1.8 -.8 -3.8 -.8 -5.5 .5M22 21.5c-1.2 -1 -2.8 -1.5 -4.2 -.8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="22.5" cy="10.5" r="1.3" fill="currentColor"/><circle cx="24" cy="16" r="1.3" fill="currentColor"/><circle cx="22" cy="21.5" r="1.3" fill="currentColor"/></svg>`
  },
  {
    key: 'endocrino',
    label: 'Endócrino',
    defaultColor: 'amber',
    keywords: ['endocrino', 'endócrino', 'tireoide', 'diabetes', 'hormonio', 'metabolismo', 'obesidade', 'adrenal'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.0 13.4C14.0 13.4 13.2 11.2 11.4 8.0C9.8 5.2 6.2 5.4 4.8 8.6C3.2 12.4 3.2 19.2 5.2 23.4C7.0 26.8 11.0 26.4 12.6 23.0C13.6 20.8 14.5 19.4 16.0 19.4C17.5 19.4 18.4 20.8 19.4 23.0C21.0 26.4 25.0 26.8 26.8 23.4C28.8 19.2 28.8 12.4 27.2 8.6C25.8 5.4 22.2 5.2 20.6 8.0C18.8 11.2 18.0 13.4 16.0 13.4Z" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.8 10.6C5.8 13.8 5.8 18.0 7.2 21.4" stroke="#162654" stroke-width="1.45" stroke-linecap="round" stroke-opacity="0.55"/><path d="M25.0 10.6C26.0 13.8 26.0 18.0 24.6 21.4M25.2 14.2L21.8 15.8M24.8 17.8L21.6 19.2" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="16.4" r="1.7" fill="currentColor"/></svg>`
  },
  {
    key: 'gastro',
    label: 'Gastro',
    defaultColor: 'orange',
    keywords: ['gastro', 'estomago', 'estômago', 'hepato', 'figado', 'fígado', 'intestino', 'digestivo', 'cirrose'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.8 3.8L11.8 8.8C11.8 12.5 14.8 14.5 14.2 17.5C13.6 20.0 10.8 20.8 8.2 19.8C6.5 19.2 5.0 20.2 4.8 22.2C4.6 24.0 5.8 25.2 7.5 25.0C9.5 24.8 11.5 26.8 15.5 26.8C22.0 26.8 26.8 21.8 26.8 14.5C26.8 8.2 23.2 5.2 19.2 5.8C17.2 6.1 16.0 7.2 15.4 8.2L15.4 3.8Z" fill="currentColor" fill-opacity="0.20" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.2 9.0C23.0 10.0 23.8 14.2 22.0 19.0" stroke="#162654" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.55"/><path d="M17.5 11.5C19.6 14.5 18.8 19.5 14.5 22.4" stroke="currentColor" stroke-width="2.0" stroke-linecap="round"/><path d="M11.5 23.2C14.8 24.4 18.5 23.4 20.8 20.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`
  },
  {
    key: 'reuma',
    label: 'Reumato',
    defaultColor: 'indigo',
    keywords: ['reuma', 'lupus', 'lúpus', 'artrite', 'autoimune', 'espondilite', 'gota', 'vasculite', 'artrologia'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.2 4.2L11.2 11.8C10.5 13.6 11.6 15.1 13.6 15.0C15.2 14.9 16.6 14.7 17.8 14.3C19.5 13.7 20.1 11.8 18.9 10.1L13.6 3.0C11.8 2.0 8.6 2.5 8.2 4.2Z" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.2 20.0C7.0 20.0 6.5 21.3 7.2 22.3L6.0 28.0C5.8 29.0 7.4 29.4 7.9 28.3L9.4 22.0C9.9 21.0 9.3 20.0 8.2 20.0Z" fill="currentColor" fill-opacity="0.16" stroke="#162654" stroke-width="1.7" stroke-linejoin="round"/><path d="M11.2 18.2C11.4 17.2 12.8 17.2 15.2 17.3C17.5 17.4 18.9 17.5 19.1 18.6C19.3 19.8 18.1 20.6 17.3 21.8L14.5 29.0C13.1 30.0 9.9 29.5 9.6 28.0L11.9 21.0C11.1 20.2 11.0 19.2 11.2 18.2Z" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.5 12.5C23.0 12.7 23.3 16.9 21.3 17.5C20.0 17.3 19.8 12.9 21.5 12.5Z" fill="#FFFFFF" stroke="#162654" stroke-width="1.8" stroke-linejoin="round"/><path d="M12.0 16.1C14.0 16.5 16.5 16.5 18.5 15.9" stroke="#C53B3B" stroke-width="2.1" stroke-linecap="round"/><path d="M24.8 12.0C26.6 14.2 26.6 17.8 24.8 20.0" stroke="#C53B3B" stroke-width="2.0" stroke-linecap="round"/><path d="M27.6 10.4C29.6 13.4 29.6 18.6 27.6 21.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`
  },
  {
    key: 'bone',
    label: 'Orto',
    defaultColor: 'emerald',
    keywords: ['orto', 'osso', 'fratura', 'trauma', 'coluna', 'joelho', 'ombro', 'musculoesqueletico', 'osteologia'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.4 8.2C4.2 6.6 5.6 3.4 8.4 3.8C10.4 4.1 11.6 5.8 11.0 7.8L15.6 11.6L13.0 13.0L14.0 14.8L11.4 16.0L7.2 12.2C5.2 12.8 3.4 12.0 2.8 10.0C2.2 7.6 4.4 6.6 6.4 8.2Z" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M25.6 24.8C27.8 26.4 26.4 29.6 23.6 29.2C21.6 28.9 20.4 27.2 21.0 25.2L16.4 20.4L19.0 19.0L18.0 17.2L20.6 16.0L24.8 20.4C26.8 19.8 28.6 20.6 29.2 22.6C29.8 25.0 27.6 26.4 25.6 24.8Z" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.2 7.6L16.8 10.4M21.6 9.6L19.0 11.4M10.4 21.6L13.0 19.8M13.8 23.6L15.2 20.8" stroke="currentColor" stroke-width="2.0" stroke-linecap="round"/></svg>`
  },
  {
    key: 'lung',
    label: 'Pneumo',
    defaultColor: 'blue',
    keywords: ['pneumo', 'pulmao', 'pulmão', 'asma', 'dpoc', 'torax', 'tórax', 'respiratorio'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 8.5c-3.5 0 -7.5 4.8 -8.2 11.5c-.5 4.8 2 6.8 5.2 6.2c2.8 -.5 3.8 -2.8 3.8 -5.5v-8.2c0 -2.4 -.3 -4 -.8 -4z" fill="currentColor" fill-opacity="0.20" stroke="#162654" stroke-width="1.9" stroke-linejoin="round"/><path d="M19.5 8.5c3.5 0 7.5 4.8 8.2 11.5c.5 4.8 -2 6.8 -5.2 6.2c-2.8 -.5 -3.8 -2.8 -3.8 -5.5v-8.2c0 -2.4 .3 -4 .8 -4z" fill="currentColor" fill-opacity="0.20" stroke="#162654" stroke-width="1.9" stroke-linejoin="round"/><path d="M16 3.5v8M16 10.5l-4.2 3.8M16 10.5l4.2 3.8M10.5 14l-2.5 2.5M9.5 15l.8 3.2M21.5 14l2.5 2.5M22.5 15l-.8 3.2" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  },
  {
    key: 'kidney',
    label: 'Nefro',
    defaultColor: 'cyan',
    keywords: ['nefro', 'rim', 'renal', 'dialise', 'diálise', 'glomerulo'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.0 3.8C9.5 3.8 5.8 8.8 5.8 16.0C5.8 23.2 9.5 28.2 16.0 28.2C19.8 28.2 22.2 26.0 21.8 22.8C21.4 20.2 16.8 19.5 16.8 16.0C16.8 12.5 21.4 11.8 21.8 9.2C22.2 6.0 19.8 3.8 16.0 3.8Z" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.8 15.2L12.5 10.8M16.8 16.0L11.5 16.0M16.8 16.8L12.5 21.2" stroke="currentColor" stroke-width="1.85" stroke-linecap="round"/><path d="M17.2 16.2C21.6 16.2 24.2 18.5 24.2 22.5L24.2 28.0" stroke="currentColor" stroke-width="2.0" stroke-linecap="round"/><path d="M26.5 12.2C23.5 12.2 21.0 13.4 17.2 14.5" stroke="#162654" stroke-width="1.85" stroke-linecap="round"/></svg>`
  },
  {
    key: 'scalpel',
    label: 'Cirurgia',
    defaultColor: 'teal',
    keywords: ['cirurgia', 'cirurgica', 'cirúrgica', 'bisturi', 'operatoria', 'abdome agudo', 'hernia', 'habilidades'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.8 11.8L24.5 4.0C25.8 2.8 28.0 3.5 28.5 5.0C28.9 6.4 28.0 7.8 26.6 9.0L18.2 15.2C17.2 15.9 15.0 12.6 15.8 11.8Z" fill="currentColor" fill-opacity="0.20" stroke="#162654" stroke-width="1.85" stroke-linejoin="round"/><path d="M13.8 13.6L3.8 21.8C7.5 22.8 12.2 21.2 15.2 18.0L16.0 16.8C16.4 16.2 14.5 13.0 13.8 13.6Z" fill="currentColor" fill-opacity="0.34" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.0 26.2H23.0M9.5 24.0L10.8 28.4M14.2 24.0L15.5 28.4M18.9 24.0L20.2 28.4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`
  },
  {
    key: 'gineco',
    label: 'Gineco/GO',
    defaultColor: 'rose',
    keywords: ['gineco', 'obstetricia', 'obstetrícia', 'go', 'gestante', 'gravidez', 'parto', 'pre-natal', 'utero', 'útero', 'mama', 'mastologia'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.0 10.5C13.2 8.0 18.8 8.0 21.0 10.5C22.0 13.5 19.5 18.0 18.4 21.8L18.0 27.2C18.0 28.4 14.0 28.4 14.0 27.2L13.6 21.8C12.5 18.0 10.0 13.5 11.0 10.5Z" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.9" stroke-linejoin="round"/><path d="M13.5 12.2Q16.0 11.6 18.5 12.2L16.4 19.0L16.0 24.5L15.6 19.0Z" fill="currentColor" fill-opacity="0.32" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9.0 10.2C5.8 9.2 3.2 10.8 3.2 14.2C3.2 15.6 3.8 16.8 4.8 17.5M23.0 10.2C26.2 9.2 28.8 10.8 28.8 14.2C28.8 15.6 28.2 16.8 27.2 17.5" stroke="#162654" stroke-width="1.9" stroke-linecap="round"/><circle cx="7.2" cy="15.5" r="2.0" fill="currentColor" fill-opacity="0.32" stroke="currentColor" stroke-width="1.65"/><circle cx="24.8" cy="15.5" r="2.0" fill="currentColor" fill-opacity="0.32" stroke="currentColor" stroke-width="1.65"/></svg>`
  },
  {
    key: 'baby',
    label: 'Pediatria',
    defaultColor: 'amber',
    keywords: ['pediatria', 'ped', 'bebe', 'bebê', 'crianca', 'criança', 'neonatologia', 'neo', 'puericultura'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.8 14.2C4.8 14.2 4.2 16.4 4.8 18.0C5.4 19.4 6.8 19.6 7.6 18.8M25.2 14.2C27.2 14.2 27.8 16.4 27.2 18.0C26.6 19.4 25.2 19.6 24.4 18.8" stroke="#162654" stroke-width="1.85" stroke-linecap="round"/><circle cx="16" cy="16.4" r="9.2" fill="currentColor" fill-opacity="0.20" stroke="#162654" stroke-width="1.9"/><path d="M15.2 7.2C14.8 4.4 17.8 3.4 19.2 5.4C20.2 6.8 18.8 8.8 16.8 8.6" stroke="#162654" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.0 14.6Q12.5 13.0 14.0 14.6M18.0 14.6Q19.5 13.0 21.0 14.6" stroke="#162654" stroke-width="1.8" stroke-linecap="round"/><rect x="11.6" y="17.8" width="8.8" height="5.0" rx="2.5" fill="currentColor" fill-opacity="0.35" stroke="currentColor" stroke-width="1.8"/><circle cx="16" cy="20.3" r="1.3" fill="#FFFFFF"/></svg>`
  },
  {
    key: 'blood',
    label: 'Hemato',
    defaultColor: 'crimson',
    keywords: ['hemato', 'sangue', 'anemia', 'leucemia', 'linfoma', 'coagulacao'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4l7.2 8.8a9.8 9.8 0 1 1 -14.4 0L16 4z" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 15.2v6M13 18.2h6" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>`
  },
  {
    key: 'virus',
    label: 'Infecto',
    defaultColor: 'emerald',
    keywords: ['infecto', 'virus', 'vírus', 'bacteria', 'bactéria', 'antibiotico', 'hiv', 'dengue', 'sepse', 'parasito'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4.5v4.2M16 23.3v4.2M4.5 16h4.2M23.3 16h4.2M7.8 7.8l3 3M21.2 21.2l3 3M24.2 7.8l-3 3M10.8 21.2l-3 3" stroke="#162654" stroke-width="1.9" stroke-linecap="round"/><circle cx="16" cy="16" r="7.2" fill="currentColor" fill-opacity="0.20" stroke="#162654" stroke-width="1.9"/><circle cx="16" cy="16" r="3.4" fill="currentColor" fill-opacity="0.35" stroke="currentColor" stroke-width="1.75"/><circle cx="16" cy="4" r="1.5" fill="currentColor"/><circle cx="16" cy="28" r="1.5" fill="currentColor"/><circle cx="4" cy="16" r="1.5" fill="currentColor"/><circle cx="28" cy="16" r="1.5" fill="currentColor"/></svg>`
  },
  {
    key: 'psiq',
    label: 'Psiquiatria',
    defaultColor: 'indigo',
    keywords: ['psiq', 'psiquiatria', 'mental', 'depressao', 'depressão', 'ansiedade', 'psicose', 'bipolar'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 28.0V24.5C7.5 22.0 9.2 20.5 11.5 20.0V18.2C8.2 16.8 6.5 13.6 6.8 9.8C7.2 5.2 11.4 2.8 16.5 2.8C21.8 2.8 25.2 5.6 25.2 10.5C25.2 11.8 24.8 12.8 24.2 13.8L26.2 16.6C26.7 17.3 26.2 18.2 25.3 18.2H23.8V20.5C23.8 22.4 22.4 23.6 20.5 23.6H18.0V28.0" fill="currentColor" fill-opacity="0.20" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.2 8.8C12.2 11.8 13.8 13.2 16.0 13.2C18.2 13.2 19.8 11.8 19.8 8.8M16.0 7.0V16.8M13.6 16.8H18.4" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  },
  {
    key: 'skin',
    label: 'Dermato',
    defaultColor: 'orange',
    keywords: ['dermato', 'pele', 'cutaneo', 'cutâneo', 'melanoma', 'acne', 'hanseniase'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 16.8C8.0 15.6 11.5 17.8 15.5 16.8C19.5 15.8 23.5 17.5 27.5 16.5V25.2C27.5 26.8 26.2 28.0 24.5 28.0H7.5C5.8 28.0 4.5 26.8 4.5 25.2V16.8Z" fill="currentColor" fill-opacity="0.20" stroke="#162654" stroke-width="1.9" stroke-linejoin="round"/><path d="M4.8 21.4C7.8 20.4 10.2 22.4 13.2 21.4C16.2 20.4 19.0 22.4 22.0 21.4C24.5 20.6 26.0 21.6 27.2 21.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M13.6 4.8C11.5 8.5 10.6 13.2 11.0 22.4C9.6 23.2 9.4 25.4 11.3 25.8C13.2 25.4 13.0 23.2 11.6 22.4" fill="#FFFFFF" stroke="#162654" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"/><circle cx="21.0" cy="10.0" r="4.4" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.9"/><path d="M24.2 13.2L27.8 16.8" stroke="#162654" stroke-width="2.1" stroke-linecap="round"/></svg>`
  },
  {
    key: 'uro',
    label: 'Urologia',
    defaultColor: 'cyan',
    keywords: ['uro', 'bexiga', 'prostata', 'próstata', 'litiase', 'litíase', 'urinario'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.8 4.4C5.8 4.4 4.0 7.0 4.0 9.8C4.0 12.6 5.8 15.2 8.8 15.2C10.6 15.2 11.4 13.8 10.6 12.4C10.0 11.4 9.2 10.6 9.2 9.8C9.2 9.0 10.0 8.2 10.6 7.2C11.4 5.8 10.6 4.4 8.8 4.4Z" fill="currentColor" fill-opacity="0.20" stroke="#162654" stroke-width="1.85" stroke-linejoin="round"/><path d="M23.2 4.4C26.2 4.4 28.0 7.0 28.0 9.8C28.0 12.6 26.2 15.2 23.2 15.2C21.4 15.2 20.6 13.8 21.4 12.4C22.0 11.4 22.8 10.6 22.8 9.8C22.8 9.0 22.0 8.2 21.4 7.2C20.6 5.8 21.4 4.4 23.2 4.4Z" fill="currentColor" fill-opacity="0.20" stroke="#162654" stroke-width="1.85" stroke-linejoin="round"/><path d="M11.6 10.2C13.2 11.5 13.5 14.8 13.6 18.0M20.4 10.2C18.8 11.5 18.5 14.8 18.4 18.0" stroke="currentColor" stroke-width="1.95" stroke-linecap="round"/><path d="M11.0 20.4C13.6 19.6 18.4 19.6 21.0 20.4C22.6 21.0 22.8 23.5 21.0 25.4C19.6 26.8 17.8 27.5 16.0 27.6C14.2 27.5 12.4 26.8 11.0 25.4C9.2 23.5 9.4 21.0 11.0 20.4Z" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.9" stroke-linejoin="round"/><path d="M16.0 27.6V29.6" stroke="#162654" stroke-width="1.9" stroke-linecap="round"/></svg>`
  },
  {
    key: 'stethoscope',
    label: 'Clínica',
    defaultColor: 'emerald',
    keywords: ['clinica', 'clínica', 'semiologia', 'propedeutica', 'medicina interna', 'preventiva', 'sus', 'saude coletiva'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5.5H6.5a2.5 2.5 0 0 0 -2.5 2.5v4.5a7.5 7.5 0 0 0 15 0V8a2.5 2.5 0 0 0 -2.5 -2.5H15" stroke="#162654" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 20a7.5 7.5 0 0 0 15 0v-4.5" stroke="#162654" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"/><circle cx="26.5" cy="13" r="3.3" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.95"/><circle cx="26.5" cy="13" r="1.1" fill="#162654"/></svg>`
  },
  {
    key: 'emergency',
    label: 'Emergência',
    defaultColor: 'crimson',
    keywords: ['emergencia', 'emergência', 'urgencia', 'urgência', 'uti', 'terapia intensiva', 'plantao', 'atls', 'acls'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4.5" y="4.5" width="23" height="23" rx="6.5" fill="currentColor" fill-opacity="0.16" stroke="#162654" stroke-width="1.9"/><path d="M13.5 9.2h5v4.3h4.3v5h-4.3v4.3h-5v-4.3H9.2v-5h4.3V9.2z" fill="currentColor" fill-opacity="0.32" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>`
  },
  {
    key: 'dna',
    label: 'Genética',
    defaultColor: 'purple',
    keywords: ['genetica', 'genética', 'dna', 'biologia', 'molecular', 'imuno', 'imunologia'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="11" y1="7.5" x2="21" y2="7.5" stroke="#162654" stroke-width="1.65" stroke-linecap="round" stroke-opacity="0.6"/><line x1="12.5" y1="11" x2="19.5" y2="11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="12.5" y1="21" x2="19.5" y2="21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="11" y1="24.5" x2="21" y2="24.5" stroke="#162654" stroke-width="1.65" stroke-linecap="round" stroke-opacity="0.6"/><path d="M9 4c0 6.5 14 6.5 14 12s-14 5.5 -14 12" stroke="#162654" stroke-width="2.0" stroke-linecap="round"/><path d="M23 4c0 6.5 -14 6.5 -14 12s14 5.5 14 12" stroke="currentColor" stroke-width="2.0" stroke-linecap="round"/></svg>`
  },
  {
    key: 'pill',
    label: 'Farmaco',
    defaultColor: 'blue',
    keywords: ['farmaco', 'fármaco', 'medicamento', 'terapeutica', 'toxicologia'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 16.5l10 -10a6.5 6.5 0 1 1 9.2 9.2l-10 10a6.5 6.5 0 1 1 -9.2 -9.2z" fill="currentColor" fill-opacity="0.14" stroke="#162654" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 11.5l5 -5a6.5 6.5 0 1 1 9.2 9.2l-5 5z" fill="currentColor" fill-opacity="0.32"/><path d="M11.5 11.5l9.2 9.2" stroke="#162654" stroke-width="1.95" stroke-linecap="round"/></svg>`
  },
  {
    key: 'microscope',
    label: 'Patologia',
    defaultColor: 'teal',
    keywords: ['patologia', 'histologia', 'anatomia patologica', 'biopsia', 'laboratorio'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 14.5l4 4l8 -8l-4 -4z" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 4.5l4 4M16 27.5a8 8 0 0 0 5 -14.2" stroke="#162654" stroke-width="1.95" stroke-linecap="round"/><path d="M14 16.5l-2.2 2.2M7 21h9" stroke="currentColor" stroke-width="2.0" stroke-linecap="round"/><path d="M6 27.5h20M10 23.5v4" stroke="#162654" stroke-width="1.95" stroke-linecap="round"/></svg>`
  },
  {
    key: 'eye',
    label: 'Oftalmo',
    defaultColor: 'cyan',
    keywords: ['oftalmo', 'olho', 'visao', 'visão', 'retina', 'glaucoma', 'catarata'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 16c3.2 -6.5 7.8 -9.8 13 -9.8s9.8 3.3 13 9.8c-3.2 6.5 -7.8 9.8 -13 9.8S6.2 22.5 3 16z" fill="currentColor" fill-opacity="0.18" stroke="#162654" stroke-width="1.9" stroke-linejoin="round"/><circle cx="16" cy="16" r="4.8" fill="currentColor" fill-opacity="0.32" stroke="currentColor" stroke-width="1.9"/><circle cx="16" cy="16" r="1.9" fill="#162654"/></svg>`
  },
  {
    key: 'ear',
    label: 'Otorrino',
    defaultColor: 'amber',
    keywords: ['otorrino', 'ouvido', 'nariz', 'garganta', 'laringe', 'sinusite', 'otite'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 13.5a8 8 0 1 1 15 3.8c-1 2.2 -2.4 3.6 -3 5.6a4.6 4.6 0 0 1 -8.6 .6" fill="currentColor" fill-opacity="0.18" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.2 13.5a3.5 3.5 0 0 1 5.5 2.6c0 2 -2 2.8 -2.8 4.2" stroke="currentColor" stroke-width="2.0" stroke-linecap="round"/><path d="M25.5 11.5c1.5 2.2 1.5 5.2 0 7.4" stroke="currentColor" stroke-width="1.85" stroke-linecap="round"/></svg>`
  },
  {
    key: 'onco',
    label: 'Oncologia',
    defaultColor: 'rose',
    keywords: ['onco', 'cancer', 'câncer', 'tumor', 'neoplasia', 'quimioterapia'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 19.5l-6 8M16 19.5l6 8M16 19.5l-4.8 -6a6 6 0 1 1 9.6 0L16 19.5z" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="11.2" r="2.3" fill="currentColor"/></svg>`
  },
  {
    key: 'geriatria',
    label: 'Geriatria',
    defaultColor: 'teal',
    keywords: ['geriatria', 'idoso', 'envelhecimento', 'demencia', 'paliativo'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="13.2" cy="7.2" r="3.2" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.85"/><path d="M10.5 12.2C7.8 12.8 6.5 15.8 7.2 19.5L8.2 27.5C8.4 28.6 11.6 28.6 11.8 27.5L12.6 20.8L15.2 27.5C15.6 28.6 18.2 28.2 17.8 26.8L15.5 19.5V15.6L19.5 16.5C20.8 16.8 21.4 15.0 20.0 14.4L15.0 12.6C13.6 12.0 11.8 11.9 10.5 12.2Z" fill="currentColor" fill-opacity="0.20" stroke="#162654" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.8 15.5C19.8 13.2 23.6 13.2 23.6 15.8V28.2" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/><path d="M22.2 28.4H25.0" stroke="#162654" stroke-width="2.0" stroke-linecap="round"/><path d="M24.5 10.8L22.2 8.4A1.6 1.6 0 0 1 24.5 6.2A1.6 1.6 0 0 1 26.8 8.4L24.5 10.8Z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`
  },
  {
    key: 'anestesia',
    label: 'Anestesia',
    defaultColor: 'indigo',
    keywords: ['anestesia', 'anestesiologia', 'sedacao', 'bloqueio', 'dor'],
    svg: `<svg viewBox="0 0 32 32" class="med-svg" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.5 4.5l4 4M25.5 6.5l-2.5 2.5M19 9l4 4L12 24H8v-4L19 9z" fill="currentColor" fill-opacity="0.22" stroke="#162654" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 24l-3.5 3.5" stroke="currentColor" stroke-width="2.0" stroke-linecap="round"/><path d="M15 13l2.4 2.4M12.2 15.8l2.4 2.4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`
  }
];

export const QUICK_SPECIALTY_PRESETS = [
  { name: 'Cardiologia', short: 'Cardio', icon: 'heart', color: 'crimson' },
  { name: 'Gastroenterologia', short: 'Gastro', icon: 'gastro', color: 'orange' },
  { name: 'Endocrinologia', short: 'Endócrino', icon: 'endocrino', color: 'crimson' },
  { name: 'Reumatologia', short: 'Reumato', icon: 'reuma', color: 'indigo' },
  { name: 'Ginecologia / GO', short: 'Gineco/GO', icon: 'gineco', color: 'rose' },
  { name: 'Cirurgia Geral', short: 'Cirurgia', icon: 'scalpel', color: 'teal' },
  { name: 'Neurologia', short: 'Neuro', icon: 'brain', color: 'purple' },
  { name: 'Ortopedia', short: 'Orto', icon: 'bone', color: 'emerald' },
  { name: 'Pneumologia', short: 'Pneumo', icon: 'lung', color: 'blue' },
  { name: 'Pediatria', short: 'Pediatria', icon: 'baby', color: 'amber' },
  { name: 'Nefrologia', short: 'Nefro', icon: 'kidney', color: 'cyan' },
  { name: 'Infectologia', short: 'Infecto', icon: 'virus', color: 'emerald' }
];

export function getMedicalIconSvg(iconKey) {
  const canonical = canonicalizeIconKey(iconKey);
  const iconObj = MEDICAL_ICONS.find((i) => i.key === canonical) || MEDICAL_ICONS[0];
  return iconObj.svg;
}

export function matchSpecialtyByName(rawQuery) {
  const query = normalizeText(rawQuery);
  if (query.length < 2) return null;

  return (
    MEDICAL_ICONS.find((item) => {
      const labelNorm = normalizeText(item.label);
      if (labelNorm.includes(query) || query.includes(labelNorm)) return true;
      if (Array.isArray(item.keywords)) {
        return item.keywords.some((kw) => {
          const kwNorm = normalizeText(kw);
          return kwNorm.length >= 2 && (query.includes(kwNorm) || kwNorm.startsWith(query));
        });
      }
      return false;
    }) || null
  );
}
