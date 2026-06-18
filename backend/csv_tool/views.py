import csv
import io
from datetime import timedelta

import pandas as pd
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .models import RegistroLimpiezaCSV

RETENTION_DAYS = 7


def detectar_separador(contenido_bytes, encoding):
    """Detecta si el CSV usa coma o punto y coma como separador."""
    muestra = contenido_bytes.decode(encoding, errors='replace')[:4096]
    try:
        dialecto = csv.Sniffer().sniff(muestra, delimiters=',;')
        return dialecto.delimiter
    except csv.Error:
        return ';'  # fallback al separador por defecto


def limpiar_csv(df):
    # Limpiar nombres de columnas
    df.columns = df.columns.str.strip()

    # Limpiar columna email si existe
    col_email = 'email'
    if col_email in df.columns:
        df[col_email] = (
            df[col_email].str.lower()
            .str.strip()
            .str.split().str.get(0)
            .str.replace('á', 'a', regex=False)
            .str.replace('é', 'e', regex=False)
            .str.replace('í', 'i', regex=False)
            .str.replace('ó', 'o', regex=False)
            .str.replace('ú', 'u', regex=False)
            .str.replace('ü', 'u', regex=False)
            .str.replace('ñ', 'n', regex=False)
            .str.replace(',', '.', regex=False)
            .str.replace(' ', '', regex=False)
            .str.replace('\n', '', regex=False)
            .str.replace('"', '', regex=False)
            .str.replace('!', '', regex=False)
            .str.replace('#', '', regex=False)
            .str.replace('$', '', regex=False)
            .str.replace('%', '', regex=False)
            .str.replace(r'\.+', '.', regex=True)
            .str.strip('._-><')
        )

    # Reemplazar ; por / en el resto de columnas de texto
    for col in df.columns:
        if col != col_email and df[col].dtype == 'object':
            df[col] = df[col].str.replace(';', '/', regex=False)

    # Eliminar espacios en todas las celdas
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)

    # Eliminar filas completamente vacías
    df.dropna(how='all', inplace=True)

    return df


@api_view(['POST'])
@parser_classes([MultiPartParser])
def limpiar_csv_view(request):
    archivo = request.FILES.get('archivo')

    if not archivo:
        return Response(
            {'error': 'Debes subir un archivo con el campo "archivo".'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not archivo.name.endswith('.csv'):
        return Response(
            {'error': 'Solo se aceptan archivos .csv'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        contenido = archivo.read()

        # Detectar encoding
        try:
            contenido.decode('utf-8')
            encoding = 'utf-8'
        except UnicodeDecodeError:
            encoding = 'latin-1'

        # Detectar separador (coma o punto y coma)
        separador = detectar_separador(contenido, encoding)

        df = pd.read_csv(io.BytesIO(contenido), sep=separador, dtype=str, engine='python', encoding=encoding)

        filas_originales = len(df)
        df = limpiar_csv(df)
        filas_limpias = len(df)

        # Generar CSV limpio conservando el separador original
        buffer = io.StringIO()
        df.to_csv(buffer, index=False, sep=separador, encoding='utf-8-sig')
        buffer.seek(0)

        RegistroLimpiezaCSV.objects.create(
            nombre_archivo=archivo.name,
            filas_originales=filas_originales,
            filas_limpias=filas_limpias,
            separador=separador,
            encoding=encoding,
        )
        RegistroLimpiezaCSV.objects.filter(
            creado_en__lt=timezone.now() - timedelta(days=RETENTION_DAYS)
        ).delete()

        nombre_salida = archivo.name.replace('.csv', '_LIMPIO.csv')
        response = HttpResponse(buffer.getvalue().encode('utf-8-sig'), content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = f'attachment; filename="{nombre_salida}"'
        response['X-Filas-Originales'] = filas_originales
        response['X-Filas-Limpias'] = filas_limpias
        response['Access-Control-Expose-Headers'] = 'X-Filas-Originales, X-Filas-Limpias'
        return response

    except Exception as e:
        return Response(
            {'error': f'Error al procesar el archivo: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def historial_csv_view(request):
    registros = RegistroLimpiezaCSV.objects.all()
    data = [
        {
            'id': r.id,
            'nombre_archivo': r.nombre_archivo,
            'filas_originales': r.filas_originales,
            'filas_limpias': r.filas_limpias,
            'separador': r.separador,
            'encoding': r.encoding,
            'creado_en': r.creado_en.isoformat(),
        }
        for r in registros
    ]
    return Response(data)
