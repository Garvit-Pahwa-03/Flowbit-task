import {
  pgTable,
  serial,
  varchar,
  decimal,
  timestamp,
  date,
  integer,
  boolean,
  jsonb,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Enums to enforce data consistency for specific fields.
 */
export const invoiceStatusEnum = pgEnum("invoice_status", ['pending', 'processed', 'paid', 'validated', 'archived']);
export const documentTypeEnum = pgEnum("document_type", ['invoice', 'creditNote', 'unknown']);

/**
 * ## Vendors Table
 * 
 * Stores information about each vendor. A unique vendor is identified by its name.
 * Additional details like address and tax ID are included for comprehensive records.
 */
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull().unique(),
  address: varchar("address", { length: 512 }),
  taxId: varchar("tax_id", { length: 128 }),
  partyNumber: varchar("party_number", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * ## Categories Table
 * 
 * Stores spending categories. In your data, this corresponds to 'Sachkonto'.
 * This table allows mapping an account code to a human-readable name.
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  accountCode: varchar("account_code", { length: 128 }).unique(), // From 'Sachkonto'
});

/**
 * ## Invoices Table
 * 
 * This is the central table, holding the core financial data extracted from documents.
 * It links to vendors and contains all summary amounts and key dates.
 */
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 256 }),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  status: invoiceStatusEnum("status").default('processed').notNull(),
  
  invoiceDate: date("invoice_date"),
  dueDate: date("due_date"),
  deliveryDate: date("delivery_date"),

  subtotal: decimal("subtotal", { precision: 12, scale: 2 }),
  totalTax: decimal("total_tax", { precision: 12, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 5 }),

  documentType: documentTypeEnum("document_type").default('unknown'),
  paymentTerms: varchar("payment_terms", { length: 512 }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * ## Line Items Table
 * 
 * Each record represents a single line item from an invoice, allowing for
 * detailed spend analysis by category.
 */
export const lineItems = pgTable("line_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: 'set null' }),

  description: varchar("description", { length: 1024 }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }),
  
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }),
  vatAmount: decimal("vat_amount", { precision: 12, scale: 2 }),
});

/**
 * ## Documents Table
 * 
 * Stores metadata about the original uploaded files and links them to the
 * extracted, structured invoice data. Storing the raw JSON is crucial for
 * auditing and reprocessing.
 */
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(), // Corresponds to '_id' in the JSON
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: 'set null' }).unique(),

  filePath: varchar("file_path", { length: 1024 }).notNull(),
  fileName: varchar("file_name", { length: 512 }).notNull(),
  fileSize: integer("file_size"),
  fileType: varchar("file_type", { length: 128 }),

  organizationId: varchar("organization_id", { length: 128 }),
  departmentId: varchar("department_id", { length: 128 }),
  uploadedById: varchar("uploaded_by_id", { length: 128 }),
  
  rawData: jsonb("raw_data"), // Stores the original 'extractedData' object
  isValidatedByHuman: boolean("is_validated_by_human").default(false),
  
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});


// --- RELATIONS ---
// Defining relations allows for easy and type-safe joining of tables.

export const vendorsRelations = relations(vendors, ({ many }) => ({
  invoices: many(invoices),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  lineItems: many(lineItems),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [invoices.vendorId],
    references: [vendors.id],
  }),
  lineItems: many(lineItems),
  document: one(documents, { // A given invoice is created from one document
    fields: [invoices.id],
    references: [documents.invoiceId],
  }),
}));

export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [lineItems.invoiceId],
    references: [invoices.id],
  }),
  category: one(categories, {
    fields: [lineItems.categoryId],
    references: [categories.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  invoice: one(invoices, {
    fields: [documents.invoiceId],
    references: [invoices.id],
  }),
}));