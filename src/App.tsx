import { useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { hayConfigSupabase } from './lib/supabase'
import { useMisCultivos } from './hooks/useMisCultivos'
import { Auth } from './components/Auth'
import { Cargando } from './components/Cargando'
import { ConfigFaltante } from './components/ConfigFaltante'
import { Calculadora } from './components/Calculadora'
import { Registro } from './components/Registro'
import { Perfil } from './components/Perfil'
import { AdminDashboard } from './components/AdminDashboard'
import { Logo } from './components/Logo'
import { Avatar } from './components/Avatar'

type Seccion = 'calculadora' | 'registro' | 'perfil' | 'admin'

export default function App() {
  if (!hayConfigSupabase) return <ConfigFaltante />
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}

function Shell() {
  const { session, perfil, cargando, esAdmin, cerrarSesion } = useAuth()
  const [seccion, setSeccion] = useState<Seccion>('calculadora')

  if (cargando) return <Cargando texto="Entrando…" />
  if (!session) return <Auth />

  return (
    <div className="app">
      <header className="encabezado">
        <div className="encabezado-top">
          <div className="marca">
            <Logo className="logo-mini" />
            <div>
              <h1>ARAC</h1>
              <p className="marca-tag">Calculadora agrícola</p>
            </div>
          </div>
          <div className="encabezado-acciones">
            <div className="greet">
              <span className="hi">Hola</span>
              <span className="who">{perfil?.nombre || 'Productor'}</span>
            </div>
            <Avatar foto={perfil?.foto} nombre={perfil?.nombre} size={40} />
            <button type="button" className="btn-salir" onClick={cerrarSesion}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Salir</span>
            </button>
          </div>
        </div>

        <nav className="tabs" aria-label="Secciones">
          <Tab actual={seccion} valor="calculadora" onClick={setSeccion}>Calculadora</Tab>
          <Tab actual={seccion} valor="registro" onClick={setSeccion}>Mi registro</Tab>
          <Tab actual={seccion} valor="perfil" onClick={setSeccion}>Perfil</Tab>
          {esAdmin && (
            <Tab actual={seccion} valor="admin" onClick={setSeccion}>Admin</Tab>
          )}
        </nav>
      </header>

      <main className="contenido">
        {seccion === 'admin' && esAdmin ? (
          <AdminDashboard />
        ) : seccion === 'perfil' ? (
          <Perfil />
        ) : (
          <PanelProductor
            seccion={seccion === 'registro' ? 'registro' : 'calculadora'}
            userId={session.user.id}
          />
        )}
      </main>

      <footer className="pie">
        <p>Hecho para el campo 🇨🇴 · Tus cultivos se guardan en tu cuenta.</p>
        <p className="credito">Desarrollado por <strong>zamge</strong></p>
      </footer>
    </div>
  )
}

function PanelProductor({
  seccion,
  userId,
}: {
  seccion: 'calculadora' | 'registro'
  userId: string
}) {
  const { cultivos, cargando, error, agregar, eliminar } = useMisCultivos(userId)
  return seccion === 'calculadora' ? (
    <Calculadora onGuardar={agregar} />
  ) : (
    <Registro cultivos={cultivos} cargando={cargando} error={error} onEliminar={eliminar} />
  )
}

function Tab({
  actual,
  valor,
  onClick,
  children,
}: {
  actual: Seccion
  valor: Seccion
  onClick: (s: Seccion) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={actual === valor ? 'tab activa' : 'tab'}
      onClick={() => onClick(valor)}
    >
      {children}
    </button>
  )
}
