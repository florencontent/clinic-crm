import { KanbanBoard } from "@/components/kanban/board";

export default function KanbanPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pipeline de Vendas</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie seus leads e acompanhe o funil</p>
      </div>
      <KanbanBoard />
    </div>
  );
}
