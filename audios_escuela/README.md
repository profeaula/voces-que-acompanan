# Voces que acompañan — aplicación de audios para escuela infantil

Aplicación responsive con Next.js + Supabase. Las familias graban desde el navegador, escuchan una vista previa y envían el audio. El panel del aula permite buscar, ordenar, escuchar, eliminar y reproducir los mensajes en orden aleatorio.

## Requisito importante sobre «sin contraseñas»

Esta versión no pide contraseña ni a las familias ni a la profesora. **Eso significa que el panel `/profesora` y sus funciones de lectura, reproducción y borrado son públicos para cualquiera que conozca la dirección de la web.** No es una configuración adecuada para datos personales y voces de menores en una web pública. Antes de usarla con familias reales, la escuela debe aceptar expresamente ese riesgo y aplicar medidas organizativas (por ejemplo, acceso solo desde una red/dispositivo del centro) o autorizar un mecanismo de acceso para el personal. No publiques el enlace del panel en la página familiar.

El bucket de Storage sí es privado y los audios se sirven con enlaces firmados de 10 minutos. La clave `service_role` se usa solo en el servidor.

## Requisitos

- Node.js 20.9 o superior.
- Proyecto Supabase.
- HTTPS en producción (necesario para el micrófono en móviles; localhost funciona para desarrollo).

## Instalación

1. Descomprime el proyecto y entra en la carpeta:
   ```bash
   cd audios_escuela
   npm install
   ```
2. En Supabase crea un proyecto.
3. En Supabase → SQL Editor, ejecuta el contenido de `supabase/schema.sql`.
4. En Project Settings → API copia Project URL y `service_role` key.
5. Copia `.env.example` como `.env.local` y completa:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
   ```
   **No uses `NEXT_PUBLIC_` en la clave service role ni la subas a Git.**
6. Arranca:
   ```bash
   npm run dev
   ```
   Abre `http://localhost:3000`. Familias: `/`. Panel docente: `/profesora`.

## Despliegue (Vercel)

1. Sube el proyecto a un repositorio privado de GitHub.
2. En Vercel importa el repositorio y selecciona Next.js.
3. Añade las variables `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Environment Variables.
4. Despliega y prueba desde un móvil usando la URL HTTPS.
5. Comparte la URL principal con las familias. La ruta `/profesora` no está enlazada desde la página familiar, pero **no está protegida**.

## Funcionamiento y límites

- Grabación en navegador mediante `MediaRecorder`; requiere permiso de micrófono.
- Duración máxima en la interfaz: 10 minutos. El servidor comprueba el valor de duración enviado y limita el tamaño a 25 MB. Como la duración la informa el navegador, esta comprobación no equivale a analizar el códec y la duración real del archivo; para un entorno sensible conviene validar el medio en servidor con FFmpeg u otro procesador.
- Subida con progreso visible.
- Audio en bucket privado; enlaces firmados de reproducción válidos durante 10 minutos.
- Datos guardados: nombre del niño/a, remitente opcional, fecha/hora, duración y ruta del objeto.
- La reproducción aleatoria baraja la lista cargada en ese momento y reproduce cada elemento una vez.
- Los audios se eliminan del almacenamiento y de la tabla desde el panel.

## Privacidad y protección de datos

Las voces son datos personales y corresponden a menores. Antes de poner la aplicación en funcionamiento, la escuela debe definir responsable del tratamiento, base jurídica, información a las familias, plazos de conservación, procedimiento de retirada/borrado, contratos con encargados, región de alojamiento y medidas de seguridad. Un checkbox por sí solo no garantiza el cumplimiento del RGPD/LOPDGDD. Consulta con la persona delegada de protección de datos del centro. Configura también copias de seguridad y una política de borrado.

## Estructura

```text
src/
  app/
    api/audios/route.ts
    api/audios/[id]/route.ts
    api/audios/[id]/url/route.ts
    profesora/page.tsx
    globals.css
    layout.tsx
    page.tsx
  lib/supabase-admin.ts
supabase/schema.sql
.env.example
```


## IMPORTANTE ANTES DE PUBLICAR

La ruta `/profesora` no incorpora autenticación en esta versión porque se solicitó un acceso sin contraseñas. Por tanto, cualquier persona que conozca la dirección podría consultar y borrar audios. No publiques datos ni voces reales de menores hasta que el centro defina un mecanismo de acceso seguro y revise el consentimiento y la política de conservación de audios conforme al RGPD. La casilla de consentimiento de la pantalla es una confirmación de interfaz, no sustituye la revisión legal del centro.
