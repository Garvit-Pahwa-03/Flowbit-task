CREATE TYPE "public"."document_type" AS ENUM('invoice', 'creditNote', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('pending', 'processed', 'paid', 'validated', 'archived');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"account_code" varchar(128),
	CONSTRAINT "categories_account_code_unique" UNIQUE("account_code")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" integer,
	"file_path" varchar(1024) NOT NULL,
	"file_name" varchar(512) NOT NULL,
	"file_size" integer,
	"file_type" varchar(128),
	"organization_id" varchar(128),
	"department_id" varchar(128),
	"uploaded_by_id" varchar(128),
	"raw_data" jsonb,
	"is_validated_by_human" boolean DEFAULT false,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(256),
	"vendor_id" integer NOT NULL,
	"status" "invoice_status" DEFAULT 'processed' NOT NULL,
	"invoice_date" date,
	"due_date" date,
	"delivery_date" date,
	"subtotal" numeric(12, 2),
	"total_tax" numeric(12, 2),
	"total_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(5),
	"document_type" "document_type" DEFAULT 'unknown',
	"payment_terms" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"category_id" integer,
	"description" varchar(1024),
	"quantity" numeric(10, 3),
	"unit_price" numeric(12, 2),
	"total_price" numeric(12, 2),
	"vat_rate" numeric(5, 2),
	"vat_amount" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"address" varchar(512),
	"tax_id" varchar(128),
	"party_number" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;