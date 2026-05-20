// Driver app prototype — expanding header pill + draggable bottom sheet over map
const { useState, useRef, useEffect, useCallback } = React;

// ─────────────────────────────────────────────────────────────
// Tokens (from figma)
// ─────────────────────────────────────────────────────────────
const C = {
  ink: 'rgb(24,12,32)',
  inkMuted: 'rgb(92,83,98)',
  inkSubtle: 'rgb(154,148,158)',
  hairline: 'rgb(243,243,244)',
  green: 'rgb(3,135,103)',
  blue: 'rgb(0,147,237)',
  blueHalo: 'rgb(184,213,238)',
  surface: 'rgb(255,255,255)',
  shadow: 'rgba(24,12,32,0.15)',
  scrim: 'rgba(24,12,32,0.35)',
};

const FONT = `'Euclid Circular A', -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', system-ui, sans-serif`;

// ─────────────────────────────────────────────────────────────
// Icons (lifted from figma vectors → SVG)
// ─────────────────────────────────────────────────────────────
const IconHamburger = ({ size = 24, color = C.inkMuted }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="1.5" y="5"  width="21" height="2" fill={color} />
    <rect x="1.5" y="11" width="21" height="2" fill={color} />
    <rect x="1.5" y="17" width="21" height="2" fill={color} />
  </svg>
);

const IconFilter = ({ size = 24, color = C.inkMuted }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <line x1="3" y1="7"  x2="21" y2="7"  stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="3" y1="17" x2="21" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="9"  cy="7"  r="3" fill={C.surface} stroke={color} strokeWidth="2" />
    <circle cx="16" cy="17" r="3" fill={C.surface} stroke={color} strokeWidth="2" />
  </svg>
);

const IconStar = ({ size = 12, color = C.inkMuted }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2l2.92 6.26L21.6 9.27l-4.9 4.78 1.16 6.76L12 17.6l-6.86 3.21 1.16-6.76L1.4 9.27l6.68-1.01L12 2z" />
  </svg>
);

const IconChevron = ({ size = 24, color = C.inkMuted }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconInfo = ({ size = 20, color = C.inkMuted }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.5" />
    <circle cx="12" cy="8" r="1" fill={color} />
    <line x1="12" y1="11" x2="12" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconEllipsis = ({ size = 24, color = C.inkMuted }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <circle cx="6"  cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="18" cy="12" r="1.6" />
  </svg>
);

const IconClose = ({ size = 24, color = C.inkMuted }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const LoadingIndicator = ({ size = 'md', surface = 'default' }) => {
  const sizePx = size === 'sm' ? 16 : size === 'lg' ? 24 : size === 'xl' ? 40 : 20;
  const rem = sizePx / 16;
  const dot = rem / 2.5;
  const travel = rem - dot;
  const color = surface === 'inverse' ? '#fff' : C.ink;
  return (
    <div style={{
      boxSizing: 'border-box',
      position: 'relative',
      width: `${rem}rem`,
      height: `${rem}rem`,
      flexShrink: 0,
    }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{
          boxSizing: 'border-box',
          position: 'absolute',
          inset: 0,
          opacity: [1, 0.7, 0.5, 0.3][i],
          transform: `rotate(${i * 90}deg)`,
        }}>
          <div style={{
            position: 'absolute',
            width: `${dot}rem`,
            height: `${dot}rem`,
            borderRadius: '50%',
            left: 0,
            top: 0,
            backgroundColor: color,
            animationName: 'loadingIndicatorSlide',
            animationDuration: '3s',
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
            animationDelay: '-525ms',
            animationFillMode: 'both',
            ['--loading-indicator-travel']: `${travel}rem`,
          }} />
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// iOS status bar (light variant)
// ─────────────────────────────────────────────────────────────
const StatusBar = ({ compact = false }) => compact ? null : (
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0, height: 44, zIndex: 60,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', pointerEvents: 'none',
    fontFamily: FONT, color: C.ink,
  }}>
    <span style={{ fontWeight: 600, fontSize: 15, marginTop: 4 }}>9:41</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
      {/* signal */}
      <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
        <rect x="0"  y="8" width="3" height="4" rx="0.5"/>
        <rect x="5"  y="6" width="3" height="6" rx="0.5"/>
        <rect x="10" y="3" width="3" height="9" rx="0.5"/>
        <rect x="15" y="0" width="3" height="12" rx="0.5"/>
      </svg>
      {/* wifi */}
      <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
        <path d="M8.5 2C5.4 2 2.6 3.2.5 5.1l1.4 1.4C3.7 4.9 6 4 8.5 4s4.8.9 6.6 2.5l1.4-1.4C14.4 3.2 11.6 2 8.5 2zm0 4c-1.9 0-3.7.7-5.1 1.9l1.4 1.4c1-.9 2.3-1.3 3.7-1.3s2.7.4 3.7 1.3l1.4-1.4C12.2 6.7 10.4 6 8.5 6zm0 4c-.7 0-1.4.3-1.9.8l1.9 1.9 1.9-1.9c-.5-.5-1.2-.8-1.9-.8z"/>
      </svg>
      {/* battery */}
      <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
        <rect x="0.5" y="0.5" width="22" height="12" rx="2.5" stroke="currentColor" opacity="0.4"/>
        <rect x="2" y="2" width="19" height="9" rx="1.5" fill="currentColor"/>
        <rect x="24" y="4.5" width="1.5" height="4" rx="0.75" fill="currentColor" opacity="0.4"/>
      </svg>
    </span>
  </div>
);

const HomeIndicator = ({ compact = false }) => compact ? null : (
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 34, zIndex: 60,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8,
    pointerEvents: 'none',
  }}>
    <div style={{ width: 134, height: 5, borderRadius: 3, background: C.ink }} />
  </div>
);

// ─────────────────────────────────────────────────────────────
// The map (image asset from figma)
// ─────────────────────────────────────────────────────────────
// Retailers around Denver with simulated demand multipliers
const STORES = [
  { name: 'Safeway',                 brand: 'safeway',  lat: 39.7380, lng: -104.9880, demand: 1.0, address: '757 E 20th Ave', hours: [{ days: 'Every day', time: '6am – 11pm' }] },
  { name: 'Target',                  brand: 'target',   lat: 39.7486, lng: -104.9955, demand: 1.2, address: '1600 California St', hours: [{ days: 'Mon–Sun', time: '8am – 10pm' }] },
  { name: 'King Soopers',            brand: 'kings',    lat: 39.7287, lng: -104.9879, demand: 1.1, address: '1155 E 9th Ave', hours: [{ days: 'Every day', time: '6am – 11pm' }] },
  { name: 'Michaels',                brand: 'michaels',  lat: 39.7162, lng: -104.9531, demand: 0.7, address: '300 S Colorado Blvd', hours: [{ days: 'Mon–Sat', time: '9am – 9pm' }, { days: 'Sun', time: '10am – 7pm' }] },
  { name: 'Walgreens',               brand: 'walgreens', lat: 39.7399, lng: -104.9849, demand: 0.85, address: '950 17th St', hours: [{ days: 'Every day', time: '7am – 10pm' }] },
  { name: 'CVS',                     brand: 'cvs',      lat: 39.7510, lng: -104.9950, demand: 0.8, address: '1600 Broadway', hours: [{ days: 'Every day', time: '8am – 9pm' }] },
  { name: 'PetSmart',                brand: 'petsmart', lat: 39.6810, lng: -104.9870, demand: 0.6, address: '4982 S Broadway', hours: [{ days: 'Every day', time: '9am – 9pm' }] },
  { name: 'Office Depot OfficeMax',  brand: 'office',   lat: 39.7077, lng: -104.9731, demand: 0.5, address: '780 S Colorado Blvd', hours: [{ days: 'Mon–Sat', time: '8am – 8pm' }, { days: 'Sun', time: '10am – 6pm' }] },
  { name: 'Petco',                   brand: 'petco',    lat: 39.7426, lng: -104.9998, demand: 0.55, address: '2000 W 15th St', hours: [{ days: 'Every day', time: '9am – 8pm' }] },
  { name: '7-Eleven',                brand: 'seven',    lat: 39.7608, lng: -104.9867, demand: 0.4, address: '1400 Speer Blvd', hours: [{ days: 'Every day', time: '24 hours' }] },
  { name: "Lowe's",                  brand: 'lowes',    lat: 39.6501, lng: -104.9878, demand: 0.75, address: '3700 E Evans Ave', hours: [{ days: 'Mon–Sat', time: '6am – 10pm' }, { days: 'Sun', time: '8am – 8pm' }] },
  { name: 'Ulta Beauty at Target',    brand: 'ulta',     lat: 39.7560, lng: -104.9980, demand: 0.65, address: '500 16th St Mall', hours: [{ days: 'Mon–Sun', time: '10am – 8pm' }] },
  { name: "Carter's",                brand: 'carters',   lat: 39.6040, lng: -105.0900, demand: 0.45, address: '8505 Park Meadows Center Dr', hours: [{ days: 'Mon–Sat', time: '10am – 9pm' }, { days: 'Sun', time: '11am – 6pm' }] },
  { name: 'Safeway',                 brand: 'safeway',  lat: 39.7345, lng: -104.8612, demand: 0.95, address: '6100 E 1st Ave', hours: [{ days: 'Every day', time: '6am – 11pm' }] },
  { name: 'King Soopers',            brand: 'kings',    lat: 39.7098, lng: -104.8478, demand: 0.9, address: '5000 E Hampden Ave', hours: [{ days: 'Every day', time: '6am – 11pm' }] },
  { name: 'Target',                  brand: 'target',   lat: 39.6871, lng: -104.8293, demand: 1.05, address: '14500 E Colfax Ave', hours: [{ days: 'Mon–Sun', time: '8am – 10pm' }] },
  { name: 'Walgreens',               brand: 'walgreens', lat: 39.7259, lng: -104.8058, demand: 0.72, address: '1900 S Havana St', hours: [{ days: 'Every day', time: '7am – 10pm' }] },
  { name: 'CVS',                     brand: 'cvs',      lat: 39.7408, lng: -104.8015, demand: 0.68, address: '5001 S Parker Rd', hours: [{ days: 'Every day', time: '8am – 9pm' }] },
  { name: 'PetSmart',                brand: 'petsmart', lat: 39.6567, lng: -104.8129, demand: 0.55, address: '7985 E Mississippi Ave', hours: [{ days: 'Every day', time: '9am – 9pm' }] },
  { name: 'Office Depot OfficeMax',  brand: 'office',   lat: 39.6904, lng: -104.8065, demand: 0.48, address: '1600 S Abilene St', hours: [{ days: 'Mon–Sat', time: '8am – 8pm' }, { days: 'Sun', time: '10am – 6pm' }] },
  { name: 'Petco',                   brand: 'petco',    lat: 39.7390, lng: -104.7830, demand: 0.52, address: '6310 S Parker Rd', hours: [{ days: 'Every day', time: '9am – 8pm' }] },
  { name: '7-Eleven',                brand: 'seven',    lat: 39.7157, lng: -104.7902, demand: 0.42, address: '1150 S Havana St', hours: [{ days: 'Every day', time: '24 hours' }] },
  { name: "Lowe's",                  brand: 'lowes',    lat: 39.6819, lng: -104.8084, demand: 0.73, address: '2500 S Parker Rd', hours: [{ days: 'Mon–Sat', time: '6am – 10pm' }, { days: 'Sun', time: '8am – 8pm' }] },
  { name: 'Ulta Beauty at Target',    brand: 'ulta',     lat: 39.6638, lng: -104.8461, demand: 0.6, address: '2400 S Colorado Blvd', hours: [{ days: 'Mon–Sun', time: '10am – 8pm' }] },
  { name: "Carter's",                brand: 'carters',   lat: 39.7182, lng: -104.7936, demand: 0.44, address: '14300 E Alameda Ave', hours: [{ days: 'Mon–Sat', time: '10am – 9pm' }, { days: 'Sun', time: '11am – 6pm' }] },
  { name: 'Safeway',                 brand: 'safeway',  lat: 39.7495, lng: -104.7679, demand: 0.92, address: '2500 S Parker Rd', hours: [{ days: 'Every day', time: '6am – 11pm' }] },
  { name: 'King Soopers',            brand: 'kings',    lat: 39.6536, lng: -104.7846, demand: 0.89, address: '10550 E Garden Dr', hours: [{ days: 'Every day', time: '6am – 11pm' }] },
  { name: 'Target',                  brand: 'target',   lat: 39.6068, lng: -104.7086, demand: 1.08, address: '6767 S Clinton St', hours: [{ days: 'Mon–Sun', time: '8am – 10pm' }] },
  { name: 'Walgreens',               brand: 'walgreens', lat: 39.7037, lng: -104.7485, demand: 0.7, address: '10401 E Arapahoe Rd', hours: [{ days: 'Every day', time: '7am – 10pm' }] },
  { name: 'CVS',                     brand: 'cvs',      lat: 39.6377, lng: -104.7480, demand: 0.66, address: '7340 E Arapahoe Rd', hours: [{ days: 'Every day', time: '8am – 9pm' }] },
  { name: 'PetSmart',                brand: 'petsmart', lat: 39.5728, lng: -104.7144, demand: 0.58, address: '6464 S Quebec St', hours: [{ days: 'Every day', time: '9am – 9pm' }] },
  { name: 'Office Depot OfficeMax',  brand: 'office',   lat: 39.7499, lng: -104.7312, demand: 0.49, address: '5600 S Quebec St', hours: [{ days: 'Mon–Sat', time: '8am – 8pm' }, { days: 'Sun', time: '10am – 6pm' }] },
];

const BRAND_COLORS = {
  target: '#cc0000',
  safeway: '#d61f26',
  kings: '#e5252a',
  michaels: '#d91f26',
  walgreens: '#e31837',
  cvs: '#d11f1f',
  petsmart: '#0054a6',
  office: '#b90000',
  petco: '#103a8c',
  seven: '#ef7d00',
  lowes: '#004990',
  ulta: '#f26b21',
  carters: '#009ddc',
};

// haversine distance in km between two lat/lng pairs
function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = (bLat - aLat) * Math.PI / 180;
  const dLng = (bLng - aLng) * Math.PI / 180;
  const aa = Math.sin(dLat/2) ** 2 +
    Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) *
    Math.sin(dLng/2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(aa));
}

// color from gradient based on demand norm (0..1) and online state
const BLUYI = ['#f7feae', '#b7e6a5', '#7ccba2', '#46aea0', '#089099', '#00718b', '#045275'];

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const parts = value.length === 3
    ? value.split('').map(ch => parseInt(ch + ch, 16))
    : [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16));
  return parts;
}

function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function interpolateGradient(colors, t) {
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (colors.length - 1);
  const idx = Math.floor(scaled);
  const localT = scaled - idx;
  if (idx >= colors.length - 1) return colors[colors.length - 1];
  const start = hexToRgb(colors[idx]);
  const end = hexToRgb(colors[idx + 1]);
  return rgbToHex([
    Math.round(lerp(start[0], end[0], localT)),
    Math.round(lerp(start[1], end[1], localT)),
    Math.round(lerp(start[2], end[2], localT)),
  ]);
}

function demandColor(norm, online) {
  if (!online) return 'rgb(120,124,138)';
  return interpolateGradient(BLUYI, norm);
}

function heatColor(norm) {
  const exponent = DEMO_CONFIG.map.colorExponent ?? 1;
  return interpolateGradient(BLUYI, Math.pow(Math.max(0, Math.min(1, norm)), exponent));
}

const DEMO_CONFIG = window.DEMO_CONFIG || {
  storeDemand: {},
  map: {
    driverVariance: 0.18,
    driverBase: 0.9,
    demandBias: 0.18,
    smoothingRadius: 1,
    colorStops: ['#f7feae', '#f2c14e', '#f28e2b', '#d95d39', '#b30059'],
    colorExponent: 0.72,
    onlineFillMin: 0.16,
    onlineFillMax: 0.58,
    offlineFillMin: 0.05,
    offlineFillMax: 0.12,
  },
};

const HEAT_DEMAND_THRESHOLD = 0.5;

function cellHash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function driverLoadForCell(cell, norm) {
  const base = DEMO_CONFIG.map.driverBase;
  const variance = DEMO_CONFIG.map.driverVariance;
  const noise = cellHash(cell);
  return Math.max(0.15, base + (noise - 0.5) * 2 * variance + norm * 0.35);
}

function storeDemandFor(store) {
  return DEMO_CONFIG.storeDemand[store.name] ?? store.demand ?? 1;
}

// SVG shopping basket icon (simple, clean)
const BASKET_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18l-2 13H5L3 6z"/><path d="M8 6V4a4 4 0 0 1 8 0v2"/></svg>`;

function buildStoreIcon(store, norm, online, selected = false, animClass = '', demand = 1) {
  if (!window.L) return null;
  const color = demandColor(norm, online);
  const size = selected ? 38 : 28;
  const shadow = selected
    ? '0 4px 14px rgba(24,12,32,0.35)'
    : '0 2px 6px rgba(24,12,32,0.25)';
  const border = selected ? '2.5px solid white' : '2px solid white';
  return window.L.divIcon({
    className: 'driver-store',
    html: `
      <div class="${animClass}" style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};color:white;
          display:flex;align-items:center;justify-content:center;
          box-shadow:${shadow};border:${border};
          transition:width 0.18s ease,height 0.18s ease;">${BASKET_SVG}</div>
        <div style="
          margin-top:3px;padding:2px 6px;border-radius:99px;
          background:${selected ? 'rgb(24,12,32)' : 'rgba(255,255,255,0.92)'};
          color:${selected ? '#fff' : 'rgb(24,12,32)'};
          font-family:'Inter',sans-serif;font-size:10px;font-weight:600;
          letter-spacing:0.1px;white-space:nowrap;
          box-shadow:0 1px 4px rgba(24,12,32,0.12);
          line-height:12px;">${store.name}</div>
      </div>`,
    iconSize: [90, selected ? 62 : 50],
    iconAnchor: [45, selected ? 19 : 14],
  });
}

function MapView({ online = false, onStoreTap, selectedStore, onMapInteract }) {
  const onStoreTapRef = useRef(onStoreTap);
  const selectedStoreRef = useRef(selectedStore);
  const onMapInteractRef = useRef(onMapInteract);
  useEffect(() => { onStoreTapRef.current = onStoreTap; }, [onStoreTap]);
  useEffect(() => { onMapInteractRef.current = onMapInteract; }, [onMapInteract]);

  // Update icons when selection changes
  useEffect(() => {
    const prev = selectedStoreRef.current;
    selectedStoreRef.current = selectedStore;
    const isSame = (a, b) => a && b && a.lat === b.lat && a.lng === b.lng;

    storeMarkersRef.current.forEach(({ marker, norm, store }) => {
      const isNowSelected = isSame(store, selectedStore);
      const wasSelected   = isSame(store, prev);
      if (!isNowSelected && !wasSelected) return;

      marker.setZIndexOffset(isNowSelected ? 1000 : 0);
      const animClass = isNowSelected ? 'pin-bounce-in' : 'pin-shrink';
      const icon = buildStoreIcon(store, norm, online, isNowSelected, animClass, storeDemandFor(store));
      if (icon) marker.setIcon(icon);
    });
  }, [selectedStore]);
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const hexLayersRef = useRef([]);   // { polygon, norm }[]
  const perimeterLayerRef = useRef(null);
  const storeMarkersRef = useRef([]); // { marker, norm, name }[]

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!window.L) {
      console.warn('Leaflet not loaded');
      return;
    }
    const L = window.L;
    const h3 = window.h3 || window.h3reactNative || window.h3Js || (window.h3 = window["h3-js"]);
    const m = L.map(containerRef.current, {
      center: [39.7392, -104.9903],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      minZoom: 11,
      maxZoom: 17,
      // big SVG render padding so hex polygons exist well beyond the viewport
      // and don't pop in as you pan
      renderer: L.svg({ padding: 3 }),
    });
    m.createPane('hexPane');
    m.getPane('hexPane').style.zIndex = '350';
    m.createPane('labelPane');
    m.getPane('labelPane').style.zIndex = '650';
    m.createPane('userPane');
    m.getPane('userPane').style.zIndex = '900';
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      tileSize: 256,
    }).addTo(m);

    // ──────────────────────────────────────────
    // H3 demand layer
    // ──────────────────────────────────────────
    if (h3 && typeof h3.latLngToCell === 'function') {
      const RES = 9;
      const demandLayer = L.layerGroup().addTo(m);
      const perimeterLayer = L.layerGroup().addTo(m);
      perimeterLayerRef.current = perimeterLayer;
      const demandPerCell = new Map();
      const cellSet = new Set();
      const RING = 6;
      STORES.forEach(s => {
        const cell = h3.latLngToCell(s.lat, s.lng, RES);
        const ring = h3.gridDisk(cell, RING);
        ring.forEach(c => cellSet.add(c));
      });

      let maxDemand = 0;
      cellSet.forEach(cell => {
        const [lat, lng] = h3.cellToLatLng(cell);
        let score = 0;
        STORES.forEach(s => {
          const dist = haversineKm(lat, lng, s.lat, s.lng);
          const storeDemand = storeDemandFor(s);
          if (storeDemand < HEAT_DEMAND_THRESHOLD) return;
          const spread = 1.1 + storeDemand * 1.45;
          const proximity = 1 / Math.pow((dist / spread) + DEMO_CONFIG.map.demandBias, 1.2);
          score += Math.pow(storeDemand, 1.4) * proximity;
        });
        const driverPressure = driverLoadForCell(cell, score);
        score -= driverPressure * 0.12;
        demandPerCell.set(cell, score);
        if (score > maxDemand) maxDemand = score;
      });
      if (maxDemand <= 0) maxDemand = 1;

      const polys = [];
      const edgeCounts = new Map();
      const edgePoints = new Map();
      const edgeKey = (a, b) => {
        const aKey = `${a[0].toFixed(6)},${a[1].toFixed(6)}`;
        const bKey = `${b[0].toFixed(6)},${b[1].toFixed(6)}`;
        return aKey < bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
      };
      cellSet.forEach(cell => {
        const boundary = h3.cellToBoundary(cell);
        const d = demandPerCell.get(cell);
        const norm = Math.max(0, Math.min(1, d / maxDemand));
        const color = d < HEAT_DEMAND_THRESHOLD ? null : heatColor(Math.min(1, Math.pow(norm, 0.8)));
        const polygon = L.polygon(boundary, {
          weight: 0,
          opacity: 0,
          interactive: false,
          pane: 'hexPane',
        }).addTo(demandLayer);
        polys.push({ polygon, norm, demand: d, color });

        for (let i = 0; i < boundary.length; i++) {
          const a = boundary[i];
          const b = boundary[(i + 1) % boundary.length];
          const key = edgeKey(a, b);
          edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
          edgePoints.set(key, [a, b]);
        }
      });
      hexLayersRef.current = polys;

      edgeCounts.forEach((count, key) => {
        if (count !== 1) return;
        const pts = edgePoints.get(key);
        L.polyline(pts, {
          color: '#aeb3bd',
          weight: 2.2,
          opacity: 0.75,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
          pane: 'hexPane',
        }).addTo(perimeterLayer);
      });

      // ──────────────────────────────────────────
      // Store markers — icon colored by demand, label below
      // ──────────────────────────────────────────
      const storeNorms = STORES.map(s => {
        const storeDemand = storeDemandFor(s);
        const demandNorm = Math.max(0, Math.min(1, (storeDemand - 0.35) / 0.95));
        // sample nearby weighted demand so the pin reflects the surrounding hotspot too
        const center = h3.latLngToCell(s.lat, s.lng, RES);
        const ring = [center, ...h3.gridDisk(center, DEMO_CONFIG.map.smoothingRadius)];
        const ds = ring
          .map(c => demandPerCell.get(c) || 0)
          .filter(v => v > 0);
        const avg = ds.length ? ds.reduce((a,b) => a+b, 0) / ds.length : 0;
        const hotspotNorm = Math.max(0, Math.min(1, avg / maxDemand));  // 0..1
        return Math.max(0, Math.min(1, demandNorm * 0.6 + hotspotNorm * 0.4));
      });

      STORES.forEach((s, i) => {
        const norm = storeNorms[i];
        const marker = L.marker([s.lat, s.lng], {
          icon: buildStoreIcon(s, norm, online, false, '', storeDemandFor(s)),
          title: s.name,
          interactive: true,
          pane: 'labelPane',
        }).addTo(m);
        marker.on('click', () => onStoreTapRef.current?.(s));
        storeMarkersRef.current.push({ marker, norm, name: s.name, store: s });
      });
    }

    // current location marker
    const haloIcon = L.divIcon({
      className: 'driver-location',
      html: `
        <div style="position:relative;width:36px;height:36px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:${C.blueHalo};opacity:0.55;animation:pulse 2.4s ease-in-out infinite;"></div>
          <div style="position:absolute;left:9px;top:9px;width:18px;height:18px;border-radius:50%;background:${C.surface};box-shadow:0 2px 6px ${C.shadow};"></div>
          <div style="position:absolute;left:10px;top:10px;width:16px;height:16px;border-radius:50%;background:${C.blue};"></div>
        </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    L.marker([39.7392, -104.9903], {
      icon: haloIcon,
      interactive: false,
      zIndexOffset: 5000,
      pane: 'userPane',
    }).addTo(m);

    const dismissSelectedStore = (e) => {
      if (!selectedStoreRef.current) return;
      if (e?.originalEvent && e?.type === 'dragstart') {
        onMapInteractRef.current?.();
        return;
      }
      if (e?.type === 'click') onMapInteractRef.current?.();
    };
    m.on('dragstart', dismissSelectedStore);
    m.on('zoomstart', dismissSelectedStore);
    m.on('click', dismissSelectedStore);

    mapRef.current = m;

    const invalidate = () => m.invalidateSize();
    requestAnimationFrame(invalidate);
    setTimeout(invalidate, 100);
    setTimeout(invalidate, 400);
    setTimeout(invalidate, 1000);

    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(containerRef.current);

    window.__driverMapRecenter = () => m.flyTo([39.7392, -104.9903], 13, { duration: 0.6 });
    // flyTo centered so latlng appears at targetScreenY pixels from the top of the 812px frame
    window.__driverMapFlyTo = (latlng, targetScreenY) => {
      const zoom = m.getZoom();
      const px = m.project(latlng, zoom);
      px.y += (812 / 2) - targetScreenY;
      m.flyTo(m.unproject(px, zoom), zoom, { duration: 0.45 });
    };

    return () => {
      m.off('dragstart', dismissSelectedStore);
      m.off('zoomstart', dismissSelectedStore);
      m.off('click', dismissSelectedStore);
      ro.disconnect();
      m.remove();
      mapRef.current = null;
      perimeterLayerRef.current = null;
      delete window.__driverMapRecenter;
    };
  }, []);

  // Update hex demand visualization when online state changes
  useEffect(() => {
      hexLayersRef.current.forEach(({ polygon, norm, demand }) => {
        // enable CSS transition on the SVG path before updating fill
        if (polygon._path) {
          polygon._path.style.transition = 'fill 0.9s ease, fill-opacity 0.9s ease';
          polygon._path.style.mixBlendMode = 'multiply';
        }
        if (demand < HEAT_DEMAND_THRESHOLD) {
          polygon.setStyle({ opacity: 0, fillOpacity: 0 });
          return;
        }
        if (online) {
          const color = heatColor(norm);
          polygon.setStyle({
            color: color, weight: 0, opacity: 0,
            fillColor: color,
            fillOpacity: 0.2 + Math.pow(norm, 0.9) * 0.48,
          });
        } else {
          if (norm < 0.18) {
            polygon.setStyle({ opacity: 0, fillOpacity: 0 });
          } else {
            polygon.setStyle({
              color: '#c7c9d1',
              weight: 0,
              opacity: 0,
              fillColor: '#000000',
              fillOpacity: 0.1,
            });
          }
        }
      });

      if (perimeterLayerRef.current) {
        if (online) {
          perimeterLayerRef.current.clearLayers();
        }
      }

    // Update store marker icons to match online/offline color
    storeMarkersRef.current.forEach(({ marker, norm, store }) => {
      const icon = buildStoreIcon(store, norm, online, false, '', storeDemandFor(store));
      if (icon) marker.setIcon(icon);
    });
  }, [online]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#e8eaed' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#e8eaed' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// The expanding header pill
// state: 'pill' | 'menu'
// ─────────────────────────────────────────────────────────────
function HeaderPill({ open, onToggle, stats, online = true, setOnline = () => {}, compact = false }) {
  // pill size
  const pillW = 243;
  const pillH = 56;
  // expanded card
  const cardW = 343;
  const cardH = 208;

  const W = open ? cardW : pillW;
  const H = open ? cardH : pillH;
  const L = (375 - W) / 2;
  const T = compact ? (open ? 16 : 12) : (open ? 50 : 44);
  const R = open ? 24 : 99;

  return (
    <div style={{
      position: 'absolute', left: L, top: T, width: W, height: H,
      background: C.surface,
      border: `0.5px solid ${C.hairline}`,
      borderRadius: R,
      boxShadow: `0 5px 16px ${C.shadow}`,
      overflow: 'hidden',
      transition: 'width 0.35s cubic-bezier(0.22,1,0.36,1), height 0.35s cubic-bezier(0.22,1,0.36,1), left 0.35s cubic-bezier(0.22,1,0.36,1), top 0.35s cubic-bezier(0.22,1,0.36,1), border-radius 0.35s cubic-bezier(0.22,1,0.36,1)',
      zIndex: open ? 55 : 40,
    }}>
      {/* PILL CONTENT — centered, fades out as card expands */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: pillW, height: pillH,
          transform: 'translateX(-50%)',
          background: 'transparent', border: 'none',
          cursor: open ? 'default' : 'pointer',
          padding: 0,
          opacity: open ? 0 : 1,
          pointerEvents: open ? 'none' : 'auto',
          transition: 'opacity 0.18s ease',
          fontFamily: FONT,
        }}
      >
        <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'center' }}>
          {online ? (
            <>
              <span style={{ fontSize: 14, lineHeight: '18px', color: C.ink, fontWeight: 500 }}>Available orders</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 0, height: 18, color: C.inkMuted, fontSize: 13, lineHeight: '18px', whiteSpace: 'nowrap' }}>
                <IconStar size={11} color={C.inkMuted} />
                <span>{stats.rating}</span>
                <span style={{ opacity: 0.6 }}>•</span>
                <span>Bonus {stats.bonus}</span>
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: 14, lineHeight: '18px', color: C.inkMuted, fontWeight: 500 }}>You're offline</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 0, height: 18, color: C.inkSubtle, fontSize: 13, lineHeight: '18px', whiteSpace: 'nowrap' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.inkSubtle, display: 'inline-block' }} />
                <span>Not receiving offers</span>
              </div>
            </>
          )}
        </div>
      </button>

      {/* MENU CONTENT — fades in as card expands */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: open
          ? 'opacity 0.22s ease 0.1s'
          : 'opacity 0.12s ease',
      }}>
        <TierRow onClick={onToggle} />
        <StatsHeroRow onClick={onToggle} />
        <AvailabilityRow onClick={onToggle} />
        <BonusesRow onClick={onToggle} />
      </div>
    </div>
  );
}

function MenuRow({ label, value, valueColor = C.inkMuted, first, last, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center',
        width: '100%', height: 56, padding: '0 8px 0 16px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        borderBottom: last ? 'none' : `0.5px solid ${C.hairline}`,
        fontFamily: FONT, textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 16, lineHeight: '24px', color: C.ink, flex: 1 }}>{label}</span>
      <span style={{ fontSize: 16, lineHeight: '24px', color: valueColor, marginRight: 8 }}>{value}</span>
      <IconChevron size={20} color={C.inkSubtle} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Bespoke menu rows
// ─────────────────────────────────────────────────────────────
function MenuRowShell({ children, onClick, height = 70, last = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        width: '100%', height,
        padding: '0 16px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        borderBottom: last ? 'none' : `0.5px solid ${C.hairline}`,
        fontFamily: FONT, textAlign: 'left',
      }}
    >
      {children}
    </button>
  );
}

function MenuProgressBar({ progress }) {
  return (
    <div style={{ height: 4, borderRadius: 99, background: C.hairline, overflow: 'hidden', marginTop: 10 }}>
      <div style={{
        height: '100%', width: `${progress * 100}%`,
        background: C.ink, borderRadius: 99,
      }} />
    </div>
  );
}

function MenuRowLabel({ left, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 13, color: C.inkMuted }}>{left}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
        <span style={{ fontSize: 13, color: C.ink }}>{right}</span>
        <IconChevron size={16} color={C.inkSubtle} />
      </span>
    </div>
  );
}

function MenuRowFooter({ left, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
      <span style={{ fontSize: 11, color: C.inkSubtle }}>{left}</span>
      {right && <span style={{ fontSize: 11, color: C.inkSubtle }}>{right}</span>}
    </div>
  );
}

function StatsHeroRow({ onClick }) {
  return (
    <MenuRowShell onClick={onClick} height={44}>
      <MenuRowLabel left="Rating" right="Excellent" />
    </MenuRowShell>
  );
}

function AvailabilityRow({ onClick }) {
  return (
    <MenuRowShell onClick={onClick} height={44}>
      <MenuRowLabel left="Availability" right="Until 5:00pm" />
    </MenuRowShell>
  );
}

function BonusesRow({ onClick }) {
  const done = 3, total = 5;
  return (
    <MenuRowShell onClick={onClick} height={76} last>
      <MenuRowLabel left="Shop 5, get $10" right="3 of 5" />
      <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < done ? C.ink : C.hairline }} />
        ))}
      </div>
      <MenuRowFooter left={`${done} completed`} right="ends in 2 hrs" />
    </MenuRowShell>
  );
}

function TierRow({ onClick }) {
  return (
    <MenuRowShell onClick={onClick} height={44}>
      <MenuRowLabel left="Wayfinder" right="247 pts to Trailblazer" />
    </MenuRowShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom sheet — draggable with snap points
// ─────────────────────────────────────────────────────────────
function BottomSheet({ snapIndex, setSnapIndex, snaps, children, onTopChange, showMapCta = false, compactViewport = false }) {
  const sheetRef = useRef(null);
  const scrollRef = useRef(null);
  const dragRef = useRef(null);
  const scrollDragRef = useRef(null);
  const scrollMomentumRef = useRef(null);
  const liveTopRef = useRef(snaps[snapIndex]);
  const [isDragging, setIsDragging] = useState(false);
  const [liveTop, setLiveTopState] = useState(snaps[snapIndex]);

  // wrapper that keeps ref + state in sync
  const setLiveTop = (top) => {
    liveTopRef.current = top;
    setLiveTopState(top);
  };

  // snap top
  const baseTop = snaps[snapIndex];

  // Sync liveTop when snapIndex changes externally and we're not dragging
  useEffect(() => {
    if (!dragRef.current) setLiveTop(baseTop);
  }, [baseTop]);

  // Notify parent on every live position update
  useEffect(() => { onTopChange && onTopChange(liveTop); }, [liveTop, onTopChange]);

  useEffect(() => () => {
    if (scrollMomentumRef.current) cancelAnimationFrame(scrollMomentumRef.current);
  }, []);

  const setTop = (top) => {
    liveTopRef.current = top;
    if (sheetRef.current) sheetRef.current.style.top = top + 'px';
    // throttle React updates to next frame so morph (radius, fs progress) updates too
    setLiveTopState(top);
  };

  const startScrollMomentum = useCallback((initialVelocity) => {
    const scroller = scrollRef.current;
    if (!scroller || Math.abs(initialVelocity) < 0.04) return;

    if (scrollMomentumRef.current) cancelAnimationFrame(scrollMomentumRef.current);

    let velocity = initialVelocity;
    let lastTs = performance.now();

    const step = (ts) => {
      const el = scrollRef.current;
      if (!el) {
        scrollMomentumRef.current = null;
        return;
      }
      const dt = Math.min(32, ts - lastTs);
      lastTs = ts;
      el.scrollTop = Math.max(0, el.scrollTop - velocity * dt);
      velocity *= 0.95;
      if (Math.abs(velocity) < 0.005) {
        scrollMomentumRef.current = null;
        return;
      }
      scrollMomentumRef.current = requestAnimationFrame(step);
    };

    scrollMomentumRef.current = requestAnimationFrame(step);
  }, []);

  const onPointerDown = (e) => {
    const target = e.target;
    if (target.closest && target.closest('button, a, input, [data-no-drag]')) return;
    if (fsProgress > 0.95 && scrollRef.current && scrollRef.current.contains(target)) return;
    if (scrollRef.current && scrollRef.current.scrollTop > 0) {
      const minTop = snaps[0];
      const distFromTop = Math.max(0, liveTop - minTop);
      const fs = 1 - distFromTop / 80;
      if (fs > 0.95) return;
    }
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}

    // Compute scale of nearest scaled ancestor so cursor and sheet move 1:1 visually
    let scale = 1;
    let el = sheetRef.current;
    while (el && el !== document.body) {
      const t = getComputedStyle(el).transform;
      if (t && t !== 'none') {
        const m = t.match(/matrix\(([^)]+)\)/);
        if (m) {
          const parts = m[1].split(',').map(parseFloat);
          if (parts[0]) { scale = parts[0]; break; }
        }
      }
      el = el.parentElement;
    }

    dragRef.current = {
      startY: e.clientY,
      startTop: liveTop,
      moved: false,
      lastY: e.clientY,
      lastT: performance.now(),
      vy: 0,
      scale,
    };
    setIsDragging(true);

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const y = ev.clientY;
      const delta = (y - dragRef.current.startY) / dragRef.current.scale;
      if (Math.abs(delta) > 2) dragRef.current.moved = true;
      let next = dragRef.current.startTop + delta;
      next = Math.max(snaps[0], Math.min(snaps[snaps.length - 1], next));
      const now = performance.now();
      const dt = now - dragRef.current.lastT;
      if (dt > 0) dragRef.current.vy = (y - dragRef.current.lastY) / dragRef.current.scale / dt;
      dragRef.current.lastY = y;
      dragRef.current.lastT = now;
      setTop(next);
      if (ev.cancelable) ev.preventDefault();
    };
    const onUp = (ev) => {
      if (!dragRef.current) return;
      const d = dragRef.current;
      const finalTop = liveTopRef.current;
      // ALWAYS snap to nearest — no tap-cycling
      const projected = finalTop + d.vy * 120;
      let nearest = 0; let nd = Infinity;
      snaps.forEach((s, i) => {
        const dist = Math.abs(projected - s);
        if (dist < nd) { nd = dist; nearest = i; }
      });
      setSnapIndex(nearest);
      setLiveTop(snaps[nearest]);
      dragRef.current = null;
      setIsDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup',   onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  };

  const onScrollPointerDown = (e) => {
    const target = e.target;
    if (target.closest && target.closest('button, a, input, [data-no-drag]')) return;
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (!scrollRef.current) return;
    if (fsProgress <= 0.95) return;

    e.stopPropagation();
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}

    const startY = e.clientY;
    const startScrollTop = scrollRef.current.scrollTop;
    const startTop = liveTopRef.current;
    let draggingSheet = false;
    let scale = 1;
    let el = sheetRef.current;
    while (el && el !== document.body) {
      const t = getComputedStyle(el).transform;
      if (t && t !== 'none') {
        const m = t.match(/matrix\(([^)]+)\)/);
        if (m) {
          const parts = m[1].split(',').map(parseFloat);
          if (parts[0]) { scale = parts[0]; break; }
        }
      }
      el = el.parentElement;
    }

    scrollDragRef.current = {
      startY,
      startScrollTop,
      startTop,
      scale,
      lastY: startY,
      lastT: performance.now(),
      vy: 0,
    };

    const onMove = (ev) => {
      if (!scrollDragRef.current) return;
      const d = scrollDragRef.current;
      const y = ev.clientY;
      const delta = (y - d.startY) / d.scale;
      const now = performance.now();
      const dt = now - d.lastT;
      if (dt > 0) d.vy = (y - d.lastY) / d.scale / dt;
      d.lastY = y;
      d.lastT = now;

      const scroller = scrollRef.current;
      if (!scroller) return;

      if (!draggingSheet) {
        const nextScrollTop = d.startScrollTop - delta;
        if (d.startScrollTop <= 0 && delta > 6) {
          draggingSheet = true;
        } else {
          scroller.scrollTop = Math.max(0, nextScrollTop);
          if (ev.cancelable) ev.preventDefault();
          return;
        }
      }

      let next = d.startTop + delta;
      next = Math.max(snaps[0], Math.min(snaps[snaps.length - 1], next));
      setTop(next);
      if (ev.cancelable) ev.preventDefault();
    };

    const onUp = () => {
      if (draggingSheet && scrollDragRef.current) {
        const finalTop = liveTopRef.current;
        const projected = finalTop + scrollDragRef.current.vy * 120;
        let nearest = 0; let nd = Infinity;
        snaps.forEach((s, i) => {
          const dist = Math.abs(projected - s);
          if (dist < nd) { nd = dist; nearest = i; }
        });
        setSnapIndex(nearest);
        setLiveTop(snaps[nearest]);
      } else if (scrollDragRef.current) {
        startScrollMomentum(scrollDragRef.current.vy);
      }
      scrollDragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // morph corners and shadow at fullscreen
  const minTop = snaps[0];
  const distFromTop = Math.max(0, liveTop - minTop);
  const fsProgress = Math.max(0, Math.min(1, 1 - distFromTop / 80));
  const radius = 16 * (1 - fsProgress);

  return (
      <div
        ref={sheetRef}
        onPointerDown={onPointerDown}
        style={{
        position: 'absolute', left: 0, right: 0,
        top: liveTop, bottom: 0,
        background: C.surface,
        borderRadius: `${radius}px ${radius}px 0 0`,
        boxShadow: fsProgress > 0.95 ? 'none' : `0 -5px 16px ${C.shadow}`,
        transition: isDragging ? 'none' : 'top 0.42s cubic-bezier(0.22,1,0.36,1), border-radius 0.3s ease, box-shadow 0.3s ease',
        display: 'flex', flexDirection: 'column',
        zIndex: 20,
        pointerEvents: 'auto',
        touchAction: fsProgress > 0.95 ? 'pan-y' : 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        willChange: 'top',
        }}
      >
      {/* drag handle — visual indicator (whole sheet is draggable) */}
      <div
        style={{
          position: 'relative',
          height: fsProgress > 0.5 ? 26 : 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, pointerEvents: 'none', userSelect: 'none',
        }}
      >
        <div style={{
          width: 36, height: 5, borderRadius: 3, background: 'rgb(216,213,219)',
          opacity: 1 - fsProgress * 0.4,
        }} />
      </div>
      <div
        ref={scrollRef}
        onPointerDown={fsProgress > 0.95 ? onScrollPointerDown : undefined}
        style={{
          flex: 1,
          overflowY: compactViewport || fsProgress > 0.95 ? 'auto' : 'hidden',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          touchAction: compactViewport || fsProgress > 0.95 ? 'pan-y' : 'none',
          paddingBottom: showMapCta ? 96 : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom sheet content
// ─────────────────────────────────────────────────────────────
function SectionHeader({ title, action }) {
  return (
    <div style={{
      height: 56, padding: '0 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: FONT,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: -0.2 }}>{title}</span>
        <IconInfo size={18} color={C.inkSubtle} />
      </span>
      {action}
    </div>
  );
}

function EmptyOffers() {
  return (
    <div style={{ padding: '8px 16px 32px', fontFamily: FONT, textAlign: 'center' }}>
      <p style={{
        fontSize: 14, lineHeight: '18px', color: C.inkSubtle, margin: '8px 0 16px',
      }}>
        No current offers. You'll receive offers based on your scheduled availability.
      </p>
      <a href="#" onClick={(e) => e.preventDefault()} style={{
        display: 'inline-block', padding: '8px 0',
        fontSize: 14, fontWeight: 600, lineHeight: '18px', color: C.green,
        textDecoration: 'none',
      }}>Update schedule</a>
    </div>
  );
}

function MetroRow({ name, count, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '18px 16px',
      borderBottom: last ? 'none' : `0.5px solid ${C.hairline}`,
      fontFamily: FONT,
    }}>
      <span style={{ flex: 1, fontSize: 16, lineHeight: '24px', color: C.ink }}>{name}</span>
      <Badge>{count}</Badge>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 32, height: 24, padding: '0 10px', borderRadius: 99,
      background: 'rgb(230,228,232)', color: C.ink,
      fontFamily: FONT, fontSize: 13, fontWeight: 500,
    }}>{children}</span>
  );
}

function OffersBlock() {
  return (
    <div>
      <SectionHeader title="Offers" action={<button style={iconBtn}><IconEllipsis /></button>} />
      <EmptyOffers />
    </div>
  );
}

function OpenMetroBlock({ rows }) {
  return (
    <div style={{ borderTop: '8px solid rgb(248,248,249)' }}>
      <SectionHeader title="Open metro" />
      <div style={{ padding: '0 0 8px' }}>
        {rows.map((r, i) => (
          <MetroRow key={r.name} {...r} last={i === rows.length - 1} />
        ))}
      </div>
      <p style={{
        padding: '24px 16px 40px', margin: 0, textAlign: 'center',
        fontFamily: FONT, fontSize: 14, lineHeight: '18px', color: C.inkSubtle,
      }}>
        No open metro orders yet. Check back soon.
      </p>
    </div>
  );
}

const iconBtn = {
  width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
};

// ─────────────────────────────────────────────────────────────
// Side nav drawer (slides from left)
// ─────────────────────────────────────────────────────────────
function SideDrawer({ open, onClose, name, compact = false }) {
  const W = 300;
  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, zIndex: 70,
        background: open ? C.scrim : 'transparent',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'background 0.3s ease',
      }} />
      <aside style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: W, zIndex: 80,
        background: C.surface,
        transform: `translateX(${open ? 0 : -W}px)`,
        transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
        boxShadow: open ? `4px 0 16px ${C.shadow}` : 'none',
        display: 'flex', flexDirection: 'column',
        fontFamily: FONT,
      }}>
        <div style={{ height: compact ? 0 : 44 }} />{/* status bar spacer */}
        <div style={{ padding: '16px 20px 24px', borderBottom: `0.5px solid ${C.hairline}` }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgb(214,242,232), rgb(184,232,212))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: C.green, fontSize: 22, fontWeight: 600,
          }}>{name.split(' ').map(s => s[0]).join('').slice(0,2)}</div>
          <div style={{ marginTop: 12, fontSize: 18, fontWeight: 600, color: C.ink }}>{name}</div>
          <div style={{ marginTop: 4, fontSize: 14, color: C.inkMuted, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconStar size={12} color={C.inkMuted} /> 4.9
          </div>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {[
            'Available Orders',
            'Earnings',
            'Resources',
            'Help',
            'Settings',
          ].map((label, i) => (
            <button key={label} onClick={onClose} style={{
              display: 'flex', alignItems: 'center', width: '100%',
              padding: '16px 20px', background: 'transparent', border: 'none',
              fontFamily: FONT, fontSize: 16, color: C.ink, textAlign: 'left', cursor: 'pointer',
            }}>
              <span style={{ flex: 1 }}>{label}</span>
              <IconChevron size={18} color={C.inkSubtle} />
            </button>
          ))}
        </nav>
        <button onClick={onClose} style={{
          margin: '8px 20px 32px', padding: '12px 0', borderRadius: 99,
          background: 'transparent', border: `1px solid ${C.hairline}`,
          fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.inkMuted, cursor: 'pointer',
        }}>Sign out</button>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter sheet (slides from bottom)
// ─────────────────────────────────────────────────────────────
function FilterSheet({ open, onClose, filters, setFilters }) {
  const toggle = (key) => setFilters({ ...filters, [key]: !filters[key] });
  const clearFilters = () => setFilters({ promo: false, hourly: false, batch: false, drinks: false });

  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, zIndex: 70,
        background: open ? C.scrim : 'transparent',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'background 0.3s ease',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 80,
        background: C.surface,
        borderRadius: '20px 20px 0 0',
        transform: `translateY(${open ? 0 : 100}%)`,
        transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
        boxShadow: `0 -8px 24px ${C.shadow}`,
        fontFamily: FONT,
        paddingBottom: 34,
      }}>
        <div style={{
          padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button onClick={onClose} style={iconBtn}><IconClose color={C.ink} /></button>
          <span style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>Filters</span>
          <button onClick={clearFilters} style={{
            ...iconBtn, width: 'auto', padding: '0 4px',
            fontSize: 14, color: '#212121', fontWeight: 600,
          }}>Clear</button>
        </div>
        <div style={{ padding: '8px 0 16px' }}>
          {[
            ['promo',  'Promo orders only'],
            ['hourly', 'Hourly windows'],
            ['batch',  'Batch deliveries'],
            ['drinks', 'No alcohol orders'],
          ].map(([key, label], i, arr) => (
            <label key={key} style={{
              display: 'flex', alignItems: 'center', padding: '16px 20px',
              borderBottom: i === arr.length - 1 ? 'none' : `0.5px solid ${C.hairline}`,
              cursor: 'pointer',
            }}>
              <span style={{ flex: 1, fontSize: 16, color: C.ink }}>{label}</span>
              <Switch on={filters[key]} onChange={() => toggle(key)} />
            </label>
          ))}
        </div>
        <div style={{ padding: '8px 16px 0' }}>
          <button onClick={onClose} style={{
            width: '100%', padding: '14px 0', borderRadius: 99,
            background: '#212121', color: C.surface,
            fontFamily: FONT, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
          }}>Apply filters</button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Map fullscreen overlay
// ─────────────────────────────────────────────────────────────
function MapFullscreen({ open, onClose, panY }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 90,
      transform: `translateY(${open ? 0 : 100}%)`,
      transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1)',
      background: C.surface, overflow: 'hidden',
    }}>
      <MapView panY={panY} />
      {/* close button */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 56, left: 16, zIndex: 5,
        width: 44, height: 44, borderRadius: '50%',
        background: C.surface, border: 'none', cursor: 'pointer',
        boxShadow: `0 4px 12px ${C.shadow}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconClose color={C.ink} />
      </button>
      {/* recenter */}
      <button style={{
        position: 'absolute', bottom: 120, right: 16, zIndex: 5,
        width: 44, height: 44, borderRadius: '50%',
        background: C.surface, border: 'none', cursor: 'pointer',
        boxShadow: `0 4px 12px ${C.shadow}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" fill={C.blue}/>
          <circle cx="12" cy="12" r="8" stroke={C.ink} strokeWidth="1.5"/>
          <line x1="12" y1="0" x2="12" y2="4" stroke={C.ink} strokeWidth="1.5"/>
          <line x1="12" y1="20" x2="12" y2="24" stroke={C.ink} strokeWidth="1.5"/>
          <line x1="0" y1="12" x2="4" y2="12" stroke={C.ink} strokeWidth="1.5"/>
          <line x1="20" y1="12" x2="24" y2="12" stroke={C.ink} strokeWidth="1.5"/>
        </svg>
      </button>
      {/* peek of sheet at bottom */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: 80, background: C.surface,
        borderRadius: '16px 16px 0 0',
        boxShadow: `0 -5px 16px ${C.shadow}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        flexDirection: 'column', gap: 6,
      }} onClick={onClose}>
        <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgb(216,213,219)' }} />
        <span style={{ fontFamily: FONT, fontSize: 14, color: C.inkMuted }}>Drag down for offers</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Busy times chart — shows expected demand by hour
// ─────────────────────────────────────────────────────────────
function BusyTimesChart() {
  const slots = [
    { h: '10a', d: 0.10 },
    { h: '12p', d: 0.22 },
    { h: '2p',  d: 0.28 },
    { h: '4p',  d: 0.45 },
    { h: '6p',  d: 0.72 },
    { h: '8p',  d: 0.95 },
    { h: '10p', d: 0.60 },
    { h: '12a', d: 0.15 },
  ];
  const nowIdx = 1; // currently 12p
  const W = 311, H = 64, PAD_LEFT = 0, PAD_RIGHT = 0;
  const n = slots.length;
  const xStep = (W - PAD_LEFT - PAD_RIGHT) / (n - 1);
  const pts = slots.map((s, i) => [PAD_LEFT + i * xStep, H - s.d * H]);

  // smooth curve via cubic bezier control points
  const smooth = (points) => {
    let d = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cp1x = points[i][0] + xStep * 0.45;
      const cp1y = points[i][1];
      const cp2x = points[i + 1][0] - xStep * 0.45;
      const cp2y = points[i + 1][1];
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i+1][0]},${points[i+1][1]}`;
    }
    return d;
  };

  const linePath = smooth(pts);
  const areaPath = `${linePath} L ${pts[n-1][0]},${H} L ${pts[0][0]},${H} Z`;

  const nowX = pts[nowIdx][0];
  const nowY = pts[nowIdx][1];

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Expected demand</span>
        <span style={{ fontSize: 11, color: C.inkSubtle }}>Peak at 8pm</span>
      </div>

      <div style={{ position: 'relative' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
          <defs>
            <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.ink} stopOpacity="0.12" />
              <stop offset="100%" stopColor={C.ink} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {/* area fill */}
          <path d={areaPath} fill="url(#demandGrad)" />
          {/* line */}
          <path d={linePath} fill="none" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* now indicator */}
          <line x1={nowX} y1="0" x2={nowX} y2={H} stroke={C.inkSubtle} strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={nowX} cy={nowY} r="3.5" fill={C.ink} />
        </svg>
      </div>

      {/* time labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {slots.map((s, i) => (
          <span key={i} style={{
            fontSize: 10, color: i === nowIdx ? C.ink : C.inkSubtle,
            fontWeight: i === nowIdx ? 700 : 400,
            textAlign: 'center',
          }}>{i === nowIdx ? 'now' : s.h}</span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Order cards
// ─────────────────────────────────────────────────────────────
const ORDERS = [
  {
    id: 4,
    store: 'Safeway',
    storeBrand: 'safeway',
    neighborhood: 'Capitol Hill',
    address: '757 E 20th Ave',
    items: 25,
    pay: 16.05,
    tip: 8.00,
    distance: 3,
    window: 'Deliver 10 am–11 am',
    estMins: 50,
    promoText: null,
    exclusive: true,
  },
  {
    id: 1,
    store: 'King Soopers',
    storeBrand: 'kings',
    neighborhood: 'Uptown',
    address: '1155 E 9th Ave',
    items: 14,
    pay: 16.05,
    tip: 0,
    distance: 3,
    window: 'Deliver 10 am–11 am',
    estMins: 50,
    promoText: null,
    tagPill: 'ID scan',
  },
  {
    id: 2,
    store: 'Target',
    storeBrand: 'target',
    neighborhood: 'Downtown Denver',
    address: '1600 California St',
    items: 25,
    pay: 16.05,
    tip: 8,
    distance: 3,
    window: 'Deliver 10 am–11 am',
    estMins: 50,
    promoText: '✨ Promo pay included',
  },
  {
    id: 3,
    store: 'Petco',
    storeBrand: 'petco',
    neighborhood: 'Cherry Creek',
    address: '2000 W 15th St',
    items: 14,
    pay: 16.05,
    tip: 6.00,
    distance: 3,
    window: 'Deliver 10 am–11 am',
    estMins: 50,
    promoText: '✨ same-day pickup',
  },
];

const STORE_INITIALS = { target: 'T', safeway: 'S', kings: 'K', michaels: 'M', walgreens: 'W', cvs: 'CVS', petsmart: 'PS', office: 'OD', petco: 'P', seven: '7E', lowes: 'L', ulta: 'U', carters: 'C' };
const BRAND_LOGOS = {
  target: 'assets/retailer-logos/Target.png',
  safeway: 'assets/retailer-logos/Safeway.png',
  kings: null,
  michaels: 'assets/retailer-logos/Michaels.png',
  walgreens: null,
  cvs: null,
  petsmart: null,
  office: 'assets/retailer-logos/Office Depot OfficeMax.png',
  petco: 'assets/retailer-logos/Petco.png',
  seven: null,
  lowes: null,
  ulta: null,
  carters: null,
};

function BrandLogo({ brand, size = 40 }) {
  const logoSrc = BRAND_LOGOS[brand];
  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: 8,
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    background: BRAND_COLORS[brand] || C.hairline,
  };

  if (logoSrc) {
    return (
      <div style={avatarStyle}>
        <img
          src={logoSrc}
          alt=""
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    );
  }

  if (!brand) {
    return <div style={{ ...avatarStyle, background: C.hairline }} />;
  }

  const label = {
    target: 'Target',
    safeway: 'Safeway',
    kings: 'King Soopers',
    michaels: 'Michaels',
    walgreens: 'Walgreens',
    cvs: 'CVS',
    petsmart: 'PetSmart',
    office: 'Office Depot OfficeMax',
    petco: 'Petco',
    seven: '7-Eleven',
    lowes: "Lowe's",
    ulta: 'Ulta',
    carters: "Carter's",
  }[brand] || brand;
  const color = BRAND_COLORS[brand] || C.ink;
  const short = label.split(' ').slice(0, 2).map(part => part[0]).join('').slice(0, 3).toUpperCase();

  return (
    <div style={{
      ...avatarStyle,
      color: '#fff',
      fontSize: brand === 'office' ? 8 : 12,
      fontWeight: 700,
      letterSpacing: 0.1,
      textAlign: 'center',
      padding: '0 4px',
      background: color,
    }}>
      {short}
    </div>
  );
}

function OrderCard({ order }) {
  const color = BRAND_COLORS[order.storeBrand] || C.ink;
  const total = order.pay.toFixed(2);
  const [exclusiveSeconds, setExclusiveSeconds] = useState(order.exclusive ? 60 : 0);
  const tipText = order.tip > 0
    ? `plus $${Number.isInteger(order.tip) ? order.tip.toFixed(0) : order.tip.toFixed(2)} est tip`
    : null;
  useEffect(() => {
    if (!order.exclusive || exclusiveSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setExclusiveSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [order.exclusive, exclusiveSeconds]);
  return (
    <div style={{
      margin: '0 16px 12px',
      background: C.surface,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 6px rgba(24,12,32,0.15)',
      fontFamily: FONT,
    }}>
      {order.exclusive && exclusiveSeconds > 0 && (
        <div style={{
          background: '#d3ece4',
          color: '#0b5f4e',
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 700,
          lineHeight: '18px',
          padding: '7px 12px',
        }}>
          Exclusive to you · {exclusiveSeconds}s
        </div>
      )}
      <div style={{ position: 'relative', padding: '16px' }}>
        <div style={{ position: 'absolute', right: 16, top: 16, width: 60, height: 40, display: 'flex', justifyContent: 'flex-end' }}>
          <BrandLogo brand={order.storeBrand} size={40} />
        </div>
        <div style={{ color: '#177cba', fontSize: 14, fontWeight: 600, lineHeight: '18px', marginBottom: 4 }}>Shop &amp; deliver</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 24, lineHeight: '24px', fontWeight: 600, color: '#180c20', letterSpacing: -0.2 }}>${total}</div>
          {tipText && <div style={{ fontSize: 16, lineHeight: '18px', color: C.inkMuted }}>{tipText}</div>}
        </div>
        {order.promoText && <div style={{ marginTop: 2, color: '#038767', fontSize: 14, lineHeight: '18px', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 4 }}>{order.promoText}</div>}
        <div style={{ marginTop: 10, fontSize: 16, lineHeight: '24px', color: '#180c20', fontWeight: 600 }}>{order.window}</div>
        <div style={{ marginTop: 0, fontSize: 16, lineHeight: '24px', color: '#180c20', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span>{order.items} total items</span>
          <span>•</span>
          <span>{order.estMins} min est</span>
          <span>•</span>
          <span>{order.distance} mi</span>
        </div>
        <div style={{ marginTop: 0, fontSize: 16, lineHeight: '24px', color: '#180c20' }}>{order.store} - {order.neighborhood}</div>
        {order.tagPill && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginTop: 8,
            padding: '4px 10px',
            borderRadius: 999,
            background: order.tagPill === 'ID scan' ? '#f8dbe0' : 'rgba(24,12,32,0.08)',
            color: order.tagPill === 'ID scan' ? '#9f2033' : C.inkMuted,
            fontSize: 12,
            fontWeight: 700,
          }}>
            {order.tagPill}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span style={{ fontSize: 12, color: C.inkMuted, fontFamily: FONT }}>{label}</span>
    </div>
  );
}

function OrderCards() {
  return (
    <div style={{ paddingTop: 8, paddingBottom: 8 }}>
      {ORDERS.map(order => <OrderCard key={order.id} order={order} />)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Store detail sheet
// ─────────────────────────────────────────────────────────────
function StoreSheet({ store, onClose, sheetRef }) {
  const open = !!store;
  const color = store ? (BRAND_COLORS[store.brand] || C.ink) : C.ink;
  const initials = store ? (STORE_INITIALS[store.brand] || store.name[0]) : '';

  return (
    <>
      {/* sheet */}
      <div ref={sheetRef} style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 45,
        background: C.surface,
        borderRadius: '20px 20px 0 0',
        boxShadow: `0 -4px 24px ${C.shadow}`,
        transform: open ? 'translateY(0)' : 'translateY(105%)',
        transition: 'transform 0.42s cubic-bezier(0.22,1,0.36,1)',
        fontFamily: FONT,
        paddingBottom: 34,
      }}>
        {/* handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgb(216,213,219)' }} />
        </div>

        {/* close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 14,
          ...iconBtn, width: 32, height: 32, borderRadius: '50%',
          background: C.hairline,
        }}>
          <IconClose size={14} color={C.inkMuted} />
        </button>

        {/* store header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 16px 16px' }}>
          <BrandLogo brand={store?.brand} size={40} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: C.ink, lineHeight: '24px' }}>{store?.name}</div>
            <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 2 }}>{store?.address}</div>
          </div>
        </div>

        {/* divider */}
        <div style={{ height: 1, background: C.hairline, margin: '0 16px' }} />

        {/* hours */}
        <div style={{ padding: '14px 16px 20px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.inkSubtle, letterSpacing: 0.4, textTransform: 'uppercase' }}>Hours</span>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {store?.hours.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: C.inkMuted }}>{h.days}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>{h.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* navigate button */}
        <div style={{ padding: '0 16px' }}>
          <button data-no-drag="true" onClick={onClose} style={{
            width: '100%', padding: '14px 0', borderRadius: 99,
            background: 'transparent', color: '#212121', border: '2px solid #212121',
            fontFamily: FONT, fontSize: 16, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4.5 20.3l.7.7 6.8-3 6.8 3 .7-.7L12 2z" fill="#212121"/>
            </svg>
            Navigate
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main app
// ─────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = (window.useTweaks ?? ((d) => [d, () => {}]))(/*EDITMODE-BEGIN*/{
    "demand": "high"
  }/*EDITMODE-END*/);
  const lowDemand = t.demand === 'low';
  const getViewportWidth = () => Math.min(window.innerWidth, window.visualViewport?.width || window.innerWidth);
  const getViewportHeight = () => Math.min(window.innerHeight, window.visualViewport?.height || window.innerHeight);
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth());
  const [viewportHeight, setViewportHeight] = useState(getViewportHeight());

  useEffect(() => {
    const onResize = () => {
      setViewportWidth(getViewportWidth());
      setViewportHeight(getViewportHeight());
    };
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, []);
  const compactViewport = viewportWidth < 430;

  const [headerOpen, setHeaderOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ promo: false, hourly: false, batch: false, drinks: false });
  const [online, setOnline] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const storeSheetRef = useRef(null);

  const handleStoreTap = useCallback((store) => {
    setSelectedStore(store);
    // measure sheet height (or fall back to estimate), compute midpoint
    const NAV_BOTTOM = 116;
    const FRAME_H = 812;
    // sheet may not be rendered yet on first tap — use offsetHeight if available
    requestAnimationFrame(() => {
      const sheetH = storeSheetRef.current?.offsetHeight ?? 300;
      const sheetTop = FRAME_H - sheetH;
      const targetY = Math.round((NAV_BOTTOM + sheetTop) / 2);
      window.__driverMapFlyTo?.([store.lat, store.lng], targetY);
    });
  }, []);

  const goOnline = () => {
    if (lowDemand || connecting) return;
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setOnline(true);
      setSnap(compactViewport ? 1 : 2); // start sheet more open on compact phones
      window.__driverMapRecenter?.();
    }, 1400);
  };

  const goOffline = () => {
    setOnline(false);
    setSnap(compactViewport ? 1 : 2);
  };

  // Sheet snap points (top distance from frame top)
  // 0 = fullscreen (sheet covers everything, no map peek)
  // 1 = mid (offers visible above metro)
  // 2 = peek (most map showing)
  const SNAPS = compactViewport
    ? [144, Math.round(viewportHeight * 0.54) + 72, Math.max(144, viewportHeight - 180) + 72]
    : [96, 380, 704];
  const [snap, setSnap] = useState(1);
  const [sheetTop, setSheetTop] = useState(SNAPS[1]);

  // 0 → 1 as sheet approaches fullscreen
  const fs = Math.max(0, Math.min(1, 1 - Math.max(0, sheetTop - SNAPS[0]) / 80));
  // 0 → 1 as sheet leaves peek (anything not peek is "engaged")
  const engaged = Math.max(0, Math.min(1, (SNAPS[2] - sheetTop) / (SNAPS[2] - SNAPS[1])));

  const stats = {
    rating: '4.9',
    bonus: '3/5',
    statsValue: 'Excellent',
    availability: 'til 5pm',
    bonuses: '1/1 active',
    status: 'Wayfinder',
  };

  const metroRows = [
    { name: 'Promo orders',     count: 1 },
    { name: 'Crestwood',        count: 3 },
    { name: 'Financial District', count: 3 },
    { name: 'Gardendale',       count: 3 },
  ];

  return (
    <>
      <style>{`
        @keyframes loadingIndicatorSlide {
          0%, 10% { transform: translate(0, 0); }
          25%, 35% { transform: translate(var(--loading-indicator-travel), 0); }
          50%, 60% { transform: translate(var(--loading-indicator-travel), var(--loading-indicator-travel)); }
          75%, 85% { transform: translate(0, var(--loading-indicator-travel)); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative', overflow: 'hidden',
      borderRadius: compactViewport ? 0 : 44,
      background: C.surface,
      boxShadow: compactViewport ? 'none' : '0 0 0 12px #111, 0 0 0 14px #222, 0 30px 80px rgba(0,0,0,0.4)',
      fontFamily: FONT,
    }}>
      {/* MAP — fades out as sheet approaches fullscreen */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: fs > 0 ? 1 - fs : 1,
        transition: 'opacity 0.25s ease',
        pointerEvents: fs > 0.9 ? 'none' : 'auto',
        zIndex: 0,
      }}>
        <MapView
          online={online}
          onStoreTap={handleStoreTap}
          selectedStore={selectedStore}
          onMapInteract={() => setSelectedStore(null)}
        />
      </div>

      {/* Backdrop scrim when header menu open */}
      <div onClick={() => setHeaderOpen(false)} style={{
        position: 'absolute', inset: 0, zIndex: 30,
        background: headerOpen ? C.scrim : 'transparent',
        pointerEvents: headerOpen ? 'auto' : 'none',
        transition: 'background 0.3s ease',
      }} />

      {/* CHROME — solidifies as sheet pulls fullscreen, hides when menu open */}
      {!headerOpen && <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: compactViewport ? 72 : 116, zIndex: 35,
        background: fs >= 1
          ? 'rgb(255,255,255)'
          : `rgba(255,255,255,${0.7 + 0.3 * fs})`,
        backdropFilter: fs >= 1 ? 'none' : 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: fs >= 1 ? 'none' : 'saturate(180%) blur(20px)',
        borderBottom: fs > 0.6 ? `0.5px solid ${C.hairline}` : '0.5px solid transparent',
        pointerEvents: 'none',
        transition: 'background 0.2s ease, border-bottom 0.2s ease',
      }} />}
      <StatusBar compact={compactViewport} />
      {/* nav buttons */}
      <button onClick={() => setDrawerOpen(true)} style={{
        position: 'absolute', left: 16, top: compactViewport ? 16 : 60, width: 24, height: 24, zIndex: 50,
        background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
      }}>
        <IconHamburger />
      </button>
      <button onClick={() => setFilterOpen(true)} style={{
        position: 'absolute', right: 16, top: compactViewport ? 16 : 60, width: 24, height: 24, zIndex: 50,
        background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
      }}>
        <IconFilter />
      </button>

      {/* HEADER PILL / MENU */}
      <HeaderPill open={headerOpen} onToggle={() => setHeaderOpen(o => !o)} stats={stats} online={online} setOnline={setOnline} compact={compactViewport} />

      {/* BOTTOM SHEET — always mounted, slides in/out */}
      <div style={{
        position: compactViewport ? 'fixed' : 'absolute',
        inset: 0,
        width: compactViewport ? '100vw' : 'auto',
        height: compactViewport ? '100dvh' : 'auto',
        zIndex: 20,
        transform: online ? 'translateY(0)' : 'translateY(110%)',
        transition: online
          ? 'transform 0.55s cubic-bezier(0.22,1,0.36,1)'
          : 'transform 0.35s cubic-bezier(0.4,0,0.6,1)',
        pointerEvents: 'none',
      }}>
        <BottomSheet
          snapIndex={snap} setSnapIndex={setSnap} snaps={SNAPS}
          onTopChange={setSheetTop}
          showMapCta={snap === 0}
          compactViewport={compactViewport}
        >
          {snap === 2 ? (
            <div style={{
              paddingTop: 0,
            }}>
              <div style={{
                width: '100%',
                textAlign: 'center',
                fontFamily: FONT,
                fontSize: 19,
                lineHeight: '23px',
                fontWeight: 600,
                color: C.ink,
                letterSpacing: -0.2,
              }}>
                {ORDERS.length} orders available
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', minHeight: '100%' }}>
              <div style={{
                opacity: 1,
                transform: 'translateY(0)',
                transition: 'opacity 0.22s ease, transform 0.22s ease',
              }}>
                <OrderCards />
                <div style={{ padding: '24px 16px 40px', display: 'flex' }}>
                  <button
                    data-no-drag="true"
                    onClick={goOffline}
                    style={{
                      width: '100%', padding: '14px 0', borderRadius: 99,
                      background: 'transparent', color: C.ink,
                      border: '2px solid #212121',
                      fontFamily: FONT, fontSize: 16, fontWeight: 600,
                      cursor: 'pointer', letterSpacing: 0.1,
                    }}
                  >Go offline</button>
                </div>
              </div>
            </div>
          )}
        </BottomSheet>
      </div>

      {snap === 0 && (
        <button
          data-no-drag="true"
          onClick={() => setSnap(2)}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: compactViewport ? 16 : 48,
            transform: 'translateX(-50%)',
            minWidth: 44,
            minHeight: 44,
            padding: '0 18px',
            borderRadius: 999,
            border: 'none',
            background: '#212121',
            color: '#fff',
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.2,
            cursor: 'pointer',
            zIndex: 26,
            animation: 'fadeInUp 0.28s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          Map
        </button>
      )}

      {/* GO ONLINE CTA — only when offline */}
      {!online && (
        <div style={{
          position: compactViewport ? 'fixed' : 'absolute',
          left: 0, right: 0, bottom: 0,
          padding: compactViewport ? '12px 12px max(16px, env(safe-area-inset-bottom))' : '12px 12px 56px', zIndex: 25,
          bottom: compactViewport ? 22 : 0,
          transform: compactViewport ? 'none' : 'translateY(32px)',
          fontFamily: FONT,
        }}>
          {/* blur bg — starts halfway down the card */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, top: '50%',
            background: 'linear-gradient(to top, rgba(255,255,255,1) 60%, rgba(255,255,255,0) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            pointerEvents: 'none',
          }} />
          {/* outer card — concentric radii */}
          <div style={{
            position: 'relative',
            background: C.surface,
            border: `1px solid ${C.hairline}`,
            borderRadius: 32,
            padding: 8,
            boxShadow: '0 2px 16px rgba(24,12,32,0.08)',
          }}>
            {/* chart sits inside at natural radius */}
            <div style={{ borderRadius: 22, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ padding: '14px 14px 10px', background: C.surface }}>
                <BusyTimesChart />
              </div>
            </div>

            {/* CTA button — innermost radius */}
            <button
              onClick={goOnline}
              disabled={lowDemand || connecting}
              style={{
                width: '100%', height: 56, borderRadius: 999,
                background: lowDemand ? 'rgb(228,226,231)' : '#212121',
                color: lowDemand ? C.inkSubtle : '#fff',
                border: 'none',
                cursor: lowDemand || connecting ? 'default' : 'pointer',
                fontFamily: FONT, fontSize: 17, fontWeight: 600,
                letterSpacing: 0.1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'opacity 0.2s ease',
                opacity: connecting ? 0.8 : 1,
              }}
            >
              {connecting && <LoadingIndicator size="sm" surface="inverse" />}
              {lowDemand ? 'Go online — low demand' : connecting ? 'Going online…' : 'Go online'}
            </button>
          </div>
        </div>
      )}

      {/* RECENTER BUTTON — top right, below the chrome */}
      <button
        onClick={() => window.__driverMapRecenter && window.__driverMapRecenter()}
        style={{
          position: 'absolute',
          right: 16,
          top: compactViewport ? 88 : 132,
          width: 44, height: 44, borderRadius: '50%',
          background: C.surface, border: 'none', cursor: 'pointer',
          boxShadow: `0 4px 12px ${C.shadow}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 15,
          padding: 0,
          transition: 'opacity 0.2s ease',
          opacity: fs > 0.85 ? 0 : 1,
          pointerEvents: fs > 0.85 ? 'none' : 'auto',
        }}
        aria-label="Center on my location"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" fill={C.ink}/>
          <circle cx="12" cy="12" r="7.5" stroke={C.ink} strokeWidth="1.5"/>
          <line x1="12" y1="1" x2="12" y2="4.5" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="12" y1="19.5" x2="12" y2="23" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="1" y1="12" x2="4.5" y2="12" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="19.5" y1="12" x2="23" y2="12" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* HOME INDICATOR */}
      <HomeIndicator compact={compactViewport} />

      {/* STORE SHEET */}
      <StoreSheet store={selectedStore} onClose={() => setSelectedStore(null)} sheetRef={storeSheetRef} />

      {/* OVERLAYS */}
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} name="Alex Reyes" compact={compactViewport} />
      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} filters={filters} setFilters={setFilters} />
    </div>
    {window.TweaksPanel && (
      <window.TweaksPanel title="Tweaks" noDeckControls={true}>
        <window.TweakSection label="State">
          <window.TweakRadio
            label="Demand level"
            value={t.demand}
            options={[
              { value: 'high', label: 'High' },
              { value: 'low',  label: 'Low'  },
            ]}
            onChange={(v) => setTweak('demand', v)}
          />
        </window.TweakSection>
      </window.TweaksPanel>
    )}
    </>
  );
}

window.App = App;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
