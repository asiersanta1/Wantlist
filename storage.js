// Capa de almacenamiento: Cloud Firestore.
// Ruta de los datos: users/{uid}/products/{id}  (las reglas de seguridad solo dejan entrar a su dueño).
// La pantalla (main.js) solo usa `repo`; no sabe nada de Firestore.
import { collection, doc, setDoc, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';

export const SAVE_ERROR = 'No se ha podido confirmar el guardado. Comprueba tu conexión e inténtalo de nuevo.';

let uid = null;
const col = () => collection(db, 'users', uid, 'products');

// Firestore no admite valores `undefined`; las notas deben ser siempre texto (lo exigen las reglas).
function clean(p) {
  const o = JSON.parse(JSON.stringify(p));
  o.notes = typeof o.notes === 'string' ? o.notes : '';
  o.userId = uid;
  return o;
}
// Si la escritura no se confirma a tiempo, se avisa de error en vez de decir «guardado».
function confirmed(promise, ms = 12000) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}
async function batched(ops) {
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    ops.slice(i, i + 400).forEach((op) => op(batch));
    await confirmed(batch.commit());
  }
}

export const repo = {
  // Escucha la lista en tiempo real. Devuelve la función para dejar de escuchar.
  watch(userId, onData, onError) {
    uid = userId;
    return onSnapshot(
      col(),
      { includeMetadataChanges: true },
      (snap) => onData(snap.docs.map((d) => d.data()), { pending: snap.metadata.hasPendingWrites, fromCache: snap.metadata.fromCache }),
      (err) => onError(err),
    );
  },
  stop() { uid = null; },
  async upsert(p) { await confirmed(setDoc(doc(col(), p.id), clean(p))); },
  async upsertMany(items) { await batched(items.map((p) => (b) => b.set(doc(col(), p.id), clean(p)))); },
  async removeMany(ids) { await batched(ids.map((id) => (b) => b.delete(doc(col(), id)))); },
  async replaceAll(items) {
    const keep = new Set(items.map((p) => p.id));
    const existing = await confirmed(getDocs(col()));
    const ops = [];
    existing.forEach((d) => { if (!keep.has(d.id)) ops.push((b) => b.delete(d.ref)); });
    items.forEach((p) => ops.push((b) => b.set(doc(col(), p.id), clean(p))));
    await batched(ops);
  },
};
