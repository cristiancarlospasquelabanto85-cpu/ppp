// Cola de prioridad propia: montículo binario mínimo sobre un arreglo.
class PriorityQueue{constructor(){this.h=[]}
 get size(){return this.h.length} isEmpty(){return !this.h.length}
 push(item,pri){const h=this.h;h.push({item,pri});let i=h.length-1;while(i>0){const p=(i-1)>>1;if(h[p].pri<=h[i].pri)break;[h[p],h[i]]=[h[i],h[p]];i=p}}
 pop(){const h=this.h,top=h[0],last=h.pop();if(h.length){h[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<h.length&&h[l].pri<h[m].pri)m=l;if(r<h.length&&h[r].pri<h[m].pri)m=r;if(m===i)break;[h[m],h[i]]=[h[i],h[m]];i=m}}return top}}
