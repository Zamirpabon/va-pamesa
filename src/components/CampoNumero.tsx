interface Props {
  etiqueta: string
  valor: number
  onChange: (v: number) => void
  prefijo?: string
  sufijo?: string
  placeholder?: string
  // Si es true, permite decimales (para kilos). Por defecto, enteros con
  // separador de miles (para dinero): al escribir 6000 se muestra "6.000".
  decimales?: boolean
}

const miles = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

// Campo numérico reutilizable, pensado para usarse con el dedo en el celular.
export function CampoNumero({
  etiqueta,
  valor,
  onChange,
  prefijo,
  sufijo,
  placeholder,
  decimales = false,
}: Props) {
  const comun = {
    placeholder: placeholder ?? '0',
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.select(),
  }

  const input = decimales ? (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      step="any"
      value={valor === 0 ? '' : valor}
      onChange={(e) => {
        const n = parseFloat(e.target.value)
        onChange(isNaN(n) ? 0 : n)
      }}
      {...comun}
    />
  ) : (
    <input
      type="text"
      inputMode="numeric"
      value={valor === 0 ? '' : miles.format(valor)}
      onChange={(e) => {
        const soloDigitos = e.target.value.replace(/\D/g, '')
        onChange(soloDigitos === '' ? 0 : parseInt(soloDigitos, 10))
      }}
      {...comun}
    />
  )

  return (
    <label className="campo">
      <span className="campo-etiqueta">{etiqueta}</span>
      <div className="campo-input">
        {prefijo && <span className="afijo afijo-pre">{prefijo}</span>}
        {input}
        {sufijo && <span className="afijo afijo-suf">{sufijo}</span>}
      </div>
    </label>
  )
}
