// Haritayı Avrasya merkezli başlat
const map = L.map('map').setView([42.0, 50.0], 4);

// Açık kaynaklı harita altlığı
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap katkıda bulunanlar'
}).addTo(map);

// GeoJSON verisini çek ve haritaya ekle
fetch('./corridors.geojson')
  .then(res => {
    if (!res.ok) throw new Error("corridors.geojson yüklenemedi!");
    return res.json();
  })
  .then(data => {
    const routeLayer = L.geoJSON(data, {
      style: feature => ({
        color: feature.properties.color || '#2563eb',
        weight: 4,
        opacity: 0.85
      }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        layer.bindPopup(`
          <div style="font-family:sans-serif; min-width:220px; line-height:1.4;">
            <div style="font-size:14px; font-weight:bold; color:${props.color}; margin-bottom:6px;">
              ${props.name}
            </div>
            <div style="margin-bottom:6px;">
              <span style="font-size:11px; font-weight:bold; color:#64748b;">GÜZERGÂH / GEÇİŞLER:</span><br>
              <span style="font-size:12px; color:#1e293b;">${props.borders}</span>
            </div>
            <div>
              <span style="font-size:11px; font-weight:bold; color:#64748b;">NOT / PARAMETRE:</span><br>
              <span style="font-size:12px; color:#334155;">${props.notes}</span>
            </div>
          </div>
        `);
      }
    }).addTo(map);

    // Açılır menüden güzergâh filtreleme
    const routeSelect = document.getElementById('routeSelect');
    routeSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      
      routeLayer.eachLayer(layer => {
        if (selected === 'all' || layer.feature.properties.id === selected) {
          layer.setStyle({ opacity: 0.85, weight: 4 });
          if (selected !== 'all' && layer.feature.properties.id === selected) {
            map.fitBounds(layer.getBounds(), { padding: [50, 50] });
          }
        } else {
          layer.setStyle({ opacity: 0, weight: 0 });
        }
      });

      if (selected === 'all') {
        map.setView([42.0, 50.0], 4);
      }
    });
  })
  .catch(err => {
    console.error("GeoJSON yüklenirken hata oluştu:", err);
  });
