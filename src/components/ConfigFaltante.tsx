// Pantalla que aparece si faltan las variables de entorno de Supabase.
export function ConfigFaltante() {
  return (
    <div className="auth">
      <div className="auth-tarjeta">
        <div className="auth-marca">
          <span className="logo" aria-hidden="true">🌱</span>
          <h1>va·pa·mesa</h1>
        </div>
        <p className="mensaje medio" style={{ marginTop: 12 }}>
          ⚙️ Falta conectar la base de datos.
        </p>
        <p className="auth-sub">
          Crea un archivo <strong>.env</strong> (copia de <strong>.env.example</strong>) con tus
          datos de Supabase:
        </p>
        <pre className="bloque-codigo">
{`VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-llave-anon`}
        </pre>
        <p className="auth-sub">
          Los encuentras en <strong>Supabase → Project Settings → API</strong>. Si ya lo desplegaste
          en Cloudflare, agrégalos también como variables del build y vuelve a desplegar.
        </p>
      </div>
    </div>
  )
}
