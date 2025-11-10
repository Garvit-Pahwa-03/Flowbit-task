import { db, invoices } from '@/db/index';
import { sql, and, ne, gte, isNotNull } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';

export async function GET() {
  noStore();

  try {
    // Get current date at start of day in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Format as YYYY-MM-DD for proper SQL date comparison
    const todayStr = today.toISOString().split('T')[0];

    console.log('Today date:', today);
    console.log('Today string for comparison:', todayStr);

    // First, let's see all invoices to debug
    const allInvoices = await db
      .select({
        id: invoices.id,
        status: invoices.status,
        dueDate: invoices.dueDate,
        totalAmount: invoices.totalAmount,
      })
      .from(invoices);

    console.log('All invoices:', allInvoices);
    console.log('Total invoices count:', allInvoices.length);

    // Fetch all unpaid invoices with a future due date
    // Updated to handle 'processed' status and use proper date comparison
    const unpaidInvoices = await db
      .select({
        dueDate: invoices.dueDate,
        totalAmount: invoices.totalAmount,
        status: invoices.status,
      })
      .from(invoices)
      .where(
        and(
          ne(invoices.status, 'paid'),
          isNotNull(invoices.dueDate),
          sql`${invoices.dueDate} >= ${todayStr}`
        )
      );

    console.log('Unpaid invoices with future due dates:', unpaidInvoices);
    console.log('Unpaid invoices count:', unpaidInvoices.length);

    // Initialize buckets matching the Figma design
    const outflow = {
      '0-7 days': 0,
      '8-30 days': 0,
      '31-60 days': 0,
      '60+ days': 0,
    };

    const oneDay = 1000 * 60 * 60 * 24;

    // Process invoices and categorize by due date
    for (const invoice of unpaidInvoices) {
      console.log('Processing invoice:', {
        dueDate: invoice.dueDate,
        status: invoice.status,
        amount: invoice.totalAmount
      });

      if (invoice.dueDate) {
        const dueDate = new Date(invoice.dueDate + 'T00:00:00'); // Ensure proper parsing
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / oneDay);
        const amount = Math.abs(parseFloat(invoice.totalAmount || '0')); // Use absolute value

        console.log(`Due date: ${dueDate.toISOString()}, Days from today: ${diffDays}, Amount: ${amount}`);

        if (diffDays >= 0 && diffDays <= 7) {
          outflow['0-7 days'] += amount;
          console.log('Added to 0-7 days bucket');
        } else if (diffDays >= 8 && diffDays <= 30) {
          outflow['8-30 days'] += amount;
          console.log('Added to 8-30 days bucket');
        } else if (diffDays >= 31 && diffDays <= 60) {
          outflow['31-60 days'] += amount;
          console.log('Added to 31-60 days bucket');
        } else if (diffDays > 60) {
          outflow['60+ days'] += amount;
          console.log('Added to 60+ days bucket');
        }
      }
    }

    console.log('Final outflow buckets:', outflow);

    // Convert to array format with consistent ordering
    const formattedData = [
      { range: '0-7 days', totalAmount: outflow['0-7 days'].toFixed(2) },
      { range: '8-30 days', totalAmount: outflow['8-30 days'].toFixed(2) },
      { range: '31-60 days', totalAmount: outflow['31-60 days'].toFixed(2) },
      { range: '60+ days', totalAmount: outflow['60+ days'].toFixed(2) },
    ];

    console.log('Cash Outflow Data:', formattedData);

    return Response.json(formattedData);
  } catch (error) {
    console.error("Error fetching cash outflow:", error);
    return Response.json({ error: "Failed to fetch cash outflow" }, { status: 500 });
  }
}