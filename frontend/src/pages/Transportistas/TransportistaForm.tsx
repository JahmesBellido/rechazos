import { useState, useEffect } from "react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

interface Transportista {
  id: number;
  nombres: string;
  apellidos: string;
  codigo_identificador: string;
  placa: string | null;
  ruta: string | null;
}

interface TransportistaFormProps {
  transportista: Transportista | null;
  onClose: () => void;
  onSave: () => void;
}

import { API_URL } from "../../config/api";

export default function TransportistaForm({ transportista, onClose, onSave }: TransportistaFormProps) {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [codigoIdentificador, setCodigoIdentificador] = useState("");
  const [placa, setPlaca] = useState("");
  const [ruta, setRuta] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (transportista) {
      setNombres(transportista.nombres);
      setApellidos(transportista.apellidos);
      setCodigoIdentificador(transportista.codigo_identificador);
      setPlaca(transportista.placa || "");
      setRuta(transportista.ruta || "");
    }
  }, [transportista]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const body = {
        nombres,
        apellidos,
        codigo_identificador: codigoIdentificador,
        placa: placa || null,
        ruta: ruta || null,
      };

      const url = transportista ? `${API_URL}/transportistas/${transportista.id}` : `${API_URL}/transportistas`;
      const method = transportista ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(transportista ? "Transportista actualizado correctamente" : "Transportista creado correctamente");
        setTimeout(() => {
          onSave();
        }, 1500);
      } else {
        setError(data.message || "Error al guardar transportista");
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
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {transportista ? "Editar Transportista" : "Nuevo Transportista"}
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

        {/* Form */}
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

          {/* Nombres & Apellidos */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label>Nombres *</Label>
              <Input
                type="text"
                placeholder="Nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
              />
            </div>
            <div>
              <Label>Apellidos *</Label>
              <Input
                type="text"
                placeholder="Apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
              />
            </div>
          </div>

          {/* Código Identificador */}
          <div className="mb-3">
            <Label>Código Identificador *</Label>
            <Input
              type="text"
              placeholder="Ej: eldward 6012"
              value={codigoIdentificador}
              onChange={(e) => setCodigoIdentificador(e.target.value)}
            />
          </div>

          {/* Placa */}
          <div className="mb-3">
            <Label>Placa</Label>
            <Input
              type="text"
              placeholder="Ej: ABC-123"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
            />
          </div>

          {/* Ruta */}
          <div className="mb-3">
            <Label>Ruta</Label>
            <Input
              type="text"
              placeholder="Ej: Juliaca"
              value={ruta}
              onChange={(e) => setRuta(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !!success} className="flex-1">
              {isLoading ? "Guardando..." : success ? "¡Listo!" : transportista ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
