// Wantlist: pantalla e interacciones. Los datos se leen y guardan solo a través de `repo` (storage.js).
import './styles.css';
import { CATS, STATUS, PRIO, CURS, $, catById, statusById, prioById, esc, todayISO, fmt, fmtDate, safeUrl, uid } from './model.js';
import { demo } from './demo.js';
import { art, imgTag } from './art.js';
import { isPending, atGoal, lastDelta } from './calc.js';
import { validateImport } from './importer.js';
import { repo, SAVE_ERROR } from './storage.js';
import { onUser, signInGoogle, signOutUser, authErrorMessage } from './auth.js';

/* ---------- estado ---------- */
var products=[];
var f={q:'',cat:'all',status:'active',prio:'all',sort:'recent'};
var loaded=false,loadError='',stopWatch=null;
var editingId=null,priceId=null,detailId=null,delArmed=null,toastT=null;

function toast(t){var el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){el.hidden=true},2600)}

/* Guardar: primero se confirma en el almacenamiento y solo después se actualiza la pantalla. */
async function saveOne(p,msg){
  try{await repo.upsert(p)}catch(e){toast(SAVE_ERROR);return false}
  var i=products.findIndex(function(x){return x.id===p.id});
  if(i>=0)products[i]=p;else products.unshift(p);
  render();if(msg)toast(msg);return true;
}
async function removeMany(ids,msg){
  try{await repo.removeMany(ids)}catch(e){toast(SAVE_ERROR);return false}
  products=products.filter(function(x){return ids.indexOf(x.id)<0});
  render();if(msg)toast(msg);return true;
}
/* ---------- sesión y sincronización ---------- */
function showSync(meta){
  var el=$('#sync');if(!el)return;
  if(!meta){el.textContent='';return}
  var off=meta.fromCache&&!navigator.onLine;
  el.className='sync'+(off?' offline':(meta.pending?' pending':''));
  el.textContent=off?'Sin conexión':(meta.pending?'Guardando…':'Sincronizado');
}
function startSession(user){
  $('#login').hidden=true;$('#app').hidden=false;
  loaded=false;loadError='';products=[];render();
  stopWatch=repo.watch(user.uid,function(list,meta){
    products=list;loaded=true;loadError='';render();showSync(meta);
  },function(err){
    loaded=true;loadError=(err&&err.code==='permission-denied')
      ?'Firestore ha rechazado el acceso. Revisa que las reglas de seguridad estén publicadas.'
      :'No se ha podido cargar tu lista. Comprueba tu conexión y recarga la página.';
    render();showSync(null);
  });
}
function endSession(){
  if(stopWatch){stopWatch();stopWatch=null}
  repo.stop();products=[];loaded=false;
  $('#app').hidden=true;$('#login').hidden=false;
  document.querySelectorAll('dialog[open]').forEach(function(d){d.close()});
}
async function boot(){
  onUser(function(user){if(user)startSession(user);else endSession()});
}
$('#btnLogin').addEventListener('click',async function(){
  var b=this,err=$('#loginErr');err.textContent='';b.disabled=true;
  try{await signInGoogle()}catch(e){err.textContent=authErrorMessage(e)}
  b.disabled=false;
});
$('#btnLogout').addEventListener('click',function(){signOutUser().catch(function(){toast('No se ha podido cerrar la sesión. Inténtalo de nuevo.')})});
$('#btnDownload').addEventListener('click',function(){
  try{
    var blob=new Blob([exportJson()],{type:'application/json'});
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='wantlist-'+todayISO()+'.json';
    document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
    toast('Archivo descargado');
  }catch(e){toast('No se ha podido descargar. Usa «Copiar texto» y guárdalo en un archivo .json.')}
});
window.addEventListener('online',function(){showSync({pending:false,fromCache:false})});
window.addEventListener('offline',function(){showSync({pending:false,fromCache:true})});

function matches(p,skipCat){
  if(!skipCat&&f.cat!=='all'&&p.category!==f.cat)return false;
  if(f.status==='active'){if(!isPending(p))return false}
  else if(f.status!=='all'&&p.status!==f.status)return false;
  if(f.prio!=='all'&&p.priority!==f.prio)return false;
  if(f.q){var s=[p.name,p.brand,p.model,p.store,p.notes].join(' ').toLowerCase();
    if(f.q.toLowerCase().split(/\s+/).some(function(w){return w&&s.indexOf(w)<0}))return false}
  return true;
}

/* ---------- render ---------- */
function renderSummary(){
  var pend=products.filter(isPending);
  var eur=pend.filter(function(p){return p.currency==='EUR'&&p.price!=null});
  var total=eur.reduce(function(s,p){return s+p.price},0);
  var other={};pend.forEach(function(p){if(p.price!=null&&p.currency!=='EUR'){other[p.currency]=(other[p.currency]||0)+p.price}});
  var noPrice=pend.filter(function(p){return p.price==null}).length;
  var wait=pend.filter(function(p){return p.status==='oferta'});
  var goal=pend.filter(atGoal).length;
  var bought=products.filter(function(p){return p.status==='comprado'}).length;
  var oth=Object.keys(other).map(function(k){return '<span class="num">+ '+esc(fmt(other[k],k))+'</span>'}).join('');
  $('#summary').innerHTML=
   '<div class="stat"><h2>Valor estimado en euros</h2><div class="big num">'+esc(fmt(total,'EUR')||'0 €')+'</div>'+
     '<p>'+eur.length+' de '+pend.length+' pendientes tienen precio en euros'+(noPrice?'; '+noPrice+' sin precio':'')+'.</p>'+
     (oth?'<p class="others">Sin convertir: '+oth+'</p>':'')+'</div>'+
   '<div class="stat"><h2>Pendientes de comprar</h2><div class="big num">'+pend.length+'</div><p>de '+products.length+' productos guardados</p></div>'+
   '<div class="stat"><h2>Esperando una oferta</h2><div class="big num">'+wait.length+'</div><p>'+(goal?'<span class="hi">'+goal+' en precio objetivo</span>':'Ninguno en precio objetivo')+'</p></div>'+
   '<div class="stat"><h2>Comprados</h2><div class="big num">'+bought+'</div><p>marcados como comprados</p></div>';
}
function renderCats(){
  var base=products.filter(function(p){return matches(p,true)});
  var h='<h2>Categorías</h2><button class="cat" type="button" data-cat="all" aria-pressed="'+(f.cat==='all')+'"><span>Todas</span><span class="n num">'+base.length+'</span></button>';
  CATS.forEach(function(c){
    var n=base.filter(function(p){return p.category===c.id}).length;
    h+='<button class="cat" type="button" data-cat="'+c.id+'" aria-pressed="'+(f.cat===c.id)+'"><span>'+esc(c.name)+'</span><span class="n num">'+n+'</span></button>';
  });
  $('#cats').innerHTML=h;
}
function sortList(a){
  var s=f.sort,c=a.slice();
  if(s==='name')c.sort(function(x,y){return x.name.localeCompare(y.name,'es')});
  else if(s==='prio')c.sort(function(x,y){return prioById(y.priority).n-prioById(x.priority).n||x.name.localeCompare(y.name,'es')});
  else if(s==='price-asc'||s==='price-desc'){
    var dir=s==='price-asc'?1:-1;
    var rank=function(p){return p.price==null?2:(p.currency==='EUR'?0:1)};
    c.sort(function(x,y){var r=rank(x)-rank(y);if(r)return r;if(rank(x)===2)return 0;
      if(x.currency!==y.currency)return x.currency.localeCompare(y.currency);return (x.price-y.price)*dir});
  }else c.sort(function(x,y){return (y.createdAt||'').localeCompare(x.createdAt||'')});
  return c;
}
function prioBars(p){var n=prioById(p.priority).n;return '<span class="prio" role="img" aria-label="Prioridad '+esc(prioById(p.priority).name.toLowerCase())+'"><i class="'+(n>=1?'on':'')+'"></i><i class="'+(n>=2?'on':'')+'"></i><i class="'+(n>=3?'on':'')+'"></i></span>'}
function priceHtml(p){
  if(p.price==null)return '<span class="price none">Sin precio todavía</span>';
  var d=lastDelta(p),dh='';
  if(d)dh='<span class="delta '+(d.d<0?'down':'up')+' num" title="Último cambio de precio">'+(d.d<0?'▼ ':'▲ ')+esc(fmt(Math.abs(d.d),d.cur))+'</span>';
  return '<span class="price num">'+esc(fmt(p.price,p.currency))+'</span>'+dh;
}
function goalHtml(p){
  if(p.target==null)return '';
  var s='Objetivo '+fmt(p.target,'EUR');
  if(p.currency==='EUR'&&p.price!=null&&p.price>p.target)s+=' · faltan '+fmt(p.price-p.target,'EUR');
  else if(p.currency!=='EUR'&&p.price!=null)s+=' · sin convertir';
  return '<span class="goal-line num">'+esc(s)+'</span>';
}
function card(p){
  var st=statusById(p.status),done=!isPending(p);
  var sub=[p.brand,p.model].filter(Boolean).join(' · ');
  var meta=[p.store,p.country].filter(Boolean).join(', ');
  return '<article class="card'+(done?' done':'')+'" data-id="'+esc(p.id)+'">'+
   '<button class="art" type="button" data-act="open" data-id="'+esc(p.id)+'" aria-label="Ver detalle de '+esc(p.name)+'">'+art(p)+imgTag(p)+
     '<span class="chips">'+(p.demo?'<span class="chip demo-t">Demo</span>':'')+(atGoal(p)?'<span class="chip goal">En precio objetivo</span>':'')+'</span></button>'+
   '<div class="body">'+
     '<div class="meta"><span>'+esc(catById(p.category).name)+'</span><span>'+esc(meta)+'</span></div>'+
     '<h3 class="name"><button type="button" data-act="open" data-id="'+esc(p.id)+'">'+esc(p.name)+'</button></h3>'+
     (sub?'<p class="sub">'+esc(sub)+'</p>':'')+
     '<div class="priceline">'+priceHtml(p)+'</div>'+goalHtml(p)+
     '<div class="foot"><span class="pill s-'+st.id+'"><span class="dot"></span>'+esc(st.name)+prioBars(p)+'</span>'+
       '<span class="iconbtns">'+
        '<button class="ib" type="button" data-act="edit" data-id="'+esc(p.id)+'" aria-label="Editar '+esc(p.name)+'" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></button>'+
        '<button class="ib" type="button" data-act="bought" data-id="'+esc(p.id)+'" aria-label="'+(p.status==='comprado'?'Volver a pendiente: ':'Marcar como comprado: ')+esc(p.name)+'" title="'+(p.status==='comprado'?'Volver a pendiente':'Marcar como comprado')+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></button>'+
       '</span></div>'+
   '</div></article>';
}
function renderGrid(){
  var list=sortList(products.filter(function(p){return matches(p)}));
  var active=f.q||f.cat!=='all'||f.status!=='active'||f.prio!=='all';
  $('#btnReset').hidden=!active;
  $('#count').textContent=list.length+(list.length===1?' producto':' productos');
  if(!loaded){$('#count').textContent='';$('#grid').innerHTML='<div class="loading" role="status">Cargando tu lista…</div>';return}
  if(loadError){$('#count').textContent='';$('#grid').innerHTML='<div class="empty"><h3>No se pudo cargar</h3><p>'+esc(loadError)+'</p></div>';return}
  if(!list.length){
    $('#grid').innerHTML= products.length?
      '<div class="empty"><h3>Ningún producto coincide</h3><p>Prueba con otra búsqueda o quita algún filtro para ver más productos.</p><button class="btn" type="button" data-act="reset">Limpiar filtros</button></div>':
      '<div class="empty"><h3>Tu lista está vacía</h3><p>Añade el primer producto pegando su enlace o rellenando los datos a mano.</p><button class="btn primary" type="button" data-act="add">Añadir producto</button><button class="btn small" type="button" data-act="load-demo">Cargar ejemplos de demostración</button></div>';
    return;
  }
  $('#grid').innerHTML=list.map(card).join('');
}
function render(){
  $('#demoBar').hidden=!products.some(function(p){return p.demo});
  renderSummary();renderCats();renderGrid();
  if(dlgDetail.open&&detailId)renderDetail(detailId);
}

/* ---------- detalle ---------- */
var dlgDetail=$('#dlgDetail'),dlgForm=$('#dlgForm'),dlgPrice=$('#dlgPrice'),dlgData=$('#dlgData');
function renderDetail(id){
  var p=products.find(function(x){return x.id===id});
  if(!p){dlgDetail.close();return}
  detailId=id;
  var st=statusById(p.status),url=safeUrl(p.url);
  $('#detailTitle').textContent=p.name;
  var hist=(p.history||[]).slice().reverse();
  var hh=hist.length?'<ul class="hist">'+hist.map(function(h,i){
      var prev=hist[i+1],dl='';
      if(prev&&prev.currency===h.currency&&prev.price!==h.price){var d=h.price-prev.price;dl=' <span class="delta '+(d<0?'down':'up')+'">'+(d<0?'▼ ':'▲ ')+esc(fmt(Math.abs(d),h.currency))+'</span>'}
      return '<li><span class="d num">'+esc(fmtDate(h.date))+'</span><span class="num"><b>'+esc(fmt(h.price,h.currency))+'</b>'+dl+'</span></li>'}).join('')+'</ul>'
    :'<p style="color:var(--muted);margin:6px 0 0;font-size:14px">Todavía no hay cambios de precio registrados.</p>';
  var del=delArmed===p.id
    ?'<button class="btn danger" type="button" data-act="del-yes" data-id="'+esc(p.id)+'">Sí, eliminar</button><button class="btn" type="button" data-act="del-no">No eliminar</button>'
    :'<button class="btn danger" type="button" data-act="del" data-id="'+esc(p.id)+'">Eliminar</button>';
  $('#detailBody').innerHTML=
   '<div class="d-art">'+art(p)+imgTag(p)+'<span class="chips">'+(p.demo?'<span class="chip demo-t">Demo</span>':'')+(atGoal(p)?'<span class="chip goal">En precio objetivo</span>':'')+'</span></div>'+
   '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin-top:16px"><div class="priceline" style="margin:0">'+priceHtml(p)+'</div>'+goalHtml(p)+'</div>'+
   '<dl class="d-grid">'+
    '<div><dt>Estado</dt><dd><span class="pill s-'+st.id+'"><span class="dot"></span>'+esc(st.name)+'</span></dd></div>'+
    '<div><dt>Prioridad</dt><dd>'+esc(prioById(p.priority).name)+' '+prioBars(p)+'</dd></div>'+
    '<div><dt>Categoría</dt><dd>'+esc(catById(p.category).name)+'</dd></div>'+
    '<div><dt>Marca y modelo</dt><dd>'+(esc([p.brand,p.model].filter(Boolean).join(' · '))||'—')+'</dd></div>'+
    '<div><dt>Tienda</dt><dd>'+(esc([p.store,p.country].filter(Boolean).join(', '))||'—')+'</dd></div>'+
    '<div><dt>Enlace</dt><dd>'+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">Abrir en la tienda</a>':'—')+'</dd></div>'+
    '<div><dt>Añadido</dt><dd>'+esc(fmtDate(p.createdAt))+'</dd></div>'+
    '<div><dt>Última modificación</dt><dd>'+esc(fmtDate(p.updatedAt))+'</dd></div>'+
   '</dl>'+
   (p.notes?'<h3 class="sec" style="margin-top:0">Notas</h3><p style="margin:4px 0 0;white-space:pre-wrap">'+esc(p.notes)+'</p>':'')+
   '<h3 class="sec">Historial de precios</h3>'+hh+
   '<div class="actions" style="justify-content:space-between">'+
     '<span style="display:flex;gap:8px;flex-wrap:wrap">'+del+'</span>'+
     '<span style="display:flex;gap:8px;flex-wrap:wrap">'+
      '<button class="btn" type="button" data-act="price" data-id="'+esc(p.id)+'">Registrar precio</button>'+
      '<button class="btn" type="button" data-act="archive" data-id="'+esc(p.id)+'">'+(p.status==='archivado'?'Restaurar':'Archivar')+'</button>'+
      '<button class="btn" type="button" data-act="bought" data-id="'+esc(p.id)+'">'+(p.status==='comprado'?'Volver a pendiente':'Marcar comprado')+'</button>'+
      '<button class="btn primary" type="button" data-act="edit" data-id="'+esc(p.id)+'">Editar</button>'+
     '</span></div>';
}
function openDetail(id){delArmed=null;renderDetail(id);if(!dlgDetail.open)dlgDetail.showModal()}

/* ---------- formulario ---------- */
function fillSelects(){
  $('#fCat').innerHTML=CATS.map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+'</option>'}).join('');
  $('#fStatusF').innerHTML=STATUS.map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+'</option>'}).join('');
  var cur=CURS.map(function(c){return '<option>'+c+'</option>'}).join('');
  $('#fCur').innerHTML=cur;$('#pCur').innerHTML=cur;
  $('#fPrioSeg').innerHTML=PRIO.map(function(p){return '<label><input type="radio" name="prio" value="'+p.id+'"><span>'+p.name+'</span></label>'}).join('');
  $('#fStatus').innerHTML='<option value="active">Pendientes</option><option value="all">Todos</option>'+STATUS.map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+'</option>'}).join('');
  $('#fPrio').innerHTML='<option value="all">Todas</option>'+PRIO.map(function(p){return '<option value="'+p.id+'">'+p.name+'</option>'}).join('');
}
function clearErrs(){['eUrl','eName','ePrice','eTarget','eImg'].forEach(function(i){$('#'+i).textContent=''});
  ['fUrl','fName','fPrice','fTarget','fImg'].forEach(function(i){$('#'+i).removeAttribute('aria-invalid')})}
function setErr(inp,err,msg){$('#'+err).textContent=msg;$('#'+inp).setAttribute('aria-invalid','true')}
function openForm(id){
  editingId=id||null;clearErrs();
  var p=id?products.find(function(x){return x.id===id}):null;
  $('#formTitle').textContent=p?'Editar producto':'Añadir producto';
  $('#btnSave').textContent=p?'Guardar cambios':'Guardar producto';
  $('#fUrl').value=p?p.url||'':'';$('#fName').value=p?p.name:'';$('#fBrand').value=p?p.brand||'':'';$('#fModel').value=p?p.model||'':'';
  $('#fStore').value=p?p.store||'':'';$('#fCountry').value=p?p.country||'':'';
  $('#fCat').value=p?p.category:(f.cat!=='all'?f.cat:'tecnologia');
  $('#fStatusF').value=p?p.status:'interesa';
  $('#fPrice').value=p&&p.price!=null?p.price:'';$('#fCur').value=p?p.currency:'EUR';
  $('#fTarget').value=p&&p.target!=null?p.target:'';$('#fImg').value=p?p.image||'':'';$('#fNotes').value=p?p.notes||'':'';
  var pr=p?p.priority:'media';
  document.querySelectorAll('input[name=prio]').forEach(function(r){r.checked=r.value===pr});
  if(dlgDetail.open)dlgDetail.close();
  dlgForm.showModal();
  setTimeout(function(){(p?$('#fName'):$('#fUrl')).focus()},30);
}
function guessFromUrl(){
  var u=safeUrl($('#fUrl').value.trim());if(!u)return;
  var host=new URL(u).hostname.replace(/^www\./,'');
  var parts=host.split('.');
  var tld=parts.slice(-2).join('.'),last=parts[parts.length-1];
  var country='';
  if(last==='es')country='España';else if(last==='my')country='Malasia';else if(tld==='co.uk'||last==='uk')country='Reino Unido';else if(last==='jp')country='Japón';
  var core=parts.length>2&&/^(co|com|org|net)$/.test(parts[parts.length-2])?parts[parts.length-3]:parts[Math.max(0,parts.length-2)];
  if(!$('#fStore').value&&core)$('#fStore').value=core.charAt(0).toUpperCase()+core.slice(1);
  if(!$('#fCountry').value&&country)$('#fCountry').value=country;
  if(country==='Malasia'&&!$('#fPrice').value)$('#fCur').value='MYR';
  if(country==='Reino Unido'&&!$('#fPrice').value)$('#fCur').value='GBP';
}
function numOrNull(v){v=String(v).trim().replace(',','.');if(v==='')return null;var n=Number(v);return isNaN(n)?NaN:n}
$('#form').addEventListener('submit',async function(e){
  e.preventDefault();clearErrs();var ok=true;
  var name=$('#fName').value.trim();
  if(!name){setErr('fName','eName','Escribe el nombre del producto.');ok=false}
  var url=$('#fUrl').value.trim();
  if(url&&!safeUrl(url)){setErr('fUrl','eUrl','El enlace debe empezar por http:// o https://.');ok=false}
  var img=$('#fImg').value.trim();
  if(img&&!safeUrl(img)){setErr('fImg','eImg','El enlace de la imagen debe empezar por http:// o https://.');ok=false}
  var price=numOrNull($('#fPrice').value);
  if(price!==null&&(isNaN(price)||price<0)){setErr('fPrice','ePrice','Introduce un precio válido, por ejemplo 129,90.');ok=false}
  var target=numOrNull($('#fTarget').value);
  if(target!==null&&(isNaN(target)||target<0)){setErr('fTarget','eTarget','Introduce un precio objetivo válido.');ok=false}
  if(!ok){var first=dlgForm.querySelector('[aria-invalid="true"]');if(first)first.focus();return}
  var now=todayISO(),cur=$('#fCur').value;
  var data={name:name,brand:$('#fBrand').value.trim(),model:$('#fModel').value.trim(),url:safeUrl(url),store:$('#fStore').value.trim(),
    country:$('#fCountry').value.trim(),image:safeUrl(img),category:$('#fCat').value,status:$('#fStatusF').value,
    price:price,currency:cur,target:target,notes:$('#fNotes').value.trim(),
    priority:(document.querySelector('input[name=prio]:checked')||{value:'media'}).value};
  var saved;
  if(editingId){
    var p=products.find(function(x){return x.id===editingId});
    var changed=data.price!==null&&(p.price!==data.price||p.currency!==data.currency);
    var np=Object.assign({},p,data,{updatedAt:now,history:(p.history||[]).slice()});
    if(changed)np.history.push({price:data.price,currency:cur,date:now});
    saved=await saveOne(np,'Cambios guardados');
  }else{
    data.id=uid();data.createdAt=now;data.updatedAt=now;data.history=price!==null?[{price:price,currency:cur,date:now}]:[];
    saved=await saveOne(data,'Producto añadido');
  }
  if(saved)dlgForm.close();
});
$('#fUrl').addEventListener('change',guessFromUrl);
$('#fUrl').addEventListener('paste',function(){setTimeout(guessFromUrl,0)});

/* ---------- registrar precio ---------- */
function openPrice(id){
  var p=products.find(function(x){return x.id===id});if(!p)return;
  priceId=id;$('#ePAmount').textContent='';
  $('#priceFor').textContent=p.name+(p.price!=null?' · ahora '+fmt(p.price,p.currency):'');
  $('#pAmount').value='';$('#pCur').value=p.currency||'EUR';$('#pDate').value=todayISO();
  if(dlgDetail.open)dlgDetail.close();
  dlgPrice.showModal();setTimeout(function(){$('#pAmount').focus()},30);
}
$('#priceForm').addEventListener('submit',async function(e){
  e.preventDefault();
  var v=numOrNull($('#pAmount').value);
  if(v===null||isNaN(v)||v<0){$('#ePAmount').textContent='Introduce el nuevo precio, por ejemplo 99,90.';return}
  var d=$('#pDate').value||todayISO();
  var p=products.find(function(x){return x.id===priceId});if(!p)return;
  var np=Object.assign({},p,{history:(p.history||[]).concat([{price:v,currency:$('#pCur').value,date:d}])});
  np.history.sort(function(a,b){return a.date.localeCompare(b.date)});
  var last=np.history[np.history.length-1];
  np.price=last.price;np.currency=last.currency;np.updatedAt=todayISO();
  if(await saveOne(np,'Precio guardado')){dlgPrice.close();openDetail(np.id)}
});

/* ---------- copia de seguridad ---------- */
function exportJson(){return JSON.stringify({app:'wantlist',version:1,exportedAt:new Date().toISOString(),products:products},null,2)}
function openData(){
  $('#exportBox').value=exportJson();$('#importBox').value='';$('#importMsg').innerHTML='';$('#importReplace').checked=false;$('#importFile').value='';
  replaceArmed=false;$('#btnImport').textContent='Importar';
  dlgData.showModal();
}
var replaceArmed=false;
$('#importFile').addEventListener('change',function(){
  var file=this.files&&this.files[0];if(!file)return;
  var r=new FileReader();r.onload=function(){$('#importBox').value=String(r.result)};
  r.onerror=function(){$('#importMsg').innerHTML='<div class="msg bad">No se pudo leer el archivo. Prueba a pegar su contenido en el cuadro.</div>'};
  r.readAsText(file);
});
$('#btnImport').addEventListener('click',async function(){
  var txt=$('#importBox').value.trim(),msg=$('#importMsg');
  if(!txt){msg.innerHTML='<div class="msg bad">Pega una copia de seguridad o elige un archivo primero.</div>';return}
  var v=validateImport(txt);
  if(v.error){msg.innerHTML='<div class="msg bad">'+esc(v.error)+' No se ha cambiado nada.</div>';return}
  var replace=$('#importReplace').checked;
  if(replace&&!replaceArmed){replaceArmed=true;$('#btnImport').textContent='Confirmar: reemplazar todo';
    msg.innerHTML='<div class="msg bad">Se borrarán los '+products.length+' productos actuales y se sustituirán por '+v.items.length+'. Pulsa de nuevo para confirmar.</div>';return}
  var added=0,skipped=0;
  try{
    if(replace){await repo.replaceAll(v.items);products=v.items;added=v.items.length}
    else{var ids={};products.forEach(function(p){ids[p.id]=1});var fresh=[];
      v.items.forEach(function(p){if(ids[p.id]){skipped++}else{fresh.push(p);ids[p.id]=1;added++}});
      if(fresh.length){await repo.upsertMany(fresh);products=products.concat(fresh)}}
  }catch(err){msg.innerHTML='<div class="msg bad">'+esc(SAVE_ERROR)+' No se ha cambiado nada.</div>';return}
  render();replaceArmed=false;$('#btnImport').textContent='Importar';
  $('#exportBox').value=exportJson();
  msg.innerHTML='<div class="msg">Importación completada: '+added+' añadidos'+(skipped?', '+skipped+' ya existían':'')+(v.bad?', '+v.bad+' descartados por datos incorrectos':'')+'.</div>';
  toast('Copia importada');
});
$('#importReplace').addEventListener('change',function(){replaceArmed=false;$('#btnImport').textContent='Importar';$('#importMsg').innerHTML=''});
$('#btnCopy').addEventListener('click',function(){
  var box=$('#exportBox');
  function fallback(){box.focus();box.select();toast('Texto seleccionado. Cópialo con Ctrl+C o con el menú del móvil')}
  try{navigator.clipboard.writeText(box.value).then(function(){toast('Copia guardada en el portapapeles')},fallback)}catch(e){fallback()}
});

/* ---------- eventos ---------- */
function setStatus(id,s,msg){var p=products.find(function(x){return x.id===id});if(!p)return;return saveOne(Object.assign({},p,{status:s,updatedAt:todayISO()}),msg)}
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-act],[data-cat],[data-close]');
  if(e.target.tagName==='DIALOG'){e.target.close();return}
  if(!t)return;
  if(t.hasAttribute('data-close')){t.closest('dialog').close();return}
  if(t.dataset.cat){f.cat=t.dataset.cat;render();return}
  var a=t.dataset.act,id=t.dataset.id;
  var p=products.find(function(x){return x.id===id});
  if(a==='open')openDetail(id);
  else if(a==='edit')openForm(id);
  else if(a==='add')openForm();
  else if(a==='price')openPrice(id);
  else if(a==='bought'&&p){var was=p.status==='comprado';setStatus(id,was?'interesa':'comprado',was?'Vuelve a estar pendiente':'Marcado como comprado')}
  else if(a==='archive'&&p){var arch=p.status==='archivado';setStatus(id,arch?'interesa':'archivado',arch?'Producto restaurado':'Producto archivado')}
  else if(a==='del'){delArmed=id;renderDetail(id)}
  else if(a==='del-no'){delArmed=null;renderDetail(detailId)}
  else if(a==='del-yes'){delArmed=null;removeMany([id],'Producto eliminado').then(function(ok){if(ok)dlgDetail.close()})}
  else if(a==='load-demo'){repo.upsertMany(demo()).then(function(){toast('Ejemplos cargados. Están marcados como «Demo»')}).catch(function(){toast(SAVE_ERROR)})}
  else if(a==='reset')resetFilters();
});
function resetFilters(){f={q:'',cat:'all',status:'active',prio:'all',sort:f.sort};$('#q').value='';$('#fStatus').value='active';$('#fPrio').value='all';render()}
$('#btnReset').addEventListener('click',resetFilters);
$('#btnAdd').addEventListener('click',function(){openForm()});
$('#fab').addEventListener('click',function(){openForm()});
$('#btnData').addEventListener('click',openData);
$('#q').addEventListener('input',function(){f.q=this.value.trim();render()});
$('#fStatus').addEventListener('change',function(){f.status=this.value;render()});
$('#fPrio').addEventListener('change',function(){f.prio=this.value;render()});
$('#fSort').addEventListener('change',function(){f.sort=this.value;render()});
$('#btnClearDemo').addEventListener('click',async function(){
  var b=this;
  if(!b.dataset.armed){b.dataset.armed='1';b.textContent='Confirmar: borrar solo los de demostración';setTimeout(function(){delete b.dataset.armed;b.textContent='Borrar datos de demostración'},4000);return}
  delete b.dataset.armed;b.textContent='Borrar datos de demostración';
  var ids=products.filter(function(p){return p.demo}).map(function(p){return p.id});
  await removeMany(ids,ids.length+' productos de demostración borrados');
});

fillSelects();
boot();
