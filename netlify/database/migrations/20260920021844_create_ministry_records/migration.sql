CREATE TABLE "needs" (
	"id" serial PRIMARY KEY,
	"preacher_id" integer NOT NULL,
	"title" text NOT NULL,
	"purpose" text NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"goal_cents" integer NOT NULL,
	"funded_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preachers" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"location" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"avatar" text DEFAULT 'TC' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "needs" ADD CONSTRAINT "needs_preacher_id_preachers_id_fkey" FOREIGN KEY ("preacher_id") REFERENCES "preachers"("id") ON DELETE CASCADE;