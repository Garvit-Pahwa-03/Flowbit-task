import { db, invoices } from '@/db/index';
import { sql, count, sum } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';

export async function GET() {
  noStore();

  try {
    // This query groups invoices by month and calculates the count and total spend for each.
    // to_char is a PostgreSQL function to format a date. 'YYYY-MM' gives us a sortable month string.
    const monthlyTrends = await db
      .select({
        month: sql<string>`to_char(${invoices.invoiceDate}, 'YYYY-MM')`.as('month'),
        invoiceCount: count(invoices.id),
        totalSpend: sum(invoices.totalAmount),
      })
      .from(invoices)
      .groupBy(sql`to_char(${invoices.invoiceDate}, 'YYYY-MM')`)
      .orderBy(sql`month DESC`) // Order by month, newest first
      .limit(12); // Limit to the last 12 months found in the data

    // Reverse the array to have the oldest month first for the chart
    const formattedData = monthlyTrends.reverse();

    // The frontend chart library will likely want separate arrays for labels and data.
    const labels = formattedData.map(item => item.month);
    const invoiceCounts = formattedData.map(item => item.invoiceCount);
    const totalSpends = formattedData.map(item => parseFloat(item.totalSpend || '0'));

    return Response.json({
      labels,
      invoiceCounts,
      totalSpends,
    });
    
  } catch (error) {
    console.error("Error fetching invoice trends:", error);
    return Response.json({ error: "Failed to fetch invoice trends" }, { status: 500 });
  }
}