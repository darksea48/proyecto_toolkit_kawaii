import { useState, useRef, useEffect, useCallback } from 'react'

const API_URL = '/api/vv/'
const HISTORIAL_URL = 'http://localhost:8000/api/vv/historial/'

function formatFecha(iso) {
  const d = new Date(iso)
  return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

function ImportadorVV() {
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
      const res = await fetch(API_URL, { method: 'POST', body: formData })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al procesar el archivo.')
        return
      }

      let avisos = []
      try {
        avisos = JSON.parse(decodeURIComponent(res.headers.get('X-Avisos') || '[]'))
      } catch { /* sin avisos */ }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const nombreSalida = archivo.name.replace(/\.[^.]+$/, '') + '_VV_import.txt'

      setResultado({ url, nombreSalida, avisos })
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
              <i className="bi bi-arrow-repeat fs-5" style={{ color: '#0D9488' }} aria-hidden="true"></i>
            </span>
            <h2 className="fw-bold mb-0">Importador VV</h2>
          </div>
          <p className="text-muted mb-4">
            Prepara un archivo VVExport de LimeSurvey para reimportarlo. Quita el BOM
            y las líneas en blanco sin tocar las tabulaciones, y valida que las dos
            cabeceras y las columnas estén correctas. No lo abras en Excel.
          </p>

          <form onSubmit={handleLimpiar}>
            <div className="mb-3">
              <label htmlFor="archivo" className="form-label fw-semibold">
                Archivo VVExport
              </label>
              <input
                id="archivo"
                ref={inputRef}
                type="file"
                accept=".csv,.vv,.txt"
                className="form-control form-control-lg"
                onChange={handleArchivoChange}
                required
              />
              <div className="form-text">
                <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                Archivos .csv, .vv o .txt separados por tabulaciones, en UTF-8.
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
                  Procesando...
                </>
              ) : (
                <>
                  <i className="bi bi-stars" aria-hidden="true"></i>
                  Preparar para importar
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

              {resultado.avisos.length > 0 ? (
                <div className="alert alert-warning small" role="alert">
                  <div className="fw-semibold mb-1">
                    <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>
                    Advertencias de validación:
                  </div>
                  <ul className="mb-0 ps-3">
                    {resultado.avisos.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              ) : (
                <p className="text-muted small mb-3">
                  <i className="bi bi-check2 me-1" aria-hidden="true"></i>
                  Validación OK: separado por tabs, 2 cabeceras y columnas consistentes.
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
                  Procesar otro
                </button>
              </div>
              <p className="text-muted small mt-3 mb-0">
                Impórtalo en LimeSurvey → Respuestas → Importar → Importar un archivo de respuestas VV.
              </p>
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
                    <th className="text-center">Respuestas</th>
                    <th className="text-center">Validación</th>
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
                      <td className="text-center">
                        <span style={{ color: '#0D9488', fontWeight: 600 }}>{r.respuestas}</span>
                      </td>
                      <td className="text-center">
                        {r.valido ? (
                          <span className="badge bg-success bg-opacity-25 text-success">OK</span>
                        ) : (
                          <span className="badge bg-warning bg-opacity-25 text-warning">
                            {r.n_avisos} aviso{r.n_avisos === 1 ? '' : 's'}
                          </span>
                        )}
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

export default ImportadorVV
