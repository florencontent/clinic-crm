"use client";

import { startOfWeek, addDays, format, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  missedAppointmentIds?: Set<string>;
}

const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8h–18h

const APT_GRADIENTS = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-violet-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

export function WeekView({ currentDate, appointments, onSelectAppointment, missedAppointmentIds }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAppointmentsForDayHour = (day: Date, hour: number) =>
    appointments.filter((a) => {
      const aptDate = new Date(a.date + "T00:00:00");
      const aptHour = parseInt(a.time.split(":")[0]);
      return isSameDay(aptDate, day) && aptHour === hour;
    });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-gray-100 dark:border-gray-800">
        <div className="p-3" />
        {weekDays.map((day, i) => {
          const today = isToday(day);
          return (
            <div
              key={i}
              className={cn(
                "p-3 text-center border-l border-gray-100 dark:border-gray-800",
                today && "bg-blue-50 dark:bg-blue-900/20"
              )}
            >
              <p className={cn(
                "text-[11px] font-medium uppercase tracking-wide",
                today ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
              )}>
                {format(day, "EEE", { locale: ptBR })}
              </p>
              <p className={cn(
                "text-xl font-bold mt-0.5",
                today ? "text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-gray-300"
              )}>
                {format(day, "d")}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="max-h-[580px] overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-[56px_repeat(7,1fr)] min-h-[68px]">
            <div className="flex items-start justify-end pr-3 pt-2">
              <span className="text-[11px] text-gray-300 dark:text-gray-600 font-medium">{`${hour}h`}</span>
            </div>
            {weekDays.map((day, dayIdx) => {
              const apts = getAppointmentsForDayHour(day, hour);
              const today = isToday(day);
              return (
                <div
                  key={dayIdx}
                  className={cn(
                    "border-l border-t border-gray-50 dark:border-gray-800 p-1.5",
                    today && "bg-blue-50/20 dark:bg-blue-900/10"
                  )}
                >
                  {apts.map((apt, aptIdx) => {
                    const isMissed = missedAppointmentIds?.has(apt.id) ?? false;
                    return (
                    <button
                      key={apt.id}
                      onClick={() => onSelectAppointment(apt)}
                      className={cn(
                        "w-full text-left text-white rounded-xl px-2.5 py-2 text-[11px] mb-1 transition-all hover:opacity-90 hover:shadow-md bg-gradient-to-b",
                        isMissed ? "from-red-500 to-red-600" : APT_GRADIENTS[aptIdx % APT_GRADIENTS.length]
                      )}
                    >
                      <p className="font-semibold truncate">{isMissed ? "⚠ " : ""}{apt.leadName.split(" ")[0]}</p>
                      <p className="opacity-80 text-[10px] truncate mt-0.5">{apt.time} · {apt.procedure}</p>
                    </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
