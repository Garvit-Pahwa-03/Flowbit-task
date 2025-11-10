// FILE: app/page.tsx

import { Suspense } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { InvoiceTrendChart } from "@/components/dashboard/invoice-trend-chart";
import { VendorSpendChart } from "@/components/dashboard/vendor-spend-chart";
import { CategorySpendChart } from "@/components/dashboard/category-spend-chart";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { InvoicesTable } from "@/components/dashboard/invoices-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getBaseURL } from "@/lib/utils"; // <-- CHANGE 1: Import the helper function

const LoadingSkeleton = ({ title, className }: { title: string, className?: string }) => (
  <Card className={className}>
    <CardHeader><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
    <CardContent className="h-[280px] flex items-center justify-center bg-gray-100 animate-pulse rounded-b-lg" />
  </Card>
);

type Stats = {
  totalSpendYTD: string; totalInvoicesProcessed: number;
  documentsUploadedThisMonth: number; averageInvoiceValue: string;
};

export default async function DashboardPage() {
  const baseURL = getBaseURL(); // <-- CHANGE 2: Call the function to get the correct URL
  const res = await fetch(`${baseURL}/api/stats`, { cache: 'no-store' }); // Use the baseURL here

  if (!res.ok) { return <div className="p-6 text-red-500">Error: Could not load dashboard stats. Is the backend running?</div>; }
  const stats: Stats = await res.json();

  return (
    <div className="flex flex-col gap-4">
      {/* ROW 1: Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Spend"
          subtitle="(YTD)"
          value={`€${stats.totalSpendYTD}`}
          change="+8.2% from last month"
          isPositive={true}
          showGraph={true}
        />
        <StatCard
          title="Total Invoices Processed"
          value={stats.totalInvoicesProcessed}
          change="+8.2% from last month"
          isPositive={true}
          showGraph={true}
        />
        <StatCard
          title="Documents Uploaded"
          subtitle="This Month"
          value={stats.documentsUploadedThisMonth}
          change="-8 less from last month"
          isPositive={false}
          showGraph={true}
        />
        <StatCard
          title="Average Invoice Value"
          value={`€${stats.averageInvoiceValue}`}
          change="+8.2% from last month"
          isPositive={true}
          showGraph={false}
        />
      </div>

      {/* ROW 2: The Two Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Suspense fallback={<LoadingSkeleton title="Invoice Volume + Value Trend" />}>
          <InvoiceTrendChart />
        </Suspense>
        <Suspense fallback={<LoadingSkeleton title="Spend by Vendor (Top 10)" />}>
          <VendorSpendChart />
        </Suspense>
      </div>

      {/* ROW 3: The Bottom Three Components */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Suspense fallback={<LoadingSkeleton title="Spend by Category" />}>
          <CategorySpendChart />
        </Suspense>
        <Suspense fallback={<LoadingSkeleton title="Cash Outflow Forecast" />}>
          <CashflowChart />
        </Suspense>
        <Suspense fallback={<LoadingSkeleton title="Invoices by Vendor" />}>
          <InvoicesTable />
        </Suspense>
      </div>
    </div>
  );
}
