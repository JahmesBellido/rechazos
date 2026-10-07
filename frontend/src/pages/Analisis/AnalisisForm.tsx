import { useState, useEffect } from "react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

interface Analisis {
  id: number;
  motivo_anulacion: string;
  importe: number;
  cant_analisis: number;
  fecha_analisis: string;
  cajas_motivo: number;
  unidades_motivo: number;
  cantidad_motivo: number;
}

interface AnalisisFormProps {
  item: Analisis | null;
  motivos: string[];
  onClose: () => void;
  onSave: () => void;
}

import { API_URL } from "../../config/api";

export default function AnalisisForm({ item, motivos, onClose, onSave }: AnalisisFormProps) {
  const [motivo, setMotivo] = useState("");
  const [importe, setImporte] = useState("");
  const [cantAnalisis, setCantAnalisis] = useState("");
  const [fechaAnalisis, setFechaAnalisis] = useState("");
  const [cajasMotivo, setCajasMotivo] = useState("");
  const [unidadesMotivo, setUnidadesMotivo] = useState("");
  const [cantidadMotivo, setCantidadMotivo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setMotivo(item.motivo_anulacion || "");
      setImporte(String(item.importe || ""));
      setCantAnalisis(String(item.cant_analisis || ""));
      const fecha = item.fecha_analisis ? String(item.fecha_analisis).split("T")[0] : "";
      setFechaAnalisis(fecha);
      setCajasMotivo(String(item.cajas_motivo ?? ""));
      setUnidadesMotivo(String(item.unidades_motivo ?? ""));
      setCantidadMotivo(String(item.cantidad_motivo ?? ""));
    } else {
      const hoy = new Date().toISOString().split("T")[0];
      setFechaAnalisis(hoy);
      setCajasMotivo("");
      setUnidadesMotivo("");
      setCantidadMotivo("");
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!motivo) {
      setError("El motivo de anulacion es obligatorio");
      return;
    }
    if (!fechaAnalisis) {
      setError("La fecha es obligatoria");
      return;
    }

    setIsLoading(true);
    try {
      const url = item
        ? `${API_URL}/analisis/${item.id}`
        : `${API_URL}/analisis`;
      const method = item ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          motivo_anulacion: motivo,
          importe: Number(importe) || 0,
          cant_analisis: Number(cantAnalisis) || 0,
          fecha_analisis: fechaAnalisis,
          cajas_motivo: Number(cajasMotivo) || 0,
          unidades_motivo: Number(unidadesMotivo) || 0,
          cantidad_motivo: Number(cantidadMotivo) || 0,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(item ? "Actualizado correctamente" : "Registrado correctamente");
        setTimeout(() => {
          onSave();
        }, 1000);
      } else {
        setError(data.message || "Error al guardar");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-20 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl mx-4 mb-10 bg-white rounded-2xl shadow-2xl dark:bg-gray-900">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {item ? "Editar Analisis" : "Registrar Analisis"}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 text-sm text-error-500 bg-error-500/10 border border-error-500/20 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 text-sm text-success-500 bg-success-500/10 border border-success-500/20 rounded-lg">
              {success}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <Label>
                Fecha de Analisis <span className="text-error-500">*</span>
              </Label>
              <Input
                type="date"
                value={fechaAnalisis}
                onChange={(e) => setFechaAnalisis(e.target.value)}
              />
            </div>

            <div>
              <Label>
                Motivo de Anulacion <span className="text-error-500">*</span>
              </Label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              >
                <option value="">Seleccionar motivo...</option>
                {motivos.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>Importe (S/)</Label>
                <Input
                  type="number"
                  step={0.01}
                  min="0"
                  placeholder="0.00"
                  value={importe}
                  onChange={(e) => setImporte(e.target.value)}
                />
              </div>
              <div>
                <Label>Cantidad de Documentos</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={cantAnalisis}
                  onChange={(e) => setCantAnalisis(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <Label>Cajas Motivo</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={cajasMotivo}
                  onChange={(e) => setCajasMotivo(e.target.value)}
                />
              </div>
              <div>
                <Label>Unidades Motivo</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={unidadesMotivo}
                  onChange={(e) => setUnidadesMotivo(e.target.value)}
                />
              </div>
              <div>
                <Label>Cantidad Motivo</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={cantidadMotivo}
                  onChange={(e) => setCantidadMotivo(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-11 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {isLoading
                  ? "Guardando..."
                  : success
                  ? "Listo!"
                  : item
                  ? "Actualizar"
                  : "Registrar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
