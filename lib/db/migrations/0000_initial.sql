-- Migration: 0000_initial
-- Created: 2025-01-27

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"department_id" uuid NOT NULL,
	"roles" json DEFAULT '[]'::json NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create departments table
CREATE TABLE IF NOT EXISTS "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create roles table
CREATE TABLE IF NOT EXISTS "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"permissions" json DEFAULT '[]'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"module" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create eons table
CREATE TABLE IF NOT EXISTS "eons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"subject" text NOT NULL,
	"description_rich" text NOT NULL,
	"category_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"final_approver_id" uuid,
	"state" text DEFAULT 'DRAFT' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create eon_approvers table
CREATE TABLE IF NOT EXISTS "eon_approvers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eon_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"approver_user_id" uuid NOT NULL,
	"is_final" boolean DEFAULT false NOT NULL,
	"alternate_user_id" uuid,
	"acted_at" timestamp,
	"action" text DEFAULT 'NONE' NOT NULL,
	"comment_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create eon_viewers table
CREATE TABLE IF NOT EXISTS "eon_viewers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"added_by_user_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);

-- Create eon_comments table
CREATE TABLE IF NOT EXISTS "eon_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eon_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"body_rich" text NOT NULL,
	"visibility" text DEFAULT 'all' NOT NULL,
	"type" text DEFAULT 'GENERAL' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create eon_attachments table
CREATE TABLE IF NOT EXISTS "eon_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eon_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"details" json,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create unique constraints
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
ALTER TABLE "departments" ADD CONSTRAINT "departments_code_unique" UNIQUE("code");
ALTER TABLE "roles" ADD CONSTRAINT "roles_name_unique" UNIQUE("name");
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_name_unique" UNIQUE("name");
ALTER TABLE "eons" ADD CONSTRAINT "eons_number_unique" UNIQUE("number");

-- Create foreign key constraints
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eons" ADD CONSTRAINT "eons_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eons" ADD CONSTRAINT "eons_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eons" ADD CONSTRAINT "eons_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eons" ADD CONSTRAINT "eons_final_approver_id_users_id_fk" FOREIGN KEY ("final_approver_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eon_approvers" ADD CONSTRAINT "eon_approvers_eon_id_eons_id_fk" FOREIGN KEY ("eon_id") REFERENCES "eons"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eon_approvers" ADD CONSTRAINT "eon_approvers_approver_user_id_users_id_fk" FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eon_approvers" ADD CONSTRAINT "eon_approvers_alternate_user_id_users_id_fk" FOREIGN KEY ("alternate_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eon_approvers" ADD CONSTRAINT "eon_approvers_comment_id_eon_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "eon_comments"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eon_viewers" ADD CONSTRAINT "eon_viewers_eon_id_eons_id_fk" FOREIGN KEY ("eon_id") REFERENCES "eons"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eon_viewers" ADD CONSTRAINT "eon_viewers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eon_viewers" ADD CONSTRAINT "eon_viewers_added_by_user_id_users_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eon_comments" ADD CONSTRAINT "eon_comments_eon_id_eons_id_fk" FOREIGN KEY ("eon_id") REFERENCES "eons"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eon_comments" ADD CONSTRAINT "eon_comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eon_attachments" ADD CONSTRAINT "eon_attachments_eon_id_eons_id_fk" FOREIGN KEY ("eon_id") REFERENCES "eons"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "eon_attachments" ADD CONSTRAINT "eon_attachments_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
