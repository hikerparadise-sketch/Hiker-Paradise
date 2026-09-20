import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const preachers = pgTable("preachers", {
  id: serial().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  location: text().notNull(),
  bio: text().notNull().default(""),
  avatar: text().notNull().default("TC"),
  status: text().notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const needs = pgTable("needs", {
  id: serial().primaryKey(),
  preacherId: integer("preacher_id").notNull().references(() => preachers.id, { onDelete: "cascade" }),
  title: text().notNull(),
  purpose: text().notNull(),
  category: text().notNull().default("General"),
  goalCents: integer("goal_cents").notNull(),
  fundedCents: integer("funded_cents").notNull().default(0),
  status: text().notNull().default("open"),
  notes: text().notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

