import { Link } from 'react-router-dom'

const herramientas = [
  {
    titulo: 'Generador QR',
    descripcion: 'Convierte cualquier texto o URL en un código QR listo para descargar.',
    icono: 'bi-qr-code',
    ruta: '/qr',
  },
  {
    titulo: 'Limpiador CSV',
    descripcion: 'Limpia y normaliza archivos CSV: emails, tildes, espacios y más.',
    icono: 'bi-file-earmark-spreadsheet',
    ruta: '/csv',
  },
  {
    titulo: 'Importador VV',
    descripcion: 'Prepara un VVExport de LimeSurvey para reimportarlo sin dañar las tabulaciones.',
    icono: 'bi-arrow-repeat',
    ruta: '/vv',
  },
]

function Home() {
  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="fw-bold mb-2" style={{ fontSize: '2.4rem', color: '#134E4A' }}>
          Tus herramientas de trabajo
        </h1>
        <p className="text-muted fs-5">Simples, rápidas y directas al grano.</p>
      </div>

      <div className="row g-4 justify-content-center">
        {herramientas.map((h) => (
          <div key={h.ruta} className="col-sm-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm tool-card bg-white">
              <div className="card-body text-center p-4 d-flex flex-column">
                <div className="mb-3">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: 64, height: 64, backgroundColor: '#CCFBF1' }}
                  >
                    <i className={`bi ${h.icono} fs-3`} style={{ color: '#0D9488' }} aria-hidden="true"></i>
                  </span>
                </div>
                <h5 className="card-title fw-bold mb-2">{h.titulo}</h5>
                <p className="card-text text-muted flex-grow-1">{h.descripcion}</p>
                <div className="mt-3">
                  <Link to={h.ruta} className="btn btn-cta px-4">
                    Abrir herramienta
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home
