# Un Gol de Closs 🎙️

Juego diario estilo Heardle/Songless: en vez de canciones, se adivinan **relatos de goles de Mariano Closs**.
Tres categorías por región: **Europa** (Champions, LaLiga, Premier…), **Sudamérica** (Libertadores, Sudamericana, ligas locales…) y **Selecciones** (Mundiales, Copa América, Eurocopa…), con **un relato por categoría por día**. Las tres se renuevan a las 00:00 de Buenos Aires, como Songless. Cada partida tiene 6 intentos con fragmentos de 1, 2, 4, 7, 11 y 16 segundos.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Storage, Auth) con `@supabase/ssr`.

---

## Estructura

```
├── supabase/
│   ├── migrations/20260101000000_init.sql   # tablas, RLS, función de sorteo, bucket
│   ├── migrations/20260102000000_categorias_por_region.sql  # pasa a Europa / Sudamérica / Selecciones
│   └── seed.sql                             # 10 relatos placeholder
├── src/
│   ├── middleware.ts                        # protege /admin (sesión + ADMIN_EMAIL)
│   ├── app/
│   │   ├── page.tsx                         # portada: las 3 categorías y su estado de hoy
│   │   ├── [categoria]/page.tsx             # el juego (/europa, /sudamerica, /selecciones)
│   │   ├── layout.tsx / globals.css         # tema "fútbol de noche"
│   │   ├── api/
│   │   │   ├── puzzle/today/route.ts        # GET  ?cat= → número + fuente de audio (sin datos del gol)
│   │   │   ├── puzzle/guess/route.ts        # POST { categoria, relatoId, intento } → { correcto, cerca }
│   │   │   ├── puzzle/reveal/route.ts       # GET  ?cat= datos del gol (solo con partida terminada)
│   │   │   └── relatos/route.ts             # GET  ?cat= catálogo para el autocompletado (rol anon)
│   │   ├── auth/callback/route.ts           # canje del link mágico
│   │   └── admin/
│   │       ├── page.tsx, actions.ts         # panel + server actions (CRUD, storage, calendario)
│   │       └── login/                       # login por link mágico
│   ├── components/
│   │   ├── game/                            # Home, Game, CategoryTabs, AttemptList, GuessInput, ProgressBar, modales
│   │   ├── admin/                           # AdminPanel, RelatoForm, FragmentPreview, PuzzleCalendar
│   │   └── ui/                              # Modal, Logo, íconos
│   └── lib/
│       ├── audio/                           # AudioSource + FileAudioSource + YouTubeAudioSource
│       ├── supabase/                        # clientes server / admin (service role) / public / browser
│       ├── puzzle.ts                        # lógica del puzzle del día (solo servidor)
│       ├── storage.ts                       # partida y estadísticas en localStorage
│       └── date.ts, text.ts, constants.ts, types.ts, auth.ts
└── .env.example
```

## Categorías

- Cada relato pertenece a una categoría (`relatos.categoria`: `europa`, `sudamerica` o `selecciones`).
- `puzzles_diarios` tiene clave `(fecha, categoria)`: tres puzzles por día. El `numero` es el mismo para las tres categorías de un mismo día (días desde `NEXT_PUBLIC_LAUNCH_DATE` + 1).
- Un trigger impide asignar a un puzzle un relato de otra categoría.
- El autocompletado de cada juego muestra solo relatos de esa categoría.
- La partida y las estadísticas se guardan por separado para cada categoría.
- Para agregar una categoría: sumala en `CATEGORIAS` (`src/lib/constants.ts`) y en los dos `check (categoria in (...))` del SQL.

## Cómo se protege la respuesta

- `relatos` tiene RLS y **privilegios por columna**: el rol `anon` solo puede leer `id, categoria, jugador, equipo, rival, competicion, anio` de relatos activos. `audio_path`, `youtube_id` y `start_seconds` no se pueden leer desde el cliente.
- `puzzles_diarios` no tiene políticas: solo el servidor (service role) sabe qué relato toca hoy.
- `/api/puzzle/today` devuelve una **signed URL de 5 minutos** con nombre de archivo UUID (el admin los genera así). El cliente descarga el audio a un Blob antes de habilitar el play.
- `/api/puzzle/guess` solo responde `{ correcto, cerca }`.
- `/api/puzzle/reveal` exige la lista de intentos del cliente y valida que la partida haya terminado: el último intento es el correcto, o hubo 6 intentos sin acertar.

> **Límites conocidos (inherentes a un juego 100% en el navegador):** quien inspeccione la red puede descargar el audio completo, o ver el video en YouTube. El recorte a 1/2/4… segundos lo hace el cliente. Con la fuente `youtube`, el video se tapa durante la partida (`NEXT_PUBLIC_OCULTAR_VIDEO`) para que no delate el gol. Las políticas de la API de YouTube prohíben ocultar el reproductor: YouTube podría bloquear la reproducción embebida. Si pasa, poné `NEXT_PUBLIC_OCULTAR_VIDEO=false` o usá audios propios (`file`).

## Setup en Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → pegá y ejecutá `supabase/migrations/20260101000000_init.sql`.
   Crea las tablas, las políticas, la función `ensure_daily_puzzle` y el bucket privado `relatos`.
   Después ejecutá `supabase/migrations/20260102000000_categorias_por_region.sql`: pasa las categorías viejas (Libertadores, Champions y Mundial) a Sudamérica, Europa y Selecciones. En una base nueva no cambia nada.
   (Con la CLI: `supabase link` y `supabase db push`, que las aplica en orden.)
3. (Opcional) Ejecutá `supabase/seed.sql` para cargar 10 relatos de ejemplo (4 de Europa, 3 de Sudamérica y 3 de Selecciones). Apuntan a `seed/relato-01.mp3` … `seed/relato-10.mp3`: subí mp3 con esos nombres al bucket `relatos` (Storage → relatos → carpeta `seed`) o editá cada relato desde `/admin` y subí el audio real.
4. **Authentication → Users → Add user**: creá el usuario con el email del admin. Nadie más puede registrarse: el login usa `shouldCreateUser: false`.
5. **Authentication → URL Configuration**:
   - *Site URL*: tu dominio (ej. `https://ungoldecloss.vercel.app`)
   - *Redirect URLs*: agregá `http://localhost:3000/auth/callback` y `https://TU-DOMINIO/auth/callback`
6. **Project Settings → API**: copiá la URL, la `anon key` y la `service_role key`.

## Desarrollo local

```bash
cp .env.example .env.local   # completá las variables
npm install
npm run dev
```

- Juego: http://localhost:3000
- Admin: http://localhost:3000/admin. Ingresá tu email y entrá con el link que te llega por mail.

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role, **solo servidor** |
| `SUPABASE_AUDIO_BUCKET` | bucket de audios (default `relatos`) |
| `ADMIN_EMAIL` | único email con acceso a `/admin` |
| `NEXT_PUBLIC_SITE_URL` | URL pública (redirect del link mágico) |
| `NEXT_PUBLIC_LAUNCH_DATE` | fecha del puzzle #1 (`YYYY-MM-DD`) |
| `NEXT_PUBLIC_OCULTAR_VIDEO` | `true` (por defecto) tapa el video de YouTube durante la partida y lo muestra al terminar; `false` lo deja visible |

## Deploy en Vercel

1. Subí el repo a GitHub e importalo en [vercel.com/new](https://vercel.com/new) (framework: Next.js, sin cambios en build).
2. En **Settings → Environment Variables** cargá todas las variables de la tabla. `NEXT_PUBLIC_SITE_URL` tiene que ser el dominio de producción.
3. Deploy. Agregá `https://TU-DOMINIO/auth/callback` en las Redirect URLs de Supabase si no lo hiciste.

No hace falta cron: el primer request del día en cada categoría llama a `ensure_daily_puzzle(fecha, categoria, numero)`, que asigna un relato activo de esa categoría que no se haya usado en los últimos 90 días (prioriza los nunca usados). Cada categoría necesita al menos un relato activo; si no, esa categoría muestra un aviso. La función toma un advisory lock, así que si dos requests llegan a la vez no se crean dos puzzles.

## Panel admin

- **Relatos**: alta, edición (con selector de categoría), filtro por categoría, activar/desactivar y borrado. No se puede borrar un relato que ya salió en alguna fecha; en ese caso, desactivalo.
- **Audio**: el archivo se sube directo del navegador a Storage con una *signed upload URL*, así que no pasa por el límite de 4.5 MB de las funciones de Vercel. Al reemplazar un audio se borra el anterior.
- **YouTube**: pegá el ID o cualquier URL (`watch?v=`, `youtu.be/`, `shorts/`).
- **Previsualización**: slider de `start_seconds` (con ajuste fino de ±0.1 s), botones de duración (1…16 s y 30 s) y la misma barra segmentada del juego.
- **Calendario**: elegí la categoría y asigná relatos a fechas específicas. Los días sin asignar se sortean solos. Si cambiás el relato de hoy o de un día pasado, el panel te pide confirmación, porque afecta a quienes ya jugaron.

## Mecánica

- Estados por intento: vacío, saltado (⬛), incorrecto (🟥), **cerca** (🟨: elegiste un gol del mismo equipo) y correcto (🟩).
- La partida del día y las estadísticas (jugados, % de victorias, racha actual y máxima, distribución por intento) se guardan en `localStorage`. La racha se corta si salteás un día.
- Texto para compartir:
  ```
  Un Gol de Closs · Selecciones #42 🎙️
  🟥🟥🟨🟩⬜⬜
  ```
