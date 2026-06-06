interface Props {
  etiqueta: string
  valor: number
  onChange: (v: number) => void
  prefijo?: string
  sufijo?: string
  placeholder?: string
}

// Campo numérico reutilizable, pensado para usarse con el dedo en el celular.
export function CampoNumero({ etiqueta, valor, onChange, prefijo, sufijo, placeholder }: Props) {
  return (
    <label className="campo">
      <span className="campo-etiqueta">{etiqueta}</span>
      <div className="campo-input">
        {prefijo && <span className="afijo afijo-pre">{prefijo}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={valor === 0 ? '' : valor}
          placeholder={placeholder ?? '0'}
          onChange={(e) => {
            const n = parseFloat(e.target.value)
            onChange(isNaN(n) ? 0 : n)
          }}
          onFocus={(e) => e.currentTarget.select()}
        />
        {sufijo && <span className="afijo afijo-suf">{sufijo}</span>}
      </div>
    </label>
  )
}
