import { randomUUID } from "node:crypto";
import { z } from "zod";
import { database, query, demoMode, type Database } from "./db";
import { AppError } from "./errors";
import {
  eventAccess,
  businessAccess,
  quoteAccess,
  allowRole,
  withinCity,
} from "./policy";
import { cities, type User } from "@/lib/types";
import { photos } from "@/lib/catalog";
import { hashPassword, verifyPassword } from "./password";
const id = () => randomUUID();
const text = z.string().trim().min(2).max(4000);
const ident = z.string().min(1).max(100);
const amount = z.coerce.number().int().min(1).max(100000000);
const audit = async (
  db: Database,
  user: User,
  action: string,
  entity: string,
  details = {},
) => {
  await db.query(
    "INSERT INTO audit(id,actor_id,action,entity_id,details) VALUES($1,$2,$3,$4,$5)",
    [id(), user.id, action, entity, JSON.stringify(details)],
  );
};
async function notify(
  db: Database,
  userId: string,
  title: string,
  body: string,
) {
  await db.query(
    "INSERT INTO notifications(id,user_id,title,body) VALUES($1,$2,$3,$4)",
    [id(), userId, title, body],
  );
}
async function expireHolds(db: Database) {
  await db.transaction(async (tx) => {
    const expired = (
      await tx.query(
        "UPDATE bookings SET status='cancelled' WHERE status='awaiting_payment' AND paid=0 AND hold_until<now() RETURNING id,quote_id",
      )
    ).rows;
    for (const k of expired) {
      await tx.query("DELETE FROM reservations WHERE booking_id=$1", [k.id]);
      await tx.query("UPDATE quotes SET status='expired' WHERE id=$1", [
        k.quote_id,
      ]);
    }
  });
}
export async function catalog() {
  return {
    businesses: await query(
      "SELECT id,name,kind,category,city,areas,description,image,status,price,tagline,verification,created_at FROM businesses WHERE status='approved' ORDER BY created_at,id",
    ),
    offerings: await query(
      "SELECT o.*,b.category,b.city,b.name AS business_name FROM offerings o JOIN businesses b ON b.id=o.business_id WHERE b.status='approved' AND o.status='published' ORDER BY o.id",
    ),
    reviews: await query(
      "SELECT r.id,r.rating,r.body,r.created_at,k.business_id,split_part(u.name,' ',1) AS author FROM reviews r JOIN bookings k ON k.id=r.booking_id JOIN users u ON u.id=r.user_id JOIN businesses b ON b.id=k.business_id WHERE b.status='approved' ORDER BY r.created_at DESC LIMIT 100",
    ),
    demo: demoMode(),
  };
}
export async function workspace(user: User) {
  await expireHolds(await database());
  const global = ["admin", "support", "finance"].includes(user.role);
  const city = user.role === "operations";
  const eventFilter = global
    ? "true"
    : city
      ? "e.city=$2"
      : `(e.owner_id=$1 OR EXISTS(SELECT 1 FROM event_members em WHERE em.event_id=e.id AND em.user_id=$1))`;
  const params = [user.id, user.city];
  // Always bind two parameters; unused parameters are typed explicitly.
  const bind = ` AND $1::text IS NOT NULL AND $2::text IS NOT NULL`;
  const vendor = `EXISTS(SELECT 1 FROM business_members bm WHERE bm.business_id=b.id AND bm.user_id=$1 AND bm.role IN ('owner','manager'))`;
  const eventOrVendor = `(${eventFilter} OR ${vendor})`;
  const events = await query(
    `SELECT e.*,u.name owner_name FROM events e JOIN users u ON u.id=e.owner_id WHERE ${eventFilter}${bind} ORDER BY e.date`,
    params,
  );
  const quotes = await query(
    `SELECT q.*,e.name event_name,e.date event_date,e.city,b.name business_name,u.name customer_name FROM quotes q JOIN events e ON e.id=q.event_id JOIN businesses b ON b.id=q.business_id JOIN users u ON u.id=e.owner_id WHERE ${eventOrVendor}${bind} ORDER BY q.created_at DESC`,
    params,
  );
  const bookings = await query(
    `SELECT k.*,e.name event_name,e.date event_date,e.city,e.owner_id,b.name business_name FROM bookings k JOIN events e ON e.id=k.event_id JOIN businesses b ON b.id=k.business_id WHERE (${eventOrVendor} OR EXISTS(SELECT 1 FROM booking_assignments ba JOIN business_members bm ON bm.user_id=ba.user_id AND bm.business_id=b.id WHERE ba.booking_id=k.id AND ba.user_id=$1))${bind} ORDER BY k.created_at DESC`,
    params,
  );
  const businesses = await query(
    `SELECT b.*,(SELECT m.role FROM business_members m WHERE m.business_id=b.id AND m.user_id=$1) AS membership FROM businesses b WHERE ${["admin", "reviewer"].includes(user.role) ? "true" : city ? "b.city=$2" : `EXISTS(SELECT 1 FROM business_members m WHERE m.business_id=b.id AND m.user_id=$1)`}${bind} ORDER BY b.created_at DESC`,
    params,
  );
  for (const booking of bookings) {
    const membership = (
      await query(
        "SELECT role FROM business_members WHERE business_id=$1 AND user_id=$2",
        [booking.business_id, user.id],
      )
    )[0];
    if (membership?.role === "worker" && booking.owner_id !== user.id) {
      booking.amount = 0;
      booking.deposit = 0;
      booking.paid = 0;
      booking.financial_redacted = true;
    }
  }
  const tasks = await query(
    `SELECT t.*,e.name event_name FROM tasks t JOIN events e ON e.id=t.event_id WHERE ${eventFilter}${bind} ORDER BY t.done,t.due_date`,
    params,
  );
  const tickets = await query(
    `SELECT t.*,e.name event_name,u.name user_name FROM tickets t LEFT JOIN events e ON e.id=t.event_id JOIN users u ON u.id=t.user_id WHERE ${["admin", "support"].includes(user.role) ? "true" : city ? "e.city=$2" : "t.user_id=$1"}${bind} ORDER BY t.created_at DESC`,
    params,
  );
  const messages = await query(
    `SELECT m.*,u.name sender_name,e.name event_name,b.name business_name FROM messages m JOIN users u ON u.id=m.sender_id JOIN quotes q ON q.id=m.quote_id JOIN events e ON e.id=q.event_id JOIN businesses b ON b.id=q.business_id WHERE ${eventOrVendor}${bind} ORDER BY m.created_at`,
    params,
  );
  const payments = await query(
    `SELECT p.*,e.name event_name,b.name business_name FROM payments p JOIN bookings k ON k.id=p.booking_id JOIN events e ON e.id=k.event_id JOIN businesses b ON b.id=k.business_id WHERE (${global ? "true" : `e.owner_id=$1 OR EXISTS(SELECT 1 FROM event_members em WHERE em.event_id=e.id AND em.user_id=$1 AND em.role='approver') OR EXISTS(SELECT 1 FROM business_members bm WHERE bm.business_id=b.id AND bm.user_id=$1 AND bm.role IN ('owner','accounts'))`})${bind} ORDER BY p.created_at DESC`,
    params,
  );
  const changes = await query(
    `SELECT c.*,e.name event_name,b.name business_name FROM changes c JOIN bookings k ON k.id=c.booking_id JOIN events e ON e.id=k.event_id JOIN businesses b ON b.id=k.business_id WHERE ${eventOrVendor}${bind} ORDER BY c.created_at DESC`,
    params,
  );
  const accessEvents = await query(
    "SELECT e.id,e.owner_id,em.role,em.spending_limit FROM events e LEFT JOIN event_members em ON em.event_id=e.id AND em.user_id=$1",
    [user.id],
  );
  const accessBusinesses = await query(
    "SELECT business_id,role FROM business_members WHERE user_id=$1",
    [user.id],
  );
  for (const record of [...quotes, ...bookings]) {
    const e = accessEvents.find((e) => e.id === record.event_id);
    const b = accessBusinesses.find(
      (b) => b.business_id === record.business_id,
    );
    record.can_manage = !!b && ["owner", "manager"].includes(b.role);
    record.can_approve =
      !!e &&
      (e.owner_id === user.id ||
        (e.role === "approver" && e.spending_limit >= record.amount));
  }
  for (const e of events) {
    const a = accessEvents.find((a) => a.id === e.id);
    e.can_edit = e.owner_id === user.id || (!!a?.role && a.role !== "viewer");
  }
  const members = await query(
    `SELECT i.*,e.name event_name FROM invitations i JOIN events e ON e.id=i.event_id WHERE (e.owner_id=$1 OR lower(i.email)=lower($2)) ORDER BY i.expires_at DESC`,
    [user.id, user.email],
  );
  return {
    user,
    guests: await query(
      `SELECT g.*,e.name event_name FROM guests g JOIN events e ON e.id=g.event_id WHERE e.owner_id=$1 OR EXISTS(SELECT 1 FROM event_members em WHERE em.event_id=e.id AND em.user_id=$1) ORDER BY g.created_at DESC`,
      [user.id],
    ),
    events,
    quotes,
    bookings,
    businesses,
    tasks,
    tickets,
    messages,
    payments,
    changes,
    members,
    documents: await query(
      `SELECT d.*,b.name business_name FROM documents d JOIN businesses b ON b.id=d.business_id WHERE ${["admin", "reviewer"].includes(user.role) ? "true" : `EXISTS(SELECT 1 FROM business_members m WHERE m.business_id=d.business_id AND m.user_id=$1 AND m.role IN ('owner','manager'))`} AND $1::text IS NOT NULL ORDER BY d.created_at DESC`,
      [user.id],
    ),
    businessInvites: await query(
      `SELECT i.*,b.name business_name FROM business_invitations i JOIN businesses b ON b.id=i.business_id WHERE b.owner_id=$1 OR i.email=$2`,
      [user.id, user.email],
    ),
    businessMembers: await query(
      `SELECT m.*,u.name,u.email,b.name business_name FROM business_members m JOIN users u ON u.id=m.user_id JOIN businesses b ON b.id=m.business_id WHERE b.owner_id=$1`,
      [user.id],
    ),
    blocks: await query(
      `SELECT a.*,b.name business_name FROM availability_blocks a JOIN businesses b ON b.id=a.business_id WHERE EXISTS(SELECT 1 FROM business_members m WHERE m.business_id=b.id AND m.user_id=$1 AND m.role IN ('owner','manager'))`,
      [user.id],
    ),
    users:
      user.role === "admin"
        ? await query(
            "SELECT id,name,email,role,city FROM users ORDER BY created_at",
          )
        : [],
    notifications: await query(
      "SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50",
      [user.id],
    ),
    audit:
      user.role === "admin"
        ? await query(
            "SELECT a.*,u.name actor_name FROM audit a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 100",
          )
        : [],
    demo: demoMode(),
  };
}
export async function command(user: User, action: string, input: unknown) {
  const db = await database();
  await expireHolds(db);
  return db.transaction(async (tx) => {
    const get = async (sql: string, p: any[] = []) => {
      const rows = (await tx.query(sql, p)).rows;
      if (!rows[0]) throw new AppError(404, "Record not found.");
      return rows[0];
    };
    let result: any = { ok: true };
    let entity = "";
    switch (action) {
      case "event.update": {
        const d = z
          .object({ id: ident, name: text, budget: amount })
          .parse(input);
        await eventAccess(user, d.id, "edit", 0, tx);
        entity = d.id;
        await tx.query("UPDATE events SET name=$1,budget=$2 WHERE id=$3", [
          d.name,
          d.budget,
          d.id,
        ]);
        break;
      }
      case "event.close": {
        const d = z.object({ id: ident }).parse(input);
        const e = await get("SELECT * FROM events WHERE id=$1", [d.id]);
        if (e.owner_id !== user.id)
          throw new AppError(403, "Only the host can close an event.");
        const bookings = (
          await tx.query("SELECT status FROM bookings WHERE event_id=$1", [
            d.id,
          ])
        ).rows;
        if (
          !bookings.length ||
          bookings.some((b) => !["completed", "cancelled"].includes(b.status))
        )
          throw new AppError(
            409,
            "Resolve all supplier bookings before closing the event.",
          );
        if (
          (
            await tx.query(
              "SELECT id FROM quotes WHERE event_id=$1 AND status IN ('requested','sent')",
              [d.id],
            )
          ).rows.length
        )
          throw new AppError(
            409,
            "Accept or decline outstanding proposals before closing the event.",
          );
        entity = d.id;
        await tx.query("UPDATE events SET status='completed' WHERE id=$1", [
          d.id,
        ]);
        break;
      }
      case "guest.create": {
        const d = z
          .object({
            event_id: ident,
            name: text,
            email: z.union([z.email(), z.literal("")]).default(""),
            party_size: z.coerce.number().int().min(1).max(100),
            rsvp: z.enum(["pending", "attending", "declined"]),
            dietary: z.string().max(1000).default(""),
          })
          .parse(input);
        await eventAccess(user, d.event_id, "edit", 0, tx);
        entity = id();
        await tx.query(
          "INSERT INTO guests(id,event_id,name,email,party_size,rsvp,dietary) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            entity,
            d.event_id,
            d.name,
            d.email,
            d.party_size,
            d.rsvp,
            d.dietary,
          ],
        );
        break;
      }
      case "guest.rsvp": {
        const d = z
          .object({
            id: ident,
            rsvp: z.enum(["pending", "attending", "declined"]),
          })
          .parse(input);
        const g = await get("SELECT event_id FROM guests WHERE id=$1", [d.id]);
        await eventAccess(user, g.event_id, "edit", 0, tx);
        entity = d.id;
        await tx.query("UPDATE guests SET rsvp=$1 WHERE id=$2", [d.rsvp, d.id]);
        break;
      }
      case "event.create": {
        const d = z
          .object({
            name: text,
            type: text,
            city: z.enum(cities),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            guests: amount,
            budget: amount,
            venue: z.string().max(500).default(""),
          })
          .parse(input);
        if (new Date(d.date + "T23:59:59") < new Date())
          throw new AppError(400, "Choose today or a future event date.");
        entity = id();
        await tx.query(
          "INSERT INTO events(id,owner_id,name,type,city,date,guests,budget,venue) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [
            entity,
            user.id,
            d.name,
            d.type,
            d.city,
            d.date,
            d.guests,
            d.budget,
            d.venue,
          ],
        );
        for (const title of [
          "Confirm your guest list",
          "Shortlist your favorite suppliers",
          "Finalize event-day details",
        ])
          await tx.query(
            "INSERT INTO tasks(id,event_id,title,due_date) VALUES($1,$2,$3,$4)",
            [id(), entity, title, d.date],
          );
        result = { id: entity };
        break;
      }
      case "business.submit": {
        const d = z
          .object({
            name: text,
            kind: z.enum(["vendor", "planner"]),
            category: text,
            city: z.enum(cities),
            description: text,
            price: amount,
            tagline: text,
          })
          .parse(input);
        entity = id();
        await tx.query(
          "INSERT INTO businesses(id,owner_id,name,kind,category,city,areas,description,image,price,tagline) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
          [
            entity,
            user.id,
            d.name,
            d.kind,
            d.category,
            d.city,
            JSON.stringify([d.city]),
            d.description,
            photos.flowers,
            d.price,
            d.tagline,
          ],
        );
        await tx.query("INSERT INTO business_members VALUES($1,$2,$3)", [
          entity,
          user.id,
          "owner",
        ]);
        if (user.role === "customer")
          await tx.query("UPDATE users SET role=$1 WHERE id=$2", [
            d.kind,
            user.id,
          ]);
        result = { id: entity };
        break;
      }
      case "business.review": {
        allowRole(user, ["admin", "reviewer"]);
        const d = z
          .object({
            id: ident,
            status: z.enum([
              "approved",
              "changes_requested",
              "rejected",
              "suspended",
            ]),
            note: text,
          })
          .parse(input);
        const b = await get("SELECT * FROM businesses WHERE id=$1 FOR UPDATE", [
          d.id,
        ]);
        if (b.owner_id === user.id)
          throw new AppError(403, "You cannot review your own business.");
        entity = d.id;
        await tx.query(
          "UPDATE businesses SET status=$1,review_note=$2,verification=$3 WHERE id=$4",
          [
            d.status,
            d.note,
            d.status === "approved" ? "Listing reviewed" : "Review pending",
            d.id,
          ],
        );
        await notify(
          tx,
          b.owner_id,
          "Business review updated",
          `${b.name}: ${d.status.replaceAll("_", " ")}. ${d.note}`,
        );
        break;
      }
      case "business.resubmit": {
        const d = z.object({ id: ident, description: text }).parse(input);
        await businessAccess(user, d.id, "owner", tx);
        const b = await get("SELECT * FROM businesses WHERE id=$1", [d.id]);
        if (!["changes_requested", "rejected", "draft"].includes(b.status))
          throw new AppError(
            409,
            "This application cannot be resubmitted in its current state.",
          );
        entity = d.id;
        await tx.query(
          "UPDATE businesses SET description=$1,status='submitted' WHERE id=$2",
          [d.description, d.id],
        );
        break;
      }
      case "offering.create": {
        const d = z
          .object({
            business_id: ident,
            name: text,
            description: text,
            price: amount,
            unit: text,
            inclusions: text,
            exclusions: text,
          })
          .parse(input);
        await businessAccess(user, d.business_id, "manage", tx);
        const b = await get("SELECT * FROM businesses WHERE id=$1", [
          d.business_id,
        ]);
        if (b.status !== "approved")
          throw new AppError(
            409,
            "Your business must be approved before publishing packages.",
          );
        entity = id();
        await tx.query(
          "INSERT INTO offerings(id,business_id,name,description,price,unit,inclusions,exclusions,image) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [
            entity,
            d.business_id,
            d.name,
            d.description,
            d.price,
            d.unit,
            JSON.stringify(d.inclusions.split("\n")),
            JSON.stringify(d.exclusions.split("\n")),
            b.image,
          ],
        );
        break;
      }
      case "quote.request": {
        const d = z
          .object({
            event_id: ident,
            offering_id: ident,
            note: z.string().max(2000).default(""),
          })
          .parse(input);
        const e = await eventAccess(user, d.event_id, "edit", 0, tx);
        if (e.status === "completed")
          throw new AppError(
            409,
            "This event is closed. Create a new event for a new celebration.",
          );
        const o = await get(
          "SELECT o.*,b.city,b.status business_status FROM offerings o JOIN businesses b ON b.id=o.business_id WHERE o.id=$1",
          [d.offering_id],
        );
        if (o.business_status !== "approved" || o.status !== "published")
          throw new AppError(409, "This service is not accepting enquiries.");
        if (o.city !== e.city)
          throw new AppError(400, "Choose a supplier serving your event city.");
        if (
          (
            await tx.query(
              "SELECT id FROM quotes WHERE event_id=$1 AND offering_id=$2 AND status IN ('requested','sent','accepted')",
              [d.event_id, d.offering_id],
            )
          ).rows.length
        )
          throw new AppError(
            409,
            "You already have an active enquiry for this package.",
          );
        entity = id();
        const price = o.unit === "guest" ? o.price * e.guests : o.price;
        await tx.query(
          "INSERT INTO quotes(id,event_id,business_id,offering_id,amount,scope,note) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            entity,
            e.id,
            o.business_id,
            o.id,
            price,
            `${o.name}. Included: ${o.inclusions.join("; ")}. Excluded: ${o.exclusions.join("; ")}.`,
            d.note,
          ],
        );
        const b = await get("SELECT owner_id FROM businesses WHERE id=$1", [
          o.business_id,
        ]);
        await notify(
          tx,
          b.owner_id,
          "New event enquiry",
          `${e.name} is looking for ${o.name}.`,
        );
        break;
      }
      case "quote.send": {
        const d = z
          .object({
            id: ident,
            amount,
            scope: text,
            items_text: z.string().max(4000).optional(),
          })
          .parse(input);
        const q = await get("SELECT * FROM quotes WHERE id=$1 FOR UPDATE", [
          d.id,
        ]);
        await businessAccess(user, q.business_id, "manage", tx);
        const b = await get(
          "SELECT status FROM businesses WHERE id=$1 FOR UPDATE",
          [q.business_id],
        );
        if (b.status !== "approved")
          throw new AppError(409, "This business is not approved.");
        if (!["requested", "sent", "expired"].includes(q.status))
          throw new AppError(
            409,
            "Accepted or declined quotes cannot be edited.",
          );
        entity = q.id;
        const items = d.items_text?.trim()
          ? d.items_text
              .trim()
              .split("\n")
              .map((line) => {
                const parts = line.split("|").map((v) => v.trim());
                return z
                  .object({
                    label: text,
                    quantity: z.coerce.number().int().min(1).max(100000),
                    unit_price: z.coerce.number().int().min(0).max(100000000),
                  })
                  .parse({
                    label: parts[0],
                    quantity: parts[1],
                    unit_price: parts[2],
                  });
              })
          : [
              {
                label: "Agreed service package",
                quantity: 1,
                unit_price: d.amount,
              },
            ];
        if (
          items.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0,
          ) !== d.amount
        )
          throw new AppError(
            400,
            "Line items must add up to the quoted total.",
          );
        await tx.query("UPDATE quotes SET items=$1 WHERE id=$2", [
          JSON.stringify(items),
          q.id,
        ]);
        const v = q.version + 1;
        await tx.query(
          "UPDATE quotes SET amount=$1,scope=$2,version=$3,status='sent',expires_at=now()+interval '7 days' WHERE id=$4",
          [d.amount, d.scope, v, q.id],
        );
        await tx.query(
          "INSERT INTO quote_versions(id,quote_id,version,amount,scope,created_at) VALUES($1,$2,$3,$4,$5,now())",
          [id(), q.id, v, d.amount, d.scope],
        );
        await tx.query(
          "UPDATE quote_versions SET items=$1 WHERE quote_id=$2 AND version=$3",
          [JSON.stringify(items), q.id, v],
        );
        const e = await get("SELECT owner_id,name FROM events WHERE id=$1", [
          q.event_id,
        ]);
        await notify(
          tx,
          e.owner_id,
          "A proposal is ready",
          `A supplier updated your quote for ${e.name}.`,
        );
        break;
      }
      case "quote.accept": {
        const d = z
          .object({ id: ident, version: z.coerce.number().int() })
          .parse(input);
        const q = await get("SELECT * FROM quotes WHERE id=$1 FOR UPDATE", [
          d.id,
        ]);
        const e = await eventAccess(user, q.event_id, "approve", q.amount, tx);
        if (
          q.status !== "sent" ||
          q.version !== d.version ||
          new Date(q.expires_at) < new Date()
        )
          throw new AppError(
            409,
            "This quote has changed or expired. Please refresh.",
          );
        const b = await get(
          "SELECT status FROM businesses WHERE id=$1 FOR UPDATE",
          [q.business_id],
        );
        if (b.status !== "approved")
          throw new AppError(409, "This supplier cannot accept bookings.");
        if (new Date(e.date) < new Date(new Date().toDateString()))
          throw new AppError(409, "This event date has passed.");
        if (
          (
            await tx.query(
              "SELECT id FROM availability_blocks WHERE business_id=$1 AND date=$2",
              [q.business_id, e.date],
            )
          ).rows.length
        )
          throw new AppError(409, "This supplier is unavailable on your date.");
        if (
          (
            await tx.query(
              "SELECT booking_id FROM reservations WHERE business_id=$1 AND event_date=$2",
              [q.business_id, e.date],
            )
          ).rows.length
        )
          throw new AppError(
            409,
            "The supplier is already reserved on this date.",
          );
        entity = id();
        await tx.query(
          "INSERT INTO bookings(id,event_id,business_id,quote_id,amount,deposit,scope) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            entity,
            q.event_id,
            q.business_id,
            q.id,
            q.amount,
            Math.ceil(q.amount * 0.3),
            q.scope,
          ],
        );
        await tx.query("INSERT INTO reservations VALUES($1,$2,$3)", [
          q.business_id,
          e.date,
          entity,
        ]);
        await tx.query("UPDATE quotes SET status='accepted' WHERE id=$1", [
          q.id,
        ]);
        result = { id: entity };
        break;
      }
      case "quote.decline": {
        const d = z.object({ id: ident }).parse(input);
        const q = await quoteAccess(user, d.id, tx);
        await eventAccess(user, q.event_id, "approve", 0, tx);
        if (!["sent", "requested"].includes(q.status))
          throw new AppError(409, "This quote cannot be declined.");
        entity = q.id;
        await tx.query("UPDATE quotes SET status='declined' WHERE id=$1", [
          q.id,
        ]);
        break;
      }
      case "booking.pay": {
        if (!demoMode())
          throw new AppError(
            503,
            "Live payments are not configured. Contact support.",
          );
        const d = z
          .object({ id: ident, reference: z.string().min(8).max(100) })
          .parse(input);
        const k = await get("SELECT * FROM bookings WHERE id=$1 FOR UPDATE", [
          d.id,
        ]);
        await eventAccess(user, k.event_id, "approve", k.amount, tx);
        const existing = (
          await tx.query("SELECT booking_id FROM payments WHERE reference=$1", [
            d.reference,
          ])
        ).rows[0];
        if (existing) {
          if (existing.booking_id !== k.id)
            throw new AppError(
              409,
              "Payment reference belongs to another booking.",
            );
          return { ok: true };
        }
        if (!["awaiting_payment", "confirmed", "delivered"].includes(k.status))
          throw new AppError(409, "This booking cannot accept a payment.");
        const due = k.paid === 0 ? k.deposit : k.amount - k.paid;
        if (due <= 0)
          throw new AppError(409, "This booking is already fully paid.");
        if (
          k.status === "awaiting_payment" &&
          new Date(k.hold_until) < new Date()
        )
          throw new AppError(
            409,
            "Your reservation has expired. Request a fresh quote.",
          );
        entity = k.id;
        await tx.query(
          "INSERT INTO payments(id,booking_id,amount,kind,status,reference,created_by) VALUES($1,$2,$3,'payment','simulated',$4,$5)",
          [id(), k.id, due, d.reference, user.id],
        );
        await tx.query(
          "UPDATE bookings SET paid=paid+$1,status=CASE WHEN status='awaiting_payment' THEN 'confirmed' ELSE status END,hold_until=NULL WHERE id=$2",
          [due, k.id],
        );
        break;
      }
      case "booking.status": {
        const d = z
          .object({
            id: ident,
            status: z.enum([
              "in_progress",
              "delivered",
              "completed",
              "cancel_requested",
            ]),
          })
          .parse(input);
        const k = await get("SELECT * FROM bookings WHERE id=$1 FOR UPDATE", [
          d.id,
        ]);
        entity = k.id;
        if (d.status === "cancel_requested") {
          await eventAccess(user, k.event_id, "approve", 0, tx);
          if (["completed", "cancelled", "cancel_requested"].includes(k.status))
            throw new AppError(409, "This booking cannot be cancelled.");
        } else if (d.status === "completed") {
          await eventAccess(user, k.event_id, "approve", 0, tx);
          if (k.status !== "delivered" || k.paid < k.amount)
            throw new AppError(
              409,
              "Complete delivery and remaining payment first.",
            );
        } else {
          await businessAccess(user, k.business_id, "manage", tx);
          if (
            (d.status === "in_progress" && k.status !== "confirmed") ||
            (d.status === "delivered" && k.status !== "in_progress")
          )
            throw new AppError(409, "Invalid booking status transition.");
        }
        await tx.query("UPDATE bookings SET status=$1 WHERE id=$2", [
          d.status,
          k.id,
        ]);
        break;
      }
      case "booking.cancel": {
        allowRole(user, ["admin", "support"]);
        const d = z.object({ id: ident }).parse(input);
        const k = await get("SELECT * FROM bookings WHERE id=$1 FOR UPDATE", [
          d.id,
        ]);
        if (k.status !== "cancel_requested")
          throw new AppError(
            409,
            "The customer must request cancellation first.",
          );
        entity = k.id;
        await tx.query("UPDATE bookings SET status='cancelled' WHERE id=$1", [
          k.id,
        ]);
        await tx.query("DELETE FROM reservations WHERE booking_id=$1", [k.id]);
        if (k.paid > 0)
          await tx.query(
            "INSERT INTO payments(id,booking_id,amount,kind,status,reference,created_by) VALUES($1,$2,$3,'refund','pending',$4,$5)",
            [id(), k.id, k.paid, `refund-${id()}`, user.id],
          );
        break;
      }
      case "change.request": {
        const d = z
          .object({ booking_id: ident, scope: text, amount })
          .parse(input);
        const k = await get("SELECT * FROM bookings WHERE id=$1 FOR UPDATE", [
          d.booking_id,
        ]);
        await businessAccess(user, k.business_id, "manage", tx);
        if (!["confirmed", "awaiting_payment"].includes(k.status))
          throw new AppError(409, "Changes are only allowed before delivery.");
        if (d.amount < k.paid)
          throw new AppError(
            400,
            "Resolve paid amounts through support before reducing below payments received.",
          );
        if (
          (
            await tx.query(
              "SELECT id FROM changes WHERE booking_id=$1 AND status='pending'",
              [k.id],
            )
          ).rows.length
        )
          throw new AppError(409, "An amendment is already awaiting approval.");
        entity = id();
        await tx.query(
          "INSERT INTO changes(id,booking_id,requested_by,scope,amount) VALUES($1,$2,$3,$4,$5)",
          [entity, k.id, user.id, d.scope, d.amount],
        );
        break;
      }
      case "change.decide": {
        const d = z.object({ id: ident, approve: z.boolean() }).parse(input);
        const c = await get("SELECT * FROM changes WHERE id=$1 FOR UPDATE", [
          d.id,
        ]);
        const k = await get("SELECT * FROM bookings WHERE id=$1 FOR UPDATE", [
          c.booking_id,
        ]);
        await eventAccess(user, k.event_id, "approve", c.amount, tx);
        if (
          c.status !== "pending" ||
          !["awaiting_payment", "confirmed"].includes(k.status)
        )
          throw new AppError(409, "This amendment is no longer available.");
        entity = c.id;
        await tx.query("UPDATE changes SET status=$1 WHERE id=$2", [
          d.approve ? "approved" : "declined",
          c.id,
        ]);
        if (d.approve)
          await tx.query(
            "UPDATE bookings SET scope=$1,amount=$2,deposit=$3 WHERE id=$4",
            [c.scope, c.amount, Math.ceil(c.amount * 0.3), k.id],
          );
        break;
      }
      case "task.create": {
        const d = z.object({ event_id: ident, title: text }).parse(input);
        const e = await eventAccess(user, d.event_id, "edit", 0, tx);
        entity = id();
        await tx.query(
          "INSERT INTO tasks(id,event_id,title,due_date) VALUES($1,$2,$3,$4)",
          [entity, e.id, d.title, e.date],
        );
        break;
      }
      case "task.toggle": {
        const d = z.object({ id: ident, done: z.boolean() }).parse(input);
        const t = await get("SELECT * FROM tasks WHERE id=$1", [d.id]);
        await eventAccess(user, t.event_id, "edit", 0, tx);
        entity = t.id;
        await tx.query("UPDATE tasks SET done=$1 WHERE id=$2", [d.done, t.id]);
        break;
      }
      case "message.send": {
        const d = z.object({ quote_id: ident, body: text }).parse(input);
        await quoteAccess(user, d.quote_id, tx);
        entity = id();
        await tx.query(
          "INSERT INTO messages(id,quote_id,sender_id,body) VALUES($1,$2,$3,$4)",
          [entity, d.quote_id, user.id, d.body],
        );
        break;
      }
      case "ticket.create": {
        const d = z
          .object({
            event_id: z.string().optional(),
            subject: text,
            body: text,
          })
          .parse(input);
        if (d.event_id) await eventAccess(user, d.event_id, "read", 0, tx);
        entity = id();
        await tx.query(
          "INSERT INTO tickets(id,event_id,user_id,subject,body) VALUES($1,$2,$3,$4,$5)",
          [entity, d.event_id || null, user.id, d.subject, d.body],
        );
        break;
      }
      case "ticket.reply": {
        allowRole(user, ["admin", "support"]);
        const d = z
          .object({
            id: ident,
            reply: text,
            status: z.enum(["open", "in_progress", "resolved"]),
          })
          .parse(input);
        const t = await get("SELECT * FROM tickets WHERE id=$1", [d.id]);
        entity = t.id;
        await tx.query("UPDATE tickets SET reply=$1,status=$2 WHERE id=$3", [
          d.reply,
          d.status,
          t.id,
        ]);
        await notify(tx, t.user_id, "Your support case was updated", d.reply);
        break;
      }
      case "invite.create": {
        const d = z
          .object({
            event_id: ident,
            email: z.email(),
            role: z.enum(["viewer", "contributor", "approver", "planner"]),
            spending_limit: z.coerce.number().int().min(0).default(0),
          })
          .parse(input);
        const e = await get("SELECT * FROM events WHERE id=$1", [d.event_id]);
        if (e.owner_id !== user.id)
          throw new AppError(403, "Only the event owner can invite members.");
        if (d.email.toLowerCase() === user.email)
          throw new AppError(400, "You already own this event.");
        entity = id();
        await tx.query(
          "INSERT INTO invitations(id,event_id,email,role,spending_limit) VALUES($1,$2,$3,$4,$5) ON CONFLICT(event_id,email) DO UPDATE SET role=excluded.role,spending_limit=excluded.spending_limit,status='pending',expires_at=now()+interval '7 days'",
          [entity, e.id, d.email.toLowerCase(), d.role, d.spending_limit],
        );
        break;
      }
      case "invite.accept": {
        const d = z.object({ id: ident }).parse(input);
        const i = await get(
          "SELECT * FROM invitations WHERE id=$1 FOR UPDATE",
          [d.id],
        );
        if (
          i.email !== user.email ||
          i.status !== "pending" ||
          new Date(i.expires_at) < new Date()
        )
          throw new AppError(
            403,
            "This invitation is not available to your account.",
          );
        entity = i.id;
        await tx.query(
          "INSERT INTO event_members VALUES($1,$2,$3,$4) ON CONFLICT(event_id,user_id) DO UPDATE SET role=excluded.role,spending_limit=excluded.spending_limit",
          [i.event_id, user.id, i.role, i.spending_limit],
        );
        await tx.query("UPDATE invitations SET status='accepted' WHERE id=$1", [
          i.id,
        ]);
        break;
      }
      case "invite.revoke": {
        const d = z.object({ id: ident }).parse(input);
        const i = await get("SELECT * FROM invitations WHERE id=$1", [d.id]);
        const e = await get("SELECT owner_id FROM events WHERE id=$1", [
          i.event_id,
        ]);
        if (e.owner_id !== user.id)
          throw new AppError(403, "Only the owner can revoke event access.");
        entity = i.id;
        await tx.query(
          "DELETE FROM event_members WHERE event_id=$1 AND user_id IN (SELECT id FROM users WHERE email=$2)",
          [i.event_id, i.email],
        );
        await tx.query("UPDATE invitations SET status='revoked' WHERE id=$1", [
          i.id,
        ]);
        break;
      }
      case "finance.request": {
        allowRole(user, ["finance", "admin"]);
        const d = z.object({ booking_id: ident }).parse(input);
        const k = await get("SELECT * FROM bookings WHERE id=$1 FOR UPDATE", [
          d.booking_id,
        ]);
        if (k.status !== "completed")
          throw new AppError(
            409,
            "Only completed bookings are eligible for payout.",
          );
        if (
          (
            await tx.query(
              "SELECT id FROM payments WHERE booking_id=$1 AND kind='payout'",
              [k.id],
            )
          ).rows.length
        )
          throw new AppError(409, "A payout already exists.");
        entity = id();
        await tx.query(
          "INSERT INTO payments(id,booking_id,amount,kind,status,reference,created_by) VALUES($1,$2,$3,'payout','pending',$4,$5)",
          [entity, k.id, Math.round(k.amount * 0.9), `payout-${id()}`, user.id],
        );
        break;
      }
      case "finance.approve": {
        allowRole(user, ["finance", "admin"]);
        if (!demoMode())
          throw new AppError(503, "Live settlement is not configured.");
        const d = z.object({ id: ident }).parse(input);
        const p = await get("SELECT * FROM payments WHERE id=$1 FOR UPDATE", [
          d.id,
        ]);
        if (p.status !== "pending" || p.kind === "payment")
          throw new AppError(409, "This transaction is not pending approval.");
        if (p.created_by === user.id)
          throw new AppError(
            403,
            "A different finance approver must approve this transaction.",
          );
        entity = p.id;
        await tx.query(
          "UPDATE payments SET status='simulated',approved_by=$1 WHERE id=$2",
          [user.id, p.id],
        );
        break;
      }
      case "review.create": {
        const d = z
          .object({
            booking_id: ident,
            rating: z.coerce.number().int().min(1).max(5),
            body: text,
          })
          .parse(input);
        const k = await get("SELECT * FROM bookings WHERE id=$1", [
          d.booking_id,
        ]);
        const e = await get("SELECT owner_id FROM events WHERE id=$1", [
          k.event_id,
        ]);
        if (e.owner_id !== user.id || k.status !== "completed")
          throw new AppError(
            403,
            "Only the host of a completed booking can review it.",
          );
        entity = id();
        await tx.query(
          "INSERT INTO reviews(id,booking_id,user_id,rating,body) VALUES($1,$2,$3,$4,$5)",
          [entity, k.id, user.id, d.rating, d.body],
        );
        break;
      }
      case "availability.block": {
        const d = z
          .object({
            business_id: ident,
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            reason: text,
          })
          .parse(input);
        await businessAccess(user, d.business_id, "manage", tx);
        await get("SELECT id FROM businesses WHERE id=$1 FOR UPDATE", [
          d.business_id,
        ]);
        if (new Date(d.date + "T23:59:59") < new Date())
          throw new AppError(400, "Choose a future date.");
        if (
          (
            await tx.query(
              "SELECT booking_id FROM reservations WHERE business_id=$1 AND event_date=$2",
              [d.business_id, d.date],
            )
          ).rows.length
        )
          throw new AppError(409, "A booking already reserves this day.");
        entity = id();
        await tx.query(
          "INSERT INTO availability_blocks(id,business_id,date,reason) VALUES($1,$2,$3,$4)",
          [entity, d.business_id, d.date, d.reason],
        );
        break;
      }
      case "availability.unblock": {
        const d = z.object({ id: ident }).parse(input);
        const block = await get(
          "SELECT * FROM availability_blocks WHERE id=$1",
          [d.id],
        );
        await businessAccess(user, block.business_id, "manage", tx);
        entity = d.id;
        await tx.query("DELETE FROM availability_blocks WHERE id=$1", [d.id]);
        break;
      }
      case "business.invite": {
        const d = z
          .object({
            business_id: ident,
            email: z.email(),
            role: z.enum(["manager", "worker", "accounts"]),
          })
          .parse(input);
        await businessAccess(user, d.business_id, "owner", tx);
        if (d.email.toLowerCase() === user.email)
          throw new AppError(400, "You already own this business.");
        entity = id();
        await tx.query(
          "INSERT INTO business_invitations(id,business_id,email,role) VALUES($1,$2,$3,$4) ON CONFLICT(business_id,email) DO UPDATE SET role=excluded.role,status='pending',expires_at=now()+interval '7 days'",
          [entity, d.business_id, d.email.toLowerCase(), d.role],
        );
        break;
      }
      case "business.invite.accept": {
        const d = z.object({ id: ident }).parse(input);
        const i = await get(
          "SELECT * FROM business_invitations WHERE id=$1 FOR UPDATE",
          [d.id],
        );
        if (
          i.email !== user.email ||
          i.status !== "pending" ||
          new Date(i.expires_at) < new Date()
        )
          throw new AppError(403, "This invitation is not available.");
        entity = i.id;
        await tx.query(
          "INSERT INTO business_members VALUES($1,$2,$3) ON CONFLICT(business_id,user_id) DO UPDATE SET role=excluded.role",
          [i.business_id, user.id, i.role],
        );
        await tx.query(
          "UPDATE business_invitations SET status='accepted' WHERE id=$1",
          [i.id],
        );
        if (user.role === "customer")
          await tx.query("UPDATE users SET role='vendor' WHERE id=$1", [
            user.id,
          ]);
        break;
      }
      case "business.member.revoke": {
        const d = z.object({ business_id: ident, user_id: ident }).parse(input);
        await businessAccess(user, d.business_id, "owner", tx);
        const b = await get("SELECT owner_id FROM businesses WHERE id=$1", [
          d.business_id,
        ]);
        if (b.owner_id === d.user_id)
          throw new AppError(
            403,
            "Business ownership cannot be removed through team access.",
          );
        entity = d.business_id;
        await tx.query(
          "DELETE FROM business_members WHERE business_id=$1 AND user_id=$2",
          [d.business_id, d.user_id],
        );
        await tx.query(
          "DELETE FROM booking_assignments WHERE user_id=$1 AND booking_id IN (SELECT id FROM bookings WHERE business_id=$2)",
          [d.user_id, d.business_id],
        );
        await tx.query(
          "UPDATE business_invitations SET status='revoked' WHERE business_id=$1 AND email IN (SELECT email FROM users WHERE id=$2)",
          [d.business_id, d.user_id],
        );
        break;
      }
      case "booking.assign": {
        const d = z.object({ booking_id: ident, user_id: ident }).parse(input);
        const k = await get("SELECT * FROM bookings WHERE id=$1", [
          d.booking_id,
        ]);
        await businessAccess(user, k.business_id, "manage", tx);
        await get(
          "SELECT user_id FROM business_members WHERE business_id=$1 AND user_id=$2",
          [k.business_id, d.user_id],
        );
        entity = k.id;
        await tx.query(
          "INSERT INTO booking_assignments VALUES($1,$2) ON CONFLICT DO NOTHING",
          [k.id, d.user_id],
        );
        break;
      }
      case "account.update": {
        const d = z
          .object({ name: z.string().trim().min(2).max(100) })
          .parse(input);
        entity = user.id;
        await tx.query("UPDATE users SET name=$1 WHERE id=$2", [
          d.name,
          user.id,
        ]);
        break;
      }
      case "account.password": {
        const d = z
          .object({
            current: z.string(),
            password: z.string().min(12).max(128),
          })
          .parse(input);
        const u = await get("SELECT password_hash FROM users WHERE id=$1", [
          user.id,
        ]);
        if (!verifyPassword(d.current, u.password_hash))
          throw new AppError(403, "Current password is incorrect.");
        entity = user.id;
        await tx.query("UPDATE users SET password_hash=$1 WHERE id=$2", [
          hashPassword(d.password),
          user.id,
        ]);
        await tx.query("DELETE FROM sessions WHERE user_id=$1", [user.id]);
        break;
      }
      case "admin.access": {
        allowRole(user, ["admin"]);
        const d = z
          .object({
            user_id: ident,
            role: z.enum([
              "customer",
              "vendor",
              "planner",
              "operations",
              "reviewer",
              "support",
              "finance",
            ]),
            city: z.enum(cities),
          })
          .parse(input);
        const target = await get("SELECT * FROM users WHERE id=$1", [
          d.user_id,
        ]);
        if (target.role === "admin" || target.id === user.id)
          throw new AppError(
            403,
            "Administrator privileges cannot be edited here.",
          );
        entity = target.id;
        await tx.query("UPDATE users SET role=$1,city=$2 WHERE id=$3", [
          d.role,
          d.city,
          target.id,
        ]);
        await tx.query("DELETE FROM sessions WHERE user_id=$1", [target.id]);
        break;
      }
      case "document.review": {
        allowRole(user, ["admin", "reviewer"]);
        const d = z
          .object({
            id: ident,
            status: z.enum(["approved", "changes_requested", "rejected"]),
            note: text,
          })
          .parse(input);
        const doc = await get("SELECT * FROM documents WHERE id=$1", [d.id]);
        const b = await get("SELECT owner_id FROM businesses WHERE id=$1", [
          doc.business_id,
        ]);
        if (b.owner_id === user.id || doc.uploaded_by === user.id)
          throw new AppError(403, "You cannot review your own document.");
        entity = d.id;
        await tx.query(
          "UPDATE documents SET status=$1,review_note=$2,reviewed_by=$3 WHERE id=$4",
          [d.status, d.note, user.id, d.id],
        );
        await notify(tx, b.owner_id, "Document review updated", d.note);
        break;
      }
      case "notification.read": {
        entity = user.id;
        await tx.query("UPDATE notifications SET read=true WHERE user_id=$1", [
          user.id,
        ]);
        break;
      }
      default:
        throw new AppError(404, "Unknown action.");
    }
    await audit(tx, user, action, entity);
    return result;
  });
}
