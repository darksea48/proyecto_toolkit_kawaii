#!/usr/bin/env python3
"""
limpiar_vv.py — Prepara un archivo VVExport de LimeSurvey para reimportarlo
en Respuestas → Importar → Importar un archivo de respuestas VV.

Hace una limpieza MÍNIMA y segura, sin pasar por Excel (que destruye la
estructura de tabulaciones):
  - Quita líneas en blanco al inicio y al final (causa común de fallo).
  - Quita el BOM inicial si existe.
  - NO toca las tabulaciones, comillas ni el contenido de las celdas.
  - Valida que el archivo sea separado por tabulaciones, tenga las dos filas
    de cabecera y que todas las filas tengan el mismo número de columnas.

Uso:
    python limpiar_vv.py archivo_original.csv
    python limpiar_vv.py archivo_original.csv -o salida.txt
    python limpiar_vv.py archivo_original.csv --solo-validar
"""

import argparse
import sys
from pathlib import Path

BOM = b"\xef\xbb\xbf"


def limpiar(datos_crudos: bytes) -> bytes:
    """Quita BOM y líneas en blanco al inicio/fin, conservando todo lo demás."""
    if datos_crudos.startswith(BOM):
        datos_crudos = datos_crudos[len(BOM):]
    # lstrip/rstrip solo de saltos de línea: no toca tabs ni espacios internos
    return datos_crudos.strip(b"\r\n")


def validar(datos: bytes) -> list[str]:
    """Devuelve una lista de advertencias. Vacía = todo correcto."""
    avisos = []
    texto = datos.decode("utf-8")  # lanza error si no es UTF-8 válido
    lineas = texto.split("\n")

    if len(lineas) < 3:
        avisos.append("El archivo tiene menos de 3 líneas: no hay cabeceras + datos.")
        return avisos

    # Conteo de columnas por fila (separador = tabulación)
    n_cols = lineas[0].count("\t") + 1
    if n_cols < 2:
        avisos.append(
            "La primera fila no parece separada por tabulaciones "
            "(¿se guardó por error como CSV con comas en Excel?)."
        )

    # La segunda fila debe ser la de códigos internos (suele empezar por 'id')
    segunda = lineas[1].split("\t")
    if segunda and segunda[0].strip().strip('"').lower() != "id":
        avisos.append(
            "La segunda fila no empieza por 'id': revisa que sean las dos "
            "filas de cabecera originales (texto legible + códigos)."
        )

    # Verificar columnas consistentes (ignora la última línea si quedó vacía)
    for i, linea in enumerate(lineas, start=1):
        if i == len(lineas) and linea == "":
            continue
        cols = linea.count("\t") + 1
        if cols != n_cols:
            avisos.append(
                f"La fila {i} tiene {cols} columnas en vez de {n_cols} "
                "(filas desiguales rompen la importación VV)."
            )
            if len(avisos) > 10:
                avisos.append("...más filas con problemas (se omiten).")
                break
    return avisos


def main() -> int:
    p = argparse.ArgumentParser(description="Limpia un VVExport de LimeSurvey para reimportar.")
    p.add_argument("entrada", help="Ruta del archivo VVExport (.csv/.vv/.txt)")
    p.add_argument("-o", "--salida", help="Ruta de salida (por defecto: <nombre>_VV_import.txt)")
    p.add_argument("--solo-validar", action="store_true", help="Solo valida, no escribe archivo")
    args = p.parse_args()

    entrada = Path(args.entrada)
    if not entrada.is_file():
        print(f"ERROR: no existe el archivo {entrada}", file=sys.stderr)
        return 1

    datos = limpiar(entrada.read_bytes())

    try:
        avisos = validar(datos)
    except UnicodeDecodeError:
        print("ERROR: el archivo no es UTF-8 válido. Vuelve a exportarlo en UTF-8.", file=sys.stderr)
        return 1

    n_lineas = datos.decode("utf-8").rstrip("\n").count("\n") + 1
    n_respuestas = max(n_lineas - 2, 0)  # menos las 2 filas de cabecera
    print(f"Líneas tras limpieza: {n_lineas}  (respuestas: ~{n_respuestas})")

    if avisos:
        print("\nAdvertencias:")
        for a in avisos:
            print(f"  - {a}")
    else:
        print("Validación: OK (separado por tabs, 2 cabeceras, columnas consistentes).")

    if args.solo_validar:
        return 0 if not avisos else 2

    salida = Path(args.salida) if args.salida else entrada.with_name(entrada.stem + "_VV_import.txt")
    salida.write_bytes(datos)
    print(f"\nArchivo listo para importar: {salida}")
    print("Impórtalo en LimeSurvey → Respuestas → Importar → Importar un archivo de respuestas VV.")
    print("NO lo abras ni lo guardes en Excel: destruye la estructura de tabulaciones.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
