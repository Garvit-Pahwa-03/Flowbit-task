import { db, invoices, documents } from '@/db/index';
import { sql, count, avg, sum } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';

export async function GET() {
  noStore();

  try {
    const today = new Date();
    const currentYearStart = new Date(today.getFullYear(), 0, 1);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Total Spend (YTD)
    const [spendYTD] = await db.select({ value: sum(invoices.totalAmount) }).from(invoices).where(sql`${invoices.invoiceDate} >= ${currentYearStart}`);
    
    // 2. Total Invoices Processed (Using all invoices for this metric)
    const [totalInvoices] = await db.select({ value: count(invoices.id) }).from(invoices);
    
    // 3. Documents Uploaded (This Month)
    const [docsThisMonth] = await db.select({ value: count(documents.id) }).from(documents).where(sql`${documents.createdAt} >= ${currentMonthStart}`);
    
    // 4. Average Invoice Value (Using all invoices)
    const [avgInvoiceValue] = await db.select({ value: avg(invoices.totalAmount) }).from(invoices);

    const stats = {
      totalSpendYTD: parseFloat(spendYTD.value || '0').toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalInvoicesProcessed: totalInvoices.value || 0,
      documentsUploadedThisMonth: docsThisMonth.value || 0,
      averageInvoiceValue: parseFloat(avgInvoiceValue.value || '0').toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    };
    
    return Response.json(stats);
  } catch (error) {
    console.error("Error fetching simplified stats:", error);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}