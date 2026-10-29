import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Fondo } from '../componentes/Marco';
import { useSesion } from '../contexto/Sesion';

export default function Login() {
  const { administrador, iniciarSesion } = useSesion();
  const ir = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  if (administrador) return <Navigate to="/planes" replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setEnviando(true);
    try { await iniciarSesion(correo.trim(), contrasena); ir('/planes'); }
    catch (err: any) { setError(err.message); }
    finally { setEnviando(false); }
  };

  return (
    <>
      <Fondo />
      <div className="login">
        <form className="vidrio tarjeta" onSubmit={enviar}>
          <h1>🌊 TurisPro</h1>
          <p className="centrado suave" style={{ padding: 0, margin: '0 0 1rem' }}>Diseñador inteligente de planes turísticos</p>
          <div style={{ marginBottom: '.8rem' }}>
            <label htmlFor="correo">Correo</label>
            <input id="correo" type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '.8rem' }}>
            <label htmlFor="contrasena">Contraseña</label>
            <input id="contrasena" type="password" autoComplete="current-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required />
          </div>
          {error && <div className="aviso error" role="alert">{error}</div>}
          <button className="boton" style={{ width: '100%' }} disabled={enviando}>{enviando ? 'Ingresando…' : 'Iniciar sesión'}</button>
          <p className="pequeno suave" style={{ textAlign: 'center', marginBottom: 0 }}>Las cuentas las crea la empresa. No hay registro público.</p>
        </form>
      </div>
    </>
  );
}
