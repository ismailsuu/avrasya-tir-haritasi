// Haritayı İstanbul/Hazar merkezli başlat
const map = L.map('map').setView([41.0, 45.0], 4);

// Açık kaynaklı OpenStreetMap altlığı
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap'
}).addTo(map);

// GeoJSON formatında saklanan tır koridorlarını yükle
fetch('./corridors.geojson')
  .then(res => res.json())
  .then(data => {
    const routeLayer = L.geoJSON(data, {
      style: feature => ({
        color: feature.properties.type === 'middle' ? '#2563eb' : '#dc2626',
        weight: 4,
        opacity: 0.8
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<b>Koridor:</b> ${feature.properties.name}<br><b>Sınır Kapıları:</b> ${feature.properties.borders}`);
      }
    }).addTo(map);

    // Dropdown filtreleme
    document.getElementById('routeSelect').addEventListener('change', (e) => {
      const selected = e.target.value;
      routeLayer.eachLayer(layer => {
        if (selected === 'all' || layer.feature.properties.type === selected) {
          layer.setStyle({ opacity: 0.8, weight: 4 });
        } else {
          layer.setStyle({ opacity: 0, weight: 0 });
        }
      });
    });
  })
  .catch(err => console.error("Koridor verisi yüklenemedi:", err));
