// Lista enlazada simple propia: historial de eventos.
class LNode{constructor(v){this.value=v;this.next=null}}
class LinkedList{constructor(){this.head=null;this.tail=null;this.size=0}
 push(v){const n=new LNode(v);if(this.tail)this.tail.next=n;else this.head=n;this.tail=n;this.size++;return this} // insertar al final O(1)
 get(i){let c=this.head;while(c&&i--)c=c.next;return c?c.value:undefined}
 find(fn){for(let c=this.head;c;c=c.next)if(fn(c.value))return c.value}
 toArray(){const a=[];for(let c=this.head;c;c=c.next)a.push(c.value);return a}}
