import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useAuth } from "../../context/AuthContext";
import DatePicker from "../../components/form/date-picker";
import { asset } from "../../utils/asset";

import { API_URL } from "../../config/api";

const getDefaultDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

interface TransportistaRechazo {
  codigo_identificador: string;
  nombres: string;
  apellidos: string;
  total_liq: number;
  total_rechazo: number;
  docs_rechazados: number;
  porcentaje_rechazo: number;
}

interface LiquidacionDiaria {
  fecha: string;
  codigo_identificador: string;
  nombres: string;
  apellidos: string;
  total_liq: number;
  total_rechazo: number;
  docs_rechazados: number;
  total_cajas: number;
  total_unidades: number;
  porcentaje_rechazo: number;
}

interface TopCajasItem {
  codigo_identificador: string;
  nombres: string;
  apellidos: string;
  cajas_fisicas: number;
  cargas_programadas: number;
  porcentaje_cajas: number;
}

interface RechazoMinimoItem {
  codigo_identificador: string;
  nombres: string;
  apellidos: string;
  cargas_programadas: number;
  unidades_programadas: number;
  cajas_fisicas: number;
  unidades_fisicas: number;
  porcentaje_cajas: number;
}

interface DashboardData {
  transportistas: TransportistaRechazo[];
  liquidacionDiaria: LiquidacionDiaria[];
  fecha: string;
  totalCajasDia: number;
  totalUnidadesDia: number;
  totalCargasProgramadas: number;
  totalUnidadesProgramadas: number;
}

interface TopMotivo {
  motivo: string;
  cantidad: number;
  total_importe: number;
  porcentaje: string;
}

interface MotivosData {
  motivos: TopMotivo[];
  fecha: string;
}

const formatMoney = (val: number) =>
  `S/ ${val.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getPorcentajeColor = (pct: number) => {
  if (pct >= 12) return { bg: "bg-red-500", text: "text-red-600", bar: "bg-red-500", border: "border-red-400 dark:border-red-500/50", glow: "shadow-red-500/20", ring: "ring-red-500/30" };
  if (pct >= 6) return { bg: "bg-orange-500", text: "text-orange-600", bar: "bg-orange-500", border: "border-orange-400 dark:border-orange-500/50", glow: "shadow-orange-500/20", ring: "ring-orange-500/30" };
  if (pct >= 3) return { bg: "bg-yellow-500", text: "text-yellow-600", bar: "bg-yellow-500", border: "border-yellow-400 dark:border-yellow-500/50", glow: "shadow-yellow-500/10", ring: "ring-yellow-500/30" };
  return { bg: "bg-green-500", text: "text-green-600", bar: "bg-green-500", border: "border-gray-200 dark:border-gray-800", glow: "", ring: "" };
};

export default function Home() {
  const { user } = useAuth();
  const [transportistas, setTransportistas] = useState<TransportistaRechazo[]>([]);
  const [liquidacionDiaria, setLiquidacionDiaria] = useState<LiquidacionDiaria[]>([]);
  const [fecha, setFecha] = useState(getDefaultDate());
  const [loading, setLoading] = useState(true);
  const [topMotivos, setTopMotivos] = useState<TopMotivo[]>([]);
  const [totalCajasDia, setTotalCajasDia] = useState(0);
  const [totalUnidadesDia, setTotalUnidadesDia] = useState(0);
  const [totalCargasProgramadas, setTotalCargasProgramadas] = useState(0);
  const [totalUnidadesProgramadas, setTotalUnidadesProgramadas] = useState(0);
  const [topCajas, setTopCajas] = useState<TopCajasItem[]>([]);
  const [listaRechazoMinimo, setListaRechazoMinimo] = useState<RechazoMinimoItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [res, motivosRes, topCajasRes, minimoRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/home-rechazos?fecha=${fecha}`, { credentials: "include" }),
          fetch(`${API_URL}/dashboard/top-5-motivos?fecha=${fecha}`, { credentials: "include" }),
          fetch(`${API_URL}/dashboard/top-10-cajas?fecha=${fecha}`, { credentials: "include" }),
          fetch(`${API_URL}/dashboard/rechazo-minimo-cajas?fecha=${fecha}`, { credentials: "include" })
        ]);
        if (res.ok) {
          const data: DashboardData = await res.json();
          setTransportistas(data.transportistas || []);
          setLiquidacionDiaria(data.liquidacionDiaria || []);
          setFecha(data.fecha || fecha);
          setTotalCajasDia(data.totalCajasDia || 0);
          setTotalUnidadesDia(data.totalUnidadesDia || 0);
          setTotalCargasProgramadas(data.totalCargasProgramadas || 0);
          setTotalUnidadesProgramadas(data.totalUnidadesProgramadas || 0);
        }
        if (motivosRes.ok) {
          const data: MotivosData = await motivosRes.json();
          setTopMotivos(data.motivos || []);
        }
        if (topCajasRes.ok) {
          const data = await topCajasRes.json();
          setTopCajas(data.data || []);
        }
        if (minimoRes.ok) {
          const data = await minimoRes.json();
          setListaRechazoMinimo(data.data || []);
        }
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fecha]);

  const handleDateChange = (selectedDates: Date[] | Date | undefined) => {
    if (selectedDates) {
      const date = Array.isArray(selectedDates) ? selectedDates[0] : selectedDates;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      setFecha(`${year}-${month}-${day}`);
    }
  };

  const fechaFmt = fecha ? (() => {
    const parts = fecha.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : fecha;
  })() : "";

  const totalLiq = transportistas.reduce((s, t) => s + Number(t.total_liq), 0);
  const totalRechazado = transportistas.reduce((s, t) => s + Number(t.total_rechazo), 0);
  const porcentajeGlobal = totalLiq > 0 ? ((totalRechazado / totalLiq) * 100).toFixed(2) : "0.00";
  const porcentajeCajasFisicas = totalCargasProgramadas > 0 ? ((totalCajasDia / totalCargasProgramadas) * 100).toFixed(1) : "0.0";

  const topCajasCodigos = new Set(topCajas.map((c) => c.codigo_identificador));
  const rechazoMinimo = listaRechazoMinimo.filter((r) => !topCajasCodigos.has(r.codigo_identificador));
  const totalCajasMin = rechazoMinimo.reduce((s, r) => s + Number(r.cajas_fisicas), 0);
  const totalUnidadesMin = rechazoMinimo.reduce((s, r) => s + Number(r.unidades_fisicas), 0);
  const totalCargasMin = rechazoMinimo.reduce((s, r) => s + Number(r.cargas_programadas), 0);
  const totalUnidadesProgMin = rechazoMinimo.reduce((s, r) => s + Number(r.unidades_programadas), 0);
  const pctMinGlobal = totalCargasMin > 0 ? ((totalCajasMin / totalCargasMin) * 100).toFixed(2) : "0.00";
  const maxPctMin = rechazoMinimo.length > 0 ? Math.max(...rechazoMinimo.map((r) => Number(r.porcentaje_cajas)), 0.5) : 0.5;

  return (
    <>
      <PageMeta
        title="Inicio | Embid Distribuidora S.A.C"
        description="Panel de administracion"
      />
      <PageBreadcrumb pageTitle="Inicio" />
      <div className="space-y-6">

        {/* Welcome Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90">
                Bienvenido al Sistema
              </h1>
              <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                Hola, {user?.fname} {user?.lname}. Has iniciado sesion correctamente.
              </p>
              {fechaFmt && (
                <p className="mt-3 text-base font-medium text-brand-600 dark:text-brand-400">
                  Datos del dia: {fechaFmt}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <DatePicker
                id="fecha-selector-home"
                defaultDate={parseDateString(fecha)}
                onChange={handleDateChange}
                placeholder="Seleccionar fecha"
                label="Fecha"
              />
              <button
                onClick={() => window.open(`${API_URL}/dashboard/export-excel?fecha=${fecha}`, "_blank")}
                className="inline-flex items-center gap-2 h-12 px-6 text-base font-medium text-white bg-success-500 rounded-lg hover:bg-success-600 transition-colors shadow-lg shadow-success-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar informacion Excel
              </button>
              <div className="w-20 h-20 overflow-hidden rounded-full">
                <img
                  width={80}
                  height={80}
                  src={user?.avatar || asset("images/user/owner.jpg")}
                  alt={`${user?.fname} ${user?.lname}`}
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* KPI Resumen */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              {/* 1. Total Liquidacion */}
              <div className="rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-5 text-white shadow-lg shadow-violet-500/25">
                <p className="text-[11px] font-bold text-violet-100 uppercase tracking-wider">Total Liquidacion</p>
                <p className="text-2xl font-black mt-1 text-white drop-shadow-sm">{formatMoney(totalLiq)}</p>
                <div className="mt-3">
                  <div className="w-full h-2 bg-violet-300/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white/90 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                  <p className="text-[10px] font-bold text-violet-200 mt-1 text-right">100%</p>
                </div>
              </div>
              {/* 2. Total Rechazado */}
              <div className="rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-red-500 p-5 text-white shadow-lg shadow-rose-500/25">
                <p className="text-[11px] font-bold text-rose-100 uppercase tracking-wider">Total Rechazado</p>
                <p className="text-2xl font-black mt-1 text-white drop-shadow-sm">{formatMoney(totalRechazado)}</p>
                <div className="mt-3">
                  <div className="w-full h-2 bg-rose-300/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white/90 rounded-full transition-all duration-700" style={{ width: `${Math.min(Number(porcentajeGlobal), 100)}%` }}></div>
                  </div>
                  <p className="text-[10px] font-bold text-rose-200 mt-1 text-right">{porcentajeGlobal}% del total</p>
                </div>
              </div>
              {/* 3. % Rechazo Global */}
              <div className={`rounded-2xl p-5 shadow-lg transition-all ${
                Number(porcentajeGlobal) >= 15
                  ? "bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 shadow-red-500/30"
                  : Number(porcentajeGlobal) >= 8
                  ? "bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-400 shadow-amber-500/30"
                  : "bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 shadow-emerald-500/30"
              } text-white`}>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${
                  Number(porcentajeGlobal) >= 15
                    ? "text-red-100"
                    : Number(porcentajeGlobal) >= 8
                    ? "text-amber-100"
                    : "text-emerald-100"
                }`}>% Rechazo Global</p>
                <div className="flex items-center gap-2 mt-1">
                  {Number(porcentajeGlobal) >= 15 && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                  )}
                  <p className="font-black text-2xl text-white drop-shadow-sm">{porcentajeGlobal}%</p>
                </div>
                <div className="mt-3">
                  <div className={`w-full h-2 rounded-full overflow-hidden ${
                    Number(porcentajeGlobal) >= 15
                      ? "bg-red-300/30"
                      : Number(porcentajeGlobal) >= 8
                      ? "bg-amber-300/30"
                      : "bg-emerald-300/30"
                  }`}>
                    <div className="h-full bg-white/90 rounded-full transition-all duration-700" style={{ width: `${Math.min(Number(porcentajeGlobal), 100)}%` }}></div>
                  </div>
                </div>
              </div>
              {/* 4. Cargas Programadas */}
              <div className="rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 p-5 text-white shadow-lg shadow-cyan-500/25">
                <p className="text-[11px] font-bold text-cyan-100 uppercase tracking-wider">Cargas Programadas</p>
                <div className="mt-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-cyan-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-xs font-bold text-white">
                      {totalCargasProgramadas.toLocaleString("es-PE")} <span className="font-semibold text-cyan-100">cajas</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-cyan-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-xs font-bold text-white">
                      {totalUnidadesProgramadas.toLocaleString("es-PE")} <span className="font-semibold text-cyan-100">unidades</span>
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-cyan-300/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white/90 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                  <p className="text-[10px] font-bold text-cyan-200 mt-1 text-right">100% programado</p>
                </div>
              </div>
              {/* 5. Cargas Fisicas Rechazadas */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-5 text-white shadow-lg shadow-blue-500/25">
                <p className="text-[11px] font-bold text-blue-100 uppercase tracking-wider">Cargas Fisicas Rechazadas</p>
                <div className="mt-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-blue-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-xs font-bold text-white">
                      {totalCajasDia.toLocaleString("es-PE")} <span className="font-semibold text-blue-100">cajas</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-blue-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-xs font-bold text-white">
                      {totalUnidadesDia.toLocaleString("es-PE")} <span className="font-semibold text-blue-100">unidades</span>
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-blue-300/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white/90 rounded-full" style={{ width: `${totalCargasProgramadas > 0 ? Math.min((totalCajasDia / totalCargasProgramadas) * 100, 100) : 0}%` }}></div>
                  </div>
                  <p className="text-[10px] font-bold text-blue-200 mt-1 text-right">{totalCargasProgramadas > 0 ? ((totalCajasDia / totalCargasProgramadas) * 100).toFixed(1) : 0}% del programado</p>
                </div>
              </div>
              {/* 6. % Cajas Fisicas */}
              <div className={`rounded-2xl p-5 shadow-lg text-white transition-all ${
                Number(porcentajeCajasFisicas) >= 15
                  ? "bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 shadow-red-500/30"
                  : Number(porcentajeCajasFisicas) >= 8
                  ? "bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-400 shadow-amber-500/30"
                  : "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-blue-500/30"
              }`}>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${
                  Number(porcentajeCajasFisicas) >= 15
                    ? "text-red-100"
                    : Number(porcentajeCajasFisicas) >= 8
                    ? "text-amber-100"
                    : "text-blue-100"
                }`}>% Cajas Fisicas</p>
                <div className="flex items-center gap-2 mt-1">
                  {Number(porcentajeCajasFisicas) >= 15 && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                  )}
                  <p className="font-black text-2xl text-white drop-shadow-sm">{porcentajeCajasFisicas}%</p>
                </div>
                <div className="mt-3">
                  <div className={`w-full h-2 rounded-full overflow-hidden ${
                    Number(porcentajeCajasFisicas) >= 15
                      ? "bg-red-300/30"
                      : Number(porcentajeCajasFisicas) >= 8
                      ? "bg-amber-300/30"
                      : "bg-blue-300/30"
                  }`}>
                    <div className="h-full bg-white/90 rounded-full transition-all duration-700" style={{ width: `${Math.min(Number(porcentajeCajasFisicas), 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top 10 Transportistas segun Cajas Fisicas */}
            <div>
              <h2 className="text-2xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
                Top 10 transportistas con mas rechazos segun cajas fisicas
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </h2>
              {topCajas.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 mb-6">
                  <div className="flex items-center justify-between flex-wrap gap-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-800 dark:text-white/90">Cajas Fisicas Rechazadas</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Top 10 transportistas con mas rechazos segun cajas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">Cajas Fisicas</p>
                        <div className="flex items-center justify-end gap-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <p className="text-2xl font-bold text-blue-600">{totalCajasDia.toLocaleString("es-PE")}</p>
                          <span className="text-xs text-blue-400">cajas</span>
                          <p className="text-2xl font-bold text-blue-600">{totalUnidadesDia.toLocaleString("es-PE")}</p>
                          <span className="text-xs text-blue-400">uds</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">Programadas</p>
                        <div className="flex items-center justify-end gap-2">
                          <p className="text-lg font-bold text-gray-600 dark:text-gray-300">{totalCargasProgramadas.toLocaleString("es-PE")}</p>
                          <span className="text-xs text-gray-400">cajas</span>
                          <p className="text-lg font-bold text-gray-600 dark:text-gray-300">{totalUnidadesProgramadas.toLocaleString("es-PE")}</p>
                          <span className="text-xs text-gray-400">uds</span>
                        </div>
                      </div>
                      <div className={`px-5 py-3 rounded-xl ${
                        Number(porcentajeCajasFisicas) >= 15
                          ? "bg-red-500/10 border border-red-400"
                          : Number(porcentajeCajasFisicas) >= 8
                          ? "bg-amber-500/10 border border-amber-400"
                          : "bg-blue-500/10 border border-blue-400"
                      }`}>
                        <p className={`text-xl font-extrabold ${
                          Number(porcentajeCajasFisicas) >= 15
                            ? "text-red-600"
                            : Number(porcentajeCajasFisicas) >= 8
                            ? "text-amber-600"
                            : "text-blue-600"
                        }`}>{porcentajeCajasFisicas}%</p>
                      </div>
                    </div>
                  </div>
                  {/* Barra resumen general de cajas */}
                  {totalCargasProgramadas > 0 && (
                    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        {totalCajasDia < totalCargasProgramadas && (
                          <div
                            className="h-full bg-success-500 flex items-center justify-center transition-all duration-700"
                            style={{ width: `${((totalCargasProgramadas - totalCajasDia) / totalCargasProgramadas) * 100}%` }}
                          >
                            <span className="text-[10px] font-semibold text-white drop-shadow-sm whitespace-nowrap">
                              {((totalCargasProgramadas - totalCajasDia) / totalCargasProgramadas * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                        {totalCajasDia > 0 && (
                          <div
                            className="h-full bg-error-500 flex items-center justify-center transition-all duration-700"
                            style={{ width: `${(totalCajasDia / totalCargasProgramadas) * 100}%` }}
                          >
                            <span className="text-[10px] font-semibold text-white drop-shadow-sm whitespace-nowrap">
                              {(totalCajasDia / totalCargasProgramadas * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm font-medium text-success-600">{(totalCargasProgramadas - totalCajasDia).toLocaleString("es-PE")} cajas entregadas</span>
                        <span className="text-sm font-medium text-error-600">{totalCajasDia.toLocaleString("es-PE")} cajas rechazadas</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {topCajas.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
                  <p className="text-gray-400">No hay datos de cajas fisicas para esta fecha</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                  <div className="space-y-3">
                    {topCajas.map((item, idx) => {
                      const pct = Number(item.porcentaje_cajas);
                      const cargas = Number(item.cargas_programadas);
                      const cajas = Number(item.cajas_fisicas);
                      const colors = getPorcentajeColor(pct);
                      const isCritico = pct >= 12;
                      const isHigh = pct >= 6;

                      return (
                        <div key={idx} className={`group relative rounded-xl p-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-gray-300/40 dark:hover:shadow-black/30 ${
                          isCritico ? "bg-red-50/80 dark:bg-red-500/5 border border-red-200/50 dark:border-red-500/20" :
                          isHigh ? "bg-orange-50/50 dark:bg-orange-500/3 border border-orange-200/30 dark:border-orange-500/10" :
                          "bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100/50 dark:hover:bg-white/[0.04]"
                        }`}>
                          <div className="flex items-center gap-4">
                            {/* Ranking + Codigo */}
                            <div className="w-[180px] shrink-0">
                              <div className="flex items-center gap-2">
                                <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 ${
                                  idx === 0 ? "bg-red-500 text-white" :
                                  idx === 1 ? "bg-orange-500 text-white" :
                                  idx === 2 ? "bg-yellow-500 text-white" :
                                  "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                }`}>
                                  {idx + 1}
                                </span>
                                {isCritico && (
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                  </span>
                                )}
                                <span className="font-bold text-sm text-gray-800 dark:text-white/90 truncate">{item.codigo_identificador}</span>
                              </div>
                              <p className="text-xs text-gray-400 dark:text-gray-500 ml-9 truncate">{item.nombres} {item.apellidos}</p>
                            </div>

                            {/* Barra grafica de cajas */}
                            <div className="flex-1 min-w-0">
                              <div className="flex h-7 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                {cargas > 0 && (
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-700 to-cyan-700 flex items-center justify-center transition-all duration-500"
                                    style={{ width: `${Math.max(((cargas - cajas) / cargas) * 100, 5)}%` }}
                                  >
                                    <span className="text-[11px] font-semibold text-white drop-shadow-sm whitespace-nowrap px-2">
                                      {cargas - cajas} cajas entregadas
                                    </span>
                                  </div>
                                )}
                                {cajas > 0 && (
                                  <div
                                    className="h-full bg-gradient-to-r from-orange-700 to-amber-600 flex items-center justify-center transition-all duration-500"
                                    style={{ width: `${Math.max((cajas / cargas) * 100, 5)}%` }}
                                  >
                                    <span className="text-[11px] font-semibold text-white drop-shadow-sm whitespace-nowrap px-2">
                                      {cajas} rechazadas
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-between mt-1.5 px-1">
                                <span className="text-[11px] font-medium text-success-600">{cargas} programadas</span>
                                <span className="text-[11px] font-medium text-error-600">{cajas} fisicas</span>
                              </div>
                            </div>

                            {/* Porcentaje */}
                            <div className={`w-[80px] shrink-0 text-right ${isCritico ? "animate-pulse" : ""}`}>
                              <span className={`text-lg font-extrabold ${colors.text}`}>
                                {pct}%
                              </span>
                              <p className="text-[10px] font-medium text-gray-400">{cajas}/{cargas}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Transportistas con rechazo minimo (menor a 0.5%) segun cajas fisicas */}
            <div>
              <h2 className="text-2xl font-extrabold mb-6 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent flex items-center gap-3">
                Transportistas con rechazo minimo segun cajas fisicas (menor a 0.5%)
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </h2>

              {rechazoMinimo.length === 0 ? (
                <div className={`rounded-2xl border p-10 text-center ${
                  topCajas.length > 0
                    ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/5"
                    : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
                }`}>
                  <p className={topCajas.length > 0 ? "text-sm font-semibold text-emerald-600 dark:text-emerald-400" : "text-gray-400"}>
                    {topCajas.length > 0
                      ? "Ningun transportista quedo con un porcentaje de rechazo menor a 0.5% en cajas fisicas"
                      : "No hay datos de cajas fisicas para esta fecha"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Header resumen rechazo minimo */}
                  <div className="rounded-2xl border border-emerald-200 bg-white dark:border-emerald-500/20 dark:bg-white/[0.03] p-6 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10">
                          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-gray-800 dark:text-white/90">Rechazo Minimo (&lt; 0.5%)</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {rechazoMinimo.length} transportistas con el menor porcentaje de cajas fisicas rechazadas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">Cajas Fisicas</p>
                          <div className="flex items-center justify-end gap-2">
                            <p className="text-2xl font-bold text-emerald-600">{totalCajasMin.toLocaleString("es-PE")}</p>
                            <span className="text-xs text-emerald-400">cajas</span>
                            <p className="text-2xl font-bold text-emerald-600">{totalUnidadesMin.toLocaleString("es-PE")}</p>
                            <span className="text-xs text-emerald-400">uds</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">Programadas</p>
                          <div className="flex items-center justify-end gap-2">
                            <p className="text-lg font-bold text-gray-600 dark:text-gray-300">{totalCargasMin.toLocaleString("es-PE")}</p>
                            <span className="text-xs text-gray-400">cajas</span>
                            <p className="text-lg font-bold text-gray-600 dark:text-gray-300">{totalUnidadesProgMin.toLocaleString("es-PE")}</p>
                            <span className="text-xs text-gray-400">uds</span>
                          </div>
                        </div>
                        <div className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-400">
                          <p className="text-xl font-extrabold text-emerald-600">{pctMinGlobal}%</p>
                        </div>
                      </div>
                    </div>
                    {totalCargasMin > 0 && (
                      <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success-500 flex items-center justify-center transition-all duration-700"
                            style={{ width: `${((totalCargasMin - totalCajasMin) / totalCargasMin) * 100}%` }}
                          >
                            <span className="text-[10px] font-semibold text-white drop-shadow-sm whitespace-nowrap">
                              {((totalCargasMin - totalCajasMin) / totalCargasMin * 100).toFixed(1)}%
                            </span>
                          </div>
                          {totalCajasMin > 0 && (
                            <div
                              className="h-full bg-emerald-600 flex items-center justify-center transition-all duration-700"
                              style={{ width: `${(totalCajasMin / totalCargasMin) * 100}%` }}
                            >
                              <span className="text-[10px] font-semibold text-white drop-shadow-sm whitespace-nowrap">
                                {(totalCajasMin / totalCargasMin * 100).toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-sm font-medium text-success-600">{(totalCargasMin - totalCajasMin).toLocaleString("es-PE")} cajas entregadas</span>
                          <span className="text-sm font-medium text-emerald-600">{totalCajasMin.toLocaleString("es-PE")} cajas rechazadas</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lista grafica de todos los transportistas con rechazo menor a 0.5% */}
                  <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Todos los transportistas con rechazo menor a 0.5%
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                          <span className="w-6 h-0 border-t-2 border-dashed border-emerald-500"></span>
                          Limite 0.5%
                        </span>
                        <span className="text-[11px] font-medium text-gray-400">Escala 0% - {maxPctMin.toFixed(2)}%</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {rechazoMinimo.map((item, idx) => {
                        const pct = Number(item.porcentaje_cajas);
                        const cajas = Number(item.cajas_fisicas);
                        const cargas = Number(item.cargas_programadas);
                        const ancho = maxPctMin > 0 ? Math.max((pct / maxPctMin) * 100, cajas > 0 ? 3 : 0) : 0;
                        const sinRechazo = cajas === 0;

                        return (
                          <div
                            key={item.codigo_identificador}
                            className="group relative rounded-xl p-4 bg-emerald-50/40 border border-emerald-200/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-200/40 dark:bg-emerald-500/5 dark:border-emerald-500/15 dark:hover:shadow-black/30"
                          >
                            <div className="flex items-center gap-4">
                              {/* Ranking + Codigo */}
                              <div className="w-[180px] shrink-0">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 bg-emerald-500 text-white">
                                    {idx + 1}
                                  </span>
                                  {sinRechazo && (
                                    <svg className="w-4 h-4 text-success-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  <span className="font-bold text-sm text-gray-800 dark:text-white/90 truncate">{item.codigo_identificador}</span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 ml-9 truncate">{item.nombres} {item.apellidos}</p>
                              </div>

                              {/* Barra grafica - escala 0% a 0.5% */}
                              <div className="flex-1 min-w-0">
                                <div className="relative">
                                  <div className="flex h-7 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    <div
                                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 flex items-center justify-center transition-all duration-500"
                                      style={{ width: `${Math.min(ancho, 100)}%` }}
                                    >
                                      {ancho > 30 && (
                                        <span className="text-[11px] font-semibold text-white drop-shadow-sm whitespace-nowrap px-2">
                                          {pct}% rechazado
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div
                                    className="absolute inset-y-0 right-0 border-r-2 border-dashed border-emerald-500/70"
                                    title="Limite de rechazo minimo 0.5%"
                                  ></div>
                                </div>
                                <div className="flex justify-between mt-1.5 px-1">
                                  <span className="text-[11px] font-medium text-success-600">{cargas} programadas</span>
                                  <span className="text-[11px] font-medium text-emerald-600">{cajas} fisicas rechazadas</span>
                                </div>
                              </div>

                              {/* Porcentaje */}
                              <div className="w-[110px] shrink-0 text-right">
                                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{pct}%</span>
                                <p className="text-[10px] font-medium text-gray-400">{cajas}/{cargas}</p>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                                  {sinRechazo ? "Sin rechazo" : "Rechazo minimo"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Liquidacion Diaria - Top 10 Transportistas */}
            <div>
              <h2 className="text-2xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
                Liquidacion diaria Top 10 transportistas con mas rechazos segun montos
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </h2>
              {liquidacionDiaria.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
                  <p className="text-gray-400">No hay datos de liquidacion diaria con rechazos por montos</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const agrupado = liquidacionDiaria.reduce((acc, row) => {
                      const fechaStr = row.fecha ? String(row.fecha).split("T")[0] : "sin fecha";
                      if (!acc[fechaStr]) acc[fechaStr] = [];
                      acc[fechaStr].push(row);
                      return acc;
                    }, {} as Record<string, LiquidacionDiaria[]>);

                    return Object.entries(agrupado).map(([fecha, rows]) => {
                      const parts = fecha.split("-");
                      const fechaFmt = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : fecha;
                      const top10 = [...rows]
                        .sort((a, b) => Number(b.porcentaje_rechazo) - Number(a.porcentaje_rechazo))
                        .slice(0, 10);
                      const totalLiqDia = rows.reduce((s, r) => s + Number(r.total_liq), 0);
                      const totalRechDia = rows.reduce((s, r) => s + Number(r.total_rechazo), 0);
                      const totalCajasDiaX = rows.reduce((s, r) => s + Number(r.total_cajas || 0), 0);
                      const totalUnidadesDiaX = rows.reduce((s, r) => s + Number(r.total_unidades || 0), 0);
                      const pctDia = totalLiqDia > 0 ? ((totalRechDia / totalLiqDia) * 100).toFixed(1) : "0.0";
                      const colorsDia = getPorcentajeColor(Number(pctDia));

                      return (
                        <div key={fecha} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                          {/* Header fecha */}
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-4">
                              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colorsDia.bg}/10`}>
                                <svg className={`w-6 h-6 ${colorsDia.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-xl font-bold text-gray-800 dark:text-white/90">{fechaFmt}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Top {top10.length} transportistas con mas rechazos segun montos</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">Liquidacion</p>
                                <p className="text-2xl font-bold text-success-600">{formatMoney(totalLiqDia)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">Rechazado</p>
                                <p className="text-2xl font-bold text-error-600">{formatMoney(totalRechDia)}</p>
                              </div>
                              {(totalCajasDiaX > 0 || totalUnidadesDiaX > 0) && (
                                <div className="text-right">
                        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">Cajas Fisicas Rechazadas</p>
                                  <div className="flex items-center justify-end gap-2">
                                    <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <p className="text-lg font-bold text-sky-600">{totalCajasDiaX}</p>
                                    <span className="text-xs text-sky-400">cajas</span>
                                    <p className="text-lg font-bold text-sky-600">{totalUnidadesDiaX}</p>
                                    <span className="text-xs text-sky-400">uds</span>
                                  </div>
                                </div>
                              )}
                              <div className={`px-5 py-3 rounded-xl ${colorsDia.bg}/10 border ${colorsDia.border}`}>
                                <p className={`text-xl font-extrabold ${colorsDia.text}`}>{pctDia}%</p>
                              </div>
                            </div>
                          </div>

                          {/* Barra resumen del dia */}
                          <div className="mb-5">
                            <div className="flex h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              {totalLiqDia > 0 && (
                                <div
                                  className="h-full bg-success-500 flex items-center justify-center transition-all duration-700"
                                  style={{ width: `${((totalLiqDia - totalRechDia) / totalLiqDia) * 100}%` }}
                                >
                                  <span className="text-[10px] font-semibold text-white drop-shadow-sm whitespace-nowrap">
                                    {((totalLiqDia - totalRechDia) / totalLiqDia * 100).toFixed(0)}%
                                  </span>
                                </div>
                              )}
                              {totalRechDia > 0 && (
                                <div
                                  className="h-full bg-error-500 flex items-center justify-center transition-all duration-700"
                                  style={{ width: `${(totalRechDia / totalLiqDia) * 100}%` }}
                                >
                                  <span className="text-[10px] font-semibold text-white drop-shadow-sm whitespace-nowrap">
                                    {(totalRechDia / totalLiqDia * 100).toFixed(0)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between mt-2">
                              <span className="text-sm font-medium text-success-600">S/ {(totalLiqDia - totalRechDia).toLocaleString("es-PE", { minimumFractionDigits: 2 })} Neto</span>
                              <span className="text-sm font-medium text-error-600">S/ {totalRechDia.toLocaleString("es-PE", { minimumFractionDigits: 2 })} Rechazo</span>
                            </div>
                          </div>

                           {/* Top 10 Transportistas */}
                          <div className="space-y-3">
                            {top10.map((row, idx) => {
                              const colors = getPorcentajeColor(row.porcentaje_rechazo);
                              const isCritico = row.porcentaje_rechazo >= 12;
                              const isHigh = row.porcentaje_rechazo >= 6;
                              const liq = Number(row.total_liq);
                              const rech = Number(row.total_rechazo);
                              const rechPct = liq > 0 ? (rech / liq) * 100 : 0;
                              const neto = liq - rech;
                              const netoPct = 100 - rechPct;

                              return (
                                <div key={idx} className={`group relative rounded-xl p-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-gray-300/40 dark:hover:shadow-black/30 ${
                                  isCritico ? "bg-red-50/80 dark:bg-red-500/5 border border-red-200/50 dark:border-red-500/20" :
                                  isHigh ? "bg-orange-50/50 dark:bg-orange-500/3 border border-orange-200/30 dark:border-orange-500/10" :
                                  "bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100/50 dark:hover:bg-white/[0.04]"
                                }`}>
                                    <div className="flex items-center gap-4">
                                    {/* Ranking + Codigo */}
                                    <div className="w-[180px] shrink-0">
                                      <div className="flex items-center gap-2">
                                        <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 ${
                                          idx === 0 ? "bg-red-500 text-white" :
                                          idx === 1 ? "bg-orange-500 text-white" :
                                          idx === 2 ? "bg-yellow-500 text-white" :
                                          "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                        }`}>
                                          {idx + 1}
                                        </span>
                                        {isCritico && (
                                          <span className="relative flex h-2 w-2 shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                          </span>
                                        )}
                                        {idx === 0 && !isCritico && (
                                          <span className="relative flex h-2 w-2 shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                          </span>
                                        )}
                                        <span className="font-bold text-sm text-gray-800 dark:text-white/90 truncate">{row.codigo_identificador}</span>
                                      </div>
                                      <p className="text-xs text-gray-400 dark:text-gray-500 ml-9 whitespace-nowrap overflow-hidden text-ellipsis">{row.nombres} {row.apellidos}</p>
                                      {(Number(row.total_cajas) > 0 || Number(row.total_unidades) > 0) && (
                                        <div className="flex items-center gap-1.5 ml-9 mt-1">
                                          <svg className="w-3.5 h-3.5 text-sky-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                          </svg>
                                          <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                                            {Number(row.total_cajas)} cajas · {Number(row.total_unidades)} uds
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Barra flex - Verde liquidacion, Rojo rechazo */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex h-7 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        {netoPct > 0 && (
                                          <div
                                    className="h-full bg-gradient-to-r from-teal-800 to-emerald-500 flex items-center justify-center transition-all duration-500"
                                            style={{ width: `${Math.max(netoPct, 5)}%` }}
                                          >
                                            <span className="text-[11px] font-semibold text-white drop-shadow-sm whitespace-nowrap px-2">
                                              {formatMoney(neto)}
                                            </span>
                                          </div>
                                        )}
                                        {rechPct > 0 && (
                                          <div
                                    className="h-full bg-gradient-to-r from-red-800 to-rose-500 flex items-center justify-center transition-all duration-500"
                                            style={{ width: `${Math.max(rechPct, 5)}%` }}
                                          >
                                            <span className="text-[11px] font-semibold text-white drop-shadow-sm whitespace-nowrap px-2">
                                              {formatMoney(rech)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex justify-between mt-1.5 px-1">
                                        <span className="text-[11px] font-medium text-success-600">{netoPct.toFixed(1)}% neto</span>
                                        <span className="text-[11px] font-medium text-error-600">{rechPct.toFixed(1)}% rechazo</span>
                                      </div>
                                    </div>

                                    {/* Montos + Porcentaje */}
                                    <div className={`w-[160px] shrink-0 text-right ${isCritico ? "animate-pulse" : ""}`}>
                                      <div className="flex items-center justify-end gap-2 mb-0.5">
                                        <span className="text-[11px] font-medium text-success-600">Liq:</span>
                                        <span className="text-xs font-bold text-success-700 dark:text-success-400">{formatMoney(liq)}</span>
                                      </div>
                                      <div className="flex items-center justify-end gap-2 mb-0.5">
                                        <span className="text-[11px] font-medium text-error-600">Rech:</span>
                                        <span className="text-xs font-bold text-error-700 dark:text-error-400">{formatMoney(rech)}</span>
                                      </div>
                                      <span className={`text-lg font-extrabold ${colors.text}`}>
                                        {row.porcentaje_rechazo}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Niveles de criticidad */}
            <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-gray-200 bg-white px-5 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Niveles:</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Rechazo minimo (&lt;0.5%)
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <span className="w-3 h-3 rounded-full bg-green-500"></span> Bajo (0-3%)
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Moderado (3-6%)
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span> Alto (6-12%)
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <span className="w-3 h-3 rounded-full bg-red-500"></span> Critico (+12%)
              </span>
            </div>

            {/* Top 5 Motivos de Anulacion */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-6">
                Top 5 motivos de anulacion del dia
              </h2>
              {topMotivos.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
                  <p className="text-gray-400">No hay datos de analisis documentario</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                  <div className="space-y-3">
                    {topMotivos.map((item, idx) => {
                      const pct = Number(item.porcentaje);
                      return (
                        <div key={idx} className="group relative rounded-xl p-4 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100/50 dark:hover:bg-white/[0.04] transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-[200px] shrink-0">
                              <div className="flex items-center gap-2">
                                <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 ${
                                  idx === 0 ? "bg-violet-500 text-white" :
                                  idx === 1 ? "bg-fuchsia-500 text-white" :
                                  idx === 2 ? "bg-purple-500 text-white" :
                                  "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                }`}>
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-sm text-gray-800 dark:text-white/90 truncate">{item.motivo}</span>
                              </div>
                              <p className="text-xs text-gray-400 dark:text-gray-500 ml-9">{item.cantidad} documentos</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="w-[120px] shrink-0 text-right">
                              <span className="text-sm font-extrabold text-violet-600 dark:text-violet-400">{formatMoney(item.total_importe)}</span>
                              <p className="text-[11px] font-semibold text-gray-400">{item.porcentaje}%</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </>
  );
}
