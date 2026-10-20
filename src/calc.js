// Cálculos puros sobre productos (sin tocar la pantalla).

export const isPending=function(p){return p.status!=='comprado'&&p.status!=='archivado'};
export const atGoal=function(p){return isPending(p)&&p.currency==='EUR'&&p.price!=null&&p.target!=null&&p.price<=p.target};
export function lastDelta(p){
  var h=p.history||[];if(h.length<2)return null;
  var a=h[h.length-1],b=h[h.length-2];
  if(a.currency!==b.currency)return null;
  var d=a.price-b.price;return d===0?null:{d:d,cur:a.currency};
}
