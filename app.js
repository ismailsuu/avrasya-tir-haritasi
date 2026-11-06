// Haritayı Avrasya merkezli başlat
const map = L.map('map').setView([42.0, 50.0], 4);

// Orijinal, ücretsiz ve hatasız OpenStreetMap katmanı
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap katkıda bulunanlar'
}).addTo(map);

// GeoJSON verisini çek ve haritaya ekle
fetch('./corridors.geojson')
  .then(res => {
    if (!res.ok) throw new Error("corridors.geojson bulunamadı!");
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
          <div style="font-family:sans-serif; min-width:200px; line-height:1.4;">
            <div style="font-size:14px; font-weight:bold; color:${props.color}; margin-bottom:4px;">
              ${props.name}
            </div>
            <div style="font-size:12px; margin-bottom:4px;">
              <b>Geçişler:</b> ${props.borders}
            </div>
            <div style="font-size:12px; color:#475569;">
              <b>Not:</b> ${props.notes}
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
    }
  })
  .catch(err => console.error("Hata:", err));
