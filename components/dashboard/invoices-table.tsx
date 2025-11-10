// FILE: components/dashboard/invoices-table.tsx

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBaseURL } from "@/lib/utils"; // <-- CHANGE 1: Import the helper function

// Define the type for a single invoice based on our API response
interface Invoice {
  id: number;
  invoiceDate: string | null;
  totalAmount: string;
  vendor: {
    name: string;
  }
}

// Helper to format the date string to match Figma's "DD.MM.YYYY" style
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    // Use Intl.DateTimeFormat for robust, locale-aware formatting.
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    return dateString; // Fallback to original string if parsing fails
  }
}

// This is an async Server Component, fetching data on the server.
export async function InvoicesTable() {
  const baseURL = getBaseURL(); // <-- CHANGE 2: Call the function
  const res = await fetch(`${baseURL}/api/invoices`, { cache: 'no-store' });
  const invoices: Invoice[] = await res.json();

  return (
    <Card>
      <CardHeader className="p-4"> {/* <-- REDUCED PADDING */}
        <CardTitle className="text-base font-semibold">Invoices by Vendor</CardTitle>
        <CardDescription className="text-xs">
          Top vendors by invoice count and net value.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[210px] overflow-y-auto p-0"> {/* <-- REDUCED HEIGHT & PADDING */}
        <Table>
          <TableHeader>
            <TableRow>
              {/* REDUCED FONT SIZE AND PADDING FOR HEADERS */}
              <TableHead className="px-4 py-2 text-xs font-medium text-muted-foreground">Vendor</TableHead>
              <TableHead className="px-4 py-2 text-xs font-medium text-muted-foreground"># Invoices</TableHead>
              <TableHead className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Net Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Show fewer rows to prevent scrolling within the card content */}
            {invoices.slice(0, 8).map((invoice) => (
              <TableRow key={invoice.id} className="border-b-0">
                {/* REDUCED FONT SIZE AND PADDING FOR CELLS */}
                <TableCell className="font-medium px-4 py-2 text-xs">{invoice.vendor.name}</TableCell>
                <TableCell className="px-4 py-2 text-xs">{formatDate(invoice.invoiceDate)}</TableCell>
                <TableCell className="text-right px-4 py-2 text-xs">
                  €{parseFloat(invoice.totalAmount).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
