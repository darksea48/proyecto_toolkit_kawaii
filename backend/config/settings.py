import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-3nzi^07p*nzlpkh3hwu++3ydyp=mgo)sj0!u7svjcn!2m+9*o!',
)

DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if h.strip()
]

# Dokploy/Traefik termina HTTPS y reenvía a Django por HTTP interno.
# Sin esto, request.is_secure() siempre da False y falla el CSRF en /admin/.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',') if o.strip()
]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # third-party
    'rest_framework',
    'corsheaders',
    # local apps
    'qr_tool',
    'csv_tool',
    'vv_import',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'config.middleware.UsageLogMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'frontend_dist'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'es-cl'

TIME_ZONE = 'America/Santiago'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

# Build de React (frontend/dist), copiado a backend/frontend_dist en el Dockerfile.
# WhiteNoise sirve estos archivos (JS/CSS/imágenes) directo desde la raíz "/".
FRONTEND_DIST = BASE_DIR / 'frontend_dist'
WHITENOISE_ROOT = FRONTEND_DIST if FRONTEND_DIST.exists() else None

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# CORS — solo necesario en desarrollo (frontend en puerto 5173 con proxy a Django).
# En producción, frontend y backend se sirven desde el mismo origen.
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get(
        'CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'
    ).split(',') if o.strip()
]
