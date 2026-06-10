import { useState } from 'react'

const API_URL = 'http://localhost:8000/api/qr/'

function GeneradorQR() {
  const [texto, setTexto] = useState('')
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [imagen, setImagen] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerar(e) {
    e.preventDefault()
    if (!texto.trim()) return

    setCargando(true)
    setError(null)
    setImagen(null)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al generar el QR.')
      } else {
        setImagen(data.imagen)
      }
    } catch {
      setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?')
    } finally {
      setCargando(false)
    }
  }

  function handleDescargar() {
    const link = document.createElement('a')
    link.href = imagen
    link.download = nombreArchivo.trim() ? `${nombreArchivo.trim()}.png` : 'qr.png'
    link.click()
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
              <i className="bi bi-qr-code fs-5" style={{ color: '#0D9488' }} aria-hidden="true"></i>
            </span>
            <h2 className="fw-bold mb-0">Generador QR</h2>
          </div>
          <p className="text-muted mb-4">Ingresa un texto o URL y obtén el código QR al instante.</p>

          <form onSubmit={handleGenerar}>
            <div className="mb-3">
              <label htmlFor="texto" className="form-label fw-semibold">
                Texto o URL
              </label>
              <input
                id="texto"
                type="text"
                className="form-control form-control-lg"
                placeholder="https://ejemplo.com"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="nombreArchivo" className="form-label fw-semibold">
                Nombre del archivo
              </label>
              <div className="input-group input-group-lg">
                <input
                  id="nombreArchivo"
                  type="text"
                  className="form-control"
                  placeholder="mi-qr"
                  value={nombreArchivo}
                  onChange={(e) => setNombreArchivo(e.target.value)}
                />
                <span className="input-group-text text-muted">.png</span>
              </div>
              <div className="form-text">
                <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                Opcional — si no lo completas se descarga como <code>qr.png</code>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={cargando}
              style={{ cursor: cargando ? 'not-allowed' : 'pointer' }}
            >
              {cargando ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                  Generando...
                </>
              ) : (
                <>
                  <i className="bi bi-qr-code" aria-hidden="true"></i>
                  Generar QR
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

          {imagen && (
            <div className="text-center mt-4">
              <div className="d-inline-block p-3 bg-white border rounded-3 shadow-sm">
                <img
                  src={imagen}
                  alt="Código QR generado"
                  className="img-fluid"
                  style={{ maxWidth: 240 }}
                />
              </div>
              <div className="mt-3">
                <button
                  className="btn btn-cta d-inline-flex align-items-center gap-2"
                  onClick={handleDescargar}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-download" aria-hidden="true"></i>
                  Descargar PNG
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default GeneradorQR
