import type { Config } from "@netlify/functions";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { needs, preachers } from "../../db/schema.js";

const json = (data: unknown, status = 200) => Response.json(data, { status });
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const cents = (value: unknown) => Math.max(0, Math.round(Number(value) * 100));

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const resource = url.searchParams.get("resource") || "preachers";
    const id = Number(url.searchParams.get("id"));

    if (req.method === "GET") {
      if (resource === "needs") {
        const preacherId = Number(url.searchParams.get("preacherId"));
        const rows = preacherId
          ? await db.select().from(needs).where(eq(needs.preacherId, preacherId)).orderBy(desc(needs.updatedAt))
          : await db.select().from(needs).orderBy(desc(needs.updatedAt));
        return json(rows);
      }
      const slug = url.searchParams.get("slug");
      const people = slug
        ? await db.select().from(preachers).where(eq(preachers.slug, slug))
        : await db.select().from(preachers).orderBy(asc(preachers.name));
      const allNeeds = await db.select().from(needs).orderBy(desc(needs.updatedAt));
      return json(people.map((person) => ({ ...person, needs: allNeeds.filter((need) => need.preacherId === person.id) })));
    }

    const body = await req.json() as Record<string, unknown>;
    if (req.method === "POST" && resource === "preachers") {
      const name = String(body.name || "").trim();
      const location = String(body.location || "").trim();
      if (!name || !location) return json({ error: "Name and location are required." }, 400);
      const [created] = await db.insert(preachers).values({
        name, location, bio: String(body.bio || "").trim(), avatar: String(body.avatar || "TC").slice(0, 3).toUpperCase(),
        slug: slugify(String(body.slug || name)), status: String(body.status || "active"),
      }).returning();
      return json(created, 201);
    }
    if (req.method === "POST" && resource === "needs") {
      if (!Number(body.preacherId) || !String(body.title || "").trim()) return json({ error: "Preacher and need title are required." }, 400);
      const [created] = await db.insert(needs).values({
        preacherId: Number(body.preacherId), title: String(body.title).trim(), purpose: String(body.purpose || "").trim(),
        category: String(body.category || "General").trim(), goalCents: cents(body.goal), fundedCents: cents(body.funded),
        status: String(body.status || "open"), notes: String(body.notes || "").trim(),
      }).returning();
      return json(created, 201);
    }
    if (!id) return json({ error: "A valid record id is required." }, 400);
    if (req.method === "PATCH" && resource === "preachers") {
      const name = String(body.name || "").trim();
      const [updated] = await db.update(preachers).set({
        name, location: String(body.location || "").trim(), bio: String(body.bio || "").trim(),
        avatar: String(body.avatar || "TC").slice(0, 3).toUpperCase(), slug: slugify(String(body.slug || name)),
        status: String(body.status || "active"), updatedAt: new Date(),
      }).where(eq(preachers.id, id)).returning();
      return updated ? json(updated) : json({ error: "Preacher not found." }, 404);
    }
    if (req.method === "PATCH" && resource === "needs") {
      const [updated] = await db.update(needs).set({
        preacherId: Number(body.preacherId), title: String(body.title || "").trim(), purpose: String(body.purpose || "").trim(),
        category: String(body.category || "General").trim(), goalCents: cents(body.goal), fundedCents: cents(body.funded),
        status: String(body.status || "open"), notes: String(body.notes || "").trim(), updatedAt: new Date(),
      }).where(and(eq(needs.id, id), eq(needs.preacherId, Number(body.preacherId)))).returning();
      return updated ? json(updated) : json({ error: "Need not found." }, 404);
    }
    if (req.method === "DELETE") {
      const table = resource === "needs" ? needs : preachers;
      const [deleted] = await db.delete(table).where(eq(table.id, id)).returning();
      return deleted ? new Response(null, { status: 204 }) : json({ error: "Record not found." }, 404);
    }
    return json({ error: "Method not allowed." }, 405);
  } catch (error) {
    const message = error instanceof Error && error.message.includes("unique") ? "That URL slug is already in use." : "The request could not be completed.";
    return json({ error: message }, 500);
  }
};

export const config: Config = { path: "/api/ministry" };
