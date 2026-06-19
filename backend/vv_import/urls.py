from django.urls import path
from . import views

urlpatterns = [
    path('', views.limpiar_vv_view, name='limpiar_vv'),
    path('historial/', views.historial_vv_view, name='historial_vv'),
]
