import { useState, useEffect, useRef } from "react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { Spanish } from "flatpickr/dist/l10n/es";

interface Rechazo {
  id: number;
  codigo_identificador: string;
  cantidad_rechazada: number | null;
  total_rechazo: number | null;
  cant_documentos_rechazados: number | null;
  cajas_fisicas: number | null;
  unidades_fisicas: number | null;
  documentos_finales: number | null;
  fecha_rechazo: string | null;
}

interface Transportista {
  id: number;
  codigo_identificador: string;
  nombres: string;
  apellidos: string;
}

interface RechazoFormProps {
  rechazo: Rechazo | null;
  onClose: () => void;
  onSave: () => void;
}

import { API_URL } from "../../config/api";

export default function DataRechazosForm({ rechazo, onClose, onSave }: RechazoFormProps) {
  const [transportistas, setTransportistas] = useState<Transportista[]>([]);
  const [codigoIdentificador, setCodigoIdentificador] = useState("");
  const [cantidadRechazada, setCantidadRechazada] = useState("");
  const [cantRechazados, setCantRechazados] = useState("");
  const [cajasFisicas, setCajasFisicas] = useState("");
  const [unidadesFisicas, setUnidadesFisicas] = useState("");
  const [fechaRechazo, setFechaRechazo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);

  const totalRechazo = Number(cantidadRechazada || 0) * 1.02;

  useEffect(() => {
    const fetchTransportistas = async () => {
      try {
        const res = await fetch(`${API_URL}/transportistas`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setTransportistas(data.transportistas);
        }
      } catch (error) {
        console.error("Error fetching transportistas:", error);
      }
    };
    fetchTransportistas();
  }, []);

  useEffect(() => {
    if (rechazo) {
      setCodigoIdentificador(rechazo.codigo_identificador);
      setCantidadRechazada(rechazo.cantidad_rechazada?.toString() || "");
      setCantRechazados(rechazo.cant_documentos_rechazados?.toString() || "");
      setCajasFisicas(rechazo.cajas_fisicas?.toString() || "");
      setUnidadesFisicas(rechazo.unidades_fisicas?.toString() || "");
      const fecha = rechazo.fecha_rechazo ? String(rechazo.fecha_rechazo).split("T")[0] : "";
      setFechaRechazo(fecha);
      if (fpRef.current && fecha) {
        fpRef.current.setDate(fecha, true);
      }
    }
  }, [rechazo]);

  useEffect(() => {
    if (dateRef.current) {
      fpRef.current = flatpickr(dateRef.current, {
        dateFormat: "Y-m-d",
        locale: Spanish,
        onChange: (_dates, dateStr) => {
          setFechaRechazo(dateStr);
        },
      });
    }
    return () => { fpRef.current?.destroy(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const body = {
        codigo_identificador: codigoIdentificador,
        cantidad_rechazada: Number(cantidadRechazada) || 0,
        cant_documentos_rechazados: Number(cantRechazados) || 0,
        cajas_fisicas: Number(cajasFisicas) || 0,
        unidades_fisicas: Number(unidadesFisicas) || 0,
        fecha_rechazo: fechaRechazo || null,
      };

      const url = rechazo ? `${API_URL}/rechazos/${rechazo.id}` : `${API_URL}/rechazos`;
      const method = rechazo ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(rechazo ? "Rechazo actualizado correctamente" : "Rechazo creado correctamente");
        setTimeout(() => {
          onSave();
        }, 1500);
      } else {
        setError(data.message || "Error al guardar rechazo");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl mx-4 mb-10 bg-white rounded-2xl shadow-2xl dark:bg-gray-900">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {rechazo ? "Editar Rechazo" : "Nuevo Rechazo"}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 text-sm text-error-500 bg-error-500/10 border border-error-500/20 rounded-xl">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 mb-4 text-sm text-success-500 bg-success-500/10 border border-success-500/20 rounded-xl">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          <div className="mb-3">
            <Label>Código Transportista *</Label>
            <select
              value={codigoIdentificador}
              onChange={(e) => setCodigoIdentificador(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
              required
            >
              <option value="">Seleccionar transportista</option>
              {transportistas.map((t) => (
                <option key={t.codigo_identificador} value={t.codigo_identificador}>
                  {t.codigo_identificador} - {t.nombres} {t.apellidos}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <Label>Cant. Documentos Rechazados *</Label>
            <Input
              type="number"
              placeholder="0"
              value={cantRechazados}
              onChange={(e) => setCantRechazados(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <Label>Cajas Físicas</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500">Cajas</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={cajasFisicas}
                  onChange={(e) => setCajasFisicas(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Unidades</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={unidadesFisicas}
                  onChange={(e) => setUnidadesFisicas(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <Label>Cant. Rechazada (S/) *</Label>
            <Input
              type="number"
              step={0.01}
              placeholder="0.00"
              value={cantidadRechazada}
              onChange={(e) => setCantidadRechazada(e.target.value)}
            />
          </div>

          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-1">
            <div className="flex justify-between">
              <Label>Total Rechazo (2% percepción)</Label>
              <span className="text-sm font-semibold text-error-600 dark:text-error-400">S/ {totalRechazo.toFixed(2)}</span>
            </div>
          </div>

          <div className="mb-3">
            <Label>Fecha de Rechazo *</Label>
            <input
              ref={dateRef}
              type="text"
              placeholder="Seleccionar fecha..."
              className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              required
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !!success} className="flex-1">
              {isLoading ? "Guardando..." : success ? "¡Listo!" : rechazo ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
