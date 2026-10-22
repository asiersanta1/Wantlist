// Conexión con tu proyecto de Firebase.
// Estos datos son PÚBLICOS por diseño (identifican el proyecto, no dan acceso).
// La seguridad real la ponen el inicio de sesión y las reglas de Firestore.
// NUNCA pegues aquí contraseñas, claves privadas ni archivos de "cuenta de servicio".
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDbdM1T5Ugr08XDdM8S8CM56pq_GuNVPEw',
  authDomain: 'hashwantlist.firebaseapp.com',
  projectId: 'hashwantlist',
  storageBucket: 'hashwantlist.firebasestorage.app',
  messagingSenderId: '591109941530',
  appId: '1:591109941530:web:eb5d7a8a4f20f1a8cae4a3',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
