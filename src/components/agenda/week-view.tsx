"use client";

import { startOfWeek, addDays, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
}

const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8:00 to 17:00

export function WeekView({ currentDate, appointments, onSelectAppointment }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAppointmentsForDayHour = (day: Date, hour: number) =>
    appointments.filter((a) => {
      const aptDate = new Date(a.date + "T00:00:00");
      const aptHour = parseInt(a.time.split(":")[0]);
      return isSameDay(aptDate, day) && aptHour === hour;
    });

  const isToday = (day: Date) => isSameDay(day, new Date());

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-100">
        <div className="p-2" />
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={cn(
              "p-3 text-center border-l border-gray-100",
              isToday(day) && "bg-blue-50"
            )}
          >
            <p className="text-xs text-gray-500">{format(day, "EEE", { locale: ptBR })}</p>
            <p className={cn(
              "text-lg font-semibold",
              isToday(day) ? "text-blue-600" : "text-gray-900"
            )}>
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[70px]">
            <div className="p-2 text-right pr-3">
              <span className="text-xs text-gray-400">{`${hour}:00`}</span>
            </div>
            {weekDays.map((day, dayIdx) => {
              const apts = getAppointmentsForDayHour(day, hour);
              return (
                <div
                  key={dayIdx}
                  className={cn(
                    "border-l border-t border-gray-50 p-1 relative",
                    isToday(day) && "bg-blue-50/30"
                  )}
                >
                  {apts.map((apt) => (
                    <button
                      key={apt.id}
                      onClick={() => onSelectAppointment(apt)}
                      className="w-full text-left bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-2 py-1.5 text-[11px] mb-1 transition-colors cursor-pointer"
                    >
                      <p className="font-medium truncate">{apt.leadName.split(" ")[0]}</p>
                      <p className="opacity-80 truncate">{apt.time} - {apt.procedure}</p>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
