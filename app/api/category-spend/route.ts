import { db, lineItems, categories } from '@/db/index';
import { sql, sum, desc, eq, isNotNull } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';

export async function GET() {
  noStore();

  try {
    // This query joins line items with their categories and sums up the total price.
    const categorySpend = await db
      .select({
        category: categories.name,
        totalSpend: sql<string>`sum(${lineItems.totalPrice})`.as('total_spend'),
      })
      .from(lineItems)
      .leftJoin(categories, eq(lineItems.categoryId, categories.id))
      .where(isNotNull(categories.name)) // Ignore line items without a category
      .groupBy(categories.name)
      .orderBy(desc(sql`total_spend`));

    // Format the numbers for cleaner output
    const formattedData = categorySpend.map(c => ({
        ...c,
        totalSpend: parseFloat(c.totalSpend || '0').toFixed(2)
    }));

    return Response.json(formattedData);
  } catch (error) {
    console.error("Error fetching category spend:", error);
    return Response.json({ error: "Failed to fetch category spend" }, { status: 500 });
  }
}