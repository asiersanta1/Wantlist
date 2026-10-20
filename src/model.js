// Modelo: categorías, estados, prioridades y funciones auxiliares (formato de precios, fechas, enlaces).
export const CATS=[
 {id:'tecnologia',name:'Tecnología',tone:'#C9D3E4'},
 {id:'ropa',name:'Ropa',tone:'#E2D3CC'},
 {id:'calzado',name:'Zapatillas y calzado',tone:'#D8D9C4'},
 {id:'accesorios',name:'Accesorios y relojes',tone:'#DAD0BE'},
 {id:'hogar',name:'Hogar',tone:'#D1DDD4'},
 {id:'viajes',name:'Viajes',tone:'#C5DAE0'},
 {id:'deporte',name:'Deporte',tone:'#DCCFD8'},
 {id:'otros',name:'Otros',tone:'#D6D6D2'}];
export const STATUS=[
 {id:'interesa',name:'Me interesa'},{id:'oferta',name:'Esperando una oferta'},
 {id:'decidido',name:'Decidido a comprar'},{id:'comprado',name:'Comprado'},{id:'archivado',name:'Archivado'}];
export const PRIO=[{id:'baja',name:'Baja',n:1},{id:'media',name:'Media',n:2},{id:'alta',name:'Alta',n:3}];
export const CURS=['EUR','MYR','USD','GBP','JPY','SGD','AUD'];
export const $=function(s){return document.querySelector(s)};
export const catById=function(id){return CATS.find(function(c){return c.id===id})||CATS[7]};
export const statusById=function(id){return STATUS.find(function(c){return c.id===id})||STATUS[0]};
export const prioById=function(id){return PRIO.find(function(c){return c.id===id})||PRIO[1]};
export function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
export function todayISO(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
export function daysAgo(n){var d=new Date();d.setDate(d.getDate()-n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
export function fmt(v,cur){
  if(v==null||isNaN(v))return '';
  try{return new Intl.NumberFormat('es-ES',{style:'currency',currency:cur||'EUR',minimumFractionDigits:0,maximumFractionDigits:2}).format(v)}
  catch(e){return v+' '+cur}
}
export function fmtDate(iso){
  if(!iso)return '';
  var p=iso.slice(0,10).split('-');if(p.length<3)return iso;
  var m=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return +p[2]+' '+m[+p[1]-1]+' '+p[0];
}
export function safeUrl(u){try{var x=new URL(u);return (x.protocol==='http:'||x.protocol==='https:')?x.href:''}catch(e){return ''}}
export function uid(){return 'p-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}

