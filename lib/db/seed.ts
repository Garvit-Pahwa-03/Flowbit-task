import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

// Import all your schemas and the db instance
import * as schema from './schema';

console.log("🌱 Starting to seed the database...");

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required for seeding');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

// Helper function to safely convert date strings to Date objects
const safeDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
};

// Helper function to validate date strings for PostgreSQL
const validateDateString = (dateString: any): string | null => {
  if (!dateString) return null;
  
  // Check if it's a valid date string format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    console.warn(`   ⚠️  Invalid date format: ${dateString}, skipping...`);
    return null;
  }
  
  // Verify it's a valid date
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.warn(`   ⚠️  Invalid date value: ${dateString}, skipping...`);
    return null;
  }
  
  return dateString;
};

// The main function to execute our seeding logic
const main = async () => {
  try {
    // --- 1. CLEAR EXISTING DATA ---
    // Delete in reverse order of creation to avoid foreign key constraint errors
    console.log("🗑️  Clearing existing data...");
    await db.delete(schema.lineItems);
    await db.delete(schema.documents);
    await db.delete(schema.invoices);
    await db.delete(schema.vendors);
    await db.delete(schema.categories);
    console.log("✅ Cleared data successfully.");

    // --- 2. READ THE JSON FILE ---
    const filePath = path.join(process.cwd(), 'Analytics_Test_Data.json');
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`📑 Found ${jsonData.length} documents to process.`);

    // --- 3. ITERATE AND INSERT DATA ---
    for (const [index, doc] of jsonData.entries()) {
      console.log(`\nProcessing document ${index + 1} of ${jsonData.length} (ID: ${doc._id})`);

      const llmData = doc.extractedData?.llmData;

      // Skip records with malformed or missing data
      if (!llmData || typeof llmData !== 'object' || !llmData.vendor?.value?.vendorName?.value) {
        console.warn(`   ⚠️  Skipping document due to missing vendor name or malformed data.`);
        continue;
      }

      // --- VENDOR (UPSERT) ---
      const vendorData = llmData.vendor.value;
      const [vendor] = await db
        .insert(schema.vendors)
        .values({
          name: vendorData.vendorName.value,
          address: vendorData.vendorAddress?.value,
          taxId: vendorData.vendorTaxId?.value,
          partyNumber: vendorData.vendorPartyNumber?.value,
        })
        .onConflictDoUpdate({
          target: schema.vendors.name,
          set: {
            address: vendorData.vendorAddress?.value,
            taxId: vendorData.vendorTaxId?.value,
          },
        })
        .returning();
      console.log(`   📇  Upserted vendor: ${vendor.name} (ID: ${vendor.id})`);

      // --- INVOICE ---
      const invoiceData = llmData.invoice.value;
      const summaryData = llmData.summary.value;
      const paymentData = llmData.payment.value;

      const [invoice] = await db
        .insert(schema.invoices)
        .values({
          vendorId: vendor.id,
          invoiceNumber: invoiceData.invoiceId?.value,
          status: doc.status === 'processed' ? 'processed' : 'pending',
          invoiceDate: validateDateString(invoiceData.invoiceDate?.value),
          dueDate: validateDateString(paymentData.dueDate?.value),
          deliveryDate: validateDateString(invoiceData.deliveryDate?.value),
          subtotal: String(summaryData.subTotal?.value || 0),
          totalTax: String(summaryData.totalTax?.value || 0),
          totalAmount: String(summaryData.invoiceTotal?.value || 0),
          currency: summaryData.currencySymbol?.value,
          documentType: summaryData.documentType?.value === 'creditNote' ? 'creditNote' : 'invoice',
          paymentTerms: paymentData.paymentTerms?.value,
        })
        .returning();
      console.log(`   🧾  Inserted invoice: ${invoice.invoiceNumber} (ID: ${invoice.id})`);

      // --- LINE ITEMS & CATEGORIES (UPSERT) ---
      const lineItemsData = llmData.lineItems?.value?.items?.value;
      if (lineItemsData && Array.isArray(lineItemsData)) {
        const lineItemsToInsert = [];
        for (const item of lineItemsData) {
          let categoryId = null;
          // Only process category if 'Sachkonto' exists and has a value
          if (item.Sachkonto?.value) {
            const accountCode = String(item.Sachkonto.value);
            const [category] = await db
              .insert(schema.categories)
              .values({
                accountCode: accountCode,
                name: `Account ${accountCode}`, // Placeholder name
              })
              .onConflictDoUpdate({
                target: schema.categories.accountCode,
                set: { name: `Account ${accountCode}` },
              })
              .returning();
            categoryId = category.id;
          }

          lineItemsToInsert.push({
            invoiceId: invoice.id,
            categoryId: categoryId,
            description: item.description?.value,
            quantity: String(item.quantity?.value || 0),
            unitPrice: String(item.unitPrice?.value || 0),
            totalPrice: String(item.totalPrice?.value || 0),
            vatRate: String(item.vatRate?.value || 0),
            vatAmount: String(item.vatAmount?.value || 0),
          });
        }

        if (lineItemsToInsert.length > 0) {
          await db.insert(schema.lineItems).values(lineItemsToInsert);
          console.log(`   📋  Inserted ${lineItemsToInsert.length} line items.`);
        }
      }

      // --- DOCUMENT ---
      // Convert MongoDB $date format to proper JavaScript Date objects
      await db.insert(schema.documents).values({
        id: doc._id,
        invoiceId: invoice.id,
        filePath: doc.filePath,
        fileName: doc.name,
        fileSize: parseInt(doc.fileSize?.$numberLong || '0', 10),
        fileType: doc.fileType,
        organizationId: doc.organizationId,
        departmentId: doc.departmentId,
        uploadedById: doc.uploadedById,
        rawData: doc.extractedData, // Store the original JSON data
        isValidatedByHuman: doc.isValidatedByHuman,
        processedAt: safeDate(doc.processedAt?.$date),
        createdAt: safeDate(doc.createdAt?.$date) || new Date(),
        updatedAt: safeDate(doc.updatedAt?.$date) || new Date(),
      });
      console.log(`   📄  Inserted document record.`);
    }

    console.log("\n✅ Database seeding completed successfully!");
    process.exit(0);

  } catch (error) {
    console.error('❌ An error occurred during the seeding process:', error);
    process.exit(1);
  }
};

// Run the main function
main();