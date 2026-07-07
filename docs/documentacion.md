# Documentación Completa — Toolkit Kawaii

**Versión:** 1.2
**Fecha:** Julio 2026
**Autor:** Douglas Suárez Zamorano y Joaquín González Cabello
**Contexto:** Proyecto personal desarrollado para uso laboral-personal

---

## Índice

1. [Descripción general](#1-descripción-general)
2. [Recolección de requisitos](#2-recolección-de-requisitos)
3. [Análisis del sistema](#3-análisis-del-sistema)
4. [Especificación técnica](#4-especificación-técnica)
5. [Arquitectura del sistema](#5-arquitectura-del-sistema)
6. [Módulos del backend](#6-módulos-del-backend)
7. [Módulos del frontend](#7-módulos-del-frontend)
8. [API REST — referencia completa](#8-api-rest--referencia-completa)
9. [Sistema de log de uso](#9-sistema-de-log-de-uso)
10. [Guía de instalación y ejecución](#10-guía-de-instalación-y-ejecución)
11. [Guía de deployment con Cloudflare Access](#11-guía-de-deployment-con-cloudflare-access)
12. [Decisiones de diseño](#12-decisiones-de-diseño)
13. [Glosario](#13-glosario)

---

## 1. Descripción general

Toolkit Kawaii es una aplicación web personal de herramientas de uso laboral. Está pensada como un conjunto extensible de utilidades — cada herramienta es independiente, accesible desde una interfaz web unificada, y construida en Python en el backend.

### Propósito

El proyecto surge de una necesidad real: disponer de herramientas Python que se usan frecuentemente en el trabajo (generación de QR, limpieza de archivos CSV con emails, entre otras) en un formato accesible desde el navegador, sin depender de scripts en scripts locales con rutas fijas.

### Objetivos

- Centralizar herramientas laborales en un solo sitio web
- Aprender y practicar Django REST Framework y React de forma aplicada
- Construir una base extensible donde agregar nuevas herramientas sea sencillo
- Aplicar buenas prácticas de diseño UI (accesibilidad, diseño consistente, Bootstrap)

---

## 2. Recolección de requisitos

### 2.1 Requisitos funcionales

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-01 | El sistema debe permitir generar un código QR a partir de un texto o URL | Alta |
| RF-02 | El código QR generado debe poder descargarse como imagen PNG | Alta |
| RF-03 | El usuario puede definir el nombre del archivo PNG antes de descargarlo | Media |
| RF-04 | El sistema debe permitir subir un archivo CSV para limpiarlo | Alta |
| RF-05 | El CSV limpio debe descargarse automáticamente tras el procesamiento | Alta |
| RF-06 | La columna `email` del CSV debe normalizarse (minúsculas, sin tildes, sin caracteres inválidos) | Alta |
| RF-07 | Las demás columnas deben tener los `;` reemplazados por `/` y espacios eliminados | Media |
| RF-08 | El sistema debe informar cuántas filas tenía el archivo original vs el procesado | Baja |
| RF-09 | La interfaz debe mostrar un spinner durante operaciones asíncronas | Media |
| RF-10 | La interfaz debe mostrar mensajes de error claros si algo falla | Alta |
| RF-11 | El limpiador CSV debe aceptar tanto coma (`,`) como punto y coma (`;`) como separador, detectándolo automáticamente | Alta |
| RF-12 | Cada limpieza CSV exitosa debe registrarse y el historial debe estar disponible durante 7 días antes de eliminarse | Media |
| RF-13 | El sistema debe permitir subir un archivo VVExport de LimeSurvey para prepararlo para reimportación | Alta |
| RF-14 | El preparador VV debe eliminar el BOM, limpiar líneas vacías y validar estructura (dos cabeceras, columnas consistentes) | Alta |
| RF-15 | Cada procesamiento VV exitoso debe registrarse con retención de 7 días, accesible desde una página de historial dedicada | Media |
| RF-16 | El historial de CSV y VV debe estar en páginas propias, accesibles desde submenús desplegables en el navbar | Baja |

### 2.2 Requisitos no funcionales

| ID | Requisito | Categoría |
| --- | --- | --- |
| RNF-01 | El backend y frontend son servidores separados (desacoplamiento) | Arquitectura |
| RNF-02 | La API debe responder en menos de 2 segundos para archivos CSV de hasta 10.000 filas | Rendimiento |
| RNF-03 | La interfaz debe ser responsive (móvil, tablet, escritorio) | Usabilidad |
| RNF-04 | El contraste de texto debe cumplir WCAG AA (mínimo 4.5:1) | Accesibilidad |
| RNF-05 | Toda llamada a la API debe quedar registrada en un archivo de log | Trazabilidad |
| RNF-06 | El proyecto debe poder instalarse en cualquier entorno Python 3.13+ con Node 22+ | Portabilidad |
| RNF-07 | Los registros de historial (CSV y VV) deben eliminarse automáticamente después de 7 días | Retención de datos |

### 2.3 Restricciones

- El proyecto corre en modo desarrollo (sin servidor de producción configurado aún)
- No requiere autenticación de usuarios en la versión 1.0
- Base de datos SQLite (no se usa para datos de herramientas, solo para sesiones/admin de Django)
- Los archivos procesados (CSV y VV) no se almacenan en el servidor; solo se guarda metadata del procesamiento con retención de 7 días

---

## 3. Análisis del sistema

### 3.1 Casos de uso principales

#### CU-01: Generar código QR

```
Actor: Usuario
Precondición: El frontend y backend están corriendo
Flujo principal:
  1. El usuario navega a /qr
  2. Ingresa un texto o URL en el campo correspondiente
  3. Opcionalmente ingresa un nombre para el archivo de descarga
  4. Hace clic en "Generar QR"
  5. El frontend envía POST /api/qr/ con el texto
  6. El backend genera la imagen QR y la retorna como base64
  7. El frontend muestra la imagen en pantalla
  8. El usuario hace clic en "Descargar PNG"
  9. El navegador descarga el archivo con el nombre indicado (o "qr.png" por defecto)
Flujo alternativo (error):
  3a. El campo de texto está vacío → el frontend valida y no envía la petición
  6a. El backend retorna error → el frontend muestra alerta con el mensaje
```

#### CU-02: Limpiar archivo CSV

```
Actor: Usuario
Precondición: El frontend y backend están corriendo
Flujo principal:
  1. El usuario navega a /csv (submenú "Limpiar archivo" del navbar)
  2. Selecciona un archivo .csv desde su disco
  3. Hace clic en "Limpiar CSV"
  4. El frontend envía POST /api/csv/ con el archivo como multipart/form-data
  5. El backend detecta el encoding (UTF-8 o cp1252) y el separador (coma o punto y coma)
  6. El backend procesa el archivo con pandas y guarda un registro en la BD
  7. Los registros con más de 7 días se eliminan automáticamente
  8. El backend retorna el CSV limpio como descarga directa
  9. El frontend muestra un recuadro de éxito con las filas procesadas
  10. El usuario descarga el archivo o inicia una nueva limpieza
Flujo alternativo — ver historial:
  1. El usuario navega a /csv/historial (submenú "Historial de limpiezas")
  2. El frontend obtiene GET /api/csv/historial/ y muestra la tabla de limpiezas recientes
Flujo alternativo (error):
  2a. El archivo no es .csv → el backend retorna 400 con mensaje de error
  6a. Error de procesamiento → el backend retorna 500 con detalle del error
```

#### CU-03: Preparar archivo VVExport

```
Actor: Usuario
Precondición: El frontend y backend están corriendo
Flujo principal:
  1. El usuario navega a /vv (submenú "Preparar archivo VV" del navbar)
  2. Selecciona un archivo VVExport (.csv, .vv o .txt) desde su disco
  3. Hace clic en "Preparar para importar"
  4. El frontend envía POST /api/vv/ con el archivo como multipart/form-data
  5. El backend elimina el BOM, limpia líneas vacías y valida estructura
  6. El backend guarda un registro en la BD y purga registros > 7 días
  7. El backend retorna el archivo procesado como descarga (.txt)
  8. El frontend muestra un recuadro de éxito con advertencias de validación (si las hay)
  9. El usuario descarga el archivo e lo importa en LimeSurvey
Flujo alternativo — ver historial:
  1. El usuario navega a /vv/historial (submenú "Historial de importaciones")
  2. El frontend obtiene GET /api/vv/historial/ y muestra la tabla de archivos procesados
Flujo alternativo (error):
  5a. El archivo no tiene la estructura VV esperada → el backend retorna 400
```

### 3.2 Diagrama de flujo de datos

```
Usuario
  │
  ▼
React SPA (puerto 5173)
  │  fetch() con JSON o FormData
  ▼
Django API (puerto 8000)
  │
  ├── UsageLogMiddleware → logs/toolkit.log
  │
  ├── POST /api/qr/          → qr_tool/views.py → qrcode → imagen base64 → JSON
  │
  ├── POST /api/csv/         → csv_tool/views.py
  │                               ├── detectar encoding (UTF-8 / cp1252)
  │                               ├── detectar separador (, / ;)
  │                               ├── pandas → CSV limpio → HttpResponse
  │                               ├── RegistroLimpiezaCSV.objects.create() ─┐
  │                               └── purgar registros > 7 días             │
  │                                                                          ▼
  ├── GET /api/csv/historial/ → csv_tool/views.py → RegistroLimpiezaCSV → JSON
  │                                                        │
  ├── POST /api/vv/           → vv_import/views.py         │
  │                               ├── eliminar BOM         │
  │                               ├── limpiar líneas       ├── db.sqlite3
  │                               ├── validar estructura   │
  │                               ├── RegistroImportVV.objects.create()  ──┤
  │                               └── purgar registros > 7 días            │
  │                                                                         ▼
  └── GET /api/vv/historial/  → vv_import/views.py → RegistroImportVV → JSON
```

---

## 4. Especificación técnica

### 4.1 Stack tecnológico

| Capa | Tecnología | Versión | Justificación |
| --- | --- | --- | --- |
| Backend framework | Django | 6.0.6 | Framework robusto, conocido del bootcamp, buen ecosistema |
| API REST | Django REST Framework | 3.17.1 | Estándar de la industria para APIs Django |
| CORS | django-cors-headers | 4.9.0 | Necesario para que React (puerto 5173) pueda llamar a Django (puerto 8000) |
| Generación QR | qrcode | 8.2 | Librería Python pura, sin dependencias externas pesadas |
| Procesamiento imagen | Pillow | 12.2.0 | Requerido por qrcode para exportar PNG |
| Procesamiento CSV | pandas | 3.0.3 | Librería estándar para manipulación de datos tabulares |
| Frontend framework | React | 19.2 | Librería de UI más usada, aprendizaje aplicado |
| Build tool | Vite | 8.x | Más rápido que Create React App, estándar moderno |
| Estilos | Bootstrap | 5.3.8 | Framework CSS conocido, clases utilitarias, responsive |
| Iconos | Bootstrap Icons | 1.13.1 | Consistentes con Bootstrap, SVG nativo, sin emojis |
| Navegación | React Router DOM | 7.x | Estándar para SPAs con React |
| Tipografía | Plus Jakarta Sans | — | Moderna, legible, friendly para apps de productividad |

### 4.2 Estructura de directorios completa

```text
proyecto_toolkit-kawaii/
│
├── .gitignore                  ← archivos excluidos del repositorio
├── README.md                   ← guía rápida de instalación y uso
├── requirements.txt            ← dependencias Python del proyecto
├── spec.md                     ← especificación técnica resumida
│
├── docs/
│   └── documentacion.md        ← este archivo
│
├── venv/                       ← entorno virtual Python (no va al repo)
│
├── backend/                    ← proyecto Django
│   ├── manage.py               ← CLI de Django
│   ├── db.sqlite3              ← base de datos SQLite (no va al repo)
│   ├── logs/
│   │   ├── .gitkeep            ← mantiene la carpeta en git
│   │   └── toolkit.log         ← log de uso generado en ejecución (no va al repo)
│   │
│   ├── config/                 ← configuración central del proyecto Django
│   │   ├── __init__.py
│   │   ├── settings.py         ← configuración principal (BD, apps, CORS, DRF)
│   │   ├── urls.py             ← enrutamiento raíz de la API
│   │   ├── middleware.py       ← middleware de log de uso
│   │   ├── wsgi.py             ← interfaz WSGI para producción
│   │   └── asgi.py             ← interfaz ASGI (para async/websockets a futuro)
│   │
│   ├── qr_tool/                ← app Django: generador de QR
│   │   ├── views.py            ← lógica de la herramienta
│   │   ├── urls.py             ← rutas de la app
│   │   ├── models.py           ← vacío (no requiere BD)
│   │   ├── admin.py
│   │   ├── apps.py
│   │   └── migrations/
│   │
│   ├── csv_tool/               ← app Django: limpiador de CSV
│   │   ├── views.py            ← lógica: limpiar CSV, historial
│   │   ├── urls.py             ← rutas: POST /, GET historial/
│   │   ├── models.py           ← modelo RegistroLimpiezaCSV
│   │   ├── admin.py            ← registro en panel admin
│   │   ├── apps.py
│   │   └── migrations/
│   │       └── 0001_initial.py ← crea tabla RegistroLimpiezaCSV
│   │
│   └── vv_import/              ← app Django: importador VVExport
│       ├── views.py            ← lógica: preparar VV, historial
│       ├── urls.py             ← rutas: POST /, GET historial/
│       ├── models.py           ← modelo RegistroImportVV
│       ├── limpiar_vv.py       ← lógica de limpieza/validación del archivo VV
│       ├── admin.py
│       ├── apps.py
│       └── migrations/
│           └── 0001_initial.py ← crea tabla RegistroImportVV
│
└── frontend/                   ← aplicación React
    ├── index.html              ← entrada HTML, monta el elemento #root
    ├── vite.config.js          ← configuración de Vite con plugin React
    ├── package.json            ← dependencias Node y scripts npm
    ├── package-lock.json       ← versiones exactas instaladas
    │
    └── src/
        ├── main.jsx            ← punto de entrada React, monta BrowserRouter
        ├── App.jsx             ← rutas principales y layout raíz
        ├── index.css           ← estilos globales, variables Bootstrap, fuente
        │
        ├── components/
        │   └── Navbar.jsx      ← barra de navegación compartida
        │
        └── pages/
            ├── Home.jsx          ← página de inicio con tarjetas de herramientas
            ├── GeneradorQR.jsx   ← generador de QR
            ├── LimpiadorCSV.jsx  ← formulario de limpieza CSV
            ├── HistorialCSV.jsx  ← historial de limpiezas CSV (últimos 7 días)
            ├── ImportadorVV.jsx  ← formulario de preparación VVExport
            └── HistorialVV.jsx   ← historial de archivos VV procesados (últimos 7 días)
```

---

## 5. Arquitectura del sistema

### 5.1 Patrón arquitectónico

El proyecto sigue el patrón **Backend API + Single Page Application (SPA)**:

- **Backend (Django):** actúa exclusivamente como servidor de API REST. No genera HTML. Procesa datos y retorna JSON o archivos.
- **Frontend (React):** es una aplicación JavaScript que corre íntegramente en el navegador del usuario. Consume la API del backend mediante `fetch()`.

Ambos corren en servidores separados durante el desarrollo:

```
http://localhost:8000  →  Django (API)
http://localhost:5173  →  Vite dev server (React SPA)
```

### 5.2 Comunicación entre capas

El navegador del usuario carga la SPA de React desde el servidor de Vite. Cuando el usuario usa una herramienta, React hace una petición HTTP al backend de Django. Django procesa y responde. React muestra el resultado.

```
Navegador
  └── Carga SPA desde Vite (HTML + JS)
  └── Usuario interactúa con la interfaz React
  └── React hace fetch() a http://localhost:8000/api/...
  └── Django recibe, procesa, responde
  └── React actualiza la UI con el resultado
```

### 5.3 CORS (Cross-Origin Resource Sharing)

Dado que el frontend y backend están en puertos distintos, el navegador bloquearía las peticiones por política de seguridad. Para resolverlo se usa `django-cors-headers`, que agrega los headers necesarios para que el navegador permita las llamadas.

En `settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
```

---

## 6. Módulos del backend

### 6.1 `config/settings.py` — Configuración central

El archivo de configuración de Django define todos los parámetros del proyecto.

**Secciones clave:**

```python
INSTALLED_APPS = [
    # Apps Django estándar (admin, auth, etc.)
    ...
    # Terceros
    'rest_framework',    # Django REST Framework
    'corsheaders',       # Manejo de CORS
    # Apps propias
    'qr_tool',
    'csv_tool',
]
```

El orden de `MIDDLEWARE` importa: `CorsMiddleware` debe estar antes de `SessionMiddleware` para que los headers CORS se agreguen a todas las respuestas, incluyendo las preflight de OPTIONS.

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',       # ← antes de Session
    'config.middleware.UsageLogMiddleware',        # ← registra el log
    ...
]
```

`REST_FRAMEWORK` se configura para retornar solo JSON (sin el browsable API de HTML en producción):

```python
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}
```

---

### 6.2 `config/urls.py` — Enrutamiento raíz

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/qr/', include('qr_tool.urls')),
    path('api/csv/', include('csv_tool.urls')),
]
```

Cada app tiene su propio archivo `urls.py` que se incluye aquí con `include()`. Esto mantiene las rutas organizadas por módulo y permite mover o renombrar rutas fácilmente.

---

### 6.3 `config/middleware.py` — Log de uso

El middleware intercepta cada petición antes y después de que Django la procese.

**Cómo funciona un middleware en Django:**

```
Petición entrante
  → Middleware 1 (__call__ antes de get_response)
  → Middleware 2 (__call__ antes de get_response)
  → Vista Django (lógica real)
  → Middleware 2 (__call__ después de get_response)
  → Middleware 1 (__call__ después de get_response)
Respuesta saliente
```

`UsageLogMiddleware` solo actúa en rutas que empiezan con `/api/`. Mide el tiempo de respuesta usando `time.monotonic()` (más preciso que `time.time()` para medir duraciones). Extrae la IP real del header `X-Forwarded-For` cuando hay un proxy (como Cloudflare) por delante.

**Formato del log:**

```
2026-06-10 22:15:34 | POST /api/qr/ | status=200 | tiempo=45ms | ip=127.0.0.1
2026-06-10 22:16:01 | POST /api/csv/ | status=200 | tiempo=312ms | ip=127.0.0.1
```

---

### 6.4 `qr_tool/views.py` — Generador de QR

```python
@api_view(['POST'])
def generar_qr(request):
```

El decorador `@api_view(['POST'])` de DRF convierte una función Python normal en una vista de API REST que:
- Solo acepta peticiones POST (retorna 405 para otros métodos)
- Deserializa automáticamente el body JSON en `request.data`
- Retorna respuestas JSON con los helpers `Response` y `status`

**Flujo interno:**

1. Lee `texto` de `request.data`
2. Valida que no esté vacío (retorna 400 si lo está)
3. Crea un objeto `QRCode` con nivel de corrección de errores alto (`ERROR_CORRECT_H` — recupera hasta un 30% de daño en la imagen)
4. Genera la imagen con `make_image()`
5. Guarda la imagen en un buffer de memoria (`BytesIO`) en lugar del disco
6. Codifica el buffer en Base64 para poder enviarlo como texto JSON
7. Retorna el string Base64 con el prefijo `data:image/png;base64,` que los navegadores pueden mostrar directamente en un `<img>`

**¿Por qué Base64 en lugar de un endpoint separado?**
Simplifica el flujo: React recibe la imagen en la misma respuesta que confirma el éxito. No necesita hacer una segunda petición para cargar la imagen. El trade-off es que las respuestas son más grandes, pero para un QR de 260×260px el impacto es mínimo (~20KB).

---

### 6.5 `csv_tool/views.py` — Limpiador de CSV

El módulo expone dos endpoints: `POST /api/csv/` para limpiar y `GET /api/csv/historial/` para consultar registros.

#### `detectar_separador(contenido_bytes, encoding)`

```python
dialecto = csv.Sniffer().sniff(muestra, delimiters=',;')
return dialecto.delimiter
```

`csv.Sniffer` es una clase del módulo estándar de Python que analiza una muestra del contenido del archivo e infiere qué carácter actúa como separador de columnas. Se pasa `delimiters=',;'` para restringirlo a los dos separadores más comunes. Si no puede determinar el separador (por ejemplo, un CSV de una sola columna sin separadores visibles), la función hace fallback a `;`.

#### `limpiar_csv_view(request)` — POST

```python
@api_view(['POST'])
@parser_classes([MultiPartParser])
def limpiar_csv_view(request):
```

El decorador `@parser_classes([MultiPartParser])` le dice a DRF que esta vista espera un formulario multipart (el formato que usan los `<input type="file">` de HTML). Sin esto, DRF intentaría parsear el body como JSON y fallaría.

**Flujo de detección de encoding y separador:**

```python
try:
    contenido.decode('utf-8')
    encoding = 'utf-8'
except UnicodeDecodeError:
    encoding = 'latin-1'

separador = detectar_separador(contenido, encoding)
df = pd.read_csv(io.BytesIO(contenido), sep=separador, encoding=encoding, ...)
```

Se detecta el encoding primero (UTF-8 o Latin-1) antes de llamar al Sniffer, porque el Sniffer necesita decodificar los bytes para analizar el texto. Con el separador detectado se lee el CSV y también se usa para escribir el archivo de salida — de modo que un CSV con `,` sale con `,` y uno con `;` sale con `;`.

**La función `limpiar_csv(df)`** recibe un DataFrame de pandas y aplica estas transformaciones en orden:

| Paso | Qué hace | Por qué |
| --- | --- | --- |
| 1 | `df.columns.str.strip()` | Elimina espacios ocultos en nombres de columnas |
| 2 | Email a minúsculas | Normaliza para comparaciones |
| 3 | Email `.split().str.get(0)` | Toma solo el primer email si hay varios separados por espacio |
| 4 | Reemplaza tildes/ñ | Los emails no admiten caracteres acentuados |
| 5 | Elimina `!#$%"` | Caracteres inválidos en direcciones de email |
| 6 | `str.replace(r'\.+', '.')` | Normaliza `a..b@x.com` → `a.b@x.com` |
| 7 | `.strip('._-><')` | Limpia el inicio y final del string |
| 8 | Reemplaza `;` por `/` en otras columnas | Si aparece dentro de un campo de datos puede confundir a parsers |
| 9 | `df.map(lambda x: x.strip())` | Elimina espacios en blanco de toda la tabla |
| 10 | `df.dropna(how='all')` | Elimina filas completamente vacías |

**Registro en base de datos y purga automática:**

```python
RegistroLimpiezaCSV.objects.create(
    nombre_archivo=archivo.name,
    filas_originales=filas_originales,
    filas_limpias=filas_limpias,
    separador=separador,
    encoding=encoding,
)
RegistroLimpiezaCSV.objects.filter(
    creado_en__lt=timezone.now() - timedelta(days=RETENTION_DAYS)
).delete()
```

Después de cada limpieza exitosa se guarda un registro de metadata en SQLite. Inmediatamente después se eliminan los registros con más de `RETENTION_DAYS` (7) días. Esta purga "perezosa" (lazy cleanup) se ejecuta solo cuando hay actividad — no requiere un proceso separado ni una tarea programada.

**La respuesta:**

```python
response = HttpResponse(buffer.getvalue(), content_type='text/csv; charset=utf-8-sig')
response['Content-Disposition'] = f'attachment; filename="{nombre_salida}"'
response['X-Filas-Originales'] = filas_originales
response['X-Filas-Limpias'] = filas_limpias
```

- `Content-Disposition: attachment` hace que el navegador descargue el archivo en lugar de mostrarlo
- `utf-8-sig` agrega un BOM (Byte Order Mark) al inicio del archivo — Excel lo necesita para detectar automáticamente que el archivo es UTF-8 y mostrar tildes y ñ correctamente
- Los headers personalizados `X-Filas-*` pasan información adicional a React sin modificar el body

#### `historial_csv_view(request)` — GET

```python
@api_view(['GET'])
def historial_csv_view(request):
    registros = RegistroLimpiezaCSV.objects.all()
```

Retorna en JSON todos los registros vigentes (los de más de 7 días ya fueron purgados por la vista POST). El frontend lo consulta al montar la página y después de cada limpieza exitosa.

---

### 6.6 `csv_tool/models.py` — Modelo de historial

```python
class RegistroLimpiezaCSV(models.Model):
    nombre_archivo  = models.CharField(max_length=255)
    filas_originales = models.IntegerField()
    filas_limpias   = models.IntegerField()
    separador       = models.CharField(max_length=1, default=';')
    encoding        = models.CharField(max_length=20, default='utf-8')
    creado_en       = models.DateTimeField(auto_now_add=True)
```

- `auto_now_add=True` en `creado_en` hace que Django asigne automáticamente la fecha y hora actuales al crear el registro; no se puede modificar después.
- `Meta.ordering = ['-creado_en']` hace que las consultas sin `.order_by()` devuelvan los registros del más reciente al más antiguo por defecto.
- El modelo no guarda el contenido del archivo, solo metadata — el archivo en sí nunca toca el disco del servidor.

---

## 7. Módulos del frontend

### 7.1 `main.jsx` — Punto de entrada

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- `createRoot` es la API moderna de React 18+ para montar la aplicación
- `StrictMode` activa verificaciones adicionales en desarrollo (detecta side effects no deseados, APIs obsoletas)
- `BrowserRouter` provee el contexto de navegación a toda la app — necesario para que `useNavigate`, `Link` y `NavLink` funcionen
- Bootstrap se importa aquí para estar disponible globalmente: `import 'bootstrap/dist/css/bootstrap.min.css'`

---

### 7.2 `App.jsx` — Rutas y layout raíz

```jsx
function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/qr" element={<GeneradorQR />} />
          <Route path="/csv" element={<LimpiadorCSV />} />
          <Route path="/csv/historial" element={<HistorialCSV />} />
          <Route path="/vv" element={<ImportadorVV />} />
          <Route path="/vv/historial" element={<HistorialVV />} />
        </Routes>
      </main>
      <footer>...</footer>
    </div>
  )
}
```

El layout usa Flexbox (`d-flex flex-column min-vh-100`) para que el footer siempre quede al fondo aunque el contenido sea corto. `flex-grow-1` en el `<main>` hace que ocupe el espacio restante entre el navbar y el footer.

`<Routes>` y `<Route>` de React Router reemplazan el antiguo `<Switch>`. Cada ruta renderiza un componente diferente sin recargar la página (navegación del lado del cliente).

---

### 7.3 `components/Navbar.jsx` — Barra de navegación

Las herramientas con subpáginas (Limpiador CSV e Importador VV) usan un **dropdown Bootstrap** en lugar de un `NavLink` directo. El estado activo del toggle se detecta con `useLocation`:

```jsx
const { pathname } = useLocation()
const csvActivo = pathname.startsWith('/csv')

<button
  className={`nav-link px-3 dropdown-toggle ${csvActivo ? 'active' : ''}`}
  data-bs-toggle="dropdown"
>
  Limpiador CSV
</button>
<ul className="dropdown-menu">
  <li><Link to="/csv">Limpiar archivo</Link></li>
  <li><Link to="/csv/historial">Historial de limpiezas</Link></li>
</ul>
```

`useLocation` devuelve el objeto de la URL actual. `pathname.startsWith('/csv')` marca el toggle como activo tanto en `/csv` como en `/csv/historial`. El mismo patrón se aplica al Importador VV con `/vv`.

Los ítems de rutas simples (Inicio, Generador QR) siguen usando `NavLink`, que agrega la clase `active` automáticamente sin código extra.

---

### 7.4 `pages/Home.jsx` — Página de inicio

Las herramientas se definen como un array de objetos:

```javascript
const herramientas = [
  { titulo: 'Generador QR', icono: 'bi-qr-code', ruta: '/qr', ... },
  { titulo: 'Limpiador CSV', icono: 'bi-file-earmark-spreadsheet', ruta: '/csv', ... },
]
```

Este patrón (datos separados del render) facilita agregar nuevas herramientas: solo se agrega un objeto al array y la grilla de tarjetas se actualiza automáticamente.

---

### 7.5 `pages/GeneradorQR.jsx` — Generador de QR

Maneja 4 estados con `useState`:

| Estado | Tipo | Descripción |
| --- | --- | --- |
| `texto` | string | Valor del input de texto |
| `nombreArchivo` | string | Nombre para el archivo PNG a descargar |
| `imagen` | string\|null | Data URL base64 de la imagen generada |
| `cargando` | boolean | Controla el spinner y deshabilita el botón |
| `error` | string\|null | Mensaje de error a mostrar |

**La función `handleDescargar`:**

```javascript
function handleDescargar() {
  const link = document.createElement('a')
  link.href = imagen                                  // data URL base64
  link.download = nombreArchivo.trim()
    ? `${nombreArchivo.trim()}.png`
    : 'qr.png'
  link.click()                                        // simula un clic en el enlace
}
```

Este patrón (crear un `<a>` temporal, asignarle `download` y hacer clic programáticamente) es la técnica estándar en JavaScript para descargar archivos generados en memoria, sin necesidad de un endpoint de descarga separado.

---

### 7.6 `pages/LimpiadorCSV.jsx` — Formulario de limpieza CSV

Maneja cuatro estados con `useState` (el historial se movió a su propia página):

| Estado | Tipo | Descripción |
| --- | --- | --- |
| `archivo` | File\|null | Archivo seleccionado por el usuario |
| `cargando` | boolean | Controla el spinner y deshabilita el botón |
| `resultado` | object\|null | URL de descarga, nombre y filas procesadas |
| `error` | string\|null | Mensaje de error a mostrar |

Usa `useRef` para el input de archivo, lo que permite resetear su valor programáticamente cuando el usuario hace clic en "Limpiar otro":

```javascript
const inputRef = useRef(null)

function handleNuevo() {
  setArchivo(null)
  if (inputRef.current) inputRef.current.value = ''  // limpia el input nativo
}
```

Sin el `ref`, el `<input type="file">` mantendría el nombre del archivo anterior aunque el estado de React esté reseteado.

**Lectura de headers de respuesta:**

```javascript
const filasOriginales = res.headers.get('X-Filas-Originales')
const filasLimpias = res.headers.get('X-Filas-Limpias')
```

Los headers personalizados (`X-Filas-*`) permiten que Django comunique metadatos del procesamiento sin modificar el cuerpo de la respuesta (que es el archivo CSV).

---

### 7.7 `pages/HistorialCSV.jsx` — Historial de limpiezas CSV

Página independiente accesible desde el submenú del navbar. Carga el historial al montar con `useEffect` simple (sin `useCallback`, ya que no necesita actualizarse tras acciones del usuario):

```javascript
useEffect(() => {
  async function cargar() {
    const res = await fetch(HISTORIAL_URL)
    if (!res.ok) throw new Error(...)
    setHistorial(await res.json())
  }
  cargar()
}, [])
```

Muestra tres estados visuales: spinner mientras carga, mensaje vacío si no hay registros, y tabla completa con número de fila, nombre del archivo, filas originales vs limpias (con delta), separador, encoding y fecha.

---

### 7.8 `pages/ImportadorVV.jsx` — Formulario de preparación VV

Mismo patrón que `LimpiadorCSV.jsx`. Cuatro estados. La respuesta del backend incluye un header `X-Avisos` con advertencias de validación codificadas en URL-encoding:

```javascript
avisos = JSON.parse(decodeURIComponent(res.headers.get('X-Avisos') || '[]'))
```

Si hay avisos, se muestra un `alert-warning` con lista de advertencias. Si la validación pasó sin problemas, se muestra un mensaje de éxito verde.

---

### 7.9 `pages/HistorialVV.jsx` — Historial de importaciones VV

Misma estructura que `HistorialCSV.jsx`. La tabla incluye nombre del archivo, número de respuestas y un badge de validación: verde "OK" si `valido === true`, o amarillo "N avisos" con el conteo.

---

### 7.10 `index.css` — Sistema de diseño

El CSS global sobrescribe las variables CSS de Bootstrap usando la especificidad de `:root`:

```css
:root {
  --bs-primary:     #0D9488;   /* teal — color principal */
  --bs-body-bg:     #F0FDFA;   /* fondo general */
  --bs-body-color:  #134E4A;   /* texto principal */
  --tk-orange:      #F97316;   /* naranja — botones CTA */
}
```

Bootstrap 5 usa variables CSS internas (`--bs-*`) en todos sus componentes, lo que permite cambiar la paleta de colores completa desde un solo lugar sin necesidad de recompilar Sass.

---

## 8. API REST — referencia completa

### `POST /api/qr/`

Genera un código QR a partir de un texto o URL.

**Headers de petición:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "texto": "https://ejemplo.com"
}
```

**Respuesta exitosa (200):**

```json
{
  "imagen": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "texto": "https://ejemplo.com"
}
```

**Respuesta de error (400):**

```json
{
  "error": "El campo \"texto\" es requerido."
}
```

**Ejemplo con curl:**

```bash
curl -X POST http://localhost:8000/api/qr/ \
  -H "Content-Type: application/json" \
  -d '{"texto": "https://ejemplo.com"}'
```

---

### `POST /api/csv/`

Limpia un archivo CSV y lo retorna como descarga.

**Headers de petición:**

```
Content-Type: multipart/form-data
```

**Form fields:**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `archivo` | file (.csv) | Sí | Archivo CSV a procesar |

**Respuesta exitosa (200):**

```
Content-Type: text/csv; charset=utf-8-sig
Content-Disposition: attachment; filename="archivo_LIMPIO.csv"
X-Filas-Originales: 150
X-Filas-Limpias: 148
Access-Control-Expose-Headers: X-Filas-Originales, X-Filas-Limpias

[contenido del CSV limpio]
```

**Respuestas de error:**

```json
// 400 — sin archivo
{ "error": "Debes subir un archivo con el campo \"archivo\"." }

// 400 — formato incorrecto
{ "error": "Solo se aceptan archivos .csv" }

// 500 — error de procesamiento
{ "error": "Error al procesar el archivo: [detalle]" }
```

**Ejemplo con curl:**

```bash
curl -X POST http://localhost:8000/api/csv/ \
  -F "archivo=@mi_base.csv" \
  --output mi_base_LIMPIO.csv
```

---

### `GET /api/csv/historial/`

Retorna los registros de limpiezas de los últimos 7 días.

**Respuesta exitosa (200):**

```json
[
  {
    "id": 5,
    "nombre_archivo": "base_encuestas.csv",
    "filas_originales": 320,
    "filas_limpias": 318,
    "separador": ";",
    "encoding": "latin-1",
    "creado_en": "2026-06-19T14:30:00.123456+00:00"
  },
  ...
]
```

Los registros se devuelven ordenados del más reciente al más antiguo. Los registros con más de 7 días se eliminan automáticamente en el siguiente `POST /api/csv/`.

**Ejemplo con curl:**

```bash
curl http://localhost:8000/api/csv/historial/
```

---

### `POST /api/vv/`

Prepara un archivo VVExport de LimeSurvey para reimportación.

**Headers de petición:**

```
Content-Type: multipart/form-data
```

**Form fields:**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `archivo` | file (.csv / .vv / .txt) | Sí | Archivo VVExport separado por tabulaciones |

**Respuesta exitosa (200):**

```
Content-Type: text/plain; charset=utf-8
Content-Disposition: attachment; filename="archivo_VV_import.txt"
X-Avisos: %5B%22aviso+1%22%5D   ← JSON codificado en URL (vacío si OK)
```

**Respuestas de error:**

```json
// 400 — sin archivo o formato incorrecto
{ "error": "Debes subir un archivo válido." }

// 500 — error de procesamiento
{ "error": "Ocurrió un error al procesar el archivo." }
```

**Ejemplo con curl:**

```bash
curl -X POST http://localhost:8000/api/vv/ \
  -F "archivo=@encuesta_vv.csv" \
  --output encuesta_VV_import.txt
```

---

### `GET /api/vv/historial/`

Retorna los registros de archivos VV procesados en los últimos 7 días.

**Respuesta exitosa (200):**

```json
[
  {
    "id": 3,
    "nombre_archivo": "encuesta_202406.csv",
    "respuestas": 145,
    "n_avisos": 0,
    "valido": true,
    "creado_en": "2026-07-07T10:15:00.000000+00:00"
  },
  ...
]
```

**Ejemplo con curl:**

```bash
curl http://localhost:8000/api/vv/historial/
```

---

## 9. Sistema de log de uso

### Ubicación

```
backend/logs/toolkit.log
```

### Formato

```
YYYY-MM-DD HH:MM:SS | METHOD /ruta/ | status=XXX | tiempo=XXXms | ip=X.X.X.X
```

### Ejemplo de entradas reales

```
2026-06-10 22:15:34 | POST /api/qr/ | status=200 | tiempo=45ms | ip=127.0.0.1
2026-06-10 22:16:01 | POST /api/csv/ | status=200 | tiempo=312ms | ip=127.0.0.1
2026-06-10 22:16:45 | POST /api/qr/ | status=400 | tiempo=3ms | ip=127.0.0.1
```

### Implementación

El middleware `UsageLogMiddleware` se registra en `settings.py` y actúa en todas las rutas que empiezan por `/api/`. Usa el módulo estándar `logging` de Python configurado para escribir a archivo.

El log **no se sube al repositorio** (está en `.gitignore`). La carpeta `logs/` sí existe en el repo gracias al archivo `.gitkeep`.

---

## 10. Guía de instalación y ejecución

### Requisitos del sistema

- Python 3.13 o superior
- Node.js 22 o superior
- npm 10 o superior
- Git

### Pasos de instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/proyecto_toolkit-kawaii.git
cd proyecto_toolkit-kawaii

# 2. Crear entorno virtual Python
python -m venv venv

# 3. Activar el entorno virtual
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 4. Instalar dependencias Python
pip install -r requirements.txt

# 5. Aplicar migraciones de Django
cd backend
python manage.py migrate
cd ..

# 6. Instalar dependencias Node
cd frontend
npm install
cd ..
```

### Ejecución

Abrir **dos terminales** desde la raíz del proyecto:

**Terminal 1 — Backend:**

```bash
cd backend
..\venv\Scripts\python manage.py runserver    # Windows
../venv/bin/python manage.py runserver         # macOS/Linux
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

Abrir en el navegador: `http://localhost:5173`

---

## 11. Guía de deployment con Cloudflare Access

> Esta sección describe los pasos para desplegar el proyecto con protección de acceso mediante Cloudflare Access. Aplica cuando el proyecto esté desplegado en un servidor público.

### ¿Qué es Cloudflare Access?

Cloudflare Access es un servicio de control de acceso Zero Trust. Permite proteger una aplicación web detrás de una capa de autenticación administrada por Cloudflare, sin modificar el código de la aplicación. El usuario debe autenticarse (por email OTP, Google, GitHub, etc.) antes de poder ver la aplicación.

### Prerrequisitos

- Dominio registrado en Cloudflare (o transferido a Cloudflare)
- Cuenta en Cloudflare con plan Free (Access está disponible gratis para hasta 50 usuarios)
- Servidor con IP pública donde esté desplegada la aplicación

### Paso 1: Desplegar la aplicación

La aplicación necesita estar accesible en un servidor. Opciones comunes:

- **Railway / Render / Fly.io** — plataformas PaaS simples para Django
- **VPS (DigitalOcean, Linode)** — mayor control, requiere configurar nginx + gunicorn

Para el backend Django en producción se recomienda:

```bash
pip install gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

Para el frontend React, hacer build y servirlo con nginx:

```bash
npm run build
# El contenido de dist/ se sirve como archivos estáticos
```

### Paso 2: Apuntar el dominio a Cloudflare

1. Ir a `dash.cloudflare.com` → agregar el sitio
2. Cambiar los nameservers del dominio a los de Cloudflare
3. Crear registros DNS tipo A apuntando al IP del servidor

### Paso 3: Crear un túnel Cloudflare (opcional pero recomendado)

El túnel Cloudflare permite exponer la aplicación sin abrir puertos en el firewall:

```bash
# Instalar cloudflared en el servidor
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/

cloudflared tunnel login
cloudflared tunnel create toolkit-kawaii
cloudflared tunnel route dns toolkit-kawaii tudominio.com
cloudflared tunnel run toolkit-kawaii
```

### Paso 4: Configurar Cloudflare Access

1. Ir a `one.dash.cloudflare.com`
2. **Access → Applications → Add an application**
3. Tipo: **Self-hosted**
4. Configurar:
   - Application name: `Toolkit Kawaii`
   - Application domain: `tudominio.com`
5. Crear una **Policy**:
   - Policy name: `Solo yo`
   - Action: Allow
   - Rule: `Emails` → agregar `tu@email.com`
6. Guardar

### Paso 5: Validar el JWT en Django (opcional)

Cloudflare Access agrega un header `CF-Access-Jwt-Assertion` a cada petición autenticada. Para validarlo en Django y asegurarse que solo peticiones autenticadas lleguen a la API:

```python
# backend/config/middleware.py (agregar)
import jwt
import requests

CF_TEAM_DOMAIN = 'https://TU_EQUIPO.cloudflareaccess.com'
CF_AUD = 'TU_APPLICATION_AUD'  # obtenerlo desde el panel de Access

class CloudflareAccessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token = request.headers.get('Cf-Access-Jwt-Assertion')
        if not token:
            from django.http import HttpResponse
            return HttpResponse('Acceso no autorizado', status=403)

        # Validar el token contra las claves públicas de Cloudflare
        # (implementación completa en la documentación oficial de Cloudflare)
        return self.get_response(request)
```

> Referencia oficial: https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/

---

## 12. Decisiones de diseño

### ¿Por qué Django y no Flask?

Se evaluó Flask como alternativa más liviana para una API de herramientas simples. Se eligió Django porque:

- Es el framework que se está aprendiendo en el bootcamp (más coherente con el contexto de aprendizaje)
- Django REST Framework ofrece más estructura y utilidades que Flask-RESTful
- Si el proyecto crece (autenticación, historial de uso, administración), Django ofrece esas funcionalidades de forma nativa

### ¿Por qué la imagen QR se devuelve como Base64?

Alternativa evaluada: devolver una URL y tener un segundo endpoint GET para descargar la imagen.

Se eligió Base64 porque:
- Simplifica el flujo en React (una sola petición)
- Las imágenes QR son pequeñas (~10-25KB antes de codificar)
- No requiere almacenamiento temporal en el servidor

### ¿Por qué Bootstrap y no Tailwind?

Tailwind es más flexible y moderno, pero requiere entender el sistema de utilidades desde cero. Bootstrap fue elegido porque:
- El usuario ya tiene experiencia con Bootstrap (bootcamp)
- Las clases son más semánticas para alguien que está aprendiendo (`btn-primary` vs `bg-blue-500 text-white rounded px-4 py-2`)
- Permite avanzar más rápido al principio

### ¿Por qué el CSV limpio se descarga directamente en lugar de mostrarse en pantalla?

Los archivos CSV de trabajo real pueden tener miles de filas. Mostrarlos en pantalla sería inútil. El flujo más práctico para uso laboral es: subir → descargar limpio → usar en Excel.

### ¿Por qué el historial usa SQLite y no un archivo de log?

Alternativa evaluada: agregar un log en formato `.log` o `.jsonl` por cada limpieza CSV, similar a `toolkit.log`.

Se eligió SQLite (modelo Django) porque:

- Permite hacer consultas filtrando por fecha (`creado_en__lt`) sin parsear texto
- La purga de 7 días se hace en una sola línea ORM en lugar de releer y reescribir un archivo
- El panel de administración de Django (`/admin/`) muestra el historial de forma inmediata sin código adicional
- Es la forma idiomática de persistencia en Django; añadir un modelo es el camino de menor fricción

### ¿Por qué purgar el historial en cada POST en lugar de una tarea programada?

Alternativa evaluada: usar una tarea programada (cron o Celery) que limpie registros viejos cada noche.

Se eligió la purga "perezosa" (en el mismo request) porque:

- Evita introducir Celery o cron en un proyecto que todavía no los necesita
- El impacto en rendimiento es mínimo (un `DELETE` con índice en `creado_en`)
- La consistencia es suficiente para el uso real: los registros se limpian la próxima vez que alguien use la herramienta

### ¿Por qué auto-detectar el separador en lugar de pedírselo al usuario?

Alternativa evaluada: un select en el formulario con opciones "coma" / "punto y coma".

Se eligió auto-detección porque:

- `csv.Sniffer` funciona de forma confiable para los dos separadores más comunes
- Reduce fricción: el usuario no tiene que saber qué separador usa su archivo
- El fallback a `;` cubre el caso edge donde el archivo tiene una sola columna

---

## 13. Glosario

| Término | Definición |
| --- | --- |
| **API REST** | Interfaz de programación que sigue el estilo arquitectónico REST. Usa HTTP y JSON para comunicar sistemas |
| **Base64** | Codificación que convierte datos binarios (como una imagen) en texto ASCII. Permite incluir archivos en respuestas JSON |
| **CORS** | Cross-Origin Resource Sharing. Política de seguridad del navegador que controla qué dominios pueden hacer peticiones a una API |
| **DRF** | Django REST Framework. Librería para construir APIs REST con Django |
| **Encoding** | Forma en que se representan los caracteres en un archivo. Los más comunes son UTF-8 y Latin-1 (Windows-1252) |
| **JWT** | JSON Web Token. Formato estándar para transmitir información de autenticación de forma segura |
| **Middleware** | Componente que se ejecuta antes y/o después de cada petición HTTP, independientemente de la vista que la maneje |
| **Multipart/form-data** | Formato de codificación HTTP usado para enviar archivos en formularios |
| **SPA** | Single Page Application. Aplicación web que carga una sola vez y actualiza la vista dinámicamente sin recargar la página |
| **UTF-8 BOM** | Variante de UTF-8 que incluye una marca al inicio del archivo para que programas como Excel detecten automáticamente el encoding |
| **Vite** | Build tool moderno para proyectos JavaScript/React. Más rápido que Webpack o Create React App |
| **Zero Trust** | Modelo de seguridad que no confía en ningún usuario por defecto, incluso si está dentro de la red. Requiere verificación explícita |
| **csv.Sniffer** | Clase del módulo estándar de Python que analiza una muestra de texto CSV para inferir el separador y otras propiedades del dialecto |
| **Lazy cleanup** | Estrategia de limpieza en la que los datos expirados se eliminan en el momento de la siguiente operación activa, en lugar de con un proceso separado |
| **Retención de datos** | Política que define cuánto tiempo se conservan registros antes de eliminarlos. En este proyecto, 7 días para el historial CSV |
| **BOM (Byte Order Mark)** | Secuencia de bytes al inicio de un archivo que indica el encoding. `utf-8-sig` lo incluye para compatibilidad con Excel |
