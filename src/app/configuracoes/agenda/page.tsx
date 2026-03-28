"use client";

import { Calendar } from "lucide-react";

export default function AgendaConfigPage() {
  return (
    <div className="p-8 max-w-[900px]">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
            <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agenda e Lembretes</h2>
        </div>
        <p className="text-sm text-gray-400 ml-12">Configure horários de funcionamento, lembretes automáticos e dias de folga</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-12 text-center">
        <Calendar className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">Em desenvolvimento</p>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Esta seção estará disponível em breve</p>
      </div>
    </div>
  );
}
