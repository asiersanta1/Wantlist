// Ilustraciones de muestra de las tarjetas y carga segura de imágenes por enlace.
import { catById, esc, safeUrl } from './model.js';

export function art(p){
  var c=catById(p.category),ch=(p.brand||p.name||'?').trim().charAt(0).toUpperCase();
  var shapes={
   tecnologia:'<rect x="130" y="50" width="140" height="200" rx="26" fill="rgba(20,22,26,.09)"/><circle cx="200" cy="215" r="10" fill="rgba(20,22,26,.14)"/>',
   ropa:'<path d="M200 50c-14 0-22 9-22 20L110 100l22 36 22-12v126h92V124l22 12 22-36-68-30c0-11-8-20-22-20z" fill="rgba(20,22,26,.09)"/>',
   calzado:'<path d="M70 210c0-30 40-30 60-70l30 18c20 12 60 6 90 24 34 8 50 10 50 28H70z" fill="rgba(20,22,26,.09)"/>',
   accesorios:'<circle cx="200" cy="150" r="82" fill="rgba(20,22,26,.09)"/><circle cx="200" cy="150" r="58" fill="none" stroke="rgba(20,22,26,.16)" stroke-width="3"/>',
   hogar:'<path d="M120 260V140a80 80 0 0 1 160 0v120z" fill="rgba(20,22,26,.09)"/>',
   viajes:'<circle cx="200" cy="190" r="90" fill="rgba(20,22,26,.09)"/><rect x="0" y="190" width="400" height="110" fill="rgba(20,22,26,.07)"/>',
   deporte:'<circle cx="200" cy="150" r="88" fill="rgba(20,22,26,.09)"/><path d="M112 150a88 88 0 0 1 176 0" fill="none" stroke="rgba(20,22,26,.16)" stroke-width="3"/>',
   otros:'<path d="M200 56l96 94-96 94-96-94z" fill="rgba(20,22,26,.09)"/>'};
  return '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="'+c.tone+'"/>'+(shapes[p.category]||shapes.otros)+
   '<text x="200" y="196" text-anchor="middle" font-family="Instrument Serif,Georgia,serif" font-size="150" fill="rgba(20,22,26,.78)">'+esc(ch)+'</text></svg>';
}
export function imgTag(p){var u=safeUrl(p.image);return u?'<img data-ext="1" src="'+esc(u)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':''}
document.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='IMG'&&t.dataset.ext)t.remove()},true);

