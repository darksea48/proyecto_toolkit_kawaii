# Toolkit Kawaii — Especificación del Proyecto

## Descripción

Sitio web personal de herramientas de uso laboral. Cada herramienta es una utilidad independiente accesible desde una interfaz web.

---

## Arquitectura

```text
proyecto_toolkit-kawaii/
├── backend/          ← Django 6 + Django REST Framework (API)
├── frontend/         ← React (Vite) + Bootstrap 5 (SPA)
├── venv/             ← Entorno virtual Python 3.13
└── requirements.txt
```

**Patrón:** Backend y frontend separados. Django expone endpoints REST, React los consume.

---

## Stack tecnológico

### Backend

| Paquete | Versión | Uso |
| --- | --- | --- |
| Django | 6.0.6 | Framework web |
| djangorestframework | 3.17.1 | API REST |
| django-cors-headers | 4.9.0 | Permitir llamadas desde React |
| qrcode | 8.2 | Generación de QR |
| Pillow | 12.2.0 | Procesamiento de imágenes |
| pandas | 3.0.3 | Limpieza de CSV |

### Frontend (por construir)

| Paquete | Uso |
| --- | --- |
| React (Vite) | SPA |
| Bootstrap 5 | Estilos y componentes visuales |
| React Router | Navegación entre herramientas |

### Entorno

- Python 3.13.5
- Node.js 22.16.0 / npm 10.9.2
- Base de datos: SQLite (desarrollo)
- SO: Windows 11

---

## Backend — estructura de apps

```text
backend/
├── config/
│   ├── settings.py   ← configuración principal
│   ├── urls.py       ← enrutamiento raíz
│   └── wsgi.py
├── qr_tool/          ← generador de QR
├── csv_tool/         ← limpiador de CSV
├── db.sqlite3
└── manage.py
```

### Configuración (settings.py)

- `LANGUAGE_CODE = 'es-cl'` / `TIME_ZONE = 'America/Santiago'`
- `CORS_ALLOWED_ORIGINS`: permite `localhost:5173` (React dev server)
- `REST_FRAMEWORK`: renderer JSON por defecto
- Base de datos: SQLite

---

## Endpoints de la API

### `POST /api/qr/`

Genera un código QR a partir de un texto.

**Request:**

```json
{ "texto": "https://ejemplo.com" }
```

**Response 200:**

```json
{
  "imagen": "data:image/png;base64,iVBORw0KGgo...",
  "texto": "https://ejemplo.com"
}
```

**Response 400:** `{ "error": "El campo 'texto' es requerido." }`

---

### `POST /api/csv/`

Limpia un archivo CSV: normaliza emails, elimina caracteres inválidos, reemplaza `;` por `/` en otras columnas.

**Request:** `multipart/form-data` con campo `archivo` (archivo .csv)

**Response 200:** Descarga directa del CSV limpio (`archivo_LIMPIO.csv`)

Headers de respuesta informativos:

- `X-Filas-Originales`: cantidad de filas antes de limpiar
- `X-Filas-Limpias`: cantidad de filas después de limpiar

**Response 400:** `{ "error": "..." }` si no se sube archivo o no es .csv

**Lógica de limpieza (columna `email`):**

- Minúsculas, sin espacios, primer email si hay varios
- Reemplaza tildes y ñ (`á→a`, `ñ→n`, etc.)
- Elimina caracteres inválidos (`!`, `#`, `$`, `%`, `"`)
- Normaliza puntos repetidos
- Elimina puntos/guiones al inicio o final

**Lógica general:**

- Reemplaza `;` por `/` en todas las columnas de texto (excepto email)
- Strip de espacios en todas las celdas
- Elimina filas completamente vacías
- Detecta encoding automáticamente (UTF-8 o Latin-1)
- Guarda con `utf-8-sig` (compatible con Excel)

---

## Herramientas planeadas

| # | Herramienta | Estado | Tecnología |
| --- | --- | --- | --- |
| 1 | Generador de QR | Completo | Python `qrcode` |
| 2 | Limpiador de CSV | Completo | Python `pandas` |
| 3 | (por definir) | Pendiente | — |

---

## Frontend — estructura

```text
frontend/
├── src/
│   ├── components/
│   │   └── Navbar.jsx     ← barra de navegación Bootstrap
│   ├── pages/
│   │   ├── Home.jsx       ← tarjetas de herramientas disponibles
│   │   ├── GeneradorQR.jsx
│   │   └── LimpiadorCSV.jsx
│   ├── App.jsx            ← rutas principales
│   ├── main.jsx           ← punto de entrada, monta React + Bootstrap
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

### Dependencias frontend

| Paquete | Versión | Uso |
| --- | --- | --- |
| react + react-dom | 19.x | UI |
| @vitejs/plugin-react | 6.x | JSX en Vite |
| bootstrap | 5.3.x | Estilos y componentes |
| bootstrap-icons | 1.13.x | Iconografía SVG |
| react-router-dom | 7.x | Navegación SPA |

### Sistema de diseño

- **Estilo:** Flat Design — 2D, minimalista, colores sólidos, sin sombras pesadas
- **Paleta:** Teal `#0D9488` (primary) · Naranja `#F97316` (CTA) · Fondo `#F0FDFA` · Texto `#134E4A`
- **Tipografía:** Plus Jakarta Sans (Google Fonts) — pesos 300/400/500/600/700
- **Iconos:** Bootstrap Icons (SVG, sin emojis)
- **Transiciones:** 150-200ms ease en hover y estados interactivos
- **Accesibilidad:** aria-label en botones de ícono, alt en imágenes, contraste 4.5:1+

### Rutas React

| Ruta | Componente | Descripción |
| --- | --- | --- |
| `/` | Home | Tarjetas de herramientas |
| `/qr` | GeneradorQR | Ingresa texto → muestra QR → descarga PNG |
| `/csv` | LimpiadorCSV | Sube CSV → descarga CSV limpio |

---

## Cómo levantar el proyecto

```bash
# Terminal 1 — Backend (desde raíz del proyecto)
cd backend
..\venv\Scripts\python manage.py runserver
# API en http://localhost:8000

# Terminal 2 — Frontend (desde raíz del proyecto)
cd frontend
npm run dev
# App en http://localhost:5173
```

---

## Próximos pasos

- [x] Fase 1: Backend Django con endpoints QR y CSV
- [x] Fase 2: Frontend React + Bootstrap con páginas QR y CSV
- [x] Fase 3: Sistema de diseño aplicado (Flat Design, teal, Plus Jakarta Sans, Bootstrap Icons)
- [ ] Agregar nuevas herramientas según necesidad
