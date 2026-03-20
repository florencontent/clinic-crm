"use client";

import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday, isWeekend,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
}

const APT_COLORS = [
  "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/70",
  "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/50 dark:text-violet-300 dark:hover:bg-violet-900/70",
  "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900/70",
  "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900/70",
  "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-900/70",
];

export function CalendarView({ currentDate, appointments, onSelectAppointment }: CalendarViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { locale: ptBR });
  const calEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getAppointmentsForDay = (day: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.date + "T00:00:00"), day));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={cn(
              "py-3 text-center text-xs font-semibold",
              i === 0 || i === 6
                ? "text-gray-300 dark:text-gray-600"
                : "text-gray-400 dark:text-gray-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayApts = getAppointmentsForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          const weekend = isWeekend(day);
          const today = isToday(day);

          return (
            <div
              key={i}
              className={cn(
                "min-h-[110px] p-2.5 border-b border-r border-gray-50 dark:border-gray-800 transition-colors",
                !inMonth && "bg-gray-50/40 dark:bg-gray-800/30",
                weekend && inMonth && "bg-gray-50/60 dark:bg-gray-800/20",
                today && "bg-blue-50/40 dark:bg-blue-900/15"
              )}
            >
              <span
                className={cn(
                  "text-xs font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full mb-1",
                  !inMonth && "text-gray-300 dark:text-gray-700",
                  inMonth && !today && "text-gray-600 dark:text-gray-400",
                  today && "bg-blue-500 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900"
                )}
              >
                {format(day, "d")}
              </span>

              <div className="space-y-0.5">
                {dayApts.slice(0, 3).map((apt, aptIdx) => (
                  <button
                    key={apt.id}
                    onClick={() => onSelectAppointment(apt)}
                    className={cn(
                      "w-full text-left text-[10px] font-medium px-1.5 py-1 rounded-lg truncate transition-colors",
                      APT_COLORS[aptIdx % APT_COLORS.length]
                    )}
                  >
                    {apt.time} · {apt.leadName.split(" ")[0]}
                  </button>
                ))}
                {dayApts.length > 3 && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 pl-1">
                    +{dayApts.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
