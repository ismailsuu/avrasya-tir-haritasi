// Haritayı Avrasya merkezli başlat
const map = L.map('map').setView([42.0, 50.0], 4);

// Açık kaynaklı harita altlığı
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap katkıda bulunanlar'
}).addTo(map);

// Rapordaki rotaların ana durak noktaları (Boylam, Enlem)
const ROUTES_CONFIG = [
  {
    id: "middle",
    name: "Orta Koridor (Trans-Hazar / TITR)",
    color: "#2563eb",
    borders: "Horgos -> Almatı -> Aktau ~ Ro-Ro ~ Bakü -> Tiflis -> Sarp -> Karadeniz Sahil Yolu -> Yavuz Sultan Selim Köprüsü -> Kapıkule",
    notes: "Rusya'yı bypass eder. Hazar Denizi feribot/Ro-Ro geçişi ve Yavuz Sultan Selim tır aksını kullanır.",
    // Gerçek yollarla bağlanacak duraklar:
    stops: [
      [80.41, 44.21], // Horgos
      [76.95, 43.22], // Almatı
      [51.16, 43.65], // Aktau Limanı
      // Hazar Ro-Ro geçişi sonrası:
      [49.86, 40.40], // Bakü Limanı
      [44.78, 41.71], // Tiflis
      [41.55, 41.52], // Sarp Sınır Kapısı
      [39.72, 41.00], // Trabzon Sahil Yolu
      [35.80, 40.65], // Amasya
      [32.85, 39.93], // Ankara / Gerede
      [29.11, 41.20], // Kuzey Marmara / YSS Köprüsü
      [26.55, 41.67]  // Kapıkule Sınır Kapısı
    ]
  },
  {
    id: "north",
    name: "Kuzey Koridoru (Avrasya)",
    color: "#dc2626",
    borders: "Horgos -> Astana -> Petropavl -> Moskova (M1) -> Minsk -> Brest / Kukuryki (Polonya)",
    notes: "Düz coğrafi yapılı otoyoldur. Belarus-Polonya sınırında jeopolitik kısıtlamalar bulunur.",
    stops: [
      [80.41, 44.21], // Horgos
      [71.43, 51.16], // Astana
      [69.15, 54.87], // Petropavl
      [61.40, 55.16], // Çelyabinsk
      [37.61, 55.75], // Moskova
      [27.56, 53.90], // Minsk
      [23.15, 52.04]  // Brest / Kukuryki Sınırı
    ]
  },
  {
    id: "south",
    name: "Güney Koridoru (ITI - Pakistan, İran, Türkiye)",
    color: "#16a34a",
    borders: "Karaçi -> Quetta -> Taftan/Mirjaveh -> Zahedan -> Tahran -> Tebriz -> Gürbulak -> Erzurum -> İstanbul -> Kapıkule",
    notes: "Güney Asya yüklerinin kesintisiz karayolu omurgasıdır. Çift şoför (AETR) standarttır.",
    stops: [
      [67.00, 24.86], // Karaçi
      [66.97, 30.17], // Quetta
      [61.58, 28.97], // Taftan / Mirjaveh Sınırı
      [51.38, 35.68], // Tahran
      [46.29, 38.08], // Tebriz
      [44.38, 39.40], // Gürbulak Sınır Kapısı
      [41.27, 39.90], // Erzurum
      [32.85, 39.93], // Ankara
      [28.97, 41.00], // İstanbul
      [26.55, 41.67]  // Kapıkule
    ]
  },
  {
    id: "europe_dist",
    name: "Avrupa Dağıtım Ağı (Almanya, Danimarka, Fransa, Portekiz)",
    color: "#06b6d4",
    borders: "Kapıkule -> Sofya -> Belgrad -> Budapeşte -> Viyana -> Passau -> Hamburg -> Danimarka / Fransa / Portekiz",
    notes: "AB Ortak Transit T1 rejimi ve TEN-T koridorları uygulanır.",
    stops: [
      [26.55, 41.67], // Kapıkule
      [23.32, 42.69], // Sofya
      [20.46, 44.78], // Belgrad
      [19.04, 47.49], // Budapeşte
      [16.37, 48.20], // Viyana
      [13.43, 48.56], // Passau (Almanya Girişi)
      [9.99, 53.55],  // Hamburg
      [9.43, 54.78],  // Padborg (Danimarka Sınırı)
      [2.35, 48.85],  // Paris (Fransa)
      [-0.57, 44.83], // Bordeaux
      [-4.72, 41.65], // Valladolid (İspanya)
      [-9.13, 38.72]  // Lizbon (Portekiz)
    ]
  }
];

const layersGroup = {};

// OSRM API üzerinden gerçek karayolu geometrisini çeken fonksiyon
async function fetchRealRoad(stops) {
  // OSRM formatı: lon,lat;lon,lat;...
  const coordString = stops.map(s => `${s[0]},${s[1]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?geometries=geojson&overview=full`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry;
    }
  } catch (err) {
    console.warn("OSRM servisine ulaşılamadı, düz hat kullanılıyor:", err);
  }
  // API yanıt vermezse yedek düz hat
  return { type: "LineString", coordinates: stops };
}

// Bütün rotaları sırayla gerçek yollara oturtup haritaya bas
async function loadAllRoutes() {
  for (const r of ROUTES_CONFIG) {
    const roadGeometry = await fetchRealRoad(r.stops);
    
    const layer = L.geoJSON(roadGeometry, {
      style: {
        color: r.color,
        weight: 5,
        opacity: 0.85
      }
    }).addTo(map);

    layer.bindPopup(`
      <div style="font-family:sans-serif; min-width:220px; line-height:1.4;">
        <div style="font-size:14px; font-weight:bold; color:${r.color}; margin-bottom:6px;">
          ${r.name}
        </div>
        <div style="margin-bottom:6px;">
          <span style="font-size:11px; font-weight:bold; color:#64748b;">GÜZERGÂH / GEÇİŞLER:</span><br>
          <span style="font-size:12px; color:#1e293b;">${r.borders}</span>
        </div>
        <div>
          <span style="font-size:11px; font-weight:bold; color:#64748b;">NOT / PARAMETRE:</span><br>
          <span style="font-size:12px; color:#334155;">${r.notes}</span>
        </div>
      </div>
    `);

    layersGroup[r.id] = layer;
  }
}

loadAllRoutes();

// Menüden seçim yapıldığında filtreleme
document.getElementById('routeSelect').addEventListener('change', (e) => {
  const selected = e.target.value;

  Object.keys(layersGroup).forEach(id => {
    const layer = layersGroup[id];
    if (selected === 'all' || selected === id) {
      layer.setStyle({ opacity: 0.85, weight: 5 });
      if (selected === id) {
        map.fitBounds(layer.getBounds(), { padding: [40, 40] });
      }
    } else {
      layer.setStyle({ opacity: 0, weight: 0 });
    }
  });

  if (selected === 'all') {
    map.setView([42.0, 50.0], 4);
  }
});
