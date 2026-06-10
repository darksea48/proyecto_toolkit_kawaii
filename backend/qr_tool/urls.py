from django.urls import path
from . import views

urlpatterns = [
    path('', views.generar_qr, name='generar_qr'),
]
