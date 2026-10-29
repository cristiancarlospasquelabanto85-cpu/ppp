// Canal de ubicaciones GPS reales: Firebase Realtime Database (REST + EventSource) o modo local (localStorage).
const Live={couriers:{},subs:[],mode:'local',status:'sin iniciar',
 get url(){return(window.CONFIG&&CONFIG.FIREBASE_DB_URL||'').replace(/\/$/,'')},
 get q(){return window.CONFIG&&CONFIG.FIREBASE_AUTH?'?auth='+CONFIG.FIREBASE_AUTH:''},
 emit(){this.subs.forEach(f=>f())},
 apply(path,data){const p=path.split('/').filter(Boolean);if(!p.length)this.couriers=data||{};else if(p.length===1){if(data===null)delete this.couriers[p[0]];else this.couriers[p[0]]=data}else{(this.couriers[p[0]]=this.couriers[p[0]]||{})[p[1]]=data}},
 listen(){if(this.url){this.mode='firebase';const es=new EventSource(this.url+'/couriers.json'+this.q);
   es.addEventListener('put',e=>{const m=JSON.parse(e.data);this.apply(m.path,m.data);this.emit()});
   es.addEventListener('patch',e=>{const m=JSON.parse(e.data);Object.entries(m.data||{}).forEach(([k,v])=>this.apply(m.path+'/'+k,v));this.emit()});
   es.onopen=()=>{this.status='conectado a Firebase';this.emit()};es.onerror=()=>{this.status='error de conexión con Firebase (revisa URL y reglas)';this.emit()}}
  else{this.mode='local';this.status='modo local (solo este navegador; configura Firebase para varios dispositivos)';
   const load=()=>{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('uf-gps-'))try{this.couriers[k.slice(7)]=JSON.parse(localStorage.getItem(k))}catch{}}this.emit()};load();addEventListener('storage',e=>{if(e.key&&e.key.startsWith('uf-gps-'))load()})}},
 async publish(id,pos){if(this.url){const r=await fetch(this.url+'/couriers/'+id+'.json'+this.q,{method:'PUT',body:JSON.stringify(pos)});if(!r.ok)throw new Error('Firebase respondió '+r.status)}else localStorage.setItem('uf-gps-'+id,JSON.stringify(pos))}};
