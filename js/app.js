// Interfaz: conecta el motor con el DOM, mapa SVG, persistencia localStorage y paneles.
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],KEY='urbanflow.v1';
let G,base,sim,timer=null,lastCmp=null;
const strip=o=>({code:o.code,client:o.client,from:o.from,to:o.to,prio:o.prio,created:o.created,deadline:o.deadline});
const fresh=o=>({...strip(o),status:'pendiente',courier:null,late:false});
const nm=id=>G.nodes.get(id).name,disp=o=>o.late&&o.status!=='entregado'&&o.status!=='cancelado'?'retrasado':o.status;
function save(){try{localStorage.setItem(KEY,JSON.stringify({orders:base,edges:G.edges.map(e=>({from:e.from,to:e.to,km:e.km,closed:e.closed,traffic:e.traffic,directed:e.directed}))}))}catch(e){toast('No se pudo guardar en localStorage','err')}}
function init(demo){let s=null;if(!demo)try{s=JSON.parse(localStorage.getItem(KEY))}catch{}G=buildGraph(s&&s.edges);base=s&&s.orders?s.orders:genOrders(8,7);resetSim()}
function resetSim(){stop();sim=new Sim(G,'cost',base.map(fresh));sim.onEvent=r=>{if(['entrega','cierre','ruta','retraso','alerta'].includes(r.type))toast(r.msg,r.type)};render()}
function toast(m,t='info'){const d=document.createElement('div');d.className='toast '+t;d.textContent=m;$('#toasts').append(d);setTimeout(()=>d.remove(),3500)}
function run(){if(timer)return;timer=setInterval(tick,1000/$('#speed').value)}function stop(){clearInterval(timer);timer=null}
function tick(){sim.step();render();if(sim.done()){stop();toast('Simulación finalizada','entrega')}}
// ---- render
function render(){cards();map();$('#clock').textContent='⏱ t = '+Math.round(sim.t)+' min';$('#console').innerHTML=sim.log.toArray().slice(-80).reverse().map(r=>`<div class="${r.type}">[${r.t}] ${r.msg}</div>`).join('');orders();charts();if(window.hcoRender)hcoRender()}
function stats(){const o=sim.orders,d=o.filter(x=>x.status==='entregado'),on=d.filter(x=>!x.late).length;return{pend:o.filter(x=>x.status==='pendiente').length,ruta:o.filter(x=>['asignado','en reparto'].includes(x.status)).length,ent:d.length,tarde:o.filter(x=>x.late).length,km:sim.couriers.reduce((a,c)=>a+c.km,0),punt:d.length?Math.round(on/d.length*100):0,prom:d.length?d.reduce((a,x)=>a+x.deliveredAt-x.created,0)/d.length:0,disp:sim.couriers.filter(c=>sim.stateOf(c)==='disponible').length}}
function cards(){const s=stats();$('#cards').innerHTML=[['⏳','Pendientes',s.pend],['🚚','En reparto',s.ruta],['✅','Entregados',s.ent],['⚠️','Retrasados',s.tarde],['🛣️','Km recorridos',s.km.toFixed(1)],['🎯','Puntualidad',s.punt+'%'],['⏱','Tiempo prom.',s.prom.toFixed(1)+' min'],['🛵','Repartidores libres',s.disp+'/3']].map(([i,l,v])=>`<div class="stat"><span>${i} ${l}</span><b>${v}</b></div>`).join('')}
function map(){let s='';for(const e of G.edges){const a=G.nodes.get(e.from),b=G.nodes.get(e.to),col=e.closed?'#ef4444':e.traffic>1?'#fb923c':'#35588c';
  s+=`<line class="edge" data-e="${e.id}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${col}" stroke-width="5" ${e.closed?'stroke-dasharray="8 6"':''}><title>${e.id}: ${e.km} km ×${e.traffic}${e.closed?' CERRADA':''}</title></line><text x="${(a.x+b.x)/2}" y="${(a.y+b.y)/2-6}" fill="#8aa0c4" font-size="11" text-anchor="middle">${e.km}${e.directed?'→':''}</text>`}
 for(const c of sim.couriers){const pts=[c.pos,...c.route.map(r=>r.to)].map(i=>G.nodes.get(i)).map(n=>n.x+','+n.y);if(pts.length>1)s+=`<polyline points="${pts.join(' ')}" fill="none" stroke="${c.color}" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>`}
 const col={almacén:'#22d3ee',barrio:'#34d399',comercio:'#fb923c',destino:'#a78bfa'};
 for(const n of G.nodes.values())s+=`<g class="nd" data-n="${n.id}"><circle cx="${n.x}" cy="${n.y}" r="14" fill="#0a1628" stroke="${col[n.type]}" stroke-width="3"/><text x="${n.x}" y="${n.y+4}" fill="#fff" font-size="11" text-anchor="middle">${n.id}</text><text x="${n.x}" y="${n.y+28}" fill="#8aa0c4" font-size="10" text-anchor="middle">${n.name}</text></g>`;
 for(const c of sim.couriers){let p=G.nodes.get(c.pos),x=p.x,y=p.y;if(c.seg){const q=G.nodes.get(c.seg.to),f=1-c.seg.left/c.seg.total;x+=(q.x-x)*f;y+=(q.y-y)*f}s+=`<g><circle cx="${x}" cy="${y}" r="12" fill="${c.color}" opacity=".9"/><text x="${x}" y="${y+5}" font-size="14" text-anchor="middle">${c.icon}</text></g>`}
 $('#map').innerHTML=s;$('#legend').innerHTML=sim.couriers.map(c=>`<span style="color:${c.color}">${c.icon} ${c.name} (${sim.stateOf(c)}, carga ${c.orders.length}/${c.cap}, ${c.km.toFixed(1)} km, ${c.done} ent.)</span>`).join(' · ')}
function orders(){const q=$('#q').value.trim().toLowerCase(),fp=$('#fp').value,fs=$('#fs').value;let L=sim.orders.filter(o=>o.code.toLowerCase().includes(q)&&(fp===''||o.prio==fp)&&(!fs||disp(o)===fs));
 L.sort($('#sort').value==='age'?(a,b)=>a.created-b.created:(a,b)=>b.prio-a.prio||a.deadline-b.deadline);
 $('#tbl').innerHTML='<tr><th>Código</th><th>Cliente</th><th>Ruta</th><th>Prior.</th><th>Estado</th><th>Repart.</th><th>ETA</th><th></th></tr>'+L.map(o=>`<tr><td>${o.code}</td><td>${o.client}</td><td>${o.from}→${o.to}</td><td>${PRIO[o.prio]}</td><td><span class="badge">${disp(o)}</span></td><td>${o.courier||'-'}</td><td>${o.eta??'-'}</td><td><button data-d="${o.code}">Detalle</button>${o.status==='pendiente'?`<button data-x="${o.code}">Cancelar</button>`:''}</td></tr>`).join('')}
function bars(items,col){const m=Math.max(1,...items.map(i=>i[1]));return items.map(([l,v,c])=>`<div class="br"><span>${l}</span><i style="width:${v/m*60}%;background:${c||col}"></i><b>${v}</b></div>`).join('')}
function charts(){const s=stats(),h=sim.pendingHistory,mx=Math.max(1,...h),pl=h.map((v,i)=>`${i/(Math.max(1,h.length-1))*280},${60-v/mx*55}`).join(' ');
 $('#chartOut').innerHTML=`<div class="card"><h3>Pedidos por estado</h3>${bars(['pendiente','asignado','en reparto','entregado','retrasado','cancelado'].map(e=>[e,sim.orders.filter(o=>disp(o)===e).length]),'#22d3ee')}</div>
 <div class="card"><h3>Puntualidad</h3>${bars([['A tiempo',s.ent-sim.orders.filter(o=>o.late&&o.status==='entregado').length,'#34d399'],['Con retraso',s.tarde,'#fb923c']])}</div>
 <div class="card"><h3>Km por repartidor</h3>${bars(sim.couriers.map(c=>[c.name,+c.km.toFixed(1),c.color]))}</div>
 <div class="card"><h3>Evolución de pendientes</h3><svg viewBox="0 0 280 60" width="100%"><polyline points="${pl}" fill="none" stroke="#22d3ee" stroke-width="2"/></svg></div>
 <div class="card"><h3>Incidentes</h3>${bars([['Cierres/tráfico',sim.incidents,'#ef4444'],['Recálculos de ruta',sim.recalcs,'#22d3ee']])}</div>
 <div class="card"><h3>Comparación de políticas</h3>${lastCmp?bars(lastCmp.rows.filter(r=>['km','puntuales','tarde'].includes(r.k)).flatMap(r=>[[r.l+' A',r.a,'#22d3ee'],[r.l+' B',r.b,'#fb923c']])):'Ejecuta la comparación.'}</div>`}
// ---- comparador y prueba
function showCmp(c,stress){lastCmp=c;let h='';if(stress)h+=`<h3>Informe de sustentación (semilla 2026)</h3>`+stress.checks.map(k=>`<div class="${k.ok?'entrega':'cierre'}">${k.ok?'✔':'✘'} ${k.name} ${k.detail?'— '+k.detail:''}</div>`).join('')+`<p>Superadas: ${stress.checks.filter(k=>k.ok).length}/${stress.checks.length}. Calles cerradas: ${stress.chosen.join(', ')}.</p>`+(stress.cmp.A.replans.concat(stress.cmp.B.replans).slice(0,6).map(r=>`<div class="ruta">t=${r.t} ${r.courier}: ${r.old.join('>')} ⇒ ${r.new.join('>')}</div>`).join(''));
 h+=`<h3>Política A (más antiguo) vs B (costo estimado)</h3><table><tr><th>Métrica</th><th>A</th><th>B</th><th>Dif. (B−A)</th><th>%</th><th>Mejor</th></tr>${c.rows.map(r=>`<tr><td>${r.l}</td><td>${r.a}</td><td>${r.b}</td><td>${r.diff}</td><td>${r.pct}%</td><td>${r.better}</td></tr>`).join('')}</table><p>${c.text}</p>${bars(c.rows.filter(r=>['km','puntuales','tarde'].includes(r.k)).flatMap(r=>[[r.l+' A',r.a,'#22d3ee'],[r.l+' B',r.b,'#fb923c']]))}`;
 $('#cmpOut').innerHTML=h;tab('cmp');charts()}
function tab(t){if(t==='hco'&&window.hcoShow)hcoShow();$$('.tab').forEach(x=>x.classList.toggle('on',x.id===t));$$('nav button').forEach(x=>x.classList.toggle('on',x.dataset.tab===t))}
function openSel(sel,items,v){sel.innerHTML=items.map(([k,l])=>`<option value="${k}">${l}</option>`).join('');if(v!==undefined)sel.value=v}
function dlg(id,err){$(id).querySelector('.err').textContent=err||''}
// ---- eventos
$$('nav button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));$$('.x').forEach(b=>b.onclick=()=>b.closest('dialog').close());
['q','fp','fs','sort'].forEach(i=>$('#'+i).oninput=orders);
$('#bStart').onclick=run;$('#bResume').onclick=run;$('#bPause').onclick=stop;$('#bStep').onclick=()=>{stop();tick()};$('#speed').onchange=()=>{if(timer){stop();run()}};
$('#bReset').onclick=()=>{if(confirm('¿Reiniciar la simulación? Se pierde el progreso actual.'))resetSim()};
$('#bDemo').onclick=()=>{if(confirm('¿Restaurar mapa y pedidos de demostración?')){init(true);save()}};
$('#bGen').onclick=()=>{const n=base.length;genOrders(30,Math.floor(Math.random()*1e6)).forEach((o,i)=>{o.code='G'+sim.t+'-'+(n+i+1);o.created+=Math.round(sim.t);o.deadline+=Math.round(sim.t);base.push(strip(o));sim.orders.push(o)});save();render();toast('30 pedidos generados')};
$('#bClose').onclick=()=>{const ids=[];sim.couriers.forEach(c=>c.route.forEach(r=>{if(!r.edge.closed&&!ids.includes(r.edge.id))ids.push(r.edge.id)}));G.edges.forEach(e=>{if(!e.closed&&!ids.includes(e.id))ids.push(e.id)});let n=0;
 for(const id of ids){if(n==2)break;const e=G.edges.find(x=>x.id===id);e.closed=true;if(connected(G)){e.closed=false;sim.closeEdge(id);n++}else e.closed=false}if(!n)toast('No hay calles que cerrar sin aislar ubicaciones','err');save();render()};
$('#bTraffic').onclick=()=>{const o=G.edges.filter(e=>!e.closed&&e.traffic===1).sort(()=>Math.random()-.5).slice(0,3);o.forEach(e=>e.traffic=2.2);sim.replanAll('Tráfico elevado en: '+o.map(e=>e.id).join(', '));save();render()};
$('#bCompare').onclick=()=>{tab('cmp');$('#bRunCmp').click()};
$('#bRunCmp').onclick=()=>{if(!base.length)return toast('No hay pedidos','err');showCmp(compare(G,base.map(fresh),[]))};
$('#bStress').onclick=()=>{stop();const s=runStress();showCmp(s.cmp,s);toast('Prueba finalizada: '+s.checks.filter(k=>k.ok).length+'/'+s.checks.length+' comprobaciones','entrega')};
$('#bNew').onclick=()=>{const f=$('#fO');openSel(f.from,[...G.nodes.values()].map(n=>[n.id,n.id+' '+n.name]));openSel(f.to,[...G.nodes.values()].map(n=>[n.id,n.id+' '+n.name]),'G');openSel(f.prio,PRIO.map((p,i)=>[i,p]),1);f.code.value='P-'+String(base.length+1).padStart(3,'0')+'-'+Math.round(sim.t);dlg('#dlgO');$('#dlgO').showModal()};
$('#fO').onsubmit=e=>{e.preventDefault();const f=e.target,o={code:f.code.value.trim(),client:f.client.value.trim(),from:f.from.value,to:f.to.value,prio:+f.prio.value,created:Math.round(sim.t),deadline:Math.round(sim.t)+(+f.lim.value||0)};
 const er=validateOrder(o,sim.orders,G);if(er.length)return dlg('#dlgO',er.join('. '));base.push(strip(o));sim.orders.push({...o,status:'pendiente',courier:null,late:false});save();$('#dlgO').close();render();toast('Pedido '+o.code+' registrado')};
$('#tbl').onclick=e=>{const d=e.target.dataset;if(d.x){const o=sim.orders.find(x=>x.code===d.x);o.status='cancelado';base=base.filter(x=>x.code!==d.x);save();render()}
 if(d.d){const o=sim.orders.find(x=>x.code===d.d);$('#iBody').textContent=JSON.stringify({...o,prio:PRIO[o.prio],origen:nm(o.from),destino:nm(o.to)},null,1);$('#dlgI').showModal()}};
function editEdge(e){const f=$('#fE'),ops=[...G.nodes.values()].map(n=>[n.id,n.id+' '+n.name]);openSel(f.from,ops,e?e.from:'A');openSel(f.to,ops,e?e.to:'B');f.from.disabled=f.to.disabled=!!e;f.km.value=e?e.km:3;f.tr.value=e?e.traffic:1;f.cl.checked=e?e.closed:false;f.di.checked=e?e.directed:false;f.di.disabled=!!e;f.dataset.id=e?e.id:'';$('#eT').textContent=e?'Editar calle '+e.id:'Nueva calle';dlg('#dlgE');$('#dlgE').showModal()}
$('#bNewEdge').onclick=()=>editEdge(null);
$('#fE').onsubmit=ev=>{ev.preventDefault();const f=ev.target,km=+f.km.value,tr=+f.tr.value;if(!(km>0)||!(tr>=1))return dlg('#dlgE','Distancia > 0 y tráfico ≥ 1');
 let e=G.edges.find(x=>x.id===f.dataset.id);if(!e){if(f.from.value===f.to.value)return dlg('#dlgE','Origen y destino deben diferir');if(G.edges.some(x=>(x.from===f.from.value&&x.to===f.to.value)||(!x.directed&&x.from===f.to.value&&x.to===f.from.value)))return dlg('#dlgE','Esa calle ya existe');e=G.addEdge(f.from.value,f.to.value,km,f.di.checked)}
 G.setKm(e,km);e.traffic=tr;if(f.cl.checked)sim.closeEdge(e.id);else if(e.closed)sim.openEdge(e.id);sim.replanAll('Calle '+e.id+' modificada: se recalculan rutas');save();$('#dlgE').close();render()};
$('#map').onclick=e=>{const n=e.target.closest('[data-n]'),l=e.target.closest('[data-e]');if(n){const id=n.dataset.n;$('#info').innerHTML=`<b>${id} ${nm(id)}</b> (${G.nodes.get(id).type}): `+G.adj.get(id).map(x=>`${nm(x.to)} ${x.edge.km} km${x.edge.closed?' (cerrada)':''}`).join(', ')}else if(l)editEdge(G.edges.find(x=>x.id===l.dataset.e))};
openSel($('#fp'),[['','Prioridad'],...PRIO.map((p,i)=>[i,p])]);init(false);
