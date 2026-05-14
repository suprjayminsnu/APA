/* global React */
/* Icons component — Feather-style SVG icons */

const ICONS = {
  search: (s) => <><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>,
  'map-pin': (s) => <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
  'arrow-right': (s) => <><path d="M5 12h14M13 5l7 7-7 7"/></>,
  'arrow-up-right': (s) => <><path d="M7 17L17 7M9 7h8v8"/></>,
  menu: (s) => <><path d="M3 7h18M3 12h18M3 17h18"/></>,
  x: (s) => <><path d="M18 6L6 18M6 6l12 12"/></>,
  check: (s) => <><polyline points="20 6 9 12 4 10"/></>,
  'shield-check': (s) => <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>,
  clock: (s) => <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  eye: (s) => <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  lock: (s) => <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  users: (s) => <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  mountain: (s) => <><polygon points="3 17 9 5 15 17"/><polyline points="13 17 17 9 21 17"/></>,
  plus: (s) => <><path d="M12 5v14M5 12h14"/></>,
  'chevron-down': (s) => <><polyline points="6 9 12 15 18 9"/></>,
  'chevron-right': (s) => <><polyline points="9 18 15 12 9 6"/></>,
  filter: (s) => <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  star: (s) => <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  phone: (s) => <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.18 9.8a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.11 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></>,
  globe: (s) => <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
  mail: (s) => <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  upload: (s) => <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
  'log-out': (s) => <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  'log-in': (s) => <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>,
  user: (s) => <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  building: (s) => <><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></>,
  'alert-circle': (s) => <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  info: (s) => <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  'external-link': (s) => <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
};

function Icon({ name, size = 16, stroke = 2, color = 'currentColor', style = {} }) {
  const paths = ICONS[name];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size} height={size}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {paths ? paths(stroke) : null}
    </svg>
  );
}

function BrandMark({ size = 32 }) {
  return (
    <svg viewBox="0 0 64 40" width={size * 1.6} height={size} aria-label="이음 로고">
      <circle cx="20" cy="20" r="18" fill="#CF4500"/>
      <circle cx="40" cy="20" r="18" fill="#F37338" fillOpacity="0.95"/>
      <path d="M30 6.5 a18 18 0 0 1 0 27 a18 18 0 0 1 0 -27 z" fill="#9A3A0A"/>
    </svg>
  );
}

window.Icon = Icon;
window.BrandMark = BrandMark;
