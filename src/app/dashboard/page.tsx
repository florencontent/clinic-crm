import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { SourcePieChart } from "@/components/dashboard/source-pie-chart";
import { ConversionBarChart } from "@/components/dashboard/conversion-bar-chart";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Visão geral do desempenho da clínica</p>
      </div>

      <div className="space-y-6">
        <MetricsCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelChart />
          <SourcePieChart />
        </div>

        <ConversionBarChart />
      </div>
    </div>
  );
}
