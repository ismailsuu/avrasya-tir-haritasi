// --- SÖZLÜK ---
const translations = {
  tr: {
    appTitle: "Avrasya Tır Koridorları",
    selectLabel: "GÜZERGÂH SEÇİN:",
    allCorridors: "Tüm Koridorlar ve Ağlar",
    transitTime: "TRANSİT SÜRE:",
    customs: "GÜMRÜK / REJİM:",
    borders: "KORİDOR / SINIRLAR:",
    note: "OPERASYONEL NOT:",
    langBtn: "EN"
  },
  en: {
    appTitle: "Eurasia Truck Corridors",
    selectLabel: "SELECT CORRIDOR:",
    allCorridors: "All Corridors & Networks",
    transitTime: "TRANSIT TIME:",
    customs: "CUSTOMS / REGIME:",
    borders: "CORRIDOR / BORDERS:",
    note: "OPERATIONAL NOTE:",
    langBtn: "TR"
  }
};

let currentLang = 'tr'; // Başlangıç dili Türkçe
let map;
let geoJsonLayer;
let rawGeoJson = null;

// HTML'deki select ve buton elementlerini güvenli bulucu
function getSelectEl() {
  return document.querySelector('select') || document.getElementById('corridor-select');
}

function getLangBtnEl() {
  return document.getElementById('lang-btn') || document.querySelector('.lang-btn') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'EN' || b.innerText.trim() === 'TR');
}

function getTitleEl() {
  return document.querySelector('h1, h2, h3, .title') || document.getElementById('app-title');
}

function getLabelEl() {
  return document.querySelector('label') || document.getElementById('select-label');
}

// --- HARİTA BAŞLATMA ---
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  loadData();
});

function initMap() {
  map = L.map('map', {
    center: [46.0, 50.0],
    zoom: 4,
    minZoom: 3
  });

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, TomTom',
    maxZoom: 18
  }).addTo(map);
}

// --- POPUP HTML ÜRETİCİ ---
function buildPopup(props, lang) {
  const t = translations[lang];
  const isTr = lang === 'tr';

  const title = isTr ? (props.name_tr || props.name) : (props.name_en || props.name);
  const transit = isTr ? (props.transit_time_tr || props.transit_time) : (props.transit_time_en || props.transit_time);
  const customs = isTr ? (props.customs_tr || props.customs) : (props.customs_en || props.customs);
  const borders = isTr ? (props.borders_tr || props.borders) : (props.borders_en || props.borders);
  const note = isTr ? (props.note_tr || props.operational_note) : (props.note_en || props.operational_note);

  return `
    <div style="font-family: inherit; font-size: 13px; line-height: 1.45; min-width: 250px;">
      <h3 style="color: #c62828; margin: 0 0 8px 0; font-size: 15px; font-weight: 700;">${title}</h3>
      <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; font-weight: bold; color: #0f172a;">
        <span>${t.transitTime}</span>
        <span>${transit}</span>
      </div>
      <div style="margin-bottom: 6px;">
        <span style="font-weight: 700; color: #475569; font-size: 11px; display: block;">${t.customs}</span>
        <span style="color: #1e293b;">${customs}</span>
      </div>
      <div style="margin-bottom: 6px;">
        <span style="font-weight: 700; color: #475569; font-size: 11px; display: block;">${t.borders}</span>
        <span style="color: #334155;">${borders}</span>
      </div>
      <div>
        <span style="font-weight: 700; color: #475569; font-size: 11px; display: block;">${t.note}</span>
        <span style="color: #475569;">${note}</span>
      </div>
    </div>
  `;
}

// --- VERİ ÇEKME ---
function loadData() {
  fetch('corridors.geojson')
    .then(res => res.json())
    .then(data => {
      rawGeoJson = data;

      geoJsonLayer = L.geoJSON(data, {
        style: (feature) => ({
          color: feature.properties.color || '#ef4444',
          weight: 4,
          opacity: 0.9
        }),
        onEachFeature: (feature, layer) => {
          layer.bindPopup(buildPopup(feature.properties, currentLang));
          layer.on('click', () => {
            const sel = getSelectEl();
            if (sel) sel.value = feature.properties.id || '';
          });
        }
      }).addTo(map);

      // Veri yüklendikten sonra listeyi doldur ve dili eşitle
      populateDropdown();
      updateLanguageUI();
      bindEvents();
    })
    .catch(err => console.error("GeoJSON yüklenemedi:", err));
}

// --- DROPDOWN DOLDURUCU ---
function populateDropdown() {
  const select = getSelectEl();
  if (!select || !rawGeoJson) return;

  const currentVal = select.value || 'all';
  const t = translations[currentLang];

  select.innerHTML = `<option value="all">${t.allCorridors}</option>`;

  rawGeoJson.features.forEach(f => {
    const p = f.properties;
    const name = currentLang === 'tr' ? (p.name_tr || p.name) : (p.name_en || p.name);
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = name;
    select.appendChild(opt);
  });

  select.value = currentVal;
}

// --- DİL GÜNCELLEYİCİ ---
function updateLanguageUI() {
  const t = translations[currentLang];

  const titleEl = getTitleEl();
  if (titleEl) titleEl.innerText = t.appTitle;

  const labelEl = getLabelEl();
  if (labelEl) labelEl.innerText = t.selectLabel;

  const btn = getLangBtnEl();
  if (btn) btn.innerText = t.langBtn;

  populateDropdown();

  // Katmanların popup içeriklerini yenile
  if (geoJsonLayer) {
    geoJsonLayer.eachLayer(layer => {
      if (layer.feature && layer.feature.properties) {
        layer.setPopupContent(buildPopup(layer.feature.properties, currentLang));
      }
    });
  }

  // Açık olan popup'ı canlı güncelle
  map.eachLayer(layer => {
    if (layer.getPopup && layer.isPopupOpen() && layer.feature) {
      layer.getPopup().setContent(buildPopup(layer.feature.properties, currentLang));
      layer.getPopup().update();
    }
  });
}

// --- ETKİLEŞİMLER ---
function bindEvents() {
  const btn = getLangBtnEl();
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = "true";
    btn.addEventListener('click', () => {
      currentLang = currentLang === 'tr' ? 'en' : 'tr';
      updateLanguageUI();
    });
  }

  const select = getSelectEl();
  if (select && !select.dataset.bound) {
    select.dataset.bound = "true";
    select.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      if (!geoJsonLayer) return;

      if (selectedId === 'all') {
        geoJsonLayer.eachLayer(layer => layer.setStyle({ opacity: 0.9, weight: 4 }));
        map.fitBounds(geoJsonLayer.getBounds(), { padding: [30, 30] });
      } else {
        let foundBounds = null;
        geoJsonLayer.eachLayer(layer => {
          if (layer.feature.properties.id === selectedId) {
            layer.setStyle({ opacity: 1, weight: 6 });
            foundBounds = layer.getBounds();
            layer.openPopup();
          } else {
            layer.setStyle({ opacity: 0.2, weight: 2 });
          }
        });
        if (foundBounds) map.fitBounds(foundBounds, { padding: [40, 40] });
      }
    });
  }
}
