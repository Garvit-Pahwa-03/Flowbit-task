import { db } from '@/db/index';
import { unstable_noStore as noStore } from 'next/cache';

export async function GET() {
  noStore();
  try {
    const invoices = await db.query.invoices.findMany({
      with: {
        vendor: true, // This joins the vendor table automatically
      },
      orderBy: (invoices, { desc }) => [desc(invoices.invoiceDate)],
      limit: 20, // Get the 20 most recent invoices
    });
    return Response.json(invoices);
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return Response.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}