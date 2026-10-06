import { test } from "node:test";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:4317";
class Client {
  cookie = "";
  async request(path: string, data?: unknown) {
    const r = await fetch(base + "/api/" + path, {
      method: data === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.cookie ? { Cookie: this.cookie } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const cookie = r.headers.get("set-cookie");
    if (cookie) this.cookie = cookie.split(";")[0];
    return { status: r.status, body: await r.json() };
  }
  async login(role: string) {
    const r = await this.request("auth/login", {
      email: `${role}@utsav.local`,
      password: "UtsavDemo2026!",
    });
    assert.equal(r.status, 200, JSON.stringify(r.body));
  }
  async cmd(action: string, data: unknown, status = 200) {
    const r = await this.request("commands", { action, data });
    assert.equal(r.status, status, `${action}: ${JSON.stringify(r.body)}`);
    return r.body;
  }
  async ws() {
    const r = await this.request("workspace");
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return r.body;
  }
}
test("marketplace, role isolation and complete booking lifecycle", async (t) => {
  const suffix = Date.now().toString(36);
  const customer = new Client(),
    outsider = new Client(),
    vendor = new Client(),
    planner = new Client(),
    reviewer = new Client(),
    finance = new Client(),
    admin = new Client(),
    support = new Client(),
    operations = new Client();
  let eventId = "",
    quoteId = "",
    bookingId = "",
    customerId = "",
    outsiderId = "";
  const date = new Date(
    Date.UTC(2031, 0, 1) + Math.floor(Math.random() * 2000) * 86400000,
  )
    .toISOString()
    .slice(0, 10);
  await t.test(
    "public catalog is available; private workspace requires sign-in",
    async () => {
      assert.equal((await customer.request("workspace")).status, 401);
      const c = await customer.request("catalog");
      assert.equal(c.status, 200);
      assert.equal(
        c.body.demo,
        true,
        "Integration tests require an isolated DEMO_MODE database.",
      );
      assert.ok(c.body.offerings.length >= 8);
      assert.ok(
        c.body.businesses.every(
          (b: any) =>
            b.status === "approved" &&
            !("review_note" in b) &&
            !("owner_id" in b),
        ),
      );
    },
  );
  await t.test("registration cannot grant a privileged role", async () => {
    for (const [c, label] of [
      [customer, "Host"],
      [outsider, "Other"],
    ] as const) {
      const r = await c.request("auth/register", {
        name: `${label} Test ${suffix}`,
        email: `${label.toLowerCase()}-${suffix}@example.test`,
        password: "StrongTestPassword2026!",
        role: "admin",
      });
      assert.equal(r.status, 200);
    }
    const me = await customer.request("auth/me");
    assert.equal(me.body.user.role, "customer");
    customerId = me.body.user.id;
    outsiderId = (await outsider.request("auth/me")).body.user.id;
  });
  await t.test("all seeded roles authenticate independently", async () => {
    for (const [c, role] of [
      [vendor, "vendor"],
      [planner, "planner"],
      [reviewer, "reviewer"],
      [finance, "finance"],
      [admin, "admin"],
      [support, "support"],
      [operations, "operations"],
    ] as const) {
      await c.login(role);
      assert.equal((await c.ws()).user.role, role);
    }
  });
  await t.test(
    "customer creates a valid event; past dates are rejected",
    async () => {
      await customer.cmd(
        "event.create",
        {
          name: "Invalid event",
          type: "Birthday",
          city: "Hyderabad",
          date: "2000-01-01",
          guests: 10,
          budget: 1000,
        },
        400,
      );
      eventId = (
        await customer.cmd("event.create", {
          name: `Integration celebration ${suffix}`,
          type: "Birthday",
          city: "Hyderabad",
          date,
          guests: 50,
          budget: 75000,
          venue: "Test venue",
        })
      ).id;
      assert.ok(
        (await customer.ws()).events.some((e: any) => e.id === eventId),
      );
      assert.ok(
        !(await outsider.ws()).events.some((e: any) => e.id === eventId),
      );
    },
  );
  await t.test(
    "customer cannot access another event, approve businesses or finance actions",
    async () => {
      await outsider.cmd(
        "task.create",
        { event_id: eventId, title: "Unauthorized edit" },
        403,
      );
      await customer.cmd(
        "business.review",
        {
          id: "b-pending",
          status: "approved",
          note: "Attempted privilege escalation",
        },
        403,
      );
      await customer.cmd("finance.request", { booking_id: "not-owned" }, 403);
    },
  );
  await t.test(
    "event invitations require acceptance and preserve spending boundaries",
    async () => {
      await customer.cmd("invite.create", {
        event_id: eventId,
        email: "planner@utsav.local",
        role: "planner",
        spending_limit: 0,
      });
      const inv = (await planner.ws()).members.find(
        (m: any) => m.event_id === eventId,
      );
      await planner.cmd("invite.accept", { id: inv.id });
      await planner.cmd("task.create", {
        event_id: eventId,
        title: "Confirm supplier arrival",
      });
    },
  );
  await t.test(
    "quote request validates city and blocks duplicate enquiries",
    async () => {
      await customer.cmd(
        "quote.request",
        { event_id: eventId, offering_id: "o-5" },
        400,
      );
      await customer.cmd("quote.request", {
        event_id: eventId,
        offering_id: "o-1",
        note: "Test garden styling",
      });
      await customer.cmd(
        "quote.request",
        { event_id: eventId, offering_id: "o-1" },
        409,
      );
      quoteId = (await customer.ws()).quotes.find(
        (q: any) => q.event_id === eventId,
      ).id;
    },
  );
  await t.test(
    "only the supplier may publish the quote; revisions are versioned",
    async () => {
      await outsider.cmd(
        "quote.send",
        { id: quoteId, amount: 19000, scope: "Unauthorized proposal" },
        403,
      );
      await vendor.cmd("quote.send", {
        id: quoteId,
        amount: 19000,
        scope:
          "Backdrop, flowers, setup and collection. No catering. Total includes all stated charges.",
      });
      const q = (await customer.ws()).quotes.find((q: any) => q.id === quoteId);
      assert.equal(q.version, 2);
      assert.equal(q.status, "sent");
    },
  );
  await t.test(
    "private supplier conversations do not leak to outsiders",
    async () => {
      await customer.cmd("message.send", {
        quote_id: quoteId,
        body: "Could we use ivory flowers?",
      });
      await outsider.cmd(
        "message.send",
        { quote_id: quoteId, body: "Unauthorized message" },
        403,
      );
      assert.ok(
        (await vendor.ws()).messages.some((m: any) => m.quote_id === quoteId),
      );
      assert.ok(
        !(await outsider.ws()).messages.some(
          (m: any) => m.quote_id === quoteId,
        ),
      );
    },
  );
  await t.test(
    "planner cannot approve spending; stale quotes cannot be accepted",
    async () => {
      await planner.cmd("quote.accept", { id: quoteId, version: 2 }, 403);
      await customer.cmd("quote.accept", { id: quoteId, version: 1 }, 409);
      bookingId = (
        await customer.cmd("quote.accept", { id: quoteId, version: 2 })
      ).id;
      await vendor.cmd(
        "quote.send",
        { id: quoteId, amount: 30000, scope: "Silently altered scope" },
        409,
      );
    },
  );
  await t.test(
    "payment is idempotent and transitions booking to confirmed",
    async () => {
      const reference = `test-payment-${suffix}`;
      await customer.cmd("booking.pay", { id: bookingId, reference });
      await customer.cmd("booking.pay", { id: bookingId, reference });
      const w = await customer.ws();
      const b = w.bookings.find((b: any) => b.id === bookingId);
      assert.equal(b.paid, 5700);
      assert.equal(b.status, "confirmed");
      assert.equal(
        w.payments.filter((p: any) => p.reference === reference).length,
        1,
      );
    },
  );
  await t.test(
    "same supplier cannot reserve two events on the same date",
    async () => {
      const e = (
        await outsider.cmd("event.create", {
          name: `Conflict ${suffix}`,
          type: "Birthday",
          city: "Hyderabad",
          date,
          guests: 10,
          budget: 20000,
        })
      ).id;
      await outsider.cmd("quote.request", { event_id: e, offering_id: "o-1" });
      const q = (await outsider.ws()).quotes.find((q: any) => q.event_id === e);
      await vendor.cmd("quote.send", {
        id: q.id,
        amount: 15000,
        scope: "Second event on the same day",
      });
      await outsider.cmd("quote.accept", { id: q.id, version: 2 }, 409);
    },
  );
  await t.test(
    "amendments require customer approval and preserve the original quote",
    async () => {
      await vendor.cmd("change.request", {
        booking_id: bookingId,
        scope: "Original styling plus additional entrance flowers.",
        amount: 21000,
      });
      let w = await customer.ws();
      assert.equal(
        w.bookings.find((b: any) => b.id === bookingId).amount,
        19000,
      );
      const c = w.changes.find((c: any) => c.booking_id === bookingId);
      await outsider.cmd("change.decide", { id: c.id, approve: true }, 403);
      await customer.cmd("change.decide", { id: c.id, approve: true });
      w = await customer.ws();
      assert.equal(
        w.bookings.find((b: any) => b.id === bookingId).amount,
        21000,
      );
      assert.equal(w.quotes.find((q: any) => q.id === quoteId).amount, 19000);
    },
  );
  await t.test(
    "business invitation scopes a worker to assigned jobs and hides financials",
    async () => {
      await vendor.cmd("business.invite", {
        business_id: "b-1",
        email: `other-${suffix}@example.test`,
        role: "worker",
      });
      const inv = (await outsider.ws()).businessInvites.find(
        (i: any) => i.business_id === "b-1",
      );
      await outsider.cmd("business.invite.accept", { id: inv.id });
      await vendor.cmd("booking.assign", {
        booking_id: bookingId,
        user_id: outsiderId,
      });
      const w = await outsider.ws();
      const b = w.bookings.find((b: any) => b.id === bookingId);
      assert.equal(b.financial_redacted, true);
      assert.equal(b.amount, 0);
      assert.ok(!w.payments.some((p: any) => p.booking_id === bookingId));
      await outsider.cmd(
        "quote.send",
        { id: quoteId, amount: 50000, scope: "Worker cannot quote" },
        403,
      );
      await vendor.cmd("business.member.revoke", {
        business_id: "b-1",
        user_id: outsiderId,
      });
      assert.ok(
        !(await outsider.ws()).bookings.some((b: any) => b.id === bookingId),
      );
    },
  );
  await t.test(
    "delivery has ordered transitions and completion requires full payment",
    async () => {
      await vendor.cmd(
        "booking.status",
        { id: bookingId, status: "delivered" },
        409,
      );
      await customer.cmd(
        "booking.status",
        { id: bookingId, status: "in_progress" },
        403,
      );
      await vendor.cmd("booking.status", {
        id: bookingId,
        status: "in_progress",
      });
      await vendor.cmd("booking.status", {
        id: bookingId,
        status: "delivered",
      });
      await customer.cmd(
        "booking.status",
        { id: bookingId, status: "completed" },
        409,
      );
      await customer.cmd("booking.pay", {
        id: bookingId,
        reference: `balance-${suffix}`,
      });
      await customer.cmd("booking.status", {
        id: bookingId,
        status: "completed",
      });
    },
  );
  await t.test(
    "reviews require a completed booking and cannot be duplicated",
    async () => {
      await outsider.cmd(
        "review.create",
        { booking_id: bookingId, rating: 5, body: "Invalid outsider review" },
        403,
      );
      await customer.cmd("review.create", {
        booking_id: bookingId,
        rating: 5,
        body: "A thoughtfully delivered test celebration.",
      });
      await customer.cmd(
        "review.create",
        { booking_id: bookingId, rating: 5, body: "Duplicate review" },
        409,
      );
    },
  );
  await t.test(
    "finance preparation and approval must be different people",
    async () => {
      await finance.cmd("finance.request", { booking_id: bookingId });
      const p = (await finance.ws()).payments.find(
        (p: any) => p.booking_id === bookingId && p.kind === "payout",
      );
      await finance.cmd("finance.approve", { id: p.id }, 403);
      await admin.cmd("finance.approve", { id: p.id });
      assert.equal(
        (await finance.ws()).payments.find((a: any) => a.id === p.id).status,
        "simulated",
      );
      await finance.cmd("finance.request", { booking_id: bookingId }, 409);
    },
  );
  await t.test(
    "revoking event membership removes access immediately",
    async () => {
      const inv = (await customer.ws()).members.find(
        (i: any) => i.event_id === eventId,
      );
      await customer.cmd("invite.revoke", { id: inv.id });
      await planner.cmd(
        "task.create",
        { event_id: eventId, title: "Cannot edit after revoke" },
        403,
      );
      assert.ok(
        !(await planner.ws()).events.some((e: any) => e.id === eventId),
      );
    },
  );
  await t.test(
    "business applications require independent review before publication",
    async () => {
      const b = (
        await customer.cmd("business.submit", {
          name: `Test studio ${suffix}`,
          kind: "vendor",
          category: "Decoration",
          city: "Nellore",
          description:
            "Independent test supplier with clear service descriptions.",
          price: 10000,
          tagline: "Thoughtfully made for testing",
        })
      ).id;
      assert.ok(
        !(await customer.request("catalog")).body.businesses.some(
          (x: any) => x.id === b,
        ),
      );
      await customer.cmd(
        "offering.create",
        {
          business_id: b,
          name: "Test package",
          description: "A test service",
          price: 1000,
          unit: "package",
          inclusions: "Setup included",
          exclusions: "Venue not included",
        },
        409,
      );
      await reviewer.cmd("business.review", {
        id: b,
        status: "changes_requested",
        note: "Please clarify the setup scope.",
      });
      await customer.cmd("business.resubmit", {
        id: b,
        description: "Setup and teardown are included in the quoted price.",
      });
      await reviewer.cmd("business.review", {
        id: b,
        status: "approved",
        note: "Listing scope reviewed. Identity checks remain separate.",
      });
      assert.ok(
        (await customer.request("catalog")).body.businesses.some(
          (x: any) => x.id === b,
        ),
      );
    },
  );
  await t.test(
    "city operations can only read their assigned city events",
    async () => {
      const e = (
        await customer.cmd("event.create", {
          name: `Nellore ${suffix}`,
          type: "Birthday",
          city: "Nellore",
          date,
          guests: 10,
          budget: 10000,
        })
      ).id;
      assert.ok(!(await operations.ws()).events.some((x: any) => x.id === e));
      await operations.cmd(
        "ticket.create",
        {
          event_id: e,
          subject: "Unauthorized event",
          body: "City boundary test",
        },
        403,
      );
    },
  );
  await t.test("cross-origin mutations are rejected", async () => {
    const r = await fetch(base + "/api/commands", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://untrusted.example",
        Cookie: customer.cookie,
      },
      body: JSON.stringify({ action: "notification.read", data: {} }),
    });
    assert.equal(r.status, 403);
  });
  await t.test(
    "itemized quote totals validate and cancelled bookings create independently approved refunds",
    async () => {
      await customer.cmd("quote.request", {
        event_id: eventId,
        offering_id: "o-2",
      });
      const q = (await customer.ws()).quotes.find(
        (q: any) => q.event_id === eventId && q.offering_id === "o-2",
      );
      await vendor.cmd(
        "quote.send",
        {
          id: q.id,
          amount: 20000,
          scope: "Food for 50 guests. Setup included.",
          items_text: "Meals | 50 | 300",
        },
        400,
      );
      await vendor.cmd("quote.send", {
        id: q.id,
        amount: 20000,
        scope: "Food for 50 guests. Setup included.",
        items_text: "Meals | 50 | 300\nServing team | 1 | 5000",
      });
      const sent = (await customer.ws()).quotes.find((x: any) => x.id === q.id);
      assert.equal(sent.items.length, 2);
      const k = (await customer.cmd("quote.accept", { id: q.id, version: 2 }))
        .id;
      await customer.cmd("booking.pay", {
        id: k,
        reference: `cancel-deposit-${suffix}`,
      });
      await customer.cmd("booking.status", {
        id: k,
        status: "cancel_requested",
      });
      await support.cmd("booking.cancel", { id: k });
      const p = (await finance.ws()).payments.find(
        (p: any) => p.booking_id === k && p.kind === "refund",
      );
      assert.equal(p.amount, 6000);
      assert.equal(p.status, "pending");
      await finance.cmd("finance.approve", { id: p.id });
      assert.equal(
        (await customer.ws()).bookings.find((b: any) => b.id === k).status,
        "cancelled",
      );
    },
  );
  await t.test(
    "blocked dates prevent acceptance and can be released by supplier managers",
    async () => {
      const d = new Date(new Date(date).getTime() + 86400000)
        .toISOString()
        .slice(0, 10);
      await vendor.cmd("availability.block", {
        business_id: "b-4",
        date: d,
        reason: "Maintenance day",
      });
      const e = (
        await customer.cmd("event.create", {
          name: `Blocked date ${suffix}`,
          type: "Birthday",
          city: "Hyderabad",
          date: d,
          guests: 50,
          budget: 80000,
        })
      ).id;
      await customer.cmd("quote.request", { event_id: e, offering_id: "o-4" });
      const q = (await customer.ws()).quotes.find((q: any) => q.event_id === e);
      await vendor.cmd("quote.send", {
        id: q.id,
        amount: 65000,
        scope: "Venue session for six hours.",
      });
      await customer.cmd("quote.accept", { id: q.id, version: 2 }, 409);
      const block = (await vendor.ws()).blocks.find(
        (b: any) => b.business_id === "b-4" && String(b.date).startsWith(d),
      );
      assert.ok(block);
      await vendor.cmd("availability.unblock", { id: block.id });
      await customer.cmd("quote.accept", { id: q.id, version: 2 });
    },
  );
  await t.test(
    "private documents reject unsafe formats and enforce download and review access",
    async () => {
      const invalid = new FormData();
      invalid.set("business_id", "b-1");
      invalid.set(
        "file",
        new Blob(["<html>test</html>"], { type: "text/html" }),
        "unsafe.html",
      );
      assert.equal(
        (
          await fetch(base + "/api/documents", {
            method: "POST",
            headers: { Cookie: vendor.cookie },
            body: invalid,
          })
        ).status,
        400,
      );
      const form = new FormData();
      form.set("business_id", "b-1");
      form.set(
        "file",
        new Blob(["%PDF-1.4\n% Local verification fixture\n%%EOF"], {
          type: "application/pdf",
        }),
        "test-document.pdf",
      );
      const r = await fetch(base + "/api/documents", {
        method: "POST",
        headers: { Cookie: vendor.cookie },
        body: form,
      });
      assert.equal(r.status, 200);
      const doc = (await r.json()) as any;
      assert.equal(
        (
          await fetch(base + "/api/documents/" + doc.id, {
            headers: { Cookie: outsider.cookie },
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await fetch(base + "/api/documents/" + doc.id, {
            headers: { Cookie: reviewer.cookie },
          })
        ).status,
        200,
      );
      await vendor.cmd(
        "document.review",
        { id: doc.id, status: "approved", note: "Cannot self-review" },
        403,
      );
      await reviewer.cmd("document.review", {
        id: doc.id,
        status: "approved",
        note: "Test document review recorded.",
      });
      assert.equal(
        (await vendor.ws()).documents.find((d: any) => d.id === doc.id).status,
        "approved",
      );
    },
  );
  await t.test(
    "guest lists remain private and event closeout checks supplier completion",
    async () => {
      await customer.cmd("guest.create", {
        event_id: eventId,
        name: "Test family",
        email: "",
        party_size: 3,
        rsvp: "pending",
        dietary: "Vegetarian",
      });
      const g = (await customer.ws()).guests.find(
        (g: any) => g.event_id === eventId,
      );
      assert.ok(g);
      assert.ok(!(await outsider.ws()).guests.some((x: any) => x.id === g.id));
      await outsider.cmd("guest.rsvp", { id: g.id, rsvp: "attending" }, 403);
      await customer.cmd("guest.rsvp", { id: g.id, rsvp: "attending" });
      await customer.cmd("event.update", {
        id: eventId,
        name: `Final celebration ${suffix}`,
        budget: 90000,
      });
      await customer.cmd("event.close", { id: eventId });
      assert.equal(
        (await customer.ws()).events.find((e: any) => e.id === eventId).status,
        "completed",
      );
      await customer.cmd(
        "quote.request",
        { event_id: eventId, offering_id: "o-4" },
        409,
      );
    },
  );
  await t.test(
    "audit log contains important changes and is admin-only",
    async () => {
      const w = await admin.ws();
      assert.ok(w.audit.some((a: any) => a.action === "finance.approve"));
      assert.equal((await customer.ws()).audit.length, 0);
    },
  );
});
