from django.conf import settings
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/qr/', include('qr_tool.urls')),
    path('api/csv/', include('csv_tool.urls')),
]

# Sirve el SPA de React (frontend/dist/index.html) para cualquier ruta no-API,
# para que React Router maneje rutas como /qr o /csv al recargar la página.
if settings.FRONTEND_DIST.exists():
    urlpatterns += [
        re_path(
            r'^(?!api/|admin/|static/).*$',
            TemplateView.as_view(
                template_name='index.html',
                content_type='text/html',
            ),
        ),
    ]
