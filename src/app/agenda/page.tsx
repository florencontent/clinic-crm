"use client";

import { useState, useMemo } from "react";
import { format, addMonths, subMonths, addWeeks, subWeeks, isSameDay, isWithinInterval, startOfWeek, endOfWeek, startOfYear, endOfYear, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, CalendarDays, Clock, CalendarCheck, UserCheck } from "lucide-react";
import { CalendarView } from "@/components/agenda/calendar-view";
import { WeekView } from "@/components/agenda/week-view";
import { AppointmentModal } from "@/components/agenda/appointment-modal";
import { NewAppointmentModal } from "@/components/agenda/new-appointment-modal";
import { Appointment } from "@/data/mock-data";
import { useAppointments } from "@/hooks/use-supabase-data";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week";
type PeriodFilter = "anual" | "mensal" | "semanal" | "personalizado";

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const { appointments, loading, setAppointments } = useAppointments();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newAptDate, setNewAptDate] = useState<string | null>(null);

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("mensal");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "month") {
      setCurrentDate((d) => direction === "prev" ? subMonths(d, 1) : addMonths(d, 1));
    } else {
      setCurrentDate((d) => direction === "prev" ? subWeeks(d, 1) : addWeeks(d, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleSave = (updated: Appointment) => {
    setAppointments((prev) => prev.map((apt) => (apt.id === updated.id ? updated : apt)));
    setSelectedAppointment(updated);
  };

  const today = new Date();

  // Period-filtered appointments
  const periodFilteredAppointments = useMemo(() => {
    let start: Date, end: Date;
    if (periodFilter === "anual") {
      start = startOfYear(today);
      end = endOfYear(today);
    } else if (periodFilter === "semanal") {
      start = startOfWeek(today, { weekStartsOn: 0 });
      end = endOfWeek(today, { weekStartsOn: 0 });
    } else if (periodFilter === "personalizado") {
      if (!customFrom || !customTo) return appointments;
      start = new Date(customFrom + "T00:00:00");
      end = new Date(customTo + "T23:59:59");
    } else {
      // mensal (default)
      start = startOfMonth(today);
      end = endOfMonth(today);
    }
    return appointments.filter((a) => {
      const d = new Date(a.date + "T00:00:00");
      return isWithinInterval(d, { start, end });
    });
  }, [appointments, periodFilter, customFrom, customTo]);

  const todayApts = appointments.filter((a) => isSameDay(new Date(a.date + "T00:00:00"), today));
  const weekApts = appointments.filter((a) => {
    const d = new Date(a.date + "T00:00:00");
    const start = startOfWeek(today, { weekStartsOn: 0 });
    const end = endOfWeek(today, { weekStartsOn: 0 });
    return d >= start && d <= end;
  });
  const compareceuCount = appointments.filter((a) => a.status === "compareceu").length;

  const PERIOD_FILTERS: { value: PeriodFilter; label: string }[] = [
    { value: "anual", label: "Anual" },
    { value: "mensal", label: "Mensal" },
    { value: "semanal", label: "Semanal" },
    { value: "personalizado", label: "Personalizado" },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agenda</h2>
          <p className="text-sm text-gray-400 mt-1">Consultas e procedimentos agendados</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-lg transition-all",
                viewMode === "month" ? "bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-lg transition-all",
                viewMode === "week" ? "bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              Semanal
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-3 py-2 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
          >
            Hoje
          </button>

          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm px-1">
            <button onClick={() => navigate("prev")} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] text-center capitalize px-1">
              {format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Semana de' d MMM", { locale: ptBR })}
            </span>
            <button onClick={() => navigate("next")} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{todayApts.length}</p>
            <p className="text-xs text-gray-400">Consultas hoje</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 p-2.5 rounded-xl">
            <CalendarCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{weekApts.length}</p>
            <p className="text-xs text-gray-400">Esta semana</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{appointments.length}</p>
            <p className="text-xs text-gray-400">Total agendado</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-2.5 rounded-xl">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{compareceuCount}</p>
            <p className="text-xs text-gray-400">Compareceram</p>
          </div>
        </div>
      </div>

      {/* Period filter tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
          {PERIOD_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setPeriodFilter(f.value)}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-lg transition-all",
                periodFilter === f.value
                  ? "bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {periodFilter === "personalizado" && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400">De</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 transition-colors"
            />
            <label className="text-xs text-gray-500 dark:text-gray-400">Até</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 transition-colors"
            />
          </div>
        )}

        {periodFilter !== "mensal" && (
          <span className="text-xs text-gray-400">
            {periodFilteredAppointments.length} consulta{periodFilteredAppointments.length !== 1 ? "s" : ""} no período
          </span>
        )}
      </div>

      {viewMode === "month" ? (
        <CalendarView
          currentDate={currentDate}
          appointments={periodFilteredAppointments}
          onSelectAppointment={setSelectedAppointment}
          onNewAppointment={(date) => setNewAptDate(date)}
        />
      ) : (
        <WeekView
          currentDate={currentDate}
          appointments={periodFilteredAppointments}
          onSelectAppointment={setSelectedAppointment}
        />
      )}

      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onSave={handleSave}
        />
      )}

      {newAptDate && (
        <NewAppointmentModal
          initialDate={newAptDate}
          onClose={() => setNewAptDate(null)}
          onCreated={(apt) => {
            setAppointments((prev) => [...prev, apt]);
            setNewAptDate(null);
          }}
        />
      )}
    </div>
  );
}
