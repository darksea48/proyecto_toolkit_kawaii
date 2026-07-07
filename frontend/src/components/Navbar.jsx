import { NavLink, Link, useLocation } from 'react-router-dom'

function Navbar() {
  const { pathname } = useLocation()
  const csvActivo = pathname.startsWith('/csv')
  const vvActivo = pathname.startsWith('/vv')

  return (
    <nav className="navbar navbar-expand-lg navbar-toolkit">
      <div className="container-fluid">
        <NavLink className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <i className="bi bi-tools fs-5" aria-hidden="true"></i>
          Toolkit Kawaii
        </NavLink>
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMain"
          aria-controls="navbarMain"
          aria-expanded="false"
          aria-label="Abrir menú"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarMain">
          <ul className="navbar-nav ms-auto gap-1">
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link px-3 ${isActive ? 'active' : ''}`} to="/">
                <i className="bi bi-house me-1" aria-hidden="true"></i>
                Inicio
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link px-3 ${isActive ? 'active' : ''}`} to="/qr">
                <i className="bi bi-qr-code me-1" aria-hidden="true"></i>
                Generador QR
              </NavLink>
            </li>
            <li className="nav-item dropdown">
              <button
                className={`nav-link px-3 dropdown-toggle ${csvActivo ? 'active' : ''}`}
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-file-earmark-spreadsheet me-1" aria-hidden="true"></i>
                Limpiador CSV
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link className="dropdown-item" to="/csv">
                    <i className="bi bi-stars me-2" aria-hidden="true"></i>
                    Limpiar archivo
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/csv/historial">
                    <i className="bi bi-clock-history me-2" aria-hidden="true"></i>
                    Historial de limpiezas
                  </Link>
                </li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <button
                className={`nav-link px-3 dropdown-toggle ${vvActivo ? 'active' : ''}`}
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-arrow-repeat me-1" aria-hidden="true"></i>
                Importador VV
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link className="dropdown-item" to="/vv">
                    <i className="bi bi-stars me-2" aria-hidden="true"></i>
                    Preparar archivo VV
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/vv/historial">
                    <i className="bi bi-clock-history me-2" aria-hidden="true"></i>
                    Historial de importaciones
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
