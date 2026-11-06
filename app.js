// Haritayı başlat
const map = L.map('map').setView([42.0, 45.0], 4);

// API anahtarı gerektirmeyen, İngilizce/Latin etiketli profesyonel harita altlığı (Esri)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 18,
  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom'
}).addTo(map);

// Dil Sözlüğü (TR & EN)
const I18N = {
  tr: {
    title: "Avrasya Tır Koridorları",
    label: "Güzergâh Seçin:",
    all: "Tüm Güzergâhlar ve Ağlar",
    btn: "EN",
    bordersLabel: "HAT / GEÇİŞLER:",
    noteLabel: "NOT / PARAMETRE:",
    routes: {
      middle: "Orta Koridor (Trans-Hazar)",
      north: "Kuzey Koridoru (Avrasya)",
      south: "Güney Koridoru (ITI - Pakistan/İran)",
      europe_dist: "Avrupa Dağıtım Ağı (DE, DK, FR, PT)"
    }
  },
  en: {
    title: "Eurasia Truck Corridors",
    label: "Select Corridor:",
    all: "All Corridors & Networks",
    btn: "TR",
    bordersLabel: "CORRIDOR / BORDERS:",
    noteLabel: "NOTES / PARAMETERS:",
    routes: {
      middle: "Middle Corridor (Trans-Caspian)",
      north: "Northern Corridor (Eurasian)",
      south: "Southern Corridor (ITI - Pak/Iran)",
      europe_dist: "Europe Distribution Network (DE, DK, FR, PT)"
    }
  }
};

let currentLang = 'tr';
let routeLayer = null;
let geojsonData = null;

// Menüyü geçerli dile göre doldur
function populateSelect() {
  const select = document.getElementById('routeSelect');
  const currentVal = select.value || 'all';
  select.innerHTML = '';

  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.innerText = I18N[currentLang].all;
  select.appendChild(optAll);

  const routeList = [
    { id: 'middle', key: 'middle' },
    { id: 'north', key: 'north' },
    { id: 'south', key: 'south' },
    { id: 'europe_dist', key: 'europe_dist' }
  ];

  routeList.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.innerText = I18N[currentLang].routes[r.key];
    select.appendChild(opt);
  });

  select.value = currentVal;
  document.getElementById('uiTitle').innerText = I18N[currentLang].title;
  document.getElementById('uiLabel').innerText = I18N[currentLang].label;
  document.getElementById('langToggle').innerText = I18N[currentLang].btn;
}

// Popup içeriğini seçili dile göre üret
function createPopupContent(props) {
  const t = I18N[currentLang];
  const routeName = t.routes[props.id] || props.name;

  return `
    <div style="font-family:sans-serif; min-width:230px; line-height:1.4;">
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

// Çizgileri haritaya bas
function renderRoutes() {
  if (routeLayer) {
    map.removeLayer(routeLayer);
  }

  routeLayer = L.geoJSON(geojsonData, {
    style: feature => ({
      color: feature.properties.color || '#2563eb',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(createPopupContent(feature.properties));
    }
  }).addTo(map);

  filterRoutes();
}

// Filtreleme
function filterRoutes() {
  const selected = document.getElementById('routeSelect').value;
  if (!routeLayer) return;

  routeLayer.eachLayer(layer => {
    if (selected === 'all' || layer.feature.properties.id === selected) {
      layer.setStyle({ opacity: 0.9, weight: 5 });
      if (selected !== 'all' && layer.feature.properties.id === selected) {
        map.fitBounds(layer.getBounds(), { padding: [40, 40] });
      }
    } else {
      layer.setStyle({ opacity: 0, weight: 0 });
    }
  });

  if (selected === 'all') {
    map.setView([42.0, 45.0], 4);
  }
}

// GeoJSON verisini çek
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
  .catch(err => console.error("Veri yüklenemedi:", err));
