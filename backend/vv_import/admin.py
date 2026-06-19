from django.contrib import admin
from .models import RegistroImportVV


@admin.register(RegistroImportVV)
class RegistroImportVVAdmin(admin.ModelAdmin):
    list_display = ('nombre_archivo', 'respuestas', 'n_avisos', 'valido', 'creado_en')
    list_filter = ('valido',)
    readonly_fields = ('creado_en',)
