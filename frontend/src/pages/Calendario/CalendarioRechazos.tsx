import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

import { API_URL } from "../../config/api";

const toISODate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toISODate(d);
};

const formatDate = (iso: string) => {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
};

interface CalendarEvent {
  title: string;
  start: string;
  totalCajas: number;
  conductores: number;
}

interface TopConductor {
  codigo_identificador: string;
  nombres: string;
  apellidos: string;
  cajas_fisicas: number;
  porcentaje: string;
}

export default function CalendarioRechazos() {
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [top3, setTop3] = useState<TopConductor[]>([]);
  const [totalDia, setTotalDia] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTop3 = useCallback(async (fecha: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/dashboard/top-3-rechazos?fecha=${fecha}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTop3(data.data || []);
        setTotalDia(data.totalDia || 0);
      } else {
        setTop3([]);
        setTotalDia(0);
        setError(res.status === 401 ? "Sesion expirada, inicia sesion de nuevo" : "Error al cargar el top 3");
      }
    } catch (err) {
      console.error("Error loading top 3:", err);
      setTop3([]);
      setTotalDia(0);
      setError("Error de conexion con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async (start: string, end: string) => {
    try {
      const res = await fetch(
        `${API_URL}/dashboard/calendario-rechazos?start=${start}&end=${end}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      } else {
        console.error("Error en calendario-rechazos:", res.status);
      }
    } catch (err) {
      console.error("Error loading calendar events:", err);
    }
  }, []);

  useEffect(() => {
    fetchTop3(selectedDate);
  }, [selectedDate, fetchTop3]);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);
    fetchEvents(toISODate(start), toISODate(end));
  }, [fetchEvents]);

  const handleDateClick = (arg: DateClickArg) => {
    const fecha = toISODate(arg.date);
    setSelectedDate(fecha);
  };

  const handleDatesSet = (arg: { start: Date; end: Date }) => {
    const start = toISODate(arg.start);
    const endExclusive = new Date(arg.end);
    endExclusive.setDate(endExclusive.getDate() - 1);
    fetchEvents(start, toISODate(endExclusive));
  };

  const rankingColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
  ];

  return (
    <>
      <PageMeta
        title="Calendario de Rechazos | Embid Distribuidora S.A.C"
        description="Calendario de rechazos y top 3 conductores del dia"
      />
      <PageBreadcrumb pageTitle="Calendario de Rechazos" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Calendario mediano */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10">
                <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  Calendario de rechazos
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Selecciona un dia para ver el top 3
                </p>
              </div>
            </div>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={esLocale}
              height={520}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek",
              }}
              buttonText={{
                today: "Hoy",
                month: "Mes",
                week: "Semana",
              }}
              events={events.map((e) => ({
                title: e.title,
                start: e.start,
                backgroundColor: "#8b5cf6",
                borderColor: "#7c3aed",
                textColor: "#ffffff",
              }))}
              dateClick={handleDateClick}
              datesSet={handleDatesSet}
              selectable
              dayMaxEvents={2}
              dayCellClassNames={(arg) => {
                const fecha = toISODate(arg.date);
                return fecha === selectedDate ? ["fc-day-selected"] : [];
              }}
            />
            <style>{`
              .fc .fc-daygrid-day.fc-day-today { background-color: rgba(139, 92, 246, 0.08); }
              .fc .fc-day-selected .fc-daygrid-day-frame { background-color: rgba(139, 92, 246, 0.18); border-radius: 8px; }
              .fc .fc-toolbar-title { font-size: 1.05rem; font-weight: 700; color: #1f2937; }
              .dark .fc .fc-toolbar-title { color: rgba(255,255,255,0.9); }
              .fc .fc-button-primary {
                background-color: #8b5cf6;
                border-color: #8b5cf6;
                color: #fff;
              }
              .fc .fc-button-primary:hover {
                background-color: #7c3aed;
                border-color: #7c3aed;
              }
              .fc .fc-button-primary:not(:disabled).fc-button-active,
              .fc .fc-button-primary:not(:disabled):active {
                background-color: #7c3aed;
                border-color: #7c3aed;
              }
              .fc .fc-event { font-size: 0.7rem; cursor: default; }
            `}</style>
          </div>
        </div>

        {/* Top 3 conductores del dia */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] h-full">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  Top 3 conductores del dia
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatDate(selectedDate)}
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-400/40">
                <p className="text-xs font-bold text-violet-600 dark:text-violet-400">
                  {totalDia.toLocaleString("es-PE")} cajas
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-error-500/10 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-error-500">{error}</p>
              </div>
            ) : top3.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">
                  Sin rechazos de cajas para esta fecha
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {top3.map((item, idx) => {
                  const pct = Number(item.porcentaje);
                  return (
                    <div
                      key={item.codigo_identificador}
                      className={`group rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                        idx === 0
                          ? "bg-red-50/80 dark:bg-red-500/5 border border-red-200/50 dark:border-red-500/20"
                          : idx === 1
                          ? "bg-orange-50/50 dark:bg-orange-500/5 border border-orange-200/30 dark:border-orange-500/10"
                          : "bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold text-white shrink-0 ${rankingColors[idx]}`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-800 dark:text-white/90 truncate">
                            {item.codigo_identificador}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {item.nombres} {item.apellidos}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-2 mb-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                            Cajas fisicas rechazadas
                          </p>
                          <p className="text-2xl font-black text-gray-800 dark:text-white/90">
                            {item.cajas_fisicas.toLocaleString("es-PE")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                            Representa
                          </p>
                          <p
                            className={`text-lg font-extrabold ${
                              idx === 0
                                ? "text-red-600"
                                : idx === 1
                                ? "text-orange-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {item.porcentaje}%
                          </p>
                        </div>
                      </div>

                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            idx === 0
                              ? "bg-gradient-to-r from-red-500 to-rose-500"
                              : idx === 1
                              ? "bg-gradient-to-r from-orange-500 to-amber-500"
                              : "bg-gradient-to-r from-yellow-400 to-amber-400"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Total del dia
                  </span>
                  <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                    {totalDia.toLocaleString("es-PE")} cajas
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
