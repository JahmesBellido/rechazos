import { useState, useEffect } from "react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

interface Transportista {
  id: number;
  codigo_identificador: string;
  nombres: string;
  apellidos: string;
  carga: string | null;
  liquidacion_programada: number | null;
  cant_documentos: number | null;
}

interface Documento {
  id: number;
  codigo_identificador: string;
  carga: string | null;
  liquidacion_programada: number | null;
  cant_documentos: number | null;
  cargas_programadas: number | null;
  unidades_programadas: number | null;
  fecha_documentos: string | null;
}

interface DataFormProps {
  documento: Documento | null;
  onClose: () => void;
  onSave: () => void;
}

import { API_URL } from "../../config/api";

export default function DataForm({ documento, onClose, onSave }: DataFormProps) {
  const [transportistas, setTransportistas] = useState<Transportista[]>([]);
  const [loadingTransportistas, setLoadingTransportistas] = useState(true);
  const [codigoIdentificador, setCodigoIdentificador] = useState("");
  const [carga, setCarga] = useState("");
  const [liquidacionProgramada, setLiquidacionProgramada] = useState("");
  const [cantDocumentos, setCantDocumentos] = useState("");
  const [cargasProgramadas, setCargasProgramadas] = useState("");
  const [unidadesProgramadas, setUnidadesProgramadas] = useState("");
  const [fechaDocumentos, setFechaDocumentos] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTransportistas = async () => {
      try {
        const res = await fetch(`${API_URL}/transportistas`, { credentials: "include" });
        if (!res.ok) {
          console.error("Error HTTP:", res.status);
          setTransportistas([]);
        } else {
          const data = await res.json();
          setTransportistas(data.transportistas || []);
        }
      } catch (err) {
        console.error("Error fetching transportistas:", err);
        setTransportistas([]);
      } finally {
        setLoadingTransportistas(false);
      }
    };
    fetchTransportistas();
  }, []);

  useEffect(() => {
    if (documento) {
      setCodigoIdentificador(documento.codigo_identificador);
      setCarga(documento.carga || "");
      setLiquidacionProgramada(documento.liquidacion_programada?.toString() || "");
      setCantDocumentos(documento.cant_documentos?.toString() || "");
      setCargasProgramadas(documento.cargas_programadas?.toString() || "");
      setUnidadesProgramadas(documento.unidades_programadas?.toString() || "");
      setFechaDocumentos(documento.fecha_documentos ? documento.fecha_documentos.split("T")[0] : "");
    }
  }, [documento]);

  const handleCodigoChange = (codigo: string) => {
    setCodigoIdentificador(codigo);
    const found = transportistas.find((t) => t.codigo_identificador === codigo);
    if (found) {
      setCarga(found.carga || "");
      setLiquidacionProgramada(found.liquidacion_programada?.toString() || "");
      setCantDocumentos(found.cant_documentos?.toString() || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const body = {
        codigo_identificador: codigoIdentificador,
        carga: carga || null,
        liquidacion_programada: liquidacionProgramada ? parseFloat(liquidacionProgramada) : null,
        cant_documentos: cantDocumentos ? parseInt(cantDocumentos) : null,
        cargas_programadas: cargasProgramadas ? parseInt(cargasProgramadas) : null,
        unidades_programadas: unidadesProgramadas ? parseInt(unidadesProgramadas) : null,
        fecha_documentos: fechaDocumentos || null,
      };

      const url = documento ? `${API_URL}/documentos/${documento.id}` : `${API_URL}/documentos`;
      const method = documento ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(documento ? "Documento actualizado correctamente" : "Documento creado correctamente");
        setTimeout(() => {
          onSave();
        }, 1500);
      } else {
        setError(data.message || "Error al guardar documento");
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
              {documento ? "Editar Documento" : "Nuevo Documento"}
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
            <Label>Código Identificador *</Label>
            {loadingTransportistas ? (
              <div className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <select
                value={codigoIdentificador}
                onChange={(e) => handleCodigoChange(e.target.value)}
                required
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">Seleccionar transportista...</option>
                {transportistas.map((t) => (
                  <option key={t.id} value={t.codigo_identificador}>
                    {t.codigo_identificador} - {t.nombres} {t.apellidos}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mb-3">
            <Label>Carga</Label>
            <Input
              type="text"
              placeholder="Ej: 6007A"
              value={carga}
              onChange={(e) => setCarga(e.target.value.toUpperCase())}
            />
          </div>

          <div className="mb-3">
            <Label>Liquidación Programada</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={liquidacionProgramada}
              onChange={(e) => setLiquidacionProgramada(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <Label>Cantidad de Documentos</Label>
            <Input
              type="number"
              placeholder="0"
              value={cantDocumentos}
              onChange={(e) => setCantDocumentos(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <Label>Cargas Programadas</Label>
              <Input
                type="number"
                placeholder="0"
                value={cargasProgramadas}
                onChange={(e) => setCargasProgramadas(e.target.value)}
              />
            </div>
            <div>
              <Label>Unidades Programadas</Label>
              <Input
                type="number"
                placeholder="0"
                value={unidadesProgramadas}
                onChange={(e) => setUnidadesProgramadas(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <Label>Fecha Documentos</Label>
            <Input
              type="date"
              value={fechaDocumentos}
              onChange={(e) => setFechaDocumentos(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !!success} className="flex-1">
              {isLoading ? "Guardando..." : success ? "¡Listo!" : documento ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
