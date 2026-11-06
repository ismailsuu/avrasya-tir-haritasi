// --- SÖZLÜK (I18N) ---
const translations = {
  tr: {
    appTitle: "Avrasya Tır Koridorları",
    selectLabel: "KORİDOR SEÇİN:",
    allCorridors: "Tüm Koridorlar ve Ağlar",
    transitTime: "TRANSİT SÜRE:",
    customs: "GÜMRÜK / REJİM:",
    borders: "KORİDOR / SINIRLAR:",
    note: "OPERASYONEL NOT:",
    langBtnText: "EN" // Butona basıldığında geçilecek dil
  },
  en: {
    appTitle: "Eurasia Truck Corridors",
    selectLabel: "SELECT CORRIDOR:",
    allCorridors: "All Corridors & Networks",
    transitTime: "TRANSIT TIME:",
    customs: "CUSTOMS / REGIME:",
    borders: "CORRIDOR / BORDERS:",
    note: "OPERATIONAL NOTE:",
    langBtnText: "TR"
  }
};

let currentLang = 'en'; // Başlangıç dili
let map;
let geoJsonLayer;
let corridorsData = null;

// --- HARİTA BAŞLATMA ---
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  initEvents();
  loadData();
});

function initMap() {
  map = L.map('map', {
    center: [45.0, 55.0],
    zoom: 4,
    minZoom: 3
  });

  // Esri World Street Map (Latin / Global Etiketli Temiz Altlık)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, TomTom',
    maxZoom: 18
  }).addTo(map);
}

// --- POPUP İÇERİK OLUŞTURUCU ---
function buildPopupContent(props, lang) {
  const t = translations[lang];

  const title = lang === 'tr' ? props.name_tr : props.name_en;
  const transit = lang === 'tr' ? props.transit_time_tr : props.transit_time_en;
  const customs = lang === 'tr' ? props.customs_tr : props.customs_en;
  const borders = lang === 'tr' ? props.borders_tr : props.borders_en;
  const note = lang === 'tr' ? props.note_tr : props.note_en;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.45; min-width: 260px;">
      <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 15px; font-weight: 700;">
        ${title}
      </h3>
      <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; font-weight: 700; color: #1e293b;">
        <span>${t.transitTime}</span>
        <span>${transit}</span>
      </div>
      <div style="margin-bottom: 8px;">
        <span style="font-weight: 700; color: #475569; font-size: 11px; display: block; text-transform: uppercase;">${t.customs}</span>
        <span style="color: #1e293b;">${customs}</span>
      </div>
      <div style="margin-bottom: 8px;">
        <span style="font-weight: 700; color: #475569; font-size: 11px; display: block; text-transform: uppercase;">${t.borders}</span>
        <span style="color: #334155;">${borders}</span>
      </div>
      <div>
        <span style="font-weight: 700; color: #475569; font-size: 11px; display: block; text-transform: uppercase;">${t.note}</span>
        <span style="color: #475569;">${note}</span>
      </div>
    </div>
  `;
}

// --- VERİYİ ÇEKME VE ÇİZME ---
function loadData() {
  fetch('corridors.geojson')
    .then(res => res.json())
    .then(data => {
      corridorsData = data;
      renderGeoJson();
      populateDropdown();
      updateUI();
    })
    .catch(err => console.error("GeoJSON yüklenemedi:", err));
}

function renderGeoJson() {
  if (geoJsonLayer) {
    map.removeLayer(geoJsonLayer);
  }

  geoJsonLayer = L.geoJSON(corridorsData, {
    style: (feature) => ({
      color: feature.properties.color || '#2563eb',
      weight: 4,
      opacity: 0.85
    }),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(buildPopupContent(feature.properties, currentLang));
      
      // Çizgiye tıklandığında seçimi ve açılır kutuyu senkronize et
      layer.on('click', () => {
        const select = document.getElementById('corridor-select');
        if (select) select.value = feature.properties.id;
      });
    }
  }).addTo(map);
}

// --- DİL VE ARAYÜZ YÖNETİMİ ---
function updateUI() {
  const t = translations[currentLang];

  // Sol panel metinleri
  const titleEl = document.getElementById('app-title');
  if (titleEl) titleEl.innerText = t.appTitle;

  const selectLabelEl = document.getElementById('select-label');
  if (selectLabelEl) selectLabelEl.innerText = t.selectLabel;

  const langBtn = document.getElementById('lang-btn');
  if (langBtn) langBtn.innerText = t.langBtnText;

  // Dropdown seçeneklerini mevcut dille güncelle
  populateDropdown();

  // Haritadaki tüm katmanların popup içeriklerini güncelle
  if (geoJsonLayer) {
    geoJsonLayer.eachLayer(layer => {
      if (layer.feature && layer.feature.properties) {
        layer.setPopupContent(buildPopupContent(layer.feature.properties, currentLang));
      }
    });
  }

  // Ekranda o an AÇIK bir popup varsa canlı olarak içeriğini yenile
  map.eachLayer(layer => {
    if (layer.getPopup && layer.isPopupOpen && layer.isPopupOpen() && layer.feature) {
      layer.getPopup().setContent(buildPopupContent(layer.feature.properties, currentLang));
      layer.getPopup().update();
    }
  });
}

function populateDropdown() {
  const select = document.getElementById('corridor-select');
  if (!select || !corridorsData) return;

  const currentSelection = select.value || 'all';
  const t = translations[currentLang];

  select.innerHTML = `<option value="all">${t.allCorridors}</option>`;

  corridorsData.features.forEach(f => {
    const p = f.properties;
    const name = currentLang === 'tr' ? p.name_tr : p.name_en;
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = name;
    select.appendChild(option);
  });

  select.value = currentSelection;
}

// --- OLAY DİNLEYİCİLERİ ---
function initEvents() {
  // Dil Değiştirme Butonu
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      currentLang = currentLang === 'tr' ? 'en' : 'tr';
      updateUI();
    });
  }

  // Koridor Filtreleme (Dropdown)
  const select = document.getElementById('corridor-select');
  if (select) {
    select.addEventListener('change', (e) => {
      const selectedId = e.target.value;

      if (!geoJsonLayer) return;

      if (selectedId === 'all') {
        geoJsonLayer.eachLayer(layer => {
          layer.setStyle({ opacity: 0.85, weight: 4 });
        });
        map.fitBounds(geoJsonLayer.getBounds(), { padding: [30, 30] });
      } else {
        let targetBounds = null;
        geoJsonLayer.eachLayer(layer => {
          if (layer.feature.properties.id === selectedId) {
            layer.setStyle({ opacity: 1, weight: 6 });
            targetBounds = layer.getBounds();
            layer.openPopup();
          } else {
            layer.setStyle({ opacity: 0.15, weight: 2 });
          }
        });

        if (targetBounds) {
          map.fitBounds(targetBounds, { padding: [50, 50] });
        }
      }
    });
  }
}
