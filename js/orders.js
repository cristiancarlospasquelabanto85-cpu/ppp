// Pedidos: generación reproducible y validación.
function genOrders(n,seed){const r=rng(seed),orig=['A','K','C','F','I','N'],out=[];
 for(let i=0;i<n;i++){const to=NODES[i%NODES.length].id;let from=orig[Math.floor(r()*orig.length)];if(from===to)from=orig[(orig.indexOf(from)+1)%orig.length];
  const created=Math.floor(r()*20);out.push({code:'P-'+String(i+1).padStart(3,'0'),client:'Cliente '+(i+1),from,to,prio:Math.floor(r()*4),created,deadline:created+40+Math.floor(r()*90),status:'pendiente',courier:null,late:false})}return out}
function validateOrder(o,existing,g){const e=[];if(!o.code)e.push('Código obligatorio');else if(existing.some(x=>x.code===o.code))e.push('Código duplicado: '+o.code);
 if(!o.client)e.push('Cliente obligatorio');if(!g.nodes.has(o.from)||!g.nodes.has(o.to))e.push('Ubicación inválida');if(o.from===o.to)e.push('Origen y destino deben ser distintos');
 if(!(o.deadline>o.created))e.push('El tiempo límite debe ser posterior a la creación');return e}
