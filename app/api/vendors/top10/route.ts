import { db, invoices, vendors } from '@/db/index';
import { sql, sum, desc } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';

export async function GET() {
  noStore();

  try {
    const topVendors = await db
      .select({
        vendorName: vendors.name,
        totalSpend: sql<string>`sum(${invoices.totalAmount})`.as('total_spend'),
      })
      .from(invoices)
      .leftJoin(vendors, eq(invoices.vendorId, vendors.id))
      .groupBy(vendors.name)
      .orderBy(desc(sql`total_spend`))
      .limit(10);
      
    // Format the numbers for cleaner output
    const formattedData = topVendors.map(v => ({
        ...v,
        totalSpend: parseFloat(v.totalSpend || '0').toFixed(2)
    }));

    return Response.json(formattedData);
  } catch (error) {
    console.error("Error fetching top vendors:", error);
    return Response.json({ error: "Failed to fetch top vendors" }, { status: 500 });
  }
}