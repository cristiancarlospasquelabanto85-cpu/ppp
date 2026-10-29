// Dijkstra manual: distancias mínimas + predecesores, ignora calles cerradas (costo Infinity).
function dijkstra(g,src,record){const dist=new Map(),prev=new Map(),done=new Set(),steps=[],pq=new PriorityQueue();
 g.nodes.forEach((_,id)=>dist.set(id,Infinity));dist.set(src,0);pq.push(src,0);
 while(!pq.isEmpty()){const{item:u,pri}=pq.pop();if(done.has(u)||pri>dist.get(u))continue;done.add(u);
  for(const{to,edge}of g.adj.get(u)){const c=g.cost(edge);if(c===Infinity||done.has(to))continue;const nd=dist.get(u)+c;if(nd<dist.get(to)){dist.set(to,nd);prev.set(to,{node:u,edge});pq.push(to,nd)}}
  if(record)steps.push({u,d:dist.get(u),dist:Object.fromEntries(dist)})}
 return{dist,prev,steps}}
// Reconstruye la ruta como segmentos [{to,edge}]; null si el destino es inaccesible.
function buildPath(r,src,dst){if(r.dist.get(dst)===Infinity)return null;const p=[];let c=dst;while(c!==src){const pr=r.prev.get(c);p.unshift({to:c,edge:pr.edge});c=pr.node}return p}
function connected(g){const r=dijkstra(g,[...g.nodes.keys()][0]);return[...r.dist.values()].every(isFinite)}
