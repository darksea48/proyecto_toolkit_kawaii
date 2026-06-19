from django.contrib import admin
from .models import RegistroLimpiezaCSV


@admin.register(RegistroLimpiezaCSV)
class RegistroLimpiezaCSVAdmin(admin.ModelAdmin):
    list_display = ('nombre_archivo', 'filas_originales', 'filas_limpias', 'separador', 'encoding', 'creado_en')
    list_filter = ('separador', 'encoding')
    readonly_fields = ('creado_en',)
