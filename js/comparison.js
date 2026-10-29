// Comparación A (antigüedad) vs B (costo) con estados independientes y escenario de sustentación.
function runPolicy(g,policy,orders,events){const s=new Sim(g.clone(),policy,orders.map(o=>({...o,status:'pendiente',courier:null,late:false})));s.events=events.map(e=>({...e}));return s.run()}
function metrics(s){const d=s.orders.filter(o=>o.status==='entregado'),late=d.filter(o=>o.late).length;
 return{km:+s.couriers.reduce((a,c)=>a+c.km,0).toFixed(1),entregados:d.length,puntuales:d.length-late,tarde:late,tiempoProm:d.length?+(d.reduce((a,o)=>a+o.deliveredAt-o.created,0)/d.length).toFixed(1):0,tiempoTotal:Math.round(s.t),pendientes:s.orders.length-d.length}}
const METRICS=[['km','Km totales',-1],['entregados','Pedidos entregados',1],['puntuales','Entregas puntuales',1],['tarde','Entregas retrasadas',-1],['tiempoProm','Tiempo prom. entrega (min)',-1],['tiempoTotal','Tiempo total (min)',-1],['pendientes','Pendientes',-1]];
function compare(g,orders,events=[]){const A=runPolicy(g,'oldest',orders,events),B=runPolicy(g,'cost',orders,events),ma=metrics(A),mb=metrics(B);
 const rows=METRICS.map(([k,l,dir])=>{const a=ma[k],b=mb[k],diff=+(b-a).toFixed(2);return{k,l,a,b,diff,pct:a?+(diff/a*100).toFixed(1):(b?100:0),better:a===b?'Empate':((b-a)*dir>0?'B':'A')}});
 const wa=rows.filter(r=>r.better==='A').length,wb=rows.filter(r=>r.better==='B').length,tie=rows.length-wa-wb;
 const verdict=wa===wb?'No hay una política claramente mejor: los resultados están equilibrados.':`La política ${wa>wb?'A (más antiguo)':'B (costo estimado)'} fue mejor en más métricas.`;
 const text=`A ganó ${wa} métricas, B ganó ${wb} y hubo ${tie} empates. ${verdict} Km: A=${ma.km}, B=${mb.km}. Entregas puntuales: A=${ma.puntuales}/${ma.entregados}, B=${mb.puntuales}/${mb.entregados}. Tiempo total: A=${ma.tiempoTotal} min, B=${mb.tiempoTotal} min.`;
 return{A,B,ma,mb,rows,text}}
// Prueba de sustentación (semilla fija 2026). Cada comprobación se calcula con datos reales de las simulaciones.
function runStress(){const g=buildGraph(),orders=genOrders(30,2026);
 const cal=new Sim(g.clone(),'cost',orders.map(o=>({...o})));for(let i=0;i<7;i++)cal.step();
 const cand=[];cal.couriers.forEach(c=>c.route.forEach(r=>{if(!cand.includes(r.edge.id))cand.push(r.edge.id)}));const chosen=[];
 for(const id of cand){if(chosen.length==2)break;const t=g.clone();[...chosen,id].forEach(x=>t.edges.find(e=>e.id===x).closed=true);if(connected(t))chosen.push(id)}
 const events=chosen.map((edge,i)=>({t:8+8*i,edge})),cmp=compare(g,orders,events),{A,B}=cmp,ok=(n,v,d)=>({name:n,ok:!!v,detail:d});
 const base=buildGraph(),p=buildPath(dijkstra(base,'A'),'A','B'),cost=dijkstra(base,'A').dist.get('B');
 const checks=[
  ok('30 pedidos con códigos únicos',new Set(orders.map(o=>o.code)).size===30&&orders.length===30,''),
  ok('Destinos cubren las 15 ubicaciones',new Set(orders.map(o=>o.to)).size===15,''),
  ok('Prioridades y límites variados',new Set(orders.map(o=>o.prio)).size>=3&&new Set(orders.map(o=>o.deadline-o.created)).size>5,''),
  ok('Tres repartidores iniciados',A.couriers.length===3&&B.couriers.length===3,''),
  ok('Dos calles cerradas durante el movimiento',chosen.length===2&&[A,B].every(s=>s.g.edges.filter(e=>e.closed).length===2),chosen.join(', ')),
  ok('Recálculos de ruta registrados',A.replans.length+B.replans.length>0,`A:${A.replans.length} B:${B.replans.length}`),
  ok('Ningún tramo nuevo usó calles cerradas',A.violations.length+B.violations.length===0,`violaciones: ${A.violations.length+B.violations.length}`),
  ok('Ambas simulaciones terminaron',A.done()&&B.done()&&A.t<900&&B.t<900,`A=${A.t} B=${B.t} min`),
  ok('Pedidos conservados (entregados+pendientes=30)',cmp.ma.entregados+cmp.ma.pendientes===30&&cmp.mb.entregados+cmp.mb.pendientes===30,''),
  ok('Ruta más corta verificada: Almacén Central → Barrio Norte vía Barrio Oeste (12.4 min)',p&&p.map(s=>s.to).join()==='L,B'&&Math.abs(cost-12.4)<1e-9,`costo ${cost}`)];
 return{checks,cmp,chosen,orders}}
