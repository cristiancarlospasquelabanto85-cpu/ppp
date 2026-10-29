// Políticas de despacho. 'oldest' = pedido más antiguo; 'cost' = mejor puntaje de costo estimado.
Sim.prototype.options=function(o,dj,from){return this.couriers.map(c=>{if(c.orders.length>=c.cap)return{c,why:'sin capacidad'};
 const d1=dj.get(c.id).dist.get(o.from),d2=from(o.from).dist.get(o.to);if(!isFinite(d1)||!isFinite(d2))return{c,why:'sin ruta válida'};
 const eta=this.t+d1+d2,late=Math.max(0,eta-o.deadline),W=WEIGHTS;
 return{c,d1,d2,eta,late,score:W.dist*(d1+d2)+W.load*c.orders.length+W.late*late-W.prio*o.prio}})};
Sim.prototype.dispatch=function(){const pend=this.orders.filter(o=>o.status==='pendiente'&&o.created<=this.t);if(!pend.length)return;
 const dj=new Map(this.couriers.map(c=>[c.id,dijkstra(this.g,c.pos)])),cache={},from=n=>cache[n]||(cache[n]=dijkstra(this.g,n));
 const pick=(o,key)=>{const L=this.options(o,dj,from);return{L,best:L.filter(x=>!x.why).sort((a,b)=>a[key]-b[key]||a.c.id.localeCompare(b.c.id))[0]}};
 if(this.policy==='oldest'){pend.sort((a,b)=>a.created-b.created||b.prio-a.prio||a.code.localeCompare(b.code));
  for(const o of pend){const{L,best}=pick(o,'d1');this.commit(o,L,best,'política A: más antiguo; repartidor elegible más cercano')}}
 else{let left=[...pend];while(left.length){let bo,bl,bb;for(const o of left){const{L,best}=pick(o,'score');if(best&&(!bb||best.score<bb.score)){bo=o;bl=L;bb=best}}
  if(!bo){left.forEach(o=>this.commit(o,this.options(o,dj,from),null));break}this.commit(bo,bl,bb,'política B: mejor puntaje global');left=left.filter(o=>o!==bo)}}};
Sim.prototype.commit=function(o,L,best,why){
 if(!best){if(!o.warned){o.warned=1;this.ev(`${o.code} sin repartidor elegible: ${L.map(x=>x.c.name+' '+x.why).join(', ')}`,'alerta')}return}
 o.warned=0;o.status='asignado';o.courier=best.c.id;o.eta=Math.round(best.eta);best.c.orders.push(o);
 const others=L.filter(x=>x!==best).map(x=>x.why?`${x.c.name} descartado (${x.why})`:`${x.c.name} puntaje ${x.score.toFixed(1)}`).join('; ');
 this.ev(`${o.code} → ${best.c.name} [${why}] puntaje ${best.score.toFixed(1)}, costo ${best.d1.toFixed(1)}+${best.d2.toFixed(1)} min, carga previa ${best.c.orders.length-1}. Otros: ${others}`,'asignación')};
