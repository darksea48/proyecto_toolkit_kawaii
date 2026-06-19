from django.db import models


class RegistroLimpiezaCSV(models.Model):
    nombre_archivo = models.CharField(max_length=255)
    filas_originales = models.IntegerField()
    filas_limpias = models.IntegerField()
    separador = models.CharField(max_length=1, default=';')
    encoding = models.CharField(max_length=20, default='utf-8')
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creado_en']
        verbose_name = 'Registro de limpieza CSV'
        verbose_name_plural = 'Registros de limpieza CSV'
