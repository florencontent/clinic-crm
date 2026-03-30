"use client";

import { useState, useRef, useEffect } from "react";
import {
  format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears,
  isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  isSameMonth, isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ChevronDown, Loader2, CalendarDays, CalendarCheck, UserCheck } from "lucide-react";
import { CalendarView } from "@/components/agenda/calendar-view";
import { WeekView } from "@/components/agenda/week-view";
import { DayView } from "@/components/agenda/day-view";
import { YearView } from "@/components/agenda/year-view";
import { AppointmentModal } from "@/components/agenda/appointment-modal";
import { NewAppointmentModal } from "@/components/agenda/new-appointment-modal";
import { Appointment } from "@/data/mock-data";
import { useAppointments } from "@/hooks/use-supabase-data";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week" | "month" | "year";

const VIEW_OPTIONS: { value: ViewMode; label: string; shortcut: string }[] = [
  { value: "day", label: "Dia", shortcut: "D" },
  { value: "week", label: "Semana", shortcut: "S" },
  { value: "month", label: "Mês", shortcut: "M" },
  { value: "year", label: "Ano", shortcut: "A" },
];

function getTitle(viewMode: ViewMode, currentDate: Date): string {
  switch (viewMode) {
    case "day":
      return format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    case "week": {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      if (isSameMonth(start, end)) {
        return format(start, "MMMM yyyy", { locale: ptBR });
      }
      return `${format(start, "MMM", { locale: ptBR })}. – ${format(end, "MMM. yyyy", { locale: ptBR })}`;
    }
    case "month":
      return format(currentDate, "MMMM yyyy", { locale: ptBR });
    case "year":
      return format(currentDate, "yyyy");
  }
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [showViewSelect, setShowViewSelect] = useState(false);
  const viewSelectRef = useRef<HTMLDivElement>(null);

  const { appointments, loading, setAppointments } = useAppointments();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newAptDate, setNewAptDate] = useState<string | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (viewSelectRef.current && !viewSelectRef.current.contains(e.target as Node)) {
        setShowViewSelect(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigate = (direction: "prev" | "next") => {
    setCurrentDate((d) => {
      if (viewMode === "day") return direction === "prev" ? subDays(d, 1) : addDays(d, 1);
      if (viewMode === "week") return direction === "prev" ? subWeeks(d, 1) : addWeeks(d, 1);
      if (viewMode === "year") return direction === "prev" ? subYears(d, 1) : addYears(d, 1);
      return direction === "prev" ? subMonths(d, 1) : addMonths(d, 1);
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleSave = (updated: Appointment) => {
    setAppointments((prev) => prev.map((apt) => (apt.id === updated.id ? updated : apt)));
    setSelectedAppointment(updated);
  };

  const today = new Date();

  // Period range based on current view mode + navigation date
  const periodRange = (() => {
    switch (viewMode) {
      case "day":
        return { start: new Date(format(currentDate, "yyyy-MM-dd") + "T00:00:00"), end: new Date(format(currentDate, "yyyy-MM-dd") + "T23:59:59"), label: "no dia" };
      case "week":
        return { start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }), label: "na semana" };
      case "month":
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate), label: "no mês" };
      case "year":
        return { start: startOfYear(currentDate), end: endOfYear(currentDate), label: "no ano" };
    }
  })();

  const periodApts = appointments.filter((a) =>
    isWithinInterval(new Date(a.date + "T00:00:00"), { start: periodRange.start, end: periodRange.end })
  );
  const compareceuCount = periodApts.filter((a) => a.status === "compareceu" || a.status === "fechado").length;

  // Fixed reference: today and this week (for context)
  const todayApts = appointments.filter((a) => isSameDay(new Date(a.date + "T00:00:00"), today));
  const weekApts = appointments.filter((a) => {
    const d = new Date(a.date + "T00:00:00");
    const start = startOfWeek(today, { weekStartsOn: 0 });
    const end = endOfWeek(today, { weekStartsOn: 0 });
    return d >= start && d <= end;
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const currentViewLabel = VIEW_OPTIONS.find((v) => v.value === viewMode)?.label ?? "Mês";

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agenda</h2>
          <p className="text-sm text-gray-400 mt-1">Consultas e procedimentos agendados</p>
        </div>

        <div className="flex items-center gap-2">
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
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[160px] text-center capitalize px-1">
              {getTitle(viewMode, currentDate)}
            </span>
            <button onClick={() => navigate("next")} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="relative" ref={viewSelectRef}>
            <button
              onClick={() => setShowViewSelect((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
            >
              {currentViewLabel}
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {showViewSelect && (
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 min-w-[140px]">
                {VIEW_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setViewMode(opt.value); setShowViewSelect(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 text-xs transition-colors",
                      viewMode === opt.value
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                  >
                    <span>{opt.label}</span>
                    <span className="text-gray-300 dark:text-gray-600 text-[10px] font-mono">{opt.shortcut}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{periodApts.length}</p>
            <p className="text-xs text-gray-400 capitalize">Consultas {periodRange.label}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 p-2.5 rounded-xl">
            <CalendarCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {viewMode === "day" ? weekApts.length : todayApts.length}
            </p>
            <p className="text-xs text-gray-400">
              {viewMode === "day" ? "Esta semana" : "Hoje"}
            </p>
          </div>
        </div>
<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-2.5 rounded-xl">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{compareceuCount}</p>
            <p className="text-xs text-gray-400 capitalize">Compareceram {periodRange.label}</p>
          </div>
        </div>
      </div>

      {/* Calendar views */}
      {viewMode === "month" && (
        <CalendarView
          currentDate={currentDate}
          appointments={appointments}
          onSelectAppointment={setSelectedAppointment}
          onNewAppointment={(date) => setNewAptDate(date)}
        />
      )}
      {viewMode === "week" && (
        <WeekView
          currentDate={currentDate}
          appointments={appointments}
          onSelectAppointment={setSelectedAppointment}
        />
      )}
      {viewMode === "day" && (
        <DayView
          currentDate={currentDate}
          appointments={appointments}
          onSelectAppointment={setSelectedAppointment}
        />
      )}
      {viewMode === "year" && (
        <YearView
          currentDate={currentDate}
          appointments={appointments}
          onSelectAppointment={setSelectedAppointment}
        />
      )}

      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onSave={handleSave}
          onDelete={(id) => {
            setAppointments((prev) => prev.filter((a) => a.id !== id));
            setSelectedAppointment(null);
          }}
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
