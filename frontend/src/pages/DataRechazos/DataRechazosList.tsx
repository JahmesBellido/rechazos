import { useState, useEffect, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import DataRechazosForm from "./DataRechazosForm";
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
  cajas_final: number | null;
  documentos_finales: number | null;
  liquidacion_final: number | null;
  fecha_rechazo: string | null;
  nombres: string;
  apellidos: string;
  placa: string | null;
  ruta: string | null;
  created_at: string;
}

import { API_URL } from "../../config/api";

export default function DataRechazosList() {
  const [rechazos, setRechazos] = useState<Rechazo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRechazo, setEditingRechazo] = useState<Rechazo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [importResult, setImportResult] = useState<{ message: string; errors: string[]; cajas?: number; unidades?: number } | null>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    if (dateRef.current) {
      dateRef.current.placeholder = "Filtrar por fecha...";
      fpRef.current = flatpickr(dateRef.current, {
        dateFormat: "Y-m-d",
        locale: Spanish,
        altInput: true,
        altFormat: "d/m/Y",
        onChange: (_dates, dateStr) => {
          setFechaFiltro(dateStr);
        },
      });
    }
    return () => { fpRef.current?.destroy(); };
  }, []);

  const fetchRechazos = async (query?: string) => {
    try {
      let url = `${API_URL}/rechazos`;
      const params = new URLSearchParams();
      if (query) params.append("search", query);
      if (fechaFiltro) params.append("fecha", fechaFiltro);
      const qs = params.toString();
      if (qs) url += `?${qs}`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRechazos(data.rechazos);
      }
    } catch (error) {
      console.error("Error fetching rechazos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRechazos();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRechazos(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, fechaFiltro]);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/rechazos/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setRechazos(rechazos.filter((r) => r.id !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Error deleting rechazo:", error);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingRechazo(null);
    fetchRechazos(search);
  };

  const handleEdit = (rechazo: Rechazo) => {
    setEditingRechazo(rechazo);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRechazo(null);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/rechazos/import`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      setImportResult({ message: data.message || data.message, errors: data.errors || [], cajas: data.cajas || 0, unidades: data.unidades || 0 });
      if (res.ok) fetchRechazos(search);
    } catch {
      setImportResult({ message: "Error de conexión", errors: [] });
    }
    e.target.value = "";
  };

  return (
    <>
      <PageMeta
        title="Data Rechazos | Embid Distribuidora S.A.C"
        description="Gestión de rechazos"
      />
      <PageBreadcrumb pageTitle="Data Rechazos" />
      <div className="space-y-6">
        <ComponentCard title="Rechazos">
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-80">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg
                    className="fill-gray-500 dark:fill-gray-400"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                      fill=""
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Buscar rechazos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                />
              </div>
              <div className="relative w-full sm:w-48">
                <input
                  ref={dateRef}
                  type="text"
                  placeholder="Filtrar por fecha..."
                  className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                />
              </div>
              {fechaFiltro && (
                <button
                  onClick={() => {
                    setFechaFiltro("");
                    fpRef.current?.clear();
                  }}
                  className="h-11 px-3 text-sm text-gray-500 hover:text-error-500 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Limpiar fecha
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div>
                <label className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-success-700 bg-success-500/10 border border-success-500/20 rounded-lg cursor-pointer hover:bg-success-500/20 transition-colors dark:text-success-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Importar Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleImport}
                  />
                </label>
                <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">Columnas: codigo, cantidad_rechazada, cant_documentos_rechazados, cajas, unidades, fecha</p>
              </div>
              <Button
                onClick={() => {
                  setEditingRechazo(null);
                  setShowForm(true);
                }}
                size="sm"
              >
                + Nuevo Rechazo
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Código
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Transportista
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Cant. Rechazada
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Total Rechazo
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Doc. Rechazados
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Cajas
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Unidades
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Cajas Final
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Doc. Finales
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Liq. Final
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Fecha
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {rechazos.length === 0 ? (
                      <TableRow>
                        <TableCell className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                          No se encontraron rechazos
                        </TableCell>
                      </TableRow>
                    ) : (
                      rechazos.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="px-5 py-4 sm:px-6 text-start">
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {r.codigo_identificador}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {r.nombres} {r.apellidos}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {r.cantidad_rechazada != null ? `S/ ${Number(r.cantidad_rechazada).toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-error-600 dark:text-error-400">
                            {r.total_rechazo != null ? `S/ ${Number(r.total_rechazo).toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {r.cant_documentos_rechazados ?? "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {r.cajas_fisicas ?? "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {r.unidades_fisicas ?? "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-blue-600 dark:text-blue-400">
                            {r.cajas_final ?? "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-success-600 dark:text-success-400">
                            {r.documentos_finales ?? "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-brand-600 dark:text-brand-400">
                            {r.liquidacion_final != null ? `S/ ${Number(r.liquidacion_final).toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm">
                            {r.fecha_rechazo ? (() => {
                              const raw = String(r.fecha_rechazo).split("T")[0];
                              const parts = raw.split("-");
                              if (parts.length !== 3) return <span className="text-gray-500">{raw}</span>;
                              return <span className="text-gray-500 dark:text-gray-400">{parts[2]}/{parts[1]}/{parts[0]}</span>;
                            })() : "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(r)}
                                className="p-1.5 text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {deleteConfirm === r.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(r.id)}
                                    className="px-2 py-1 text-xs text-white bg-error-500 rounded hover:bg-error-600"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-2 py-1 text-xs text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(r.id)}
                                  className="p-1.5 text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-400"
                                  title="Eliminar"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>

      {showForm && (
        <DataRechazosForm
          rechazo={editingRechazo}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}

      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl dark:bg-gray-900">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Resultado de importación</h2>
                <button onClick={() => setImportResult(null)} className="p-1.5 text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 p-4 mb-4 bg-success-500/10 border border-success-500/20 rounded-xl">
                <svg className="w-6 h-6 text-success-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-success-700 dark:text-success-400">{importResult.message}</span>
              </div>
              {(importResult.cajas ?? 0) > 0 || (importResult.unidades ?? 0) > 0 ? (
                <div className="flex items-center gap-4 p-4 mb-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <div className="text-sm text-blue-700 dark:text-blue-400">
                    <span className="font-medium">Cajas Físicas:</span>{" "}
                    <span className="font-bold">{importResult.cajas ?? 0}</span> cajas |{" "}
                    <span className="font-bold">{importResult.unidades ?? 0}</span> unidades
                  </div>
                </div>
              ) : null}
              {importResult.errors.length > 0 && (
                <div className="p-4 bg-warning-500/10 border border-warning-500/20 rounded-xl">
                  <p className="text-sm font-medium text-warning-700 dark:text-warning-400 mb-2">Errores encontrados:</p>
                  <ul className="text-xs text-warning-600 dark:text-warning-400 space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>- {err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={() => setImportResult(null)}
                className="w-full mt-4 h-10 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
