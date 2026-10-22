# Wantlist

Aplicación web personal para guardar y organizar los productos que quiero comprar.

**Estado actual (fase 5):** interfaz conectada a Firebase (inicio de sesión con Google y Cloud Firestore).
Pendiente: publicar en GitHub Pages, autorizar el dominio en Firebase y pruebas de aceptación (fase 6 y 7).

## Estructura

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura de la página y ventanas (formulario, detalle, copia de seguridad) |
| `src/styles.css` | Todo el diseño, en claro y oscuro |
| `src/model.js` | Categorías, estados, prioridades y funciones de formato (precios, fechas) |
| `src/calc.js` | Cálculos: pendientes, precio objetivo, último cambio de precio |
| `src/art.js` | Ilustraciones de muestra de las tarjetas |
| `src/demo.js` | Datos de demostración (inventados, marcados «Demo») |
| `src/importer.js` | Validación de copias de seguridad JSON |
| `src/storage.js` | **Único** archivo que guarda y lee datos (Cloud Firestore, ruta `users/{uid}/products/{id}`) |
| `src/firebase.js` | Configuración pública del proyecto Firebase |
| `src/auth.js` | Inicio y cierre de sesión con Google |
| `src/main.js` | Pantalla e interacciones |
| `.github/workflows/deploy.yml` | Publicación automática en GitHub Pages (fase 6) |

## Reglas del proyecto

- Coste cero: no activar facturación ni servicios de pago.
- Nunca subir contraseñas, claves privadas ni copias de seguridad con datos personales al repositorio.
- No se convierten monedas con tipos de cambio inventados.
- El comparador automático de precios queda fuera del MVP.

## Ejecutar en local (opcional, requiere Node.js 20 o superior)

    npm install
    npm run dev       # desarrollo
    npm run build     # genera la carpeta dist/
