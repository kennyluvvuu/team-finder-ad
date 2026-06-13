import socket
import typing
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

# TODO: Создать и заполнить .env, ориентируясь на .env_example

SECRET_KEY: str = typing.cast(str, config("DJANGO_SECRET_KEY"))

DEBUG: bool = typing.cast(bool, config("DJANGO_DEBUG", default=False, cast=bool))

ALLOWED_HOSTS: list[str] = typing.cast(list[str], config("ALLOWED_HOSTS", default="*", cast=lambda v: [s.strip() for s in v.split(",")]))

# Ensure localhost and common docker services are always allowed
for host in ["localhost", "127.0.0.1", "backend", "web"]:
    if host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(host)

# Add SITE_DOMAIN if set
site_domain: str = typing.cast(str, config("SITE_DOMAIN", default=""))
if site_domain:
    clean_domain = site_domain.split("://")[-1].split(":")[0]
    if clean_domain not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(clean_domain)

# Dynamically add the container's own hostname and IP to ALLOWED_HOSTS
try:
    hostname = socket.gethostname()
    if hostname and hostname not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(hostname)
    
    local_ip = socket.gethostbyname(hostname)
    if local_ip and local_ip not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(local_ip)
except Exception:
    pass

CSRF_TRUSTED_ORIGINS: list[str] = typing.cast(list[str], config(
    "CSRF_TRUSTED_ORIGINS",
    default="http://localhost:3000,http://127.0.0.1:3000,http://localhost,http://127.0.0.1",
    cast=lambda v: [s.strip() for s in v.split(",")]
))

# Dynamically add SITE_DOMAIN (http and https) to CSRF_TRUSTED_ORIGINS
if site_domain:
    clean_domain = site_domain.split("://")[-1]
    for proto in ["http", "https"]:
        origin = f"{proto}://{clean_domain}"
        if origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(origin)


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "apps.users",
    "apps.projects",
    "rest_framework",
    "drf_spectacular",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "team_finder.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / f"templates_var{config('TASK_VERSION', default='1')}"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "team_finder.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("POSTGRES_DB"),
        "USER": config("POSTGRES_USER"),
        "PASSWORD": config("POSTGRES_PASSWORD"),
        "HOST": config("POSTGRES_HOST", default="localhost"),
        "PORT": config("POSTGRES_PORT", default=5432, cast=int),
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = []
if not DEBUG:
    AUTH_PASSWORD_VALIDATORS.extend(
        [
            {
                "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
            },
            {
                "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
            },
            {
                "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
            },
            {
                "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
            },
        ]
    )

# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = "ru"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
# Media files

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "users.User"

LOGIN_URL = "/users/login/"
LOGIN_REDIRECT_URL = "/project/list/"
LOGOUT_REDIRECT_URL = "/project/list/"

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 6,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'TeamFinder API',
    'DESCRIPTION': 'API для поиска единомышленников и формирования команд для Pet-проектов',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
    },
}



