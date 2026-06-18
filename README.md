# Toolkit Kawaii

Sitio web personal de herramientas de uso laboral. Cada herramienta es una utilidad independiente accesible desde una interfaz web.

## Herramientas disponibles

| Herramienta | Descripción |
| --- | --- |
| Generador QR | Convierte texto o URL en código QR descargable como PNG |
| Limpiador CSV | Normaliza emails, elimina caracteres inválidos y limpia archivos CSV |

## Stack

| Capa | Tecnología |
| --- | --- |
| Backend | Django 6 + Django REST Framework |
| Frontend | React 19 + Vite + Bootstrap 5 |
| Base de datos | SQLite (desarrollo) |
| Iconos | Bootstrap Icons |
| Tipografía | Plus Jakarta Sans |

## Requisitos previos

- Python 3.13+
- Node.js 22+
- npm 10+

## Instalación

```bash
# 1. Clonar o descargar el proyecto
# 2. Crear entorno virtual (si no existe)
python -m venv venv

# 3. Instalar dependencias Python
venv\Scripts\pip install -r requirements.txt

# 4. Instalar dependencias Node
cd frontend
npm install
cd ..
```

## Levantar el proyecto

Abrir **dos terminales** desde la raíz del proyecto:

**Terminal 1 — Backend**

```bash
cd backend
..\venv\Scripts\python manage.py runserver
```

API disponible en `http://localhost:8000`

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

Sitio disponible en `http://localhost:5173`

## Estructura del proyecto

```text
proyecto_toolkit-kawaii/
├── backend/
│   ├── config/          ← configuración Django (settings, urls)
│   ├── qr_tool/         ← app generador QR
│   ├── csv_tool/        ← app limpiador CSV
│   ├── db.sqlite3
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/  ← Navbar
│   │   ├── pages/       ← Home, GeneradorQR, LimpiadorCSV
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
├── venv/
├── requirements.txt
├── spec.md              ← especificación técnica detallada
└── README.md
```

## API

| Método | Endpoint | Descripción |
| --- | --- | --- |
| POST | `/api/qr/` | Recibe `{"texto": "..."}`, devuelve imagen base64 |
| POST | `/api/csv/` | Recibe archivo `.csv`, devuelve CSV limpio como descarga |

Para más detalle ver [spec.md](spec.md).

## Despliegue (Dokploy)

El proyecto se despliega como **un solo contenedor**: el `Dockerfile` en la raíz construye el frontend (Vite) y lo sirve desde Django (vía WhiteNoise) junto con la API.

1. En Dokploy, crear una app de tipo **Dockerfile** apuntando a la raíz del repo.
2. Configurar las variables de entorno (ver [.env.example](.env.example)):
   - `SECRET_KEY`: clave secreta de Django (generar una nueva, no usar la de desarrollo)
   - `DEBUG=False`
   - `ALLOWED_HOSTS`: dominio asignado por Dokploy (sin `https://`)
   - `CSRF_TRUSTED_ORIGINS`: `https://tu-dominio` (necesario para `/admin/`)
3. El contenedor expone el puerto `8000` y corre `migrate` + `gunicorn` al iniciar.

Nota: la base de datos SQLite vive dentro del contenedor — si solo se usa para `/admin/` y sesiones, no requiere volumen. Si se necesita persistencia, montar un volumen en `/app/db.sqlite3`.
# toolkitkawai
