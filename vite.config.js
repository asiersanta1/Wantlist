import { defineConfig } from 'vite';

// base './' hace que la web funcione desde cualquier ruta, incluida
// https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/ en GitHub Pages.
export default defineConfig({
  base: './',
});
