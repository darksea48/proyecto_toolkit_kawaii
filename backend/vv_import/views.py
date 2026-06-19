import json
import logging
from datetime import timedelta
from urllib.parse import quote

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .limpiar_vv import limpiar, validar
from .models import RegistroImportVV

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
RETENTION_DAYS = 7


@api_view(['POST'])
@parser_classes([MultiPartParser])
def limpiar_vv_view(request):
    archivo = request.FILES.get('archivo')

    if not archivo:
        return Response(
            {'error': 'Debes subir un archivo con el campo "archivo".'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if archivo.size > MAX_FILE_SIZE:
        return Response(
            {'error': f'El archivo supera el tamaño máximo de '
                      f'{MAX_FILE_SIZE // (1024 * 1024)} MB.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    datos = limpiar(archivo.read())

    try:
        avisos = validar(datos)
        texto = datos.decode('utf-8')
    except UnicodeDecodeError:
        return Response(
            {'error': 'El archivo no es UTF-8 válido. Vuelve a exportarlo en UTF-8.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception:
        logger.exception('Error al validar el VVExport')
        return Response(
            {'error': 'Ocurrió un error al procesar el archivo.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    n_lineas = texto.rstrip('\n').count('\n') + 1
    respuestas = max(n_lineas - 2, 0)  # menos las 2 filas de cabecera

    RegistroImportVV.objects.create(
        nombre_archivo=archivo.name,
        respuestas=respuestas,
        n_avisos=len(avisos),
        valido=not avisos,
    )
    RegistroImportVV.objects.filter(
        creado_en__lt=timezone.now() - timedelta(days=RETENTION_DAYS)
    ).delete()

    nombre_salida = archivo.name.rsplit('.', 1)[0] + '_VV_import.txt'
    response = HttpResponse(datos, content_type='text/plain; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{nombre_salida}"'
    # Cabeceras safe-ASCII: JSON url-encoded para no romper con tildes.
    response['X-Avisos'] = quote(json.dumps(avisos, ensure_ascii=False))
    response['X-Respuestas'] = respuestas
    response['Access-Control-Expose-Headers'] = 'X-Avisos, X-Respuestas'
    return response


@api_view(['GET'])
def historial_vv_view(request):
    registros = RegistroImportVV.objects.all()
    data = [
        {
            'id': r.id,
            'nombre_archivo': r.nombre_archivo,
            'respuestas': r.respuestas,
            'n_avisos': r.n_avisos,
            'valido': r.valido,
            'creado_en': r.creado_en.isoformat(),
        }
        for r in registros
    ]
    return Response(data)
