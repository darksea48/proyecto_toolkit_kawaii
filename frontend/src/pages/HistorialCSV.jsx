import { useState, useEffect } from 'react'

const HISTORIAL_URL = 'http://localhost:8000/api/csv/historial/'

function formatFecha(iso) {
  const d = new Date(iso)
  return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

function HistorialCSV() {
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(HISTORIAL_URL)
        if (!res.ok) throw new Error('Error al obtener el historial.')
        setHistorial(await res.json())
      } catch (e) {
        setError(e.message || 'No se pudo conectar con el servidor.')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">

          <div className="d-flex align-items-center gap-2 mb-1">
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle"
              style={{ width: 44, height: 44, backgroundColor: '#CCFBF1' }}
            >
              <i className="bi bi-clock-history fs-5" style={{ color: '#0D9488' }} aria-hidden="true"></i>
            </span>
            <h2 className="fw-bold mb-0">Historial de limpiezas</h2>
            <span className="badge ms-1" style={{ backgroundColor: '#CCFBF1', color: '#134E4A' }}>
              últimos 7 días
            </span>
          </div>
          <p className="text-muted mb-4">
            Registro de archivos CSV procesados. Los registros se eliminan automáticamente
            después de 7 días.
          </p>

          {cargando && (
            <div className="d-flex align-items-center gap-2 text-muted">
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              Cargando historial...
            </div>
          )}

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
              <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
              {error}
            </div>
          )}

          {!cargando && !error && historial.length === 0 && (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-3" aria-hidden="true"></i>
              <p className="mb-0">No hay limpiezas registradas en los últimos 7 días.</p>
            </div>
          )}

          {historial.length > 0 && (
            <div className="table-responsive rounded-3 border">
              <table className="table table-hover mb-0 align-middle small">
                <thead style={{ backgroundColor: '#F0FDFA' }}>
                  <tr>
                    <th className="ps-3">#</th>
                    <th>Archivo</th>
                    <th className="text-center">Filas orig.</th>
                    <th className="text-center">Filas limpias</th>
                    <th className="text-center">Sep.</th>
                    <th className="text-center">Encoding</th>
                    <th className="text-end pe-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="ps-3 text-muted">{idx + 1}</td>
                      <td className="text-truncate" style={{ maxWidth: 220 }} title={r.nombre_archivo}>
                        <i className="bi bi-file-earmark-text me-1 text-muted" aria-hidden="true"></i>
                        {r.nombre_archivo}
                      </td>
                      <td className="text-center">{r.filas_originales}</td>
                      <td className="text-center">
                        <span style={{ color: '#0D9488', fontWeight: 600 }}>{r.filas_limpias}</span>
                        {r.filas_originales !== r.filas_limpias && (
                          <span className="text-muted ms-1 small">
                            ({r.filas_originales - r.filas_limpias < 0 ? '+' : '-'}
                            {Math.abs(r.filas_originales - r.filas_limpias)})
                          </span>
                        )}
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
          )}

        </div>
      </div>
    </div>
  )
}

export default HistorialCSV
