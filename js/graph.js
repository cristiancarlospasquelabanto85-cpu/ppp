// Grafo ponderado con listas de adyacencia (Map id -> [{to,edge}]). No dirigido salvo edge.directed.
class Graph{constructor(){this.nodes=new Map();this.adj=new Map();this.edges=[]}
 addNode(n){this.nodes.set(n.id,n);this.adj.set(n.id,[])}
 addEdge(a,b,km,directed=false){const e={id:a+'-'+b,from:a,to:b,km,base:km*2,closed:false,traffic:1,directed:!!directed};this.edges.push(e);this.adj.get(a).push({to:b,edge:e});if(!directed)this.adj.get(b).push({to:a,edge:e});return e}
 setKm(e,km){e.km=km;e.base=km*2} // tiempo base = km a 30 km/h (min)
 cost(e){return e.closed?Infinity:e.base*e.traffic} // costo de ruta = tiempo estimado con tráfico
 clone(){const g=new Graph();this.nodes.forEach(n=>g.addNode(n));this.edges.forEach(e=>{const x=g.addEdge(e.from,e.to,e.km,e.directed);x.closed=e.closed;x.traffic=e.traffic});return g}}
function buildGraph(saved){const g=new Graph();NODES.forEach(n=>g.addNode(n));(saved||EDGES.map(([from,to,km])=>({from,to,km,closed:false,traffic:1}))).forEach(e=>{const x=g.addEdge(e.from,e.to,e.km,e.directed);x.closed=!!e.closed;x.traffic=e.traffic||1});return g}
