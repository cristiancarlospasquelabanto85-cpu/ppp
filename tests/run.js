// node tests/run.js  — ejecuta Dijkstra, listas y la prueba de sustentación sin navegador.
const fs=require('fs');const f=['data','priorityQueue','linkedList','graph','dijkstra','orders','simulation','dispatch','comparison'];
eval(f.map(x=>fs.readFileSync(__dirname+'/../js/'+x+'.js','utf8')).join('\n')+';globalThis.T={runStress,LinkedList,PriorityQueue}');
const r=T.runStress();r.checks.forEach(c=>console.log(c.ok?'OK  ':'FALLA',c.name,c.detail));console.log(r.cmp.rows.map(x=>`${x.l}: A=${x.a} B=${x.b} -> ${x.better}`).join('\n'));console.log(r.cmp.text);
const l=new T.LinkedList();l.push(1).push(2);const q=new T.PriorityQueue();[5,1,3].forEach(x=>q.push(x,x));console.log('lista',l.toArray(),'cola',q.pop().item,q.pop().item);
process.exit(r.checks.every(c=>c.ok)?0:1);
