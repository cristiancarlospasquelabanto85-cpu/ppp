// Mapa real de Huánuco (Leaflet + OpenStreetMap). Los repartidores se muestran SOLO con GPS real recibido (Live).
// COORDENADAS APROXIMADAS de los 15 puntos del sistema y de las zonas: ajústalas aquí si necesitas precisión.
const HCO_COORDS={A:[-9.9306,-76.2422],B:[-9.9010,-76.2290],C:[-9.9150,-76.2330],D:[-9.8780,-76.2050],E:[-9.9000,-76.2150],F:[-9.9230,-76.2380],G:[-9.9340,-76.2400],H:[-9.9560,-76.2440],I:[-9.9380,-76.2450],J:[-9.9420,-76.2370],K:[-9.9650,-76.2420],L:[-9.9250,-76.2520],M:[-9.9100,-76.2460],N:[-9.9600,-76.2300],O:[-9.9700,-76.2500]};
const HCO_ZONES=[{id:'centro',name:'Huánuco Centro',c:[-9.9306,-76.2422],r:1700,color:'#22d3ee'},{id:'amarilis',name:'Amarilis',c:[-9.9050,-76.2290],r:2400,color:'#34d399'},{id:'pillco',name:'Pillco Marca',c:[-9.9600,-76.2420],r:2400,color:'#fb923c'}];
const HCO_STATE={pendiente:['pendiente','#8aa0c4'],asignado:['en preparación','#fb923c'],'en reparto':['en camino','#22d3ee'],entregado:['entregado','#34d399']};
let hmap,hl={},roadCache={};
const hState=o=>(HCO_STATE[o.status]||[o.status])[0];
const hZone=ll=>HCO_ZONES.reduce((b,z)=>L.latLng(ll).distanceTo(z.c)<L.latLng(ll).distanceTo(b.c)?z:b);
function hcoShow(){if(!hmap){hmap=L.map('hmap').setView([-9.93,-76.235],13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(hmap);
  HCO_ZONES.forEach(z=>L.circle(z.c,{radius:z.r,color:z.color,weight:2,fillOpacity:.07}).bindTooltip('Zona de reparto: '+z.name,{sticky:true}).addTo(hmap));
  ['routes','orders','sim','gps'].forEach(k=>hl[k]=L.layerGroup().addTo(hmap));
  openSel($('#hC'),[['','Todos los repartidores'],...COURIERS.map(c=>[c.id,c.icon+' '+c.name])]);openSel($('#hZ'),[['','Todas las zonas'],...HCO_ZONES.map(z=>[z.id,z.name])]);openSel($('#hS'),[['','Todos los estados'],...['pendiente','en preparación','en camino','entregado'].map(s=>[s,s])]);
  ['hC','hZ','hS','hSim'].forEach(i=>$('#'+i).onchange=hcoRender);Live.subs.push(hcoRender);Live.listen();setInterval(hcoRender,5000)}
 setTimeout(()=>{hmap.invalidateSize();hcoRender()},60)}
function roadLine(a,b,color){const k=a+b,g=roadCache[k];
 if(g)return L.polyline(g,{color,weight:5,opacity:.85}).addTo(hl.routes);
 L.polyline([HCO_COORDS[a],HCO_COORDS[b]],{color,weight:3,dashArray:'4 8'}).addTo(hl.routes);
 if(!roadCache[k+'?']){roadCache[k+'?']=1;const p=x=>HCO_COORDS[x][1]+','+HCO_COORDS[x][0];
  fetch(`https://router.project-osrm.org/route/v1/driving/${p(a)};${p(b)}?overview=full&geometries=geojson`).then(r=>r.json()).then(j=>{roadCache[k]=j.routes[0].geometry.coordinates.map(([x,y])=>[y,x]);hcoRender()}).catch(()=>{})}}
function hcoRender(){if(!hmap||!$('#hco').classList.contains('on'))return;
 const fc=$('#hC').value,fz=$('#hZ').value,fs=$('#hS').value;Object.values(hl).forEach(l=>l.clearLayers());
 sim.orders.forEach(o=>{if(o.status==='cancelado')return;const st=hState(o),ll=HCO_COORDS[o.to],z=hZone(ll);if((fs&&st!==fs)||(fc&&o.courier!==fc)||(fz&&z.id!==fz))return;
  L.circleMarker(ll,{radius:6+o.prio*2,color:'#fff',weight:1,fillColor:(HCO_STATE[o.status]||[0,'#fff'])[1],fillOpacity:.9}).bindPopup(`<b>${o.code}</b> — ${o.client}<br>Estado: ${st}<br>Prioridad: ${PRIO[o.prio]}<br>${nm(o.from)} → ${nm(o.to)}<br>Zona: ${z.name}<br>Repartidor: ${o.courier||'sin asignar'}`).addTo(hl.orders)});
 sim.couriers.forEach(c=>{if(fc&&c.id!==fc)return;const pts=[c.pos,...c.route.map(r=>r.to)];for(let i=0;i<pts.length-1;i++)roadLine(pts[i],pts[i+1],c.color);
  if($('#hSim').checked){let ll=HCO_COORDS[c.pos];if(c.seg){const q=HCO_COORDS[c.seg.to],f=1-c.seg.left/c.seg.total;ll=[ll[0]+(q[0]-ll[0])*f,ll[1]+(q[1]-ll[1])*f]}L.marker(ll,{icon:L.divIcon({className:'',html:`<div class="mk" style="background:${c.color};opacity:.6">${c.icon}</div>`,iconSize:[30,30]})}).bindTooltip(c.name+' (SIMULADO)').addTo(hl.sim)}});
 const rows=COURIERS.map(c=>{const p=Live.couriers[c.id];if(!p||p.off||!p.lat)return`<div>${c.icon} ${c.name}: sin GPS</div>`;const age=Math.round((Date.now()-p.t)/1000),z=hZone([p.lat,p.lng]);
  if(!(fc&&p.id!==fc)&&!(fz&&z.id!==fz))L.marker([p.lat,p.lng],{icon:L.divIcon({className:'',html:`<div class="mk" style="background:${c.color}">${c.icon}</div>`,iconSize:[34,34]})}).bindPopup(`<b>${c.name}</b> (GPS real)<br>Zona: ${z.name}<br>Precisión ±${p.acc} m<br>Actualizado hace ${age} s${age>120?' — SIN SEÑAL':''}`).addTo(hl.gps);
  return`<div style="color:${c.color}">${c.icon} ${c.name}: GPS ${age>120?'sin señal':'activo'} (hace ${age} s, ${z.name})</div>`}).join('');
 const cnt={};sim.orders.forEach(o=>cnt[hState(o)]=(cnt[hState(o)]||0)+1);
 $('#hSide').innerHTML=`<h3>Repartidores (GPS real)</h3>${rows}<p>Canal: ${Live.status}</p><h3>Pedidos</h3>${['pendiente','en preparación','en camino','entregado'].map(s=>`<div>${s}: ${cnt[s]||0}</div>`).join('')}<p style="color:#8aa0c4">Leyenda: círculo = destino (tamaño = prioridad). Línea punteada = ruta pendiente de geometría vial.</p>`}
