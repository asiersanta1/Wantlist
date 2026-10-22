// Inicio y cierre de sesión con Google (Firebase Authentication).
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';

export function onUser(cb) { return onAuthStateChanged(auth, cb); }

export function signInGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

export function signOutUser() { return signOut(auth); }

export function authErrorMessage(e) {
  switch (e && e.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Se cerró la ventana de Google antes de terminar. Pulsa el botón para intentarlo de nuevo.';
    case 'auth/popup-blocked':
      return 'El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes de este sitio e inténtalo de nuevo.';
    case 'auth/unauthorized-domain':
      return 'Este sitio aún no está autorizado en Firebase. Hay que añadir su dirección en Authentication, Configuración, Dominios autorizados.';
    case 'auth/network-request-failed':
      return 'No hay conexión con Google. Comprueba tu internet e inténtalo de nuevo.';
    default:
      return 'No se ha podido iniciar sesión. Inténtalo de nuevo.';
  }
}
