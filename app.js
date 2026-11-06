// Harita Başlatma
const map = L.map('map', {
  center: [46.0, 52.0],
  zoom: 4,
  minZoom: 3
});

// Latin/Global etiketli altlık
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, TomTom',
  maxZoom: 18
}).addTo(map);

let geoJsonLayer;
let currentLang = 'tr';

// İki dili birlikte basan popup şablonu
function createBilingualPopup(p) {
  return `
    <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 260px;">
      <h3 style="color: #dc2626; margin: 0 0 8px 0; font-size: 15px; font-weight: bold;">
        ${p.name}
      </h3>
      
      <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; font-weight: bold; color: #0f172a;">
        <span>SÜRE / TRANSIT TIME:</span>
        <span>${p.transit_time}</span>
      </div>
      
      <div style="margin-bottom: 6px;">
        <span style="font-weight: bold; color: #475569; font-size: 11px; display: block;">GÜMRÜK / CUSTOMS REGIME:</span>
        <span>${p.customs}</span>
      </div>
      
      <div style="margin-bottom: 6px;">
        <span style="font-weight: bold; color: #475569; font-size: 11px; display: block;">GÜZERGÂH / CORRIDOR & BORDERS:</span>
        <span style="color: #334155;">${p.borders}</span>
      </div>
      
      <div>
        <span style="font-weight: bold; color: #475569; font-size: 11px; display: block;">NOT / OPERATIONAL NOTE:</span>
        <p style="margin: 2px 0 4px 0; color: #334155;">🇹🇷 ${p.note_tr}</p>
        <p style="margin: 0; color: #64748b; font-style: italic;">🇬🇧 ${p.note_en}</p>
      </div>
    </div>
  `;
}

// GeoJSON Yükleme
fetch('corridors.geojson')
  .then(res => res.json())
  .then(data => {
    // GeoJSON Çizgileri
    geoJsonLayer = L.geoJSON(data, {
      style: (feature) => ({
        color: feature.properties.color || '#ef4444',
        weight: 4,
        opacity: 0.85
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(createBilingualPopup(feature.properties));
        
        layer.on('click', () => {
          const select = document.querySelector('select');
          if (select) select.value = feature.properties.id;
        });
      }
    }).addTo(map);

    // Açılır Listeyi (Dropdown) Doldur
    const select = document.querySelector('select');
    if (select) {
      select.innerHTML = '<option value="all">Tüm Koridorlar / All Corridors</option>';
      data.features.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.properties.id;
        opt.textContent = f.properties.name;
        select.appendChild(opt);
      });

      select.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'all') {
          geoJsonLayer.eachLayer(l => l.setStyle({ opacity: 0.85, weight: 4 }));
          map.fitBounds(geoJsonLayer.getBounds(), { padding: [30, 30] });
        } else {
          let targetBounds = null;
          geoJsonLayer.eachLayer(l => {
            if (l.feature.properties.id === val) {
              l.setStyle({ opacity: 1, weight: 6 });
              targetBounds = l.getBounds();
              l.openPopup();
            } else {
              l.setStyle({ opacity: 0.2, weight: 2 });
            }
          });
          if (targetBounds) map.fitBounds(targetBounds, { padding: [40, 40] });
        }
      });
    }
  });

// Sol Panel Dil Butonu (TR / EN)
const langBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'EN' || b.innerText.trim() === 'TR');
if (langBtn) {
  langBtn.addEventListener('click', () => {
    currentLang = currentLang === 'tr' ? 'en' : 'tr';
    langBtn.innerText = currentLang === 'tr' ? 'EN' : 'TR';

    const titleEl = document.querySelector('h1, h2, h3, .title');
    if (titleEl) {
      titleEl.innerText = currentLang === 'tr' ? 'Avrasya Tır Koridorları' : 'Eurasia Truck Corridors';
    }

    const labelEl = document.querySelector('label');
    if (labelEl) {
      labelEl.innerText = currentLang === 'tr' ? 'GÜZERGÂH SEÇİN:' : 'SELECT CORRIDOR:';
    }
  });
}
