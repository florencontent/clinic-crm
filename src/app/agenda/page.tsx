"use client";

import { useState } from "react";
import { format, addMonths, subMonths, addWeeks, subWeeks, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, CalendarDays, Clock, CalendarCheck } from "lucide-react";
import { CalendarView } from "@/components/agenda/calendar-view";
import { WeekView } from "@/components/agenda/week-view";
import { AppointmentModal } from "@/components/agenda/appointment-modal";
import { Appointment } from "@/data/mock-data";
import { useAppointments } from "@/hooks/use-supabase-data";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week";

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const { appointments, loading, setAppointments } = useAppointments();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

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
  const todayApts = appointments.filter((a) => isSameDay(new Date(a.date + "T00:00:00"), today));
  const weekApts = appointments.filter((a) => {
    const d = new Date(a.date + "T00:00:00");
    const start = new Date(today); start.setDate(today.getDate() - today.getDay());
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return d >= start && d <= end;
  });

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
          <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
          <p className="text-sm text-gray-400 mt-1">Consultas e procedimentos agendados</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-lg transition-all",
                viewMode === "month" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-lg transition-all",
                viewMode === "week" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
              )}
            >
              Semanal
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
          >
            Hoje
          </button>

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl shadow-sm px-1">
            <button onClick={() => navigate("prev")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900 min-w-[150px] text-center capitalize px-1">
              {format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Semana de' d MMM", { locale: ptBR })}
            </span>
            <button onClick={() => navigate("next")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{todayApts.length}</p>
            <p className="text-xs text-gray-400">Consultas hoje</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="bg-violet-50 text-violet-600 p-2.5 rounded-xl">
            <CalendarCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{weekApts.length}</p>
            <p className="text-xs text-gray-400">Esta semana</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            <p className="text-xs text-gray-400">Total agendado</p>
          </div>
        </div>
      </div>

      {viewMode === "month" ? (
        <CalendarView
          currentDate={currentDate}
          appointments={appointments}
          onSelectAppointment={setSelectedAppointment}
        />
      ) : (
        <WeekView
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
        />
      )}
    </div>
  );
}
