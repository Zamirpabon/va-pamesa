import { useCallback, useEffect, useState } from 'react'
import { agregarCultivo, eliminarCultivo, listarMisCultivos } from '../lib/db'
import type { CultivoRow, DatosCultivo } from '../types'

// Maneja la lista de cultivos del productor actual (cargar, agregar, eliminar).
export function useMisCultivos(userId: string) {
  const [cultivos, setCultivos] = useState<CultivoRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setCultivos(await listarMisCultivos(userId))
    } catch {
      setError('No pudimos cargar tus cultivos.')
    } finally {
      setCargando(false)
    }
  }, [userId])

  useEffect(() => {
    recargar()
  }, [recargar])

  const agregar = useCallback(
    async (datos: DatosCultivo) => {
      const fila = await agregarCultivo(userId, datos)
      setCultivos((prev) => [fila, ...prev])
      return fila
    },
    [userId],
  )

  const eliminar = useCallback(
    async (id: string) => {
      try {
        await eliminarCultivo(id)
        setCultivos((prev) => prev.filter((c) => c.id !== id))
      } catch {
        setError('No pudimos eliminar el cultivo. Intenta de nuevo.')
        await recargar() // reconcilia con el estado real del servidor
      }
    },
    [recargar],
  )

  return { cultivos, cargando, error, agregar, eliminar, recargar }
}
