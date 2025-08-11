// Destinos bonitos (MX) con imágenes
const destinos = Object.freeze([
  { nombre:"Xcaret", tipo:"playa", costo:2500, tiempo:6, lat:20.5832, lng:-87.1206, icon:"🌴", ciudad:"Playa del Carmen",
    img:"https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop" },
  { nombre:"Tulum Zona Arqueológica", tipo:"playa", costo:95, tiempo:3, lat:20.2149, lng:-87.4297, icon:"🏛️", ciudad:"Tulum",
    img:"https://images.unsplash.com/photo-1526404079165-8e0659103b53?q=80&w=1200&auto=format&fit=crop" },
  { nombre:"Chichén Itzá", tipo:"cultura", costo:614, tiempo:4, lat:20.6843, lng:-88.5678, icon:"🛕", ciudad:"Yucatán",
    img:"https://images.unsplash.com/photo-1546026423-cc4642628d2b?q=80&w=1200&auto=format&fit=crop" },
  { nombre:"Cenote Ik-Kil", tipo:"naturaleza", costo:200, tiempo:2, lat:20.6895, lng:-88.5687, icon:"💧", ciudad:"Yucatán",
    img:"https://images.unsplash.com/photo-1587573089580-2329f1b7b655?q=80&w=1200&auto=format&fit=crop" },
  { nombre:"Teotihuacán", tipo:"cultura", costo:95, tiempo:4, lat:19.6925, lng:-98.8438, icon:"🗿", ciudad:"Edomex",
    img:"https://images.unsplash.com/photo-1505845664900-7d955d6ba67c?q=80&w=1200&auto=format&fit=crop" },
  { nombre:"Bosque de Chapultepec", tipo:"naturaleza", costo:0, tiempo:2, lat:19.420, lng:-99.186, icon:"🌳", ciudad:"CDMX",
    img:"https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop" },
  { nombre:"Palacio de Bellas Artes", tipo:"cultura", costo:100, tiempo:1.5, lat:19.4351, lng:-99.1415, icon:"🎭", ciudad:"CDMX",
    img:"https://images.unsplash.com/photo-1583454110553-3f17b0b3d22a?q=80&w=1200&auto=format&fit=crop" },
  { nombre:"Hierve el Agua", tipo:"naturaleza", costo:70, tiempo:3, lat:16.8677, lng:-96.2759, icon:"⛰️", ciudad:"Oaxaca",
    img:"https://images.unsplash.com/photo-1603859363783-13213e63ed05?q=80&w=1200&auto=format&fit=crop" },
  { nombre:"El Arco de Cabo San Lucas", tipo:"playa", costo:600, tiempo:3, lat:22.875, lng:-109.904, icon:"⛵", ciudad:"Baja California Sur",
    img:"https://images.unsplash.com/photo-1526401485004-2fda9f4f7c23?q=80&w=1200&auto=format&fit=crop" }
]);

// Utilidades
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
const formatMXN = n => n.toLocaleString("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0});
const formatH   = n => `${n} h`;
const haversine = (a,b)=>{
  const R=6371;
  const dLat=( (b.lat-a.lat) * Math.PI /180);
  const dLon=( (b.lng-a.lng) * Math.PI /180);
  const s1=Math.sin(dLat/2)**2;
  const s2=Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;
  const c=2*Math.atan2(Math.sqrt(s1+s2), Math.sqrt(1-(s1+s2)));
  return R*c;
};

let userPos = Object.freeze({ lat:19.4326, lng:-99.1332, label:"CDMX (por defecto)" });
let ultimaRuta = { lista:[], tiempo:0, costo:0 };

// Mapa Leaflet
const mapa = L.map("mapa").setView([userPos.lat, userPos.lng], 5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:"Map data © OpenStreetMap contributors"
}).addTo(mapa);
let markers = [];

const resultadosDiv = document.getElementById("resultados");
const resumenDiv    = document.getElementById("resumen");
const ubicacionTxt  = document.getElementById("ubicacionTexto");

// Geolocalización
document.getElementById("btnUbicacion").addEventListener("click", ()=>{
  if(!navigator.geolocation){ ubicacionTxt.value = "Geolocalización no soportada"; return; }
  navigator.geolocation.getCurrentPosition(pos=>{
    userPos = Object.freeze({ lat:pos.coords.latitude, lng:pos.coords.longitude, label:"Mi ubicación" });
    ubicacionTxt.value = `${userPos.label}: ${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}`;
    mapa.setView([userPos.lat,userPos.lng], 6);
    L.circleMarker([userPos.lat,userPos.lng], {radius:6, color:"#7c5dfa"}).addTo(mapa).bindPopup("Tú estás aquí");
  }, ()=>{ ubicacionTxt.value = "No se pudo obtener ubicación"; }, {enableHighAccuracy:true, timeout:7000});
});

// Limpiar
document.getElementById("btnLimpiar").addEventListener("click", ()=>{
  document.querySelectorAll('input[name="categoria"]').forEach(c=>c.checked=false);
  document.querySelector('input[value="naturaleza"]').checked=true;
  document.querySelector('input[value="cultura"]').checked=true;
  document.getElementById("tiempo").value=6;
  document.getElementById("presupuesto").value=1200;
  resultadosDiv.innerHTML = "";
  resumenDiv.innerHTML = "";
  clearMarkers();
  ultimaRuta = { lista:[], tiempo:0, costo:0 };
});

// CSV
document.getElementById("btnCSV").addEventListener("click", ()=>{
  const rows = [
    ["Nombre","Tipo","Ciudad","Costo (MXN)","Estancia (h)","Distancia (km)"],
    ...ultimaRuta.lista.map(d=>[d.nombre,d.tipo,d.ciudad,d.costo,d.tiempo,(d.distancia||0).toFixed(2)])
  ];
  const csv = rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "ruta_turistica.csv";
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
});

// PDF
document.getElementById("btnPDF").addEventListener("click", ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF(); let y = 15;
  doc.setFontSize(16); doc.text("Ruta Turística Inteligente", 14, y); y+=8;
  doc.setFontSize(11);
  doc.text(`Lugares: ${ultimaRuta.lista.length}`, 14, y); y+=6;
  doc.text(`Tiempo total: ${ultimaRuta.tiempo.toFixed(1)} h`, 14, y); y+=6;
  doc.text(`Costo total: ${ultimaRuta.costo.toLocaleString("es-MX")} MXN`, 14, y); y+=8;
  ultimaRuta.lista.forEach((d,i)=>{ const line = `${i+1}. ${d.nombre} | ${d.ciudad} | ${d.tipo} | ${formatMXN(d.costo)} | ${d.tiempo} h | ${(d.distancia||0).toFixed(1)} km`;
    doc.text(line, 14, y); y+=6; if (y > 280) { doc.addPage(); y = 15; }});
  doc.save("ruta_turistica.pdf");
});

function clearMarkers(){ markers.forEach(m=>mapa.removeLayer(m)); markers = []; }

function renderCards(lista){
  resultadosDiv.innerHTML = "";
  if(lista.length===0){ resultadosDiv.innerHTML = `<div class="stat">No se encontraron sitios que cumplan con tus filtros.</div>`; return; }
  const frag = document.createDocumentFragment();
  lista.forEach(d=>{
    const card = document.createElement("div");
    card.className = "place";
    card.innerHTML = `
      <img class="place__thumb" src="${d.img}" alt="${d.nombre}">
      <div>
        <h3 class="place__title">${d.icon || "📍"} ${d.nombre}</h3>
        <div class="place__meta">${d.ciudad} • ${d.tipo}</div>
        <div class="badges">
          <span class="badge"><i class="fa-solid fa-coins"></i> ${formatMXN(d.costo)}</span>
          <span class="badge"><i class="fa-solid fa-clock"></i> ${formatH(d.tiempo)}</span>
          <span class="badge badge--warn"><i class="fa-solid fa-location-dot"></i> ${(d.distancia||0).toFixed(1)} km</span>
        </div>
      </div>`;
    frag.appendChild(card);
  });
  resultadosDiv.appendChild(frag);
}

function renderMap(lista){
  clearMarkers();
  lista.forEach(d=>{
    const mk = L.marker([d.lat,d.lng]).addTo(mapa)
      .bindPopup(`<b>${d.nombre}</b><br>${d.tipo} • ${d.ciudad}<br>${formatMXN(d.costo)} • ${formatH(d.tiempo)}`);
    markers.push(mk);
  });
  if(lista.length>0){
    const b = L.latLngBounds(lista.map(d=>[d.lat,d.lng]));
    mapa.fitBounds(b.pad(0.2));
  }
}

// Greedy por cercanía respetando tiempo/presupuesto
function optimizarRuta({ categorias, tiempoMax, presupuestoMax }){
  const candidatos = destinos
    .filter(d => categorias.includes(d.tipo))
    .map(d => ({ ...d, distancia: haversine(userPos, {lat:d.lat, lng:d.lng}) }))
    .sort((a,b) => a.distancia - b.distancia);

  return candidatos.reduce((acc, d)=>{
    const nuevoTiempo = acc.tiempo + d.tiempo;
    const nuevoCosto  = acc.costo  + d.costo;
    if(nuevoTiempo <= tiempoMax && nuevoCosto <= presupuestoMax){
      return { lista:[...acc.lista, d], tiempo:nuevoTiempo, costo:nuevoCosto };
    }
    return acc;
  }, { lista:[], tiempo:0, costo:0 });
}

function renderResumen({ tiempo, costo, lista }){
  resumenDiv.innerHTML = `
    <div class="stat"><i class="fa-solid fa-location-dot"></i> Lugares: <b>${lista.length}</b></div>
    <div class="stat"><i class="fa-solid fa-clock"></i> Tiempo total: <b>${tiempo.toFixed(1)} h</b></div>
    <div class="stat"><i class="fa-solid fa-coins"></i> Costo total: <b>${formatMXN(costo)}</b></div>
  `;
}

document.getElementById("formulario").addEventListener("submit", (e)=>{
  e.preventDefault();
  const categorias = Array.from(document.querySelectorAll('input[name="categoria"]:checked')).map(x=>x.value);
  const tiempoMax = clamp(parseFloat(document.getElementById("tiempo").value)||0, 1, 72);
  const presupuestoMax = Math.max(0, parseFloat(document.getElementById("presupuesto").value)||0);

  if(categorias.length===0){
    resultadosDiv.innerHTML = `<div class="stat">Selecciona al menos una categoría.</div>`;
    resumenDiv.innerHTML = "";
    return;
  }

  const ruta = optimizarRuta({ categorias, tiempoMax, presupuestoMax });
  ultimaRuta = ruta;
  renderResumen(ruta);
  renderCards(ruta.lista);
  renderMap(ruta.lista);
});

// Carga inicial
(function(){
  const ruta = optimizarRuta({ categorias:["naturaleza","cultura"], tiempoMax:6, presupuestoMax:1200 });
  ultimaRuta = ruta;
  renderResumen(ruta);
  renderCards(ruta.lista);
  renderMap(ruta.lista);
})();
