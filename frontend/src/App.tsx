import { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Marco } from './componentes/Marco';
import { useSesion } from './contexto/Sesion';
import Asistente from './paginas/Asistente';
import Editor from './paginas/Editor';
import Ficha from './paginas/Ficha';
import Login from './paginas/Login';
import Planes from './paginas/Planes';
import Recursos from './paginas/Recursos';
import Reportes from './paginas/Reportes';

function Protegida({ children }: { children: ReactElement }) {
  const { administrador, cargando } = useSesion();
  if (cargando) return <p className="centrado">Cargando…</p>;
  return administrador ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protegida><Marco /></Protegida>}>
        <Route path="/planes" element={<Planes />} />
        <Route path="/planes/nuevo" element={<Editor />} />
        <Route path="/planes/:id/editar" element={<Editor />} />
        <Route path="/planes/:id/ficha" element={<Ficha />} />
        <Route path="/asistente" element={<Asistente />} />
        <Route path="/recursos" element={<Recursos />} />
        <Route path="/reportes" element={<Reportes />} />
      </Route>
      <Route path="*" element={<Navigate to="/planes" replace />} />
    </Routes>
  );
}
