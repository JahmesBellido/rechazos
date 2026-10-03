import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DatePicker from "../../components/form/date-picker";

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

interface Summary {
  liquidacionTotal: number;
  totalRechazado: number;
  documentosRechazados: number;
  totalCajas: number;
  totalUnidades: number;
  liquidacionFinal: number;
  liqSemanal: number;
  pctSemanal: string;
  totalDocumentos: number;
  totalRechazos: number;
  totalTransportistas: number;
}

interface RechazosDiario {
  fecha: string;
  total_rechazo: number;
  docs_rechazados: number;
  liq_final: number;
  cajas_fisicas: number;
  cargas_programadas: number;
  porcentaje_cajas: number;
}

interface AnalisisItem {
  id: number;
  motivo_anulacion: string;
  importe: number;
  cant_analisis: number;
  fecha_analisis: string;
}

const formatMoney = (val: number) =>
  `S/ ${val.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatFechaCorta = (fecha: string) => {
  const parts = fecha.split("-");
  if (parts.length !== 3) return fecha;
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const dia = parseInt(parts[2], 10);
  const mes = meses[parseInt(parts[1], 10) - 1];
  const anio = parts[0];
  return `${dia} ${mes} ${anio}`;
};

const formatDiaMes = (fecha: string) => {
  const parts = fecha.split("-");
  if (parts.length !== 3) return fecha;
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const dia = parseInt(parts[2], 10);
  const mes = meses[parseInt(parts[1], 10) - 1];
  return `${dia} ${mes}`;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rechazosDiario, setRechazosDiario] = useState<RechazosDiario[]>([]);
  const [analisis, setAnalisis] = useState<AnalisisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(getDefaultDate());

  const handleDateChange = (selectedDates: Date[] | Date | undefined) => {
    if (selectedDates) {
      const date = Array.isArray(selectedDates) ? selectedDates[0] : selectedDates;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      setFecha(`${year}-${month}-${day}`);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, r, a] = await Promise.all([
          fetch(`${API_URL}/dashboard/summary`, { credentials: "include" }).then((r) => r.json()),
          fetch(`${API_URL}/dashboard/rechazos-diario`, { credentials: "include" }).then((r) => r.json()),
          fetch(`${API_URL}/analisis?fecha=${fecha}`, { credentials: "include" }).then((r) => r.json()),
        ]);
        setSummary(s);
        setRechazosDiario(r.data || []);
        setAnalisis(a.analisis || []);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [fecha]);

  const rechazosUltimos7 = [...rechazosDiario]
    .sort((a, b) => {
      const dateA = new Date((a.fecha || "").split("T")[0]);
      const dateB = new Date((b.fecha || "").split("T")[0]);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(-7);

  const rechazosBarOptions: ApexCharts.ApexOptions = {
    chart: { type: "bar", height: 420, toolbar: { show: false }, fontFamily: "Inter, sans-serif", animations: { enabled: true, speed: 800 } },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 6,
        columnWidth: "55%",
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
        colors: { ranges: [{ from: 0, color: undefined }] },
      },
    },
    xaxis: {
      categories: rechazosUltimos7.map((r) => {
        const f = r.fecha?.split("T")[0] || "";
        return formatDiaMes(f);
      }),
      labels: {
        style: { fontSize: "11px", fontWeight: "600", colors: "#64748b" },
        rotate: -45,
        rotateAlways: false,
        offsetX: 0,
        offsetY: 5,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        seriesName: "Rechazado",
        labels: {
          formatter: (val) => val >= 1000 ? `S/ ${(val / 1000).toFixed(0)}k` : `S/ ${val.toFixed(0)}`,
          style: { fontSize: "11px", colors: "#F97066" },
        },
      },
      {
        seriesName: "Liquidacion Final",
        opposite: true,
        labels: {
          formatter: (val) => val >= 1000 ? `S/ ${(val / 1000).toFixed(0)}k` : `S/ ${val.toFixed(0)}`,
          style: { fontSize: "11px", colors: "#00C49F" },
        },
      },
      {
        seriesName: "Cajas Fisicas",
        opposite: true,
        labels: {
          formatter: (val) => `${Math.round(val)}`,
          style: { fontSize: "11px", colors: "#0EA5E9" },
        },
      },
    ],
    colors: ["#F97066", "#00C49F", "#0EA5E9"],
    legend: { position: "top", fontSize: "12px", fontWeight: 600 },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "light",
      custom: ({ series, dataPointIndex }) => {
        const fecha = rechazosUltimos7[dataPointIndex]?.fecha?.split("T")[0] || "";
        const rechazado = series[0][dataPointIndex];
        const liqFinal = series[1][dataPointIndex];
        const cajas = series[2][dataPointIndex];
        const pctCajas = rechazosUltimos7[dataPointIndex]?.porcentaje_cajas || 0;
        return `
          <div style="padding:10px;font-family:Inter,sans-serif;font-size:12px;">
            <div style="font-weight:700;margin-bottom:6px;color:#334155;">${formatFechaCorta(fecha)}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="width:10px;height:10px;border-radius:2px;background:#F97066;display:inline-block;"></span>
              <span style="color:#64748b;">Rechazado:</span>
              <span style="font-weight:700;color:#F97066;">${formatMoney(rechazado)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="width:10px;height:10px;border-radius:2px;background:#00C49F;display:inline-block;"></span>
              <span style="color:#64748b;">Liquidacion:</span>
              <span style="font-weight:700;color:#00C49F;">${formatMoney(liqFinal)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="width:10px;height:10px;border-radius:2px;background:#0EA5E9;display:inline-block;"></span>
              <span style="color:#64748b;">Cajas Fisicas:</span>
              <span style="font-weight:700;color:#0EA5E9;">${Math.round(cajas)} (${pctCajas}%)</span>
            </div>
          </div>
        `;
      },
    },
    grid: { borderColor: "#f1f5f9", strokeDashArray: 3, padding: { left: 5, right: 5 } },
    dataLabels: {
      enabled: false,
    },
  };

  const rechazosBarSeries = [
    {
      name: "Rechazado",
      data: rechazosUltimos7.map((r) => Number(r.total_rechazo)),
    },
    {
      name: "Liquidacion Final",
      data: rechazosUltimos7.map((r) => Number(r.liq_final)),
    },
    {
      name: "Cajas Fisicas",
      data: rechazosUltimos7.map((r) => Number(r.cajas_fisicas)),
    },
  ];

  const totalRechazadoAyer = summary?.totalRechazado || 0;
  const liquidacionFinalAyer = summary?.liquidacionFinal || 0;
  const pctRechazo = totalRechazadoAyer + liquidacionFinalAyer > 0
    ? ((totalRechazadoAyer / (totalRechazadoAyer + liquidacionFinalAyer)) * 100).toFixed(1)
    : "0.0";
  const pctLiquidacion = totalRechazadoAyer + liquidacionFinalAyer > 0
    ? ((liquidacionFinalAyer / (totalRechazadoAyer + liquidacionFinalAyer)) * 100).toFixed(1)
    : "0.0";

  if (loading) {
    return (
      <>
        <PageMeta title="Estadisticas | Embid Distribuidora S.A.C" description="Dashboard de estadisticas" />
        <PageBreadcrumb pageTitle="Estadisticas" />
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Estadisticas | Embid Distribuidora S.A.C" description="Dashboard de estadisticas" />
      <PageBreadcrumb pageTitle="Estadisticas" />
      <div className="space-y-6">

        {/* Card Gran Fecha */}
        <div className="rounded-2xl border-2 border-brand-400 dark:border-brand-500/50 bg-gradient-to-br from-brand-500 to-brand-600 p-6 text-white shadow-lg shadow-brand-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/70 uppercase tracking-wider">Fecha de Analisis</p>
              <p className="text-3xl font-extrabold mt-1">{formatFechaCorta(fecha)}</p>
              <p className="text-base text-white/80 mt-1">Totales acumulados globales</p>
            </div>
            <div className="flex items-center gap-4">
              <DatePicker
                id="fecha-selector-estadisticas"
                defaultDate={parseDateString(fecha)}
                onChange={handleDateChange}
                placeholder="Seleccionar fecha"
                label="Fecha"
                inputClassName="!bg-white/20 !text-white !border-white/30 !placeholder:text-white/60 focus:!border-white/50 focus:!ring-white/20"
                labelClassName="!text-white/80"
              />
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summary && (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Rechazado</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{formatMoney(summary.totalRechazado)}</p>
                    <p className="text-xs font-semibold text-rose-400 mt-0.5">{pctRechazo}% del total acumulado</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-500/10">
                    <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Liquidacion Semanal</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{formatMoney(summary.liqSemanal)}</p>
                    <p className="text-xs font-semibold text-emerald-400 mt-0.5">{summary.pctSemanal}% rechazo esta semana</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cajas Físicas</p>
                    <p className="text-2xl font-bold text-sky-600 mt-1">{summary.totalCajas.toLocaleString("es-PE")} / {summary.totalUnidades.toLocaleString("es-PE")}</p>
                    <p className="text-xs font-semibold text-sky-400 mt-0.5">{summary.totalCajas} cajas | {summary.totalUnidades} unidades</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10">
                    <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Documentos Rechazados</p>
                    <p className="text-2xl font-bold text-violet-600 mt-1">{summary.documentosRechazados.toLocaleString("es-PE")}</p>
                    <p className="text-xs font-semibold text-violet-400 mt-0.5">{summary.totalRechazos} rechazos registrados</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/10">
                    <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Charts + Table Row */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* Rechazos Bar Chart */}
          <ComponentCard title="Rechazos, Liquidacion y Cajas Fisicas - Totales Diarios" desc="Montos en soles y cajas fisicas de los ultimos 7 dias">
            {rechazosUltimos7.length > 0 ? (
              <Chart options={rechazosBarOptions} series={rechazosBarSeries} type="bar" height={380} />
            ) : (
              <p className="text-center text-gray-400 py-10">Sin datos disponibles</p>
            )}
          </ComponentCard>

          {/* Tabla Analisis del Dia Seleccionado */}
          <ComponentCard title={`Analisis Documentario - ${formatFechaCorta(fecha)}`} desc="Detalle de motivos de rechazo del dia">
            {analisis.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">No hay registros de analisis para este dia</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase">Motivo</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase">Importe</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {(() => {
                      const totalImporte = analisis.reduce((s, a) => s + Number(a.importe), 0);
                      const sorted = [...analisis].sort((a, b) => Number(b.importe) - Number(a.importe));
                      return sorted.slice(0, 8).map((item) => {
                        const pct = totalImporte > 0 ? (Number(item.importe) / totalImporte) * 100 : 0;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                            <td className="px-3 py-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                {item.motivo_anulacion}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-rose-500 dark:text-rose-400">
                              {formatMoney(item.importe)}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-10 text-right">
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.02]">
                      <td className="px-3 py-2 font-bold text-slate-800 dark:text-white/90 text-xs">TOTAL</td>
                      <td className="px-3 py-2 text-right font-bold text-rose-600 dark:text-rose-400 text-xs">
                        {formatMoney(analisis.reduce((s, a) => s + Number(a.importe), 0))}
                      </td>
                      <td className="px-3 py-2 text-center text-xs font-bold text-violet-600 dark:text-violet-400">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </ComponentCard>

        </div>

        {/* Pie Chart - Rechazado vs Liquidacion Final */}
        <ComponentCard title="Composicion Global - Rechazado vs Liquidacion" desc="Totales acumulados en soles">
          {totalRechazadoAyer + liquidacionFinalAyer > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <Chart
                  options={{
                    chart: { type: "donut", fontFamily: "Inter, sans-serif", animations: { enabled: true, speed: 900 } },
                    labels: ["Total Rechazado", "Liquidacion Final"],
                    colors: ["#F97066", "#00C49F"],
                    legend: { position: "bottom", fontSize: "12px", fontWeight: 600 },
                    plotOptions: {
                      pie: {
                        donut: {
                          size: "68%",
                          labels: {
                            show: true,
                            name: { show: true, fontSize: "13px", fontWeight: 500, color: "#94a3b8", offsetY: 8 },
                            value: {
                              show: true,
                              fontSize: "22px",
                              fontWeight: "800",
                              color: "#1e293b",
                              formatter: (val: string) => formatMoney(Number(val)),
                            },
                            total: {
                              show: true,
                              label: "Total Acumulado",
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "#94a3b8",
                              formatter: () => formatMoney(totalRechazadoAyer + liquidacionFinalAyer),
                            },
                          },
                        },
                      },
                    },
                    tooltip: {
                      y: { formatter: (val) => formatMoney(Number(val)) },
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: (val: number) => {
                        const pct = Number(val).toFixed(1);
                        return `${pct}%`;
                      },
                      style: { fontSize: "12px", fontWeight: "700", colors: ["#fff"] },
                      dropShadow: { enabled: false },
                    },
                    stroke: { width: 3, colors: ["#fff"] },
                  }}
                  series={[totalRechazadoAyer, liquidacionFinalAyer]}
                  type="donut"
                  height={340}
                />
              </div>
              <div className="flex flex-col gap-4 min-w-[220px]">
                <div className="rounded-xl bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Rechazado</p>
                  <p className="text-xl font-extrabold text-rose-600 mt-1">{formatMoney(totalRechazadoAyer)}</p>
                  <p className="text-xs font-semibold text-rose-400 mt-0.5">{pctRechazo}% del total acumulado</p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Liquidacion Final</p>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1">{formatMoney(liquidacionFinalAyer)}</p>
                  <p className="text-xs font-semibold text-emerald-400 mt-0.5">{pctLiquidacion}% del total acumulado</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-10">Sin datos disponibles</p>
          )}
        </ComponentCard>

      </div>
    </>
  );
}
