// Motor de simulación con tiempo virtual (1 paso = 1 minuto).
class Sim{constructor(g,policy,orders){this.g=g;this.policy=policy;this.orders=orders;this.t=0;this.log=new LinkedList();this.events=[];this.violations=[];this.replans=[];this.recalcs=0;this.incidents=0;this.pendingHistory=[];this.idle=0;this.onEvent=null;
  this.couriers=COURIERS.map(c=>({...c,pos:c.start,orders:[],route:[],seg:null,km:0,done:0}))}
 nm(id){return this.g.nodes.get(id).name}
 ev(msg,type='info'){const r={t:Math.round(this.t),msg,type};this.log.push(r);if(this.onEvent)this.onEvent(r)}
 stateOf(c){return c.orders.length>=c.cap?'sin capacidad':(c.seg||c.route.length)?'en ruta':'disponible'}
 closeEdge(id){const e=this.g.edges.find(x=>x.id===id);if(!e||e.closed)return;e.closed=true;this.incidents++;this.ev(`Calle ${this.nm(e.from)}–${this.nm(e.to)} CERRADA`,'cierre');this.invalidate(e)}
 openEdge(id){const e=this.g.edges.find(x=>x.id===id);if(e&&e.closed){e.closed=false;this.ev(`Calle ${this.nm(e.from)}–${this.nm(e.to)} reabierta`,'ruta');this.replanAll('Reapertura: se reconsideran rutas')}}
 // Regla: el tramo en curso se termina (se registra); los tramos futuros se recalculan sin la calle cerrada.
 invalidate(e){for(const c of this.couriers){if(!c.route.some(r=>r.edge===e))continue;const old=[c.pos,...c.route.map(r=>r.to)];
  if(c.seg&&c.seg.edge===e)this.ev(`${c.name} termina el tramo en curso (regla: no se interrumpe)`,'ruta');
  c.route=c.seg?c.route.slice(0,1):[];c.oldRoute=old;this.recalcs++;this.ev(`Recalculando la ruta de ${c.name} desde ${this.nm(c.pos)}`,'ruta')}}
 replanAll(msg){this.incidents++;this.ev(msg,'ruta');this.couriers.forEach(c=>{c.route=c.seg?c.route.slice(0,1):[]})}
 arrive(c){for(const o of [...c.orders]){if(o.status==='asignado'&&o.from===c.pos){o.status='en reparto';o.pickedAt=this.t;this.ev(`${c.name} recoge ${o.code} en ${this.nm(c.pos)}`)}
  else if(o.status==='en reparto'&&o.to===c.pos){o.status='entregado';o.deliveredAt=this.t;o.late=this.t>o.deadline;c.done++;c.orders=c.orders.filter(x=>x!==o);this.ev(`${c.name} ENTREGA ${o.code} en ${this.nm(c.pos)} (${o.late?'con retraso':'a tiempo'})`,'entrega')}}}
 // Objetivo más barato (según Dijkstra actual) entre recogidas/entregas pendientes del repartidor.
 plan(c){c.route=[];const ts=c.orders.map(o=>o.status==='asignado'?o.from:o.to);if(!ts.length)return;const r=dijkstra(this.g,c.pos);let best=null;
  for(const n of ts)if(r.dist.get(n)<(best?r.dist.get(best):Infinity))best=n;
  if(!best){if(!c.warn){c.warn=1;this.ev(`${c.name}: destinos inaccesibles con las calles actuales`,'alerta')}return}
  c.warn=0;c.route=buildPath(r,c.pos,best)||[];
  if(c.oldRoute){const nw=[c.pos,...c.route.map(x=>x.to)];this.replans.push({t:Math.round(this.t),courier:c.name,old:c.oldRoute.map(i=>this.nm(i)),new:nw.map(i=>this.nm(i))});this.ev(`Ruta de ${c.name}: ${c.oldRoute.join('>')} ⇒ ${nw.join('>')}`,'ruta');c.oldRoute=null}}
 move(c){let dt=1;while(dt>1e-9){
  if(!c.seg){this.arrive(c);if(!c.route.length)this.plan(c);if(!c.route.length)return;let s=c.route[0];
   if(s.edge.closed){c.route=[];this.plan(c);if(!c.route.length)return;s=c.route[0];if(s.edge.closed){this.violations.push(`${c.name} t=${this.t}`);return}}
   const k=this.g.cost(s.edge);c.seg={to:s.to,edge:s.edge,left:k,total:k}}
  const u=Math.min(dt,c.seg.left);c.seg.left-=u;dt-=u;
  if(c.seg.left<1e-9){c.pos=c.seg.to;c.km+=c.seg.edge.km;c.route.shift();c.seg=null}}
  if(!c.seg)this.arrive(c)}
 step(){this.t++;for(const e of this.events)if(!e.done&&e.t<=this.t){e.done=1;this.closeEdge(e.edge)}
  this.dispatch();this.couriers.forEach(c=>this.move(c));
  for(const o of this.orders)if(!o.late&&!['entregado','cancelado'].includes(o.status)&&this.t>o.deadline){o.late=true;this.ev(`${o.code} retrasado`,'retraso')}
  this.pendingHistory.push(this.orders.filter(o=>o.status==='pendiente'&&o.created<=this.t).length);
  const busy=this.couriers.some(c=>c.seg||c.route.length),future=this.orders.some(o=>o.created>this.t)||this.events.some(e=>!e.done);this.idle=(!busy&&!future)?this.idle+1:0}
 done(){return !this.orders.some(o=>!['entregado','cancelado'].includes(o.status))||this.idle>=2}
 run(max=900){while(this.t<max&&!this.done())this.step();return this}}
