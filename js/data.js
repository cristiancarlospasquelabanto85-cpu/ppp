// Datos base: 15 ubicaciones, calles (km), repartidores y pesos de asignación configurables.
const NODES=[['A','Almacén Central',90,300,'almacén'],['B','Barrio Norte',230,90,'barrio'],['C','Comercio Plaza',380,60,'comercio'],['D','Destino Aeropuerto',560,70,'destino'],['E','Barrio Este',700,130,'barrio'],['F','Comercio Mall',250,230,'comercio'],['G','Centro',400,200,'destino'],['H','Barrio Sur',210,400,'barrio'],['I','Comercio Mercado',380,350,'comercio'],['J','Destino Hospital',540,260,'destino'],['K','Almacén Sur',420,480,'almacén'],['L','Barrio Oeste',60,150,'barrio'],['M','Destino Universidad',680,300,'destino'],['N','Comercio Puerto',700,430,'comercio'],['O','Barrio Lomas',560,430,'barrio']].map(([id,name,x,y,type])=>({id,name,x,y,type}));
const EDGES=[['A','L',3],['A','F',3.5],['A','H',3],['L','B',3.2],['B','C',2.5],['B','F',2.8],['C','D',3.5],['C','G',2.6],['D','E',3],['E','M',3.5],['F','G',2.7],['F','H',3.4],['G','J',2.2],['G','I',2.8],['H','I',2.6],['H','K',3.4],['I','J',2.9],['I','K',2.4],['J','M',2.4],['J','D',3.3],['K','O',2.7],['O','N',2.5],['N','M',3.2],['O','J',3],['I','O',3.1]];
const COURIERS=[{id:'R1',name:'Ana',color:'#22d3ee',icon:'🛵',cap:4,start:'A'},{id:'R2',name:'Luis',color:'#34d399',icon:'🚲',cap:4,start:'A'},{id:'R3',name:'Marta',color:'#fb923c',icon:'🚐',cap:4,start:'K'}];
const PRIO=['baja','normal','alta','urgente'];
// Puntaje (menor = mejor): dist*(costo total) + load*carga + late*minutos de retraso previsto - prio*prioridad(0..3)
const WEIGHTS={dist:1,load:4,late:2,prio:6};
// Generador pseudoaleatorio con semilla (mulberry32) para escenarios reproducibles
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
