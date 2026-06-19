from django.db import models


class RegistroImportVV(models.Model):
    nombre_archivo = models.CharField(max_length=255)
    respuestas = models.IntegerField()
    n_avisos = models.IntegerField(default=0)
    valido = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creado_en']
        verbose_name = 'Registro de importación VV'
        verbose_name_plural = 'Registros de importación VV'
