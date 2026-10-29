import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSesion } from '../contexto/Sesion';

const BURBUJAS = [
  { t: 90, x: '6%', y: '18%', d: 0 }, { t: 40, x: '14%', y: '62%', d: 2 }, { t: 130, x: '82%', y: '30%', d: 1 },
  { t: 56, x: '92%', y: '70%', d: 3 }, { t: 28, x: '48%', y: '12%', d: 4 }, { t: 70, x: '70%', y: '84%', d: 2 },
];

export function Fondo() {
  return (
    <>
      <div className="astro-sol" aria-hidden />
      {BURBUJAS.map((b, i) => (
        <span key={i} className="burbuja" aria-hidden style={{ width: b.t, height: b.t, left: b.x, top: b.y, animationDelay: `${b.d}s` }} />
      ))}
      <svg className="olas" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden>
        <path fill="#99e1d9" fillOpacity=".55" d="M0,120 C240,40 480,200 720,120 C960,40 1200,190 1440,100 L1440,220 L0,220Z" />
        <path fill="#99e1d9" fillOpacity=".75" d="M0,160 C260,100 520,220 780,150 C1040,80 1240,200 1440,150 L1440,220 L0,220Z" />
        <path fill="#faf561" fillOpacity=".45" d="M0,200 C300,170 600,225 900,195 C1150,170 1300,215 1440,195 L1440,220 L0,220Z" />
      </svg>
    </>
  );
}

export function Marco() {
  const { administrador, cerrarSesion } = useSesion();
  const ir = useNavigate();
  return (
    <>
      <Fondo />
      <header className="barra vidrio">
        <NavLink to="/planes" className="logo">🌊 TurisPro</NavLink>
        <nav>
          <NavLink to="/planes">Planes</NavLink>
          <NavLink to="/asistente">Asistente IA</NavLink>
          <NavLink to="/recursos">Recursos</NavLink>
          <NavLink to="/reportes">Reportes</NavLink>
        </nav>
        <div className="usuario">
          <span>{administrador?.nombre}</span>
          <button className="boton secundario pequeno" onClick={() => { cerrarSesion(); ir('/login'); }}>Cerrar sesión</button>
        </div>
      </header>
      <main className="contenido"><Outlet /></main>
    </>
  );
}
