import { useState, useEffect } from 'react'

const HISTORIAL_URL = 'http://localhost:8000/api/vv/historial/'

function formatFecha(iso) {
  const d = new Date(iso)
  return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

function HistorialVV() {
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
            <h2 className="fw-bold mb-0">Historial VV</h2>
            <span className="badge ms-1" style={{ backgroundColor: '#CCFBF1', color: '#134E4A' }}>
              últimos 7 días
            </span>
          </div>
          <p className="text-muted mb-4">
            Registro de archivos VVExport procesados. Los registros se eliminan automáticamente
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
              <p className="mb-0">No hay archivos VV procesados en los últimos 7 días.</p>
            </div>
          )}

          {historial.length > 0 && (
            <div className="table-responsive rounded-3 border">
              <table className="table table-hover mb-0 align-middle small">
                <thead style={{ backgroundColor: '#F0FDFA' }}>
                  <tr>
                    <th className="ps-3">#</th>
                    <th>Archivo</th>
                    <th className="text-center">Respuestas</th>
                    <th className="text-center">Validación</th>
                    <th className="text-end pe-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="ps-3 text-muted">{idx + 1}</td>
                      <td className="text-truncate" style={{ maxWidth: 260 }} title={r.nombre_archivo}>
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
          )}

        </div>
      </div>
    </div>
  )
}

export default HistorialVV
