// Haritayı başlat
const map = L.map('map').setView([42.0, 50.0], 4);

// Açık kaynaklı harita katmanı
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap katkıda bulunanlar'
}).addTo(map);

// TR / EN Dil Sözlüğü
const I18N = {
  tr: {
    title: "Avrasya Tır Koridorları",
    label: "GÜZERGÂH SEÇİN:",
    all: "Tüm Güzergâhlar ve Ağlar",
    btn: "EN",
    bordersLabel: "HAT / GEÇİŞLER:",
    noteLabel: "NOT / PARAMETRE:",
    routes: {
      middle: "Orta Koridor (Trans-Hazar)",
      north: "Kuzey Koridoru (Avrasya)",
      south: "Güney Koridoru (ITI)",
      asia_feed: "Güneydoğu Asya (Vietnam/Tayland)",
      central_asia: "Orta Asya (Tacikistan/AH7)",
      pamir_highway: "Pamir / Kulma (Çin-Tacikistan)",
      india_feed: "Hindistan Multimodal (Deniz+Kara)",
      europe_dist: "Avrupa Dağıtım Ağı (DE, DK, FR, PT)",
      italy_roro: "İtalya Ro-Ro & Güney Avrupa"
    }
  },
  en: {
    title: "Eurasia Truck Corridors",
    label: "SELECT CORRIDOR:",
    all: "All Corridors & Networks",
    btn: "TR",
    bordersLabel: "CORRIDOR / BORDERS:",
    noteLabel: "NOTES / PARAMETERS:",
    routes: {
      middle: "Middle Corridor (Trans-Caspian)",
      north: "Northern Corridor (Eurasian)",
      south: "Southern Corridor (ITI)",
      asia_feed: "Southeast Asia (Vietnam/Thailand)",
      central_asia: "Central Asia (Tajikistan/AH7)",
      pamir_highway: "Pamir / Kulma Pass (China-Tajik)",
      india_feed: "India Multimodal (Sea+Road)",
      europe_dist: "Europe Distribution Network",
      italy_roro: "Italy Ro-Ro & Southern Europe"
    }
  }
};

let currentLang = 'tr';
let routeLayer = null;
let geojsonData = null;

// Menüyü doldur
function populateSelect() {
  const select = document.getElementById('routeSelect');
  if (!select || !geojsonData) return;

  const currentVal = select.value || 'all';
  select.innerHTML = '';

  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.innerText = I18N[currentLang].all;
  select.appendChild(optAll);

  geojsonData.features.forEach(f => {
    const id = f.properties.id;
    const opt = document.createElement('option');
    opt.value = id;
    opt.innerText = I18N[currentLang].routes[id] || f.properties.name;
    select.appendChild(opt);
  });

  select.value = currentVal;
  document.getElementById('uiTitle').innerText = I18N[currentLang].title;
  document.getElementById('uiLabel').innerText = I18N[currentLang].label;
  document.getElementById('langToggle').innerText = I18N[currentLang].btn;
}

// Popup içeriği oluştur
function createPopupContent(props) {
  const t = I18N[currentLang];
  const routeName = t.routes[props.id] || props.name;

  return `
    <div style="font-family:sans-serif; min-width:220px; line-height:1.4;">
      <div style="font-size:14px; font-weight:bold; color:${props.color}; margin-bottom:6px;">
        ${routeName}
      </div>
      <div style="margin-bottom:6px;">
        <span style="font-size:11px; font-weight:bold; color:#64748b;">${t.bordersLabel}</span><br>
        <span style="font-size:12px; color:#1e293b;">${props.borders}</span>
      </div>
      <div>
        <span style="font-size:11px; font-weight:bold; color:#64748b;">${t.noteLabel}</span><br>
        <span style="font-size:12px; color:#334155;">${props.notes}</span>
      </div>
    </div>
  `;
}

// Çizgileri render et
function renderRoutes() {
  if (routeLayer) {
    map.removeLayer(routeLayer);
  }

  routeLayer = L.geoJSON(geojsonData, {
    style: feature => ({
      color: feature.properties.color || '#2563eb',
      weight: 4,
      opacity: 0.85
    }),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(createPopupContent(feature.properties));
    }
  }).addTo(map);

  filterRoutes();
}

// Filtreleme
function filterRoutes() {
  const select = document.getElementById('routeSelect');
  if (!select || !routeLayer) return;
  const selected = select.value;

  routeLayer.eachLayer(layer => {
    if (selected === 'all' || layer.feature.properties.id === selected) {
      layer.setStyle({ opacity: 0.85, weight: 4 });
      if (selected !== 'all' && layer.feature.properties.id === selected) {
        map.fitBounds(layer.getBounds(), { padding: [40, 40] });
      }
    } else {
      layer.setStyle({ opacity: 0, weight: 0 });
    }
  });

  if (selected === 'all') {
    map.setView([42.0, 50.0], 4);
  }
}

// Veriyi yükle
fetch('./corridors.geojson')
  .then(res => res.json())
  .then(data => {
    geojsonData = data;
    populateSelect();
    renderRoutes();

    document.getElementById('routeSelect').addEventListener('change', filterRoutes);

    document.getElementById('langToggle').addEventListener('click', () => {
      currentLang = currentLang === 'tr' ? 'en' : 'tr';
      populateSelect();
      renderRoutes();
    });
  })
  .catch(err => console.error("Hata:", err));
