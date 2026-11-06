// Haritayı merkezle
const map = L.map('map').setView([42.0, 45.0], 4);

// Tüm dünyadaki şehir isimlerini İngilizce/Latin gösteren uluslararası harita katmanı
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd'
}).addTo(map);

// GeoJSON dosyasını oku ve haritaya ekle
fetch('./corridors.geojson')
  .then(res => {
    if (!res.ok) throw new Error("corridors.geojson okunamadı!");
    return res.json();
  })
  .then(data => {
    const routeLayer = L.geoJSON(data, {
      style: feature => ({
        color: feature.properties.color || '#2563eb',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        layer.bindPopup(`
          <div style="font-family:sans-serif; min-width:230px; line-height:1.4;">
            <div style="font-size:14px; font-weight:bold; color:${props.color}; margin-bottom:6px;">
              ${props.name}
            </div>
            <div style="margin-bottom:6px;">
              <span style="font-size:11px; font-weight:bold; color:#64748b;">HAT / GEÇİŞLER:</span><br>
              <span style="font-size:12px; color:#1e293b;">${props.borders}</span>
            </div>
            <div>
              <span style="font-size:11px; font-weight:bold; color:#64748b;">NOT:</span><br>
              <span style="font-size:12px; color:#334155;">${props.notes}</span>
            </div>
          </div>
        `);
      }
    }).addTo(map);

    // Açılır menüden güzergâh filtreleme
    const routeSelect = document.getElementById('routeSelect');
    if (routeSelect) {
      routeSelect.addEventListener('change', (e) => {
        const selected = e.target.value;
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
      });
    }
  })
  .catch(err => {
    console.error("Yol verisi yüklenirken hata oluştu:", err);
  });
