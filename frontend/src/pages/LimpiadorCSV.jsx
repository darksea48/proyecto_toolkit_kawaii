import { useState, useRef, useEffect, useCallback } from 'react'

const API_URL = 'http://localhost:8000/api/csv/'
const HISTORIAL_URL = 'http://localhost:8000/api/csv/historial/'

function formatFecha(iso) {
  const d = new Date(iso)
  return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

function LimpiadorCSV() {
  const [archivo, setArchivo] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)
  const [historial, setHistorial] = useState([])
  const inputRef = useRef(null)

  const cargarHistorial = useCallback(async () => {
    try {
      const res = await fetch(HISTORIAL_URL)
      if (res.ok) setHistorial(await res.json())
    } catch {
      // servidor no disponible — se ignora silenciosamente
    }
  }, [])

  useEffect(() => { cargarHistorial() }, [cargarHistorial])

  function handleArchivoChange(e) {
    setArchivo(e.target.files[0] || null)
    setResultado(null)
    setError(null)
  }

  async function handleLimpiar(e) {
    e.preventDefault()
    if (!archivo) return

    setCargando(true)
    setError(null)
    setResultado(null)

    const formData = new FormData()
    formData.append('archivo', archivo)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al procesar el archivo.')
        return
      }

      const filasOriginales = res.headers.get('X-Filas-Originales')
      const filasLimpias = res.headers.get('X-Filas-Limpias')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const nombreSalida = archivo.name.replace('.csv', '_LIMPIO.csv')

      setResultado({ url, nombreSalida, filasOriginales, filasLimpias })
      cargarHistorial()
    } catch {
      setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?')
    } finally {
      setCargando(false)
    }
  }

  function handleNuevo() {
    setArchivo(null)
    setResultado(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-5">

          <div className="d-flex align-items-center gap-2 mb-1">
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle"
              style={{ width: 44, height: 44, backgroundColor: '#CCFBF1' }}
            >
              <i className="bi bi-file-earmark-spreadsheet fs-5" style={{ color: '#0D9488' }} aria-hidden="true"></i>
            </span>
            <h2 className="fw-bold mb-0">Limpiador CSV</h2>
          </div>
          <p className="text-muted mb-4">
            Sube un archivo CSV y lo limpiamos: normaliza emails, elimina caracteres
            inválidos y reemplaza punto y coma por barra en otras columnas.
            Acepta separador por coma (<code>,</code>) o punto y coma (<code>;</code>).
          </p>

          <form onSubmit={handleLimpiar}>
            <div className="mb-3">
              <label htmlFor="archivo" className="form-label fw-semibold">
                Archivo CSV
              </label>
              <input
                id="archivo"
                ref={inputRef}
                type="file"
                accept=".csv"
                className="form-control form-control-lg"
                onChange={handleArchivoChange}
                required
              />
              <div className="form-text">
                <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                Solo archivos .csv; se procesarán las columnas de texto para limpiar los datos.
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={cargando || !archivo}
              style={{ cursor: cargando || !archivo ? 'not-allowed' : 'pointer' }}
            >
              {cargando ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                  Limpiando...
                </>
              ) : (
                <>
                  <i className="bi bi-stars" aria-hidden="true"></i>
                  Limpiar CSV
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mt-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
              {error}
            </div>
          )}

          {resultado && (
            <div className="mt-4 p-4 bg-white rounded-3 border" style={{ borderColor: '#0D9488' }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-check-circle-fill fs-5" style={{ color: '#0D9488' }} aria-hidden="true"></i>
                <span className="fw-semibold">¡Archivo listo!</span>
              </div>
              {resultado.filasOriginales && (
                <p className="text-muted small mb-3">
                  <i className="bi bi-table me-1" aria-hidden="true"></i>
                  Filas originales: <strong>{resultado.filasOriginales}</strong>
                  {' → '}
                  Filas limpias: <strong>{resultado.filasLimpias}</strong>
                </p>
              )}
              <div className="d-flex gap-2 flex-wrap">
                <a
                  href={resultado.url}
                  download={resultado.nombreSalida}
                  className="btn btn-cta d-inline-flex align-items-center gap-2"
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-download" aria-hidden="true"></i>
                  Descargar {resultado.nombreSalida}
                </a>
                <button
                  className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                  onClick={handleNuevo}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-arrow-repeat" aria-hidden="true"></i>
                  Limpiar otro
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {historial.length > 0 && (
        <div className="row justify-content-center mt-5">
          <div className="col-md-10 col-lg-8">
            <div className="d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-clock-history fs-5" style={{ color: '#0D9488' }} aria-hidden="true"></i>
              <h5 className="fw-semibold mb-0">Historial reciente</h5>
              <span className="badge ms-1" style={{ backgroundColor: '#CCFBF1', color: '#134E4A' }}>
                últimos 7 días
              </span>
            </div>
            <div className="table-responsive rounded-3 border">
              <table className="table table-hover mb-0 align-middle small">
                <thead style={{ backgroundColor: '#F0FDFA' }}>
                  <tr>
                    <th className="ps-3">Archivo</th>
                    <th className="text-center">Filas orig.</th>
                    <th className="text-center">Filas limpias</th>
                    <th className="text-center">Sep.</th>
                    <th className="text-center">Encoding</th>
                    <th className="text-end pe-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(r => (
                    <tr key={r.id}>
                      <td className="ps-3 text-truncate" style={{ maxWidth: 200 }} title={r.nombre_archivo}>
                        <i className="bi bi-file-earmark-text me-1 text-muted" aria-hidden="true"></i>
                        {r.nombre_archivo}
                      </td>
                      <td className="text-center">{r.filas_originales}</td>
                      <td className="text-center">
                        <span style={{ color: '#0D9488', fontWeight: 600 }}>{r.filas_limpias}</span>
                      </td>
                      <td className="text-center">
                        <code>{r.separador === ',' ? 'coma' : 'punto y coma'}</code>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-secondary bg-opacity-25 text-secondary">{r.encoding}</span>
                      </td>
                      <td className="text-end pe-3 text-muted">{formatFecha(r.creado_en)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LimpiadorCSV
