"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  currentDate: Date;
  appointments: Appointment[];
}

export function CalendarView({ currentDate, appointments }: CalendarViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { locale: ptBR });
  const calEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getAppointmentsForDay = (day: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.date + "T00:00:00"), day));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-7">
        {weekDays.map((day) => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 border-b border-gray-100">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayAppointments = getAppointmentsForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          return (
            <div
              key={i}
              className={cn(
                "min-h-[100px] p-2 border-b border-r border-gray-50",
                !inMonth && "bg-gray-50/50"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                  !inMonth && "text-gray-300",
                  inMonth && "text-gray-700",
                  isToday(day) && "bg-blue-500 text-white"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-1">
                {dayAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded truncate"
                  >
                    {apt.time} {apt.leadName.split(" ")[0]}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <span className="text-[10px] text-gray-400">+{dayAppointments.length - 3} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
