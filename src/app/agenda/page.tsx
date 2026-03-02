"use client";

import { useState } from "react";
import { format, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
      setCurrentDate((d) => (direction === "prev" ? subMonths(d, 1) : addMonths(d, 1)));
    } else {
      setCurrentDate((d) => (direction === "prev" ? subWeeks(d, 1) : addWeeks(d, 1)));
    }
  };

  const handleSave = (updated: Appointment) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === updated.id ? updated : apt))
    );
    setSelectedAppointment(updated);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
          <p className="text-sm text-gray-500 mt-1">Consultas e procedimentos agendados</p>
        </div>

        <div className="flex items-center gap-4">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                viewMode === "month"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                viewMode === "week"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Semanal
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("prev")}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-gray-900 min-w-[160px] text-center capitalize">
              {format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Semana de' d MMM", { locale: ptBR })}
            </span>
            <button
              onClick={() => navigate("next")}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
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
