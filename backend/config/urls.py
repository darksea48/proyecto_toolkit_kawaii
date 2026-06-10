from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/qr/', include('qr_tool.urls')),
    path('api/csv/', include('csv_tool.urls')),
]
