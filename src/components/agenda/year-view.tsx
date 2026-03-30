"use client";

import {
  startOfYear, endOfYear, eachMonthOfInterval,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay, format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface YearViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
}

const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function MiniMonth({ month, appointments }: { month: Date; appointments: Appointment[] }) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div className="p-4">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 capitalize">
        {format(month, "MMMM", { locale: ptBR })}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-gray-400 dark:text-gray-500 font-medium py-0.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);
          const hasApt = inMonth && appointments.some((a) => isSameDay(new Date(a.date + "T00:00:00"), day));

          return (
            <div
              key={i}
              className={cn(
                "flex items-center justify-center h-6 w-full rounded-full text-[10px] relative",
                !inMonth && "text-gray-200 dark:text-gray-700",
                inMonth && !today && "text-gray-600 dark:text-gray-400",
                today && "bg-blue-500 text-white font-bold",
              )}
            >
              {format(day, "d")}
              {hasApt && !today && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function YearView({ currentDate, appointments }: YearViewProps) {
  const months = eachMonthOfInterval({
    start: startOfYear(currentDate),
    end: endOfYear(currentDate),
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="grid grid-cols-4 divide-x divide-y divide-gray-100 dark:divide-gray-800">
        {months.map((month, i) => (
          <MiniMonth key={i} month={month} appointments={appointments} />
        ))}
      </div>
    </div>
  );
}
