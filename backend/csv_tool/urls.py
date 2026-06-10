from django.urls import path
from . import views

urlpatterns = [
    path('', views.limpiar_csv_view, name='limpiar_csv'),
]
