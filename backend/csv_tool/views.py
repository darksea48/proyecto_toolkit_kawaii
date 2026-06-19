import csv
import io
import logging
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

logger = logging.getLogger(__name__)

# --- Constantes para la limpieza ---
# Tamaño máximo de archivo aceptado (en bytes). Evita agotar la memoria.
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

# Mapa para normalizar caracteres comunes en los correos (tildes, ñ, coma->punto).
EMAIL_NORMALIZATION_MAP = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'ñ': 'n',
    ',': '.',
}
# Tabla de traducción precompilada: normaliza en una sola pasada.
EMAIL_TRANSLATION = str.maketrans(EMAIL_NORMALIZATION_MAP)

# Elimina cualquier caracter que NO sea letra, número o uno de [@ . _ -].
# Una sola regex reemplaza la larga cadena de .str.replace() individuales.
INVALID_EMAIL_CHARS_REGEX = r'[^a-z0-9@._-]'


def detectar_separador(muestra: str) -> str:
    """Detecta si el CSV usa coma o punto y coma como separador."""
    try:
        dialecto = csv.Sniffer().sniff(muestra[:4096], delimiters=',;')
        return dialecto.delimiter
    except csv.Error:
        return ';'  # fallback al separador por defecto


def decodificar(contenido_bytes: bytes) -> tuple[str, str]:
    """
    Decodifica el contenido del archivo intentando UTF-8 primero y
    cayendo a cp1252 (Windows-1252), que es lo que suele exportar Excel
    en español. Devuelve (texto, nombre_encoding).
    """
    try:
        return contenido_bytes.decode('utf-8'), 'utf-8'
    except UnicodeDecodeError:
        return contenido_bytes.decode('cp1252', errors='replace'), 'cp1252'


def _clean_email_series(email_series: pd.Series) -> pd.Series:
    """
    Aplica los pasos de limpieza a una Serie de correos de forma vectorizada.
    """
    if email_series.dtype != 'object':
        return email_series

    # 1. Minúsculas, sin espacios, y tomar solo el primer "bloque" de texto.
    cleaned = email_series.str.lower().str.strip().str.split().str.get(0)

    # 2. Normalizar tildes, ñ y comas en una sola pasada.
    cleaned = cleaned.str.translate(EMAIL_TRANSLATION)

    # 3. Eliminar TODOS los caracteres no válidos de una sola vez.
    cleaned = cleaned.str.replace(INVALID_EMAIL_CHARS_REGEX, '', regex=True)

    # 4. Colapsar puntos consecutivos ('a..b' -> 'a.b').
    cleaned = cleaned.str.replace(r'\.+', '.', regex=True)

    # 5. Quitar puntos/guiones sobrantes al inicio o final.
    cleaned = cleaned.str.strip('._-><')

    return cleaned


def limpiar_csv(df: pd.DataFrame) -> pd.DataFrame:
    """Limpia un DataFrame: columnas, email, separadores y filas vacías."""
    # 1. Limpiar nombres de columnas.
    df.columns = df.columns.str.strip()

    # 2. Limpiar la columna 'email' si existe.
    col_email = 'email'
    if col_email in df.columns:
        df[col_email] = _clean_email_series(df[col_email])

    # 3. Quitar espacios de todas las celdas de texto.
    #    (df.map requiere pandas >= 2.1; usar df.applymap en versiones previas)
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)

    # 4. Reemplazar ';' por '/' en las columnas de texto, excepto email.
    other_text_cols = [
        c for c in df.select_dtypes(include='object').columns
        if c != col_email
    ]
    if other_text_cols:
        df[other_text_cols] = df[other_text_cols].apply(
            lambda col: col.str.replace(';', '/', regex=False)
        )

    # 5. Eliminar filas completamente vacías.
    df.dropna(how='all', inplace=True)

    return df


@api_view(['POST'])
@parser_classes([MultiPartParser])
def limpiar_csv_view(request):
    archivo = request.FILES.get('archivo')

    if not archivo:
        return Response(
            {'error': 'Debes subir un archivo con el campo "archivo".'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not archivo.name.lower().endswith('.csv'):
        return Response(
            {'error': 'Solo se aceptan archivos .csv'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if archivo.size > MAX_FILE_SIZE:
        return Response(
            {'error': f'El archivo supera el tamaño máximo de '
                      f'{MAX_FILE_SIZE // (1024 * 1024)} MB.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        contenido = archivo.read()

        # Decodificar una sola vez (UTF-8 con fallback a cp1252).
        texto, encoding = decodificar(contenido)

        # Detectar separador (coma o punto y coma).
        separador = detectar_separador(texto)

        # Motor C por defecto (más rápido); el separador es de un solo caracter.
        df = pd.read_csv(io.StringIO(texto), sep=separador, dtype=str)

        filas_originales = len(df)
        df = limpiar_csv(df)
        filas_limpias = len(df)

        # Generar CSV limpio conservando el separador original.
        buffer = io.StringIO()
        df.to_csv(buffer, index=False, sep=separador)

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

        nombre_salida = archivo.name.rsplit('.csv', 1)[0] + '_LIMPIO.csv'
        # utf-8-sig agrega el BOM para que Excel reconozca tildes y eñes.
        response = HttpResponse(
            buffer.getvalue().encode('utf-8-sig'),
            content_type='text/csv; charset=utf-8',
        )
        response['Content-Disposition'] = f'attachment; filename="{nombre_salida}"'
        response['X-Filas-Originales'] = filas_originales
        response['X-Filas-Limpias'] = filas_limpias
        response['Access-Control-Expose-Headers'] = (
            'X-Filas-Originales, X-Filas-Limpias'
        )
        return response

    except Exception:
        # Se loguea el detalle completo, pero no se expone al cliente.
        logger.exception('Error al procesar el archivo CSV')
        return Response(
            {'error': 'Ocurrió un error al procesar el archivo.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
