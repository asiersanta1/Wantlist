// Validación de copias de seguridad JSON. Si algo es inválido, no se importa nada.
import { CATS, STATUS, PRIO, safeUrl, todayISO, uid } from './model.js';

export function validateImport(txt){
  var j;try{j=JSON.parse(txt)}catch(e){return {error:'El texto no es un JSON válido. Copia la copia de seguridad completa, de principio a fin.'}}
  var arr=Array.isArray(j)?j:(j&&Array.isArray(j.products)?j.products:null);
  if(!arr)return {error:'No se encontró la lista de productos. El archivo debe contener «products».'};
  var out=[],bad=0;
  arr.forEach(function(r){
    if(!r||typeof r!=='object'||typeof r.name!=='string'||!r.name.trim()){bad++;return}
    var price=(r.price===null||r.price===undefined||r.price==='')?null:Number(r.price);
    if(price!==null&&(isNaN(price)||price<0)){bad++;return}
    var target=(r.target===null||r.target===undefined||r.target==='')?null:Number(r.target);
    if(target!==null&&(isNaN(target)||target<0))target=null;
    var cur=typeof r.currency==='string'&&/^[A-Za-z]{3}$/.test(r.currency)?r.currency.toUpperCase():'EUR';
    out.push({id:typeof r.id==='string'&&r.id?r.id:uid(),name:r.name.trim().slice(0,120),brand:String(r.brand||'').slice(0,60),model:String(r.model||'').slice(0,60),
      url:safeUrl(r.url||''),image:safeUrl(r.image||''),store:String(r.store||'').slice(0,60),country:String(r.country||'').slice(0,40),
      category:CATS.some(function(c){return c.id===r.category})?r.category:'otros',
      status:STATUS.some(function(c){return c.id===r.status})?r.status:'interesa',
      priority:PRIO.some(function(c){return c.id===r.priority})?r.priority:'media',
      price:price,currency:cur,target:target,notes:String(r.notes||'').slice(0,1000),
      createdAt:/^\d{4}-\d{2}-\d{2}/.test(r.createdAt||'')?r.createdAt.slice(0,10):todayISO(),
      updatedAt:/^\d{4}-\d{2}-\d{2}/.test(r.updatedAt||'')?r.updatedAt.slice(0,10):todayISO(),
      demo:r.demo===true,
      history:Array.isArray(r.history)?r.history.filter(function(h){return h&&typeof h.price==='number'&&typeof h.date==='string'}).map(function(h){return {price:h.price,currency:String(h.currency||cur).toUpperCase().slice(0,3),date:h.date.slice(0,10)}}):[]});
  });
  if(!out.length)return {error:'No hay ningún producto válido para importar'+(bad?' ('+bad+' descartados por datos incorrectos).':'.')};
  return {items:out,bad:bad};
}
