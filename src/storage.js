// Capa de almacenamiento. HOY: localStorage del navegador (solo este dispositivo).
// Fase 3-4: este archivo se sustituye por una versión con Cloud Firestore que ofrece las MISMAS funciones,
// así que la pantalla (main.js) no cambia.
const KEY = 'wantlist-v1';
export const SAVE_ERROR = 'No se ha podido guardar el cambio. Comprueba que el navegador permite guardar datos de sitios web e inténtalo de nuevo.';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a : null;
  } catch (e) { return null; }
}
function write(list) {
  // Si falla, lanza error para que la pantalla no diga «guardado» sin estarlo.
  localStorage.setItem(KEY, JSON.stringify(list));
  if (localStorage.getItem(KEY) === null) throw new Error('write failed');
}

export const repo = {
  async loadAll() { return read(); },                       // null = todavía no hay nada guardado
  async upsert(p) {
    const list = read() || [];
    const i = list.findIndex((x) => x.id === p.id);
    if (i >= 0) list[i] = p; else list.unshift(p);
    write(list);
  },
  async upsertMany(items) {
    const list = read() || [];
    items.forEach((p) => { const i = list.findIndex((x) => x.id === p.id); if (i >= 0) list[i] = p; else list.push(p); });
    write(list);
  },
  async removeMany(ids) { write((read() || []).filter((x) => !ids.includes(x.id))); },
  async replaceAll(items) { write(items); },
};
