import { useState } from 'react'
import { Calculadora } from './components/Calculadora'
import { Registro } from './components/Registro'
import { leerRegistro } from './lib/storage'
import type { CultivoGuardado } from './types'

type Pestana = 'calculadora' | 'registro'

export default function App() {
  const [pestana, setPestana] = useState<Pestana>('calculadora')
  const [registro, setRegistro] = useState<CultivoGuardado[]>(() => leerRegistro())

  return (
    <div className="app">
      <header className="encabezado">
        <div className="marca">
          <span className="logo" aria-hidden="true">🌱</span>
          <div>
            <h1>
              va<span className="marca-acento">·</span>pa<span className="marca-acento">·</span>mesa
            </h1>
            <p>¿Tu cultivo es rentable? Averígualo en segundos.</p>
          </div>
        </div>

        <nav className="tabs" aria-label="Secciones">
          <button
            type="button"
            className={pestana === 'calculadora' ? 'tab activa' : 'tab'}
            onClick={() => setPestana('calculadora')}
          >
            Calculadora
          </button>
          <button
            type="button"
            className={pestana === 'registro' ? 'tab activa' : 'tab'}
            onClick={() => setPestana('registro')}
          >
            Mi registro
            {registro.length > 0 && <span className="badge">{registro.length}</span>}
          </button>
        </nav>
      </header>

      <main className="contenido">
        {pestana === 'calculadora' ? (
          <Calculadora onGuardar={setRegistro} />
        ) : (
          <Registro registro={registro} onCambio={setRegistro} />
        )}
      </main>

      <footer className="pie">
        <p>Hecho para el campo 🇨🇴 · Tus datos se guardan solo en este dispositivo.</p>
      </footer>
    </div>
  )
}
