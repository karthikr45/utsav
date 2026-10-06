"use client";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  BriefcaseBusiness,
  CheckSquare,
  MessageCircle,
  Store,
  Wallet,
  LifeBuoy,
  Users,
  ShieldCheck,
  Activity,
  Settings,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Bell,
  Search,
  ChevronDown,
  MapPin,
  Check,
  LogOut,
  Menu,
  X,
  Clock,
  MoreHorizontal,
  Send,
  Inbox,
  Heart,
  Sparkles,
  CheckCircle2,
  Download,
} from "lucide-react";
import { useApp, Brand } from "./application";
import { Status, Badge, Empty, SectionTitle, type Field } from "./ui";
import {
  money,
  dateLabel,
  cities,
  type Workspace,
  type EventRecord,
  type Quote,
  type Booking,
} from "@/lib/types";
import { roleLabels } from "@/lib/catalog";
const tabs: Record<string, { label: string; icon: any }> = {
  overview: { label: "Overview", icon: LayoutDashboard },
  guests: { label: "Guest list", icon: Users },
  events: { label: "My events", icon: CalendarDays },
  quotes: { label: "Enquiries & quotes", icon: FileText },
  bookings: { label: "Bookings", icon: BriefcaseBusiness },
  tasks: { label: "Checklist", icon: CheckSquare },
  messages: { label: "Messages", icon: MessageCircle },
  business: { label: "My business", icon: Store },
  payments: { label: "Payments & payouts", icon: Wallet },
  support: { label: "Help & support", icon: LifeBuoy },
  team: { label: "People & access", icon: Users },
  approvals: { label: "Business reviews", icon: ShieldCheck },
  audit: { label: "Activity log", icon: Activity },
  settings: { label: "Account settings", icon: Settings },
};
const allowed: Record<string, string[]> = {
  customer: [
    "overview",
    "events",
    "guests",
    "quotes",
    "bookings",
    "tasks",
    "messages",
    "payments",
    "team",
    "support",
    "settings",
  ],
  vendor: [
    "overview",
    "events",
    "guests",
    "tasks",
    "business",
    "quotes",
    "bookings",
    "messages",
    "payments",
    "team",
    "support",
    "settings",
  ],
  planner: [
    "overview",
    "events",
    "guests",
    "quotes",
    "bookings",
    "tasks",
    "messages",
    "business",
    "payments",
    "team",
    "support",
    "settings",
  ],
  operations: ["overview", "events", "bookings", "support", "settings"],
  reviewer: ["overview", "approvals", "settings"],
  support: [
    "overview",
    "events",
    "bookings",
    "messages",
    "support",
    "settings",
  ],
  finance: ["overview", "bookings", "payments", "settings"],
  admin: Object.keys(tabs),
};
export function WorkspaceView() {
  const { user, ws, loading, go, path, newEvent, logout, demo } = useApp();
  const [mobile, setMobile] = useState(false);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width:720px)");
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [notifications, setNotifications] = useState(false);
  const tab = path.split("/")[2] || "overview";
  if (loading)
    return (
      <div className="loading-page">
        <span className="brand-mark">✳</span>
        <h2>Gathering the little details…</h2>
      </div>
    );
  if (!user || !ws)
    return (
      <main id="main" className="container section">
        <Empty
          title="Your celebrations are waiting."
          body="Sign in to open your private workspace."
          action={
            <button className="button primary" onClick={() => go("/login")}>
              Sign in <ArrowRight size={16} />
            </button>
          }
        />
      </main>
    );
  const nav = allowed[user.role] ?? allowed.customer;
  const unread = ws.notifications.filter((n) => !n.read).length;
  return (
    <div className="workspace-shell">
      <aside
        inert={narrow && !mobile}
        className={`sidebar ${mobile ? "open" : ""}`}
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-toggle"
            onClick={() => setMobile(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-symbol">
            <Sparkles size={16} />
          </span>
          <div>
            <strong>{roleLabels[user.role]}</strong>
            <span>
              {user.role === "operations" ? user.city : "Your Utsav workspace"}
            </span>
          </div>
        </div>
        <span className="nav-group-label">WORKSPACE</span>
        <nav>
          {nav.map((key) => {
            const Icon = tabs[key].icon;
            return (
              <button
                key={key}
                className={tab === key ? "selected" : ""}
                onClick={() => {
                  go(`/dashboard/${key === "overview" ? "" : key}`);
                  setMobile(false);
                }}
              >
                <Icon size={18} strokeWidth={1.65} />
                {tabs[key].label}
                {key === "quotes" &&
                  ws.quotes.filter((q) => q.status === "sent").length > 0 && (
                    <span className="nav-count">
                      {ws.quotes.filter((q) => q.status === "sent").length}
                    </span>
                  )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-promo">
            <span>✳</span>
            <strong>A little inspiration?</strong>
            <p>
              Find your next favorite
              <br />
              local business.
            </p>
            <button onClick={() => go("/explore")}>
              Explore the marketplace <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className="sidebar-profile"
            onClick={() => go("/dashboard/settings")}
          >
            <span className="avatar">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span>
              <strong>{user.name}</strong>
              <small>{user.role} account</small>
            </span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <div>
            <button
              className="icon-button mobile-toggle"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <span className="header-slash">/</span>
            <strong>{tabs[tab]?.label || "Event details"}</strong>
          </div>
          <div>
            <button
              className="workspace-market-link"
              onClick={() => go("/explore")}
            >
              Explore marketplace <ArrowUpRight size={14} />
            </button>
            <span className="header-line" />
            <button
              className="notification-button"
              aria-label="Notifications"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={19} />
              {unread > 0 && <i />}
            </button>
            <span className="avatar small">{user.name[0]}</span>
          </div>
        </header>
        {notifications && (
          <NotificationPanel onClose={() => setNotifications(false)} />
        )}
        <main id="main" className="workspace-content">
          {demo && (
            <div className="demo-banner">
              <span>
                <span className="status-dot" />
                LOCAL PREVIEW
              </span>
              <p>
                Fictional suppliers and sample data. Payments are simulated.
              </p>
              <button onClick={logout}>
                Try another role <ArrowUpRight size={13} />
              </button>
            </div>
          )}
          {!nav.includes(tab) ? (
            <Empty
              title="This area belongs to another role."
              body="Your account does not have access to this workspace."
              action={
                <button
                  className="button primary"
                  onClick={() => go("/dashboard")}
                >
                  Back to overview
                </button>
              }
            />
          ) : (
            <>
              {tab === "guests" ? (
                <Guests />
              ) : tab === "overview" ? (
                <Overview />
              ) : tab === "events" ? (
                path.split("/")[3] ? (
                  <EventDetail id={path.split("/")[3]} />
                ) : (
                  <Events />
                )
              ) : tab === "quotes" ? (
                <Quotes />
              ) : tab === "bookings" ? (
                <Bookings />
              ) : tab === "tasks" ? (
                <Tasks />
              ) : tab === "messages" ? (
                <Messages />
              ) : tab === "business" ? (
                <Businesses />
              ) : tab === "approvals" ? (
                <Approvals />
              ) : tab === "payments" ? (
                <Payments />
              ) : tab === "support" ? (
                <Support />
              ) : tab === "team" ? (
                <Team />
              ) : tab === "audit" ? (
                <Audit />
              ) : (
                <SettingsPage />
              )}
            </>
          )}
        </main>
        <footer className="workspace-footer">
          <span>Thoughtfully together. That’s Utsav.</span>
          <button onClick={() => go("/help")}>
            Need a hand? <ArrowUpRight size={12} />
          </button>
        </footer>
      </div>
    </div>
  );
}
function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="workspace-page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
function Overview() {
  const { ws, user, newEvent, go } = useApp();
  if (!ws || !user) return null;
  const customer = ["customer", "planner"].includes(user.role);
  const pending = ws.quotes.filter((q) =>
    ["requested", "sent"].includes(q.status),
  );
  const committed = ws.bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + b.amount, 0);
  const paid = ws.bookings.reduce((s, b) => s + b.paid, 0);
  const stats = customer
    ? [
        ["Active celebrations", String(ws.events.length), CalendarDays],
        ["Proposals to explore", String(pending.length), FileText],
        ["Committed budget", money(committed), Wallet],
        [
          "Details checked off",
          `${ws.tasks.filter((t) => t.done).length} / ${ws.tasks.length}`,
          CheckSquare,
        ],
      ]
    : user.role === "reviewer"
      ? [
          [
            "Awaiting review",
            String(
              ws.businesses.filter((b) => b.status === "submitted").length,
            ),
            ShieldCheck,
          ],
          [
            "Approved listings",
            String(ws.businesses.filter((b) => b.status === "approved").length),
            Store,
          ],
          [
            "Changes requested",
            String(
              ws.businesses.filter((b) => b.status === "changes_requested")
                .length,
            ),
            FileText,
          ],
        ]
      : [
          [
            "Active bookings",
            String(
              ws.bookings.filter(
                (b) => !["cancelled", "completed"].includes(b.status),
              ).length,
            ),
            CalendarDays,
          ],
          ["Open enquiries", String(pending.length), FileText],
          ["Booking value", money(committed), Wallet],
          [
            "Open support cases",
            String(ws.tickets.filter((t) => t.status !== "resolved").length),
            LifeBuoy,
          ],
        ];
  return (
    <>
      <PageHeader
        eyebrow={new Date()
          .toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })
          .toUpperCase()}
        title={`Hello, ${user.name.split(" ")[0]}.`}
        description={
          customer
            ? "Good things are coming together. Let’s make a little progress."
            : "A clear view of your work, and the details that need you next."
        }
        action={
          customer ? (
            <button className="button primary" onClick={newEvent}>
              <Plus size={17} />
              New celebration
            </button>
          ) : (
            <button className="button outline" onClick={() => go("/explore")}>
              View marketplace <ArrowUpRight size={16} />
            </button>
          )
        }
      />
      <div className="stats-grid">
        {stats.map(([label, value, Icon]: any) => (
          <div className="stat-card" key={label}>
            <span>
              {label}
              <Icon size={17} />
            </span>
            <strong>{value}</strong>
            <small>
              {label === "Committed budget"
                ? "Accepted bookings, excluding cancellations"
                : "From your current workspace"}
            </small>
          </div>
        ))}
      </div>
      <div className="dashboard-columns">
        <div>
          <div className="panel">
            <div className="panel-heading">
              <h3>{customer ? "Your celebrations" : "Coming up next"}</h3>
              <button
                className="text-link"
                onClick={() =>
                  go(customer ? "/dashboard/events" : "/dashboard/bookings")
                }
              >
                View all <ArrowUpRight size={14} />
              </button>
            </div>
            {ws.events.length ? (
              ws.events
                .slice(0, 2)
                .map((e) => <EventCard event={e} key={e.id} />)
            ) : ws.bookings.length ? (
              ws.bookings.slice(0, 3).map((b) => (
                <div className="simple-row" key={b.id}>
                  <span className="row-icon">
                    <CalendarDays size={20} />
                  </span>
                  <div>
                    <strong>{b.event_name}</strong>
                    <small>
                      {dateLabel(b.event_date)} · {b.business_name}
                    </small>
                  </div>
                  <Status value={b.status} />
                </div>
              ))
            ) : (
              <Empty
                title={
                  user.role === "reviewer"
                    ? "Your review desk is ready."
                    : "Room for something wonderful."
                }
                body={
                  user.role === "reviewer"
                    ? "Open Business reviews to evaluate submitted applications."
                    : "Your upcoming work will appear here."
                }
                action={
                  <button
                    className="button outline small"
                    onClick={() =>
                      user.role === "reviewer"
                        ? go("/dashboard/approvals")
                        : customer
                          ? newEvent()
                          : go("/dashboard/business")
                    }
                  >
                    {user.role === "reviewer"
                      ? "Open reviews"
                      : customer
                        ? "Create an event"
                        : "Open business studio"}{" "}
                    <ArrowUpRight size={14} />
                  </button>
                }
              />
            )}
          </div>
          <div className="panel">
            <div className="panel-heading">
              <h3>{customer ? "Fresh proposals" : "Enquiry inbox"}</h3>
              <button
                className="text-link"
                onClick={() => go("/dashboard/quotes")}
              >
                Open inbox <ArrowUpRight size={14} />
              </button>
            </div>
            {pending.length ? (
              pending.slice(0, 3).map((q) => (
                <div className="simple-row" key={q.id}>
                  <span className="row-icon blush">
                    <FlowerIcon />
                  </span>
                  <div>
                    <strong>{q.business_name}</strong>
                    <small>{q.event_name}</small>
                  </div>
                  <div className="row-right">
                    <strong>{money(q.amount)}</strong>
                    <Status value={q.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="panel-empty">
                You’re all caught up. New proposals will appear here.
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="inspiration-card">
            <span className="eyebrow">A LITTLE REMINDER</span>
            <h2>
              The best part?
              <br />
              <em>
                Being there
                <br />
                for it all.
              </em>
            </h2>
            <p>
              Let your dashboard hold the details.
              <br />
              Save a little space for the joy.
            </p>
            <span className="inspiration-flower">✳</span>
            <button onClick={() => go("/packages")}>
              Find some inspiration <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="panel">
            <div className="panel-heading">
              <h3>Next little steps</h3>
              <CheckSquare size={16} />
            </div>
            {ws.tasks
              .filter((t) => !t.done)
              .slice(0, 3)
              .map((t) => (
                <div className="mini-task" key={t.id}>
                  <span className="empty-check" />
                  <span>
                    {t.title}
                    <small>{t.event_name}</small>
                  </span>
                </div>
              ))}
            {!ws.tasks.some((t) => !t.done) && (
              <div className="panel-empty">
                No outstanding tasks. A little breathing room.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
function FlowerIcon() {
  return <Sparkles size={19} />;
}
function EventCard({ event: e }: { event: EventRecord }) {
  const { go, ws } = useApp();
  const bookings =
    ws?.bookings.filter(
      (b) => b.event_id === e.id && b.status !== "cancelled",
    ) ?? [];
  const total = bookings.reduce((s, b) => s + b.amount, 0);
  const percent = Math.min(100, (total / e.budget) * 100);
  return (
    <button
      className="event-card"
      onClick={() => go(`/dashboard/events/${e.id}`)}
    >
      <div className="event-card-top">
        <span className="event-icon">
          <Sparkles size={25} strokeWidth={1.3} />
        </span>
        <Status value={e.status} />
        <ArrowUpRight size={18} />
      </div>
      <span className="eyebrow">{e.type}</span>
      <h3>{e.name}</h3>
      <div className="event-meta">
        <span>
          <CalendarDays size={13} />
          {dateLabel(e.date)}
        </span>
        <span>
          <MapPin size={13} />
          {e.city}
        </span>
        <span>
          <Users size={13} />
          {e.guests} guests
        </span>
      </div>
      <div className="event-budget">
        <span>Committed budget</span>
        <strong>
          {money(total)} <small>/ {money(e.budget)}</small>
        </strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${percent}%` }} />
      </div>
      <span className="event-card-footer">
        {bookings.length} services booked
        <span>
          Open celebration <ArrowRight size={14} />
        </span>
      </span>
    </button>
  );
}
function Events() {
  const { ws, newEvent } = useApp();
  return (
    <>
      <PageHeader
        eyebrow="YOUR PLANNING SPACE"
        title="Every occasion. All together."
        description="A thoughtful home for every celebration you’re bringing to life."
        action={
          <button className="button primary" onClick={newEvent}>
            <Plus size={17} />
            New celebration
          </button>
        }
      />
      <div className="events-grid">
        {ws?.events.map((e) => (
          <EventCard event={e} key={e.id} />
        ))}
      </div>
      {!ws?.events.length && (
        <Empty
          title="Your first celebration starts here."
          body="Tell us a little about your event. We’ll keep all the details together."
          action={
            <button className="button primary" onClick={newEvent}>
              Create a celebration <Plus size={16} />
            </button>
          }
        />
      )}
    </>
  );
}
function EventDetail({ id }: { id: string }) {
  const { ws, go, user, open, run } = useApp();
  const e = ws?.events.find((e) => e.id === id);
  if (!e)
    return (
      <Empty
        title="This event isn’t in your workspace."
        body="Ask the event owner to invite you if you need access."
      />
    );
  return (
    <>
      <button
        className="text-link back-link"
        onClick={() => go("/dashboard/events")}
      >
        ← All celebrations
      </button>
      <PageHeader
        eyebrow={`${e.type} · ${e.city}`}
        title={e.name}
        description={`${dateLabel(e.date)} · ${e.guests} guests · ${e.venue || "Venue to be decided"}`}
        action={
          <button className="button primary" onClick={() => go("/explore")}>
            Find another service <Plus size={16} />
          </button>
        }
      />
      {e.can_edit && (
        <div className="event-edit-actions">
          <button
            className="button outline small"
            onClick={() =>
              open({
                title: "A little update to your plans.",
                action: "event.update",
                data: { id: e.id },
                submit: "Save event details",
                fields: [
                  { name: "name", label: "Event name", value: e.name },
                  {
                    name: "budget",
                    label: "Planning budget (₹)",
                    type: "number",
                    min: 1,
                    value: e.budget,
                  },
                ],
                note: "Changing your planning budget does not change accepted supplier quotes. Date, location and guest-count changes require supplier reconfirmation through support.",
              })
            }
          >
            Edit name & budget
          </button>
          <button
            className="button outline small"
            onClick={() => go("/dashboard/guests")}
          >
            Manage guests
          </button>
          {e.owner_id === user?.id && e.status !== "completed" && (
            <button
              className="text-link"
              onClick={() => run("event.close", { id: e.id })}
            >
              Close completed celebration
            </button>
          )}
        </div>
      )}
      <div className="event-summary">
        <div>
          <span>YOUR BUDGET</span>
          <strong>{money(e.budget)}</strong>
        </div>
        <div>
          <span>COMMITTED</span>
          <strong>
            {money(
              ws!.bookings
                .filter((b) => b.event_id === id && b.status !== "cancelled")
                .reduce((s, b) => s + b.amount, 0),
            )}
          </strong>
        </div>
        <div>
          <span>YOUR HOST</span>
          <strong>{e.owner_name || user?.name}</strong>
        </div>
        <div>
          <span>STATUS</span>
          <Status value={e.status} />
        </div>
      </div>
      <div className="section-heading compact">
        <h2>The people bringing it together.</h2>
        <button className="text-link" onClick={() => go("/dashboard/team")}>
          People & access <ArrowUpRight size={15} />
        </button>
      </div>
      <Bookings eventId={id} compact />
      <Tasks eventId={id} compact />
    </>
  );
}
function Quotes() {
  const { ws, user, open, run } = useApp();
  const [filter, setFilter] = useState("all");
  const business = user?.role === "vendor";
  const rows =
    ws?.quotes.filter((q) => filter === "all" || q.status === filter) ?? [];
  return (
    <>
      <PageHeader
        eyebrow="CLEAR DETAILS. THOUGHTFUL DECISIONS."
        title={
          business
            ? "Every enquiry is a possibility."
            : "Good things, in proposal form."
        }
        description="Compare scope and final totals. Accepted proposals are preserved as a versioned record."
      />
      <div className="filter-chips dashboard-filters">
        {["all", "requested", "sent", "accepted", "declined"].map((f) => (
          <button
            className={filter === f ? "selected" : ""}
            key={f}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All proposals" : f}
          </button>
        ))}
      </div>
      <div className="quote-grid">
        {rows.map((q) => (
          <article className="quote-card" key={q.id}>
            <div className="quote-card-top">
              <span className="row-icon blush">
                <FileText size={20} />
              </span>
              <Status value={q.status} />
            </div>
            <small>{q.event_name}</small>
            <h3>{q.business_name}</h3>
            <p>{q.scope}</p>
            {q.items && q.items.length > 0 && (
              <div className="quote-items">
                {q.items.map((item, i) => (
                  <div key={i}>
                    <span>
                      {item.label}
                      <small>
                        {item.quantity} × {money(item.unit_price)}
                      </small>
                    </span>
                    <strong>{money(item.quantity * item.unit_price)}</strong>
                  </div>
                ))}
              </div>
            )}
            {q.note && <blockquote>{q.note}</blockquote>}
            <div className="quote-total">
              <span>
                {q.status === "requested" ? "Initial estimate" : "Quoted total"}
              </span>
              <strong>{money(q.amount)}</strong>
            </div>
            <div className="quote-meta">
              <span>Version {q.version}</span>
              <span>Valid until {dateLabel(q.expires_at)}</span>
            </div>
            <div className="card-actions">
              {q.can_manage &&
              ["requested", "sent", "expired"].includes(q.status) ? (
                <button
                  className="button primary small"
                  onClick={() =>
                    open({
                      title: "Make the details clear.",
                      subtitle: `Proposal for ${q.event_name}`,
                      action: "quote.send",
                      data: { id: q.id },
                      submit:
                        q.status === "requested"
                          ? "Send proposal"
                          : "Send revised proposal",
                      fields: [
                        {
                          name: "amount",
                          label: "Final total (₹)",
                          type: "number",
                          value: q.amount,
                          min: 1,
                        },
                        {
                          name: "scope",
                          label: "Scope, inclusions, exclusions and terms",
                          type: "textarea",
                          value: q.scope,
                        },
                        {
                          name: "items_text",
                          label:
                            "Line items · description | quantity | unit price",
                          type: "textarea",
                          required: false,
                          placeholder:
                            "Floral backdrop | 1 | 12000\nSetup and collection | 1 | 6500",
                          hint: "Optional. Each line must follow the format above; the sum must match the quoted total.",
                        },
                      ],
                      note: "Sending a revision creates a new version. The customer must accept that exact version.",
                    })
                  }
                >
                  Prepare proposal <ArrowUpRight size={14} />
                </button>
              ) : q.status === "sent" && q.can_approve ? (
                <>
                  <button
                    className="button primary small"
                    onClick={() =>
                      open({
                        title: "Ready to bring this together?",
                        subtitle: q.business_name,
                        action: "quote.accept",
                        data: { id: q.id, version: q.version },
                        fields: [],
                        submit: `Accept ${money(q.amount)} proposal`,
                        note: `${q.scope} A 30% deposit is required to confirm your booking. Your supplier is reserved when you accept; you can request cancellation from Bookings.`,
                      })
                    }
                  >
                    Review & accept <ArrowUpRight size={14} />
                  </button>
                  <button
                    className="button outline small"
                    onClick={() => run("quote.decline", { id: q.id })}
                  >
                    Decline
                  </button>
                </>
              ) : (
                <span className="muted small-text">
                  {q.status === "requested"
                    ? "Waiting for supplier confirmation."
                    : q.status === "accepted"
                      ? "Continue in your booking workspace."
                      : "No action required."}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
      {!rows.length && (
        <Empty
          title="A little room for possibilities."
          body="Request a quote from a package to start a conversation with a supplier."
        />
      )}
    </>
  );
}
function Bookings({
  eventId,
  compact = false,
}: {
  eventId?: string;
  compact?: boolean;
}) {
  const { ws, user, run, open, go } = useApp();
  const rows =
    ws?.bookings.filter((b) => !eventId || b.event_id === eventId) ?? [];
  const vendor = user?.role === "vendor";
  return (
    <>
      {!compact && (
        <PageHeader
          eyebrow="FROM PLANS TO BEAUTIFUL REALITY"
          title="The details, confirmed."
          description="Track each supplier, payment and delivery in one place."
        />
      )}
      <div className="booking-list">
        {rows.map((b) => (
          <article className="booking-card" key={b.id}>
            <div className="booking-card-main">
              <span className="row-icon">
                <BriefcaseBusiness size={21} />
              </span>
              <div>
                <small>
                  {b.event_name} · {dateLabel(b.event_date)}
                </small>
                <h3>{b.business_name}</h3>
                <p>{b.scope}</p>
              </div>
              <Status value={b.status} />
            </div>
            {b.status === "awaiting_payment" && b.hold_until && (
              <div className="hold-note">
                <Clock size={13} /> Reservation held until{" "}
                {new Date(b.hold_until).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                . Complete your deposit before it expires.
              </div>
            )}
            <div className="booking-financial">
              {!b.financial_redacted && (
                <>
                  <div>
                    <span>BOOKING TOTAL</span>
                    <strong>{money(b.amount)}</strong>
                  </div>
                  <div>
                    <span>PAID</span>
                    <strong>{money(b.paid)}</strong>
                  </div>
                  <div>
                    <span>REMAINING</span>
                    <strong>{money(b.amount - b.paid)}</strong>
                  </div>
                </>
              )}
              <div className="booking-actions">
                {b.can_approve &&
                  ["awaiting_payment", "confirmed", "delivered"].includes(
                    b.status,
                  ) &&
                  b.paid < b.amount && (
                    <button
                      className="button primary small"
                      onClick={() =>
                        open({
                          title: "A clear next step.",
                          action: "booking.pay",
                          data: { id: b.id, reference: crypto.randomUUID() },
                          fields: [],
                          submit: ws?.demo
                            ? `Simulate ${money(b.paid === 0 ? b.deposit : b.amount - b.paid)} payment`
                            : "Continue to payment",
                          note: ws?.demo
                            ? "Local preview: this records a simulated payment. No money will be charged."
                            : "Live payment provider setup is required.",
                        })
                      }
                    >
                      {b.paid === 0 ? "Pay deposit" : "Pay balance"}{" "}
                      <ArrowUpRight size={14} />
                    </button>
                  )}
                {b.can_manage && (
                  <button
                    className="button outline small"
                    onClick={() =>
                      open({
                        title: "Assign the right person.",
                        action: "booking.assign",
                        data: { booking_id: b.id },
                        submit: "Assign team member",
                        fields: [
                          {
                            name: "user_id",
                            label: "Team member",
                            options: ws?.businessMembers
                              .filter((m) => m.business_id === b.business_id)
                              .map((m) => ({
                                value: m.user_id,
                                label: `${m.name} · ${m.role}`,
                              })),
                          },
                        ],
                        note: "Workers see only assigned jobs. Financial fields are hidden.",
                      })
                    }
                  >
                    Assign staff
                  </button>
                )}
                {b.can_manage && b.status === "confirmed" && (
                  <button
                    className="button primary small"
                    onClick={() =>
                      run("booking.status", { id: b.id, status: "in_progress" })
                    }
                  >
                    Start delivery
                  </button>
                )}
                {b.can_manage && b.status === "in_progress" && (
                  <button
                    className="button primary small"
                    onClick={() =>
                      run("booking.status", { id: b.id, status: "delivered" })
                    }
                  >
                    Mark delivered
                  </button>
                )}
                {b.can_approve &&
                  b.status === "delivered" &&
                  b.paid === b.amount && (
                    <button
                      className="button primary small"
                      onClick={() =>
                        run("booking.status", { id: b.id, status: "completed" })
                      }
                    >
                      Confirm completion
                    </button>
                  )}
                {b.can_manage &&
                  ["confirmed", "awaiting_payment"].includes(b.status) && (
                    <button
                      className="button outline small"
                      onClick={() =>
                        open({
                          title: "Propose a change.",
                          action: "change.request",
                          data: { booking_id: b.id },
                          submit: "Send for customer approval",
                          fields: [
                            {
                              name: "amount",
                              label: "Revised total (₹)",
                              type: "number",
                              value: b.amount,
                              min: 1,
                            },
                            {
                              name: "scope",
                              label: "Revised scope and reason",
                              type: "textarea",
                              value: b.scope,
                            },
                          ],
                          note: "The accepted booking remains unchanged until the customer approves.",
                        })
                      }
                    >
                      Propose change
                    </button>
                  )}
                {b.status === "completed" && b.owner_id === user?.id && (
                  <button
                    className="button outline small"
                    onClick={() =>
                      open({
                        title: "Tell their next customer.",
                        action: "review.create",
                        data: { booking_id: b.id },
                        submit: "Publish review",
                        fields: [
                          {
                            name: "rating",
                            label: "Your rating",
                            options: [5, 4, 3, 2, 1].map((v) => ({
                              value: String(v),
                              label: `${v} stars`,
                            })),
                          },
                          {
                            name: "body",
                            label: "Your experience",
                            type: "textarea",
                          },
                        ],
                      })
                    }
                  >
                    Leave a review <Heart size={14} />
                  </button>
                )}
                {b.can_approve &&
                  !["completed", "cancelled", "cancel_requested"].includes(
                    b.status,
                  ) && (
                    <button
                      className="text-link muted"
                      onClick={() =>
                        open({
                          title: "Request a cancellation?",
                          action: "booking.status",
                          data: { id: b.id, status: "cancel_requested" },
                          fields: [],
                          submit: "Request cancellation",
                          note: "Support will review this request. Any refund is processed separately and appears in your payment history.",
                        })
                      }
                    >
                      Cancel
                    </button>
                  )}
                {["support", "admin"].includes(user?.role || "") &&
                  b.status === "cancel_requested" && (
                    <button
                      className="button outline small"
                      onClick={() => run("booking.cancel", { id: b.id })}
                    >
                      Approve cancellation
                    </button>
                  )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!rows.length && (
        <Empty
          title="Your people will be right here."
          body="Accept a supplier proposal to create your first booking."
          action={
            <button
              className="button outline"
              onClick={() => go("/dashboard/quotes")}
            >
              View proposals <ArrowUpRight size={15} />
            </button>
          }
        />
      )}{" "}
      {(ws?.changes ?? [])
        .filter((c) => c.status === "pending")
        .map((c) => (
          <div className="amendment-card" key={c.id}>
            <div>
              <Badge tone="amber">Approval needed</Badge>
              <h3>{c.business_name} · proposed amendment</h3>
              <p>{c.scope}</p>
              <strong>Revised total: {money(c.amount)}</strong>
            </div>
            {ws?.bookings.some(
              (b) => b.id === c.booking_id && b.can_approve,
            ) && (
              <div className="card-actions">
                <button
                  className="button primary small"
                  onClick={() =>
                    run("change.decide", { id: c.id, approve: true })
                  }
                >
                  Approve change
                </button>
                <button
                  className="button outline small"
                  onClick={() =>
                    run("change.decide", { id: c.id, approve: false })
                  }
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        ))}
    </>
  );
}
function Tasks({
  eventId,
  compact = false,
}: {
  eventId?: string;
  compact?: boolean;
}) {
  const { ws, open, run } = useApp();
  const rows =
    ws?.tasks.filter((t) => !eventId || t.event_id === eventId) ?? [];
  const add = () =>
    open({
      title: "One little detail.",
      action: "task.create",
      submit: "Add to checklist",
      fields: [
        {
          name: "event_id",
          label: "Celebration",
          value: eventId,
          options: ws?.events.map((e) => ({ value: e.id, label: e.name })),
        },
        {
          name: "title",
          label: "What needs doing?",
          placeholder: "e.g. Confirm the cake delivery time",
        },
      ],
    });
  return (
    <div className={compact ? "event-tasks" : ""}>
      {!compact ? (
        <PageHeader
          eyebrow="ONE DETAIL AT A TIME"
          title="A little progress feels lovely."
          description="Keep your people aligned and your to-dos in one place."
          action={
            <button className="button primary" onClick={add}>
              <Plus size={16} />
              Add a task
            </button>
          }
        />
      ) : (
        <div className="panel-heading">
          <h3>The little details</h3>
          <button className="text-link" onClick={add}>
            Add task <Plus size={15} />
          </button>
        </div>
      )}
      <div className="panel task-panel">
        {rows.map((t) => (
          <label className={`task-row ${t.done ? "done" : ""}`} key={t.id}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={(e) =>
                run("task.toggle", { id: t.id, done: e.target.checked })
              }
            />
            <span>
              <strong>{t.title}</strong>
              <small>{t.event_name}</small>
            </span>
            <span className="task-date">
              {t.due_date ? dateLabel(t.due_date) : "No due date"}
            </span>
          </label>
        ))}
        {!rows.length && (
          <Empty
            title="A fresh checklist."
            body="Create an event to start gathering the details."
          />
        )}
      </div>
    </div>
  );
}
function Messages() {
  const { ws, user, run } = useApp();
  const [selected, setSelected] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const q = ws?.quotes.find((q) => q.id === selected) || ws?.quotes[0];
  const messages = ws?.messages.filter((m) => m.quote_id === q?.id) ?? [];
  return (
    <>
      <PageHeader
        eyebrow="GOOD CONVERSATIONS. BETTER CELEBRATIONS."
        title="Keep the conversation together."
        description="A private thread for each supplier proposal."
      />
      {!q ? (
        <Empty
          title="Say hello to your next possibility."
          body="Request a quote to start a conversation."
        />
      ) : (
        <div className="message-layout">
          <aside>
            {ws?.quotes.map((t) => (
              <button
                className={t.id === q.id ? "active" : ""}
                key={t.id}
                onClick={() => setSelected(t.id)}
              >
                <span className="avatar">{t.business_name[0]}</span>
                <span>
                  <strong>{t.business_name}</strong>
                  <small>{t.event_name}</small>
                </span>
              </button>
            ))}
          </aside>
          <div className="message-thread">
            <div className="message-thread-header">
              <strong>{q.business_name}</strong>
              <span>{q.event_name}</span>
            </div>
            <div className="message-body">
              {messages.map((m) => (
                <div
                  className={`message-bubble ${m.sender_id === user?.id ? "own" : ""}`}
                  key={m.id}
                >
                  <small>{m.sender_name}</small>
                  <p>{m.body}</p>
                  <time>
                    {new Date(m.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              ))}
              {!messages.length && (
                <div className="panel-empty">
                  A friendly hello is a lovely place to start.
                </div>
              )}
            </div>
            <form
              className="message-compose"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                if (await run("message.send", { quote_id: q.id, body }))
                  setBody("");
                setBusy(false);
              }}
            >
              <input
                aria-label="Your message"
                placeholder="A question, an idea, a little hello…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                minLength={2}
                maxLength={4000}
              />
              <button
                className="button primary"
                disabled={busy}
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
function Businesses() {
  const { ws, go, open } = useApp();
  return (
    <>
      <PageHeader
        eyebrow="YOUR BUSINESS, BEAUTIFULLY PRESENTED"
        title="Your craft. Your little corner."
        description="Manage your listings, services and application status."
        action={
          <button className="button primary" onClick={() => go("/partner")}>
            <Plus size={16} />
            Add a business
          </button>
        }
      />
      <div className="business-list">
        {ws?.businesses.map((b) => (
          <article className="business-card" key={b.id}>
            <img src={b.image} alt={b.name} />
            <div>
              <div className="card-actions">
                <Badge>
                  {b.category} · {b.city}
                </Badge>
                <Status value={b.status} />
              </div>
              <h3>{b.name}</h3>
              <p>{b.description}</p>
              {b.review_note && (
                <div className="review-feedback">
                  <strong>Review feedback</strong>
                  <p>{b.review_note}</p>
                </div>
              )}
              <div className="card-actions">
                {b.status === "approved" ? (
                  <>
                    <button
                      className="button outline small"
                      onClick={() => go(`/vendors/${b.id}`)}
                    >
                      View storefront <ArrowUpRight size={14} />
                    </button>
                    <button
                      className="button primary small"
                      onClick={() =>
                        open({
                          title: "Something lovely to offer.",
                          action: "offering.create",
                          data: { business_id: b.id },
                          submit: "Publish package",
                          fields: [
                            { name: "name", label: "Package name" },
                            {
                              name: "price",
                              label: "Starting price (₹)",
                              type: "number",
                              min: 1,
                            },
                            {
                              name: "unit",
                              label: "Price per",
                              options: [
                                "package",
                                "guest",
                                "session",
                                "cake",
                                "planning fee",
                              ].map((v) => ({ value: v, label: v })),
                            },
                            {
                              name: "description",
                              label: "Description",
                              type: "textarea",
                            },
                            {
                              name: "inclusions",
                              label: "Included · one item per line",
                              type: "textarea",
                            },
                            {
                              name: "exclusions",
                              label: "Excluded · one item per line",
                              type: "textarea",
                            },
                          ],
                        })
                      }
                    >
                      <Plus size={14} />
                      Add package
                    </button>
                  </>
                ) : ["changes_requested", "rejected", "draft"].includes(
                    b.status,
                  ) ? (
                  <button
                    className="button primary small"
                    onClick={() =>
                      open({
                        title: "A little more detail.",
                        action: "business.resubmit",
                        data: { id: b.id },
                        submit: "Resubmit for review",
                        fields: [
                          {
                            name: "description",
                            label: "Updated description and corrections",
                            type: "textarea",
                            value: b.description,
                          },
                        ],
                      })
                    }
                  >
                    Update application
                  </button>
                ) : (
                  <span className="muted small-text">
                    <Clock size={13} /> Your application is with our review
                    team.
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      <Availability />
      <Documents />
      {!ws?.businesses.length && (
        <Empty
          title="Let’s give your business a home."
          body="Create your profile and submit it for review."
          action={
            <button className="button primary" onClick={() => go("/partner")}>
              Get started <ArrowUpRight size={15} />
            </button>
          }
        />
      )}
    </>
  );
}
function Approvals() {
  const { ws, open } = useApp();
  const [filter, setFilter] = useState("submitted");
  const rows =
    ws?.businesses.filter((b) => filter === "all" || b.status === filter) ?? [];
  return (
    <>
      <PageHeader
        eyebrow="TRUST STARTS WITH THE DETAILS"
        title="A thoughtful review desk."
        description="Review listing information. Identity and payment-provider verification remain separate gates."
      />
      <div className="filter-chips dashboard-filters">
        {["submitted", "changes_requested", "approved", "all"].map((s) => (
          <button
            className={filter === s ? "selected" : ""}
            key={s}
            onClick={() => setFilter(s)}
          >
            {s.replaceAll("_", " ")}
          </button>
        ))}
      </div>
      <div className="business-list">
        {rows.map((b) => (
          <article className="business-card" key={b.id}>
            <img src={b.image} alt={b.name} />
            <div>
              <div className="card-actions">
                <Badge>
                  {b.category} · {b.city}
                </Badge>
                <Status value={b.status} />
              </div>
              <h3>{b.name}</h3>
              <p>{b.description}</p>
              <span className="small-text">
                Starting at {money(b.price)} · {b.kind}
              </span>
              <div className="card-actions">
                <button
                  className="button primary small"
                  onClick={() =>
                    open({
                      title: `Review ${b.name}`,
                      action: "business.review",
                      data: { id: b.id },
                      submit: "Record review decision",
                      fields: [
                        {
                          name: "status",
                          label: "Decision",
                          options: [
                            { value: "approved", label: "Approve listing" },
                            {
                              value: "changes_requested",
                              label: "Request corrections",
                            },
                            { value: "rejected", label: "Reject application" },
                            { value: "suspended", label: "Suspend listing" },
                          ],
                        },
                        {
                          name: "note",
                          label: "Reason and feedback",
                          type: "textarea",
                        },
                      ],
                      note: "This decision is recorded in the audit log and shared with the business owner. Listing review is not an identity or quality guarantee.",
                    })
                  }
                >
                  Review application <ShieldCheck size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!rows.length && (
        <Empty
          title="All clear in this queue."
          body="Applications matching this status will appear here."
        />
      )}
      <Documents />
    </>
  );
}
function Payments() {
  const { ws, user, run, open } = useApp();
  const finance = ["finance", "admin"].includes(user?.role || "");
  const payments = ws?.payments ?? [];
  const total = payments
    .filter((p) => p.kind === "payment")
    .reduce((s, p) => s + p.amount, 0);
  const exportCsv = () => {
    const rows = [
      ["Reference", "Type", "Amount INR", "Status", "Event"],
      ...payments.map((p) => [
        p.reference,
        p.kind,
        p.amount,
        p.status,
        p.event_name,
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map(
            (v) =>
              '"' +
              String(v)
                .replaceAll('"', '""')
                .replace(/^[=+@-]/, "'") +
              '"',
          )
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "utsav-payment-statement.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <PageHeader
        eyebrow="EVERY RUPEE, ACCOUNTED FOR"
        title="Clear numbers. Peace of mind."
        description="Payment records, refund requests and supplier settlements."
        action={
          <button className="button outline" onClick={exportCsv}>
            <Download size={16} />
            Export statement
          </button>
        }
      />
      <div className="stats-grid three">
        <div className="stat-card">
          <span>
            Recorded payments
            <Wallet size={17} />
          </span>
          <strong>{money(total)}</strong>
          <small>
            {ws?.demo
              ? "Simulated local preview transactions"
              : "Payment records"}
          </small>
        </div>
        <div className="stat-card">
          <span>
            Refund requests
            <FileText size={17} />
          </span>
          <strong>
            {money(
              payments
                .filter((p) => p.kind === "refund")
                .reduce((s, p) => s + p.amount, 0),
            )}
          </strong>
          <small>Refunds are tracked separately</small>
        </div>
        <div className="stat-card">
          <span>
            Pending approval
            <Clock size={17} />
          </span>
          <strong>
            {payments.filter((p) => p.status === "pending").length}
          </strong>
          <small>Requires an independent approver</small>
        </div>
      </div>
      <div className="panel table-panel">
        <div className="panel-heading">
          <h3>Transaction history</h3>
          <Badge>{payments.length} records</Badge>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Event / supplier</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.event_name}</strong>
                    <small>{p.business_name}</small>
                  </td>
                  <td className="capitalize">{p.kind}</td>
                  <td>{money(p.amount)}</td>
                  <td>
                    <Status value={p.status} />
                  </td>
                  <td>{dateLabel(p.created_at)}</td>
                  <td>
                    {finance && p.status === "pending" ? (
                      <button
                        className="text-link"
                        onClick={() =>
                          open({
                            title: "Approve this financial action?",
                            action: "finance.approve",
                            data: { id: p.id },
                            fields: [],
                            submit: "Approve simulated settlement",
                            note: `${p.kind}: ${money(p.amount)}. The preparer cannot approve their own transaction. No real funds move in this preview.`,
                          })
                        }
                      >
                        Review <ArrowUpRight size={14} />
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!payments.length && (
          <Empty
            title="A clean slate."
            body="Booking payments and settlements will appear here."
          />
        )}
      </div>
      {finance && (
        <div className="panel">
          <div className="panel-heading">
            <h3>Completed bookings eligible for payout</h3>
            <small>Preview commission: 10%</small>
          </div>
          {ws?.bookings
            .filter((b) => b.status === "completed")
            .map((b) => (
              <div className="simple-row" key={b.id}>
                <div>
                  <strong>{b.business_name}</strong>
                  <small>{b.event_name}</small>
                </div>
                <strong>{money(Math.round(b.amount * 0.9))}</strong>
                <button
                  className="button outline small"
                  onClick={() => run("finance.request", { booking_id: b.id })}
                >
                  Prepare payout
                </button>
              </div>
            ))}
        </div>
      )}
    </>
  );
}
function Support() {
  const { ws, user, open } = useApp();
  const staff = ["support", "admin"].includes(user?.role || "");
  return (
    <>
      <PageHeader
        eyebrow="A LITTLE HELP, RIGHT WHEN YOU NEED IT"
        title={
          staff
            ? "Care for every celebration."
            : "You don’t have to figure it out alone."
        }
        description="Keep questions and resolutions connected to your event."
        action={
          <button
            className="button primary"
            onClick={() =>
              open({
                title: "Tell us how we can help.",
                action: "ticket.create",
                submit: "Open support case",
                fields: [
                  {
                    name: "event_id",
                    label: "Related celebration",
                    required: false,
                    options: [
                      { value: "", label: "General question" },
                      ...(ws?.events.map((e) => ({
                        value: e.id,
                        label: e.name,
                      })) ?? []),
                    ],
                  },
                  { name: "subject", label: "Subject" },
                  { name: "body", label: "What happened?", type: "textarea" },
                ],
              })
            }
          >
            <Plus size={16} />
            New support case
          </button>
        }
      />
      <div className="support-grid">
        {ws?.tickets.map((t) => (
          <article className="support-card panel" key={t.id}>
            <div className="card-actions">
              <Status value={t.status} />
              <span className="small-text muted">
                {dateLabel(t.created_at)}
              </span>
            </div>
            <h3>{t.subject}</h3>
            <small>
              {t.event_name || "General question"} · {t.user_name}
            </small>
            <p>{t.body}</p>
            {t.reply && (
              <div className="support-reply">
                <strong>Customer care</strong>
                <p>{t.reply}</p>
              </div>
            )}
            {staff && (
              <button
                className="button outline small"
                onClick={() =>
                  open({
                    title: "A helpful next step.",
                    action: "ticket.reply",
                    data: { id: t.id },
                    submit: "Send response",
                    fields: [
                      {
                        name: "reply",
                        label: "Response",
                        type: "textarea",
                        value: t.reply,
                      },
                      {
                        name: "status",
                        label: "Case status",
                        options: ["open", "in_progress", "resolved"].map(
                          (v) => ({ value: v, label: v.replaceAll("_", " ") }),
                        ),
                        value: t.status,
                      },
                    ],
                  })
                }
              >
                Respond <MessageCircle size={14} />
              </button>
            )}
          </article>
        ))}
      </div>
      {!ws?.tickets.length && (
        <Empty
          title="Nothing unresolved. That’s a good feeling."
          body="If you need a hand, open a case and keep the conversation here."
        />
      )}
    </>
  );
}
function Team() {
  const { ws, user, open, run } = useApp();
  return (
    <>
      <PageHeader
        eyebrow="THE RIGHT PEOPLE. THE RIGHT ACCESS."
        title="Better, together."
        description="Invite collaborators to an event. They accept before access is granted."
        action={
          <button
            className="button primary"
            onClick={() =>
              open({
                title: "Bring your people together.",
                action: "invite.create",
                submit: "Create invitation",
                fields: [
                  {
                    name: "event_id",
                    label: "Your celebration",
                    options: ws?.events
                      .filter((e) => e.owner_id === user?.id)
                      .map((e) => ({ value: e.id, label: e.name })),
                  },
                  {
                    name: "email",
                    label: "Their account email",
                    type: "email",
                  },
                  {
                    name: "role",
                    label: "Permission",
                    options: [
                      { value: "viewer", label: "Viewer · see event details" },
                      {
                        value: "contributor",
                        label: "Contributor · tasks and enquiries",
                      },
                      {
                        value: "approver",
                        label: "Approver · limited spending",
                      },
                      {
                        value: "planner",
                        label: "Planner · coordinate this event",
                      },
                    ],
                  },
                  {
                    name: "spending_limit",
                    label: "Spending limit for approver (₹)",
                    type: "number",
                    min: 0,
                    value: 0,
                  },
                ],
                note: "Local preview invitations appear when the recipient signs into the matching account. Email delivery is not configured.",
              })
            }
          >
            <Plus size={16} />
            Invite someone
          </button>
        }
      />
      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Celebration</th>
                <th>Role</th>
                <th>Spending limit</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ws?.members.map((m) => (
                <tr key={m.id}>
                  <td>{m.email}</td>
                  <td>{m.event_name}</td>
                  <td>{m.role}</td>
                  <td>{money(m.spending_limit)}</td>
                  <td>
                    <Status value={m.status} />
                  </td>
                  <td>
                    {m.email === user?.email && m.status === "pending" ? (
                      <button
                        className="text-link"
                        onClick={() => run("invite.accept", { id: m.id })}
                      >
                        Accept invitation
                      </button>
                    ) : m.email !== user?.email && m.status !== "revoked" ? (
                      <button
                        className="text-link"
                        onClick={() => run("invite.revoke", { id: m.id })}
                      >
                        Revoke
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!ws?.members.length && (
          <Empty
            title="A place for your people."
            body="Invite a collaborator, planner or spending approver to a celebration."
          />
        )}
      </div>
      <BusinessTeam />
      <div className="permission-note">
        <ShieldCheck size={23} />
        <div>
          <h3>Access belongs to an event—not your whole account.</h3>
          <p>
            Viewers cannot edit. Contributors cannot approve spending. Planners
            coordinate without payment authority. Revoking an invitation removes
            the associated event membership.
          </p>
        </div>
      </div>
    </>
  );
}
function Audit() {
  const { ws } = useApp();
  return (
    <>
      <PageHeader
        eyebrow="ACCOUNTABILITY, BUILT IN"
        title="Every important action leaves a record."
        description="A chronological record of changes and approval decisions."
      />
      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Record</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {ws?.audit.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.action}</strong>
                  </td>
                  <td>{a.actor_name}</td>
                  <td className="mono">{a.entity_id.slice(0, 14)}</td>
                  <td>{new Date(a.created_at).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!ws?.audit.length && (
          <div className="panel-empty">
            Activity will appear as people use the platform.
          </div>
        )}
      </div>
    </>
  );
}
function AdminUsers() {
  const { ws, open } = useApp();
  if (!ws?.users.length) return null;
  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <h3>Platform access directory</h3>
        <Badge>Admin only</Badge>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Person</th>
              <th>Role</th>
              <th>City</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            {ws.users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name}</strong>
                  <small>{u.email}</small>
                </td>
                <td>{u.role}</td>
                <td>{u.city}</td>
                <td>
                  {u.role !== "admin" && (
                    <button
                      className="text-link"
                      onClick={() =>
                        open({
                          title: "Manage platform access",
                          action: "admin.access",
                          data: { user_id: u.id },
                          submit: "Update access & revoke sessions",
                          fields: [
                            {
                              name: "role",
                              label: "Role",
                              value: u.role,
                              options: [
                                "customer",
                                "vendor",
                                "planner",
                                "operations",
                                "reviewer",
                                "support",
                                "finance",
                              ].map((v) => ({ value: v, label: v })),
                            },
                            {
                              name: "city",
                              label: "Assigned city",
                              value: u.city,
                              options: cities.map((v) => ({
                                value: v,
                                label: v,
                              })),
                            },
                          ],
                          note: "Changing role revokes existing sessions. Business and event memberships remain separate.",
                        })
                      }
                    >
                      Edit access
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function SettingsPage() {
  const { user, logout, demo, open, ws } = useApp();
  return (
    <>
      <PageHeader
        eyebrow="YOUR ACCOUNT"
        title="The details that make it yours."
      />
      <div className="settings-grid">
        <section className="panel settings-panel">
          <h3>Profile & workspace</h3>
          <dl>
            <dt>Name</dt>
            <dd>{user?.name}</dd>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
            <dt>Account role</dt>
            <dd className="capitalize">{user?.role}</dd>
            <dt>Assigned city</dt>
            <dd>{user?.city}</dd>
          </dl>
          <div className="card-actions">
            <button
              className="button primary small"
              onClick={() =>
                open({
                  title: "Your name, your way.",
                  action: "account.update",
                  submit: "Save profile",
                  fields: [{ name: "name", label: "Name", value: user?.name }],
                })
              }
            >
              Edit profile
            </button>
            <button
              className="button outline small"
              onClick={() =>
                open({
                  title: "Keep your account secure.",
                  action: "account.password",
                  submit: "Update password & sign out",
                  fields: [
                    {
                      name: "current",
                      label: "Current password",
                      type: "password",
                    },
                    {
                      name: "password",
                      label: "New password",
                      type: "password",
                    },
                  ],
                  after: logout,
                })
              }
            >
              Change password
            </button>
          </div>
          <button
            className="button outline"
            style={{ marginTop: 20 }}
            onClick={logout}
          >
            <LogOut size={16} />
            Sign out securely
          </button>
        </section>
        <section className="panel settings-panel">
          <ShieldCheck size={26} />
          <h3>Your access is scoped.</h3>
          <p>
            Business and event membership are checked on the server for each
            action. Your role never grants access to another business’s private
            records.
          </p>
          {demo && (
            <div className="form-note">
              This preview uses password authentication. Production email
              verification, recovery, multi-factor authentication and
              notification delivery must be connected before launch.
            </div>
          )}
        </section>
      </div>
      <AdminUsers />
    </>
  );
}
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { ws, run } = useApp();
  return (
    <aside className="notification-panel">
      <div className="panel-heading">
        <h3>Your updates</h3>
        <button
          className="icon-button"
          aria-label="Close updates"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </div>
      {ws?.notifications.map((n) => (
        <div className={`notification-row ${n.read ? "read" : ""}`} key={n.id}>
          <span className="status-dot" />
          <div>
            <strong>{n.title}</strong>
            <p>{n.body}</p>
          </div>
        </div>
      ))}
      {!ws?.notifications.length && (
        <div className="panel-empty">You’re all caught up.</div>
      )}
      <button className="text-link" onClick={() => run("notification.read")}>
        Mark all as read <Check size={15} />
      </button>
    </aside>
  );
}
function Availability() {
  const { ws, open, run } = useApp();
  const businesses =
    ws?.businesses.filter((b) =>
      ["owner", "manager"].includes(b.membership || ""),
    ) ?? [];
  if (!businesses.length) return null;
  return (
    <section className="panel availability-panel">
      <div className="panel-heading">
        <h3>Availability & blocked dates</h3>
        <button
          className="text-link"
          onClick={() =>
            open({
              title: "Make room in your calendar.",
              action: "availability.block",
              submit: "Block this date",
              fields: [
                {
                  name: "business_id",
                  label: "Business",
                  options: businesses.map((b) => ({
                    value: b.id,
                    label: b.name,
                  })),
                },
                {
                  name: "date",
                  label: "Unavailable date",
                  type: "date",
                  min: new Date().toISOString().slice(0, 10),
                },
                {
                  name: "reason",
                  label: "Reason",
                  placeholder: "Existing commitment, time off…",
                },
              ],
              note: "The current booking model reserves one event per supplier per day. Existing reservations cannot be overwritten.",
            })
          }
        >
          Block a date <Plus size={14} />
        </button>
      </div>
      {ws?.blocks.map((b) => (
        <div className="simple-row" key={b.id}>
          <CalendarDays size={18} />
          <div>
            <strong>
              {b.business_name} · {dateLabel(b.date)}
            </strong>
            <small>{b.reason}</small>
          </div>
          <button
            className="text-link"
            onClick={() => run("availability.unblock", { id: b.id })}
          >
            Make available
          </button>
        </div>
      ))}
      {!ws?.blocks.length && (
        <div className="panel-empty">
          No manually blocked dates. Confirmed bookings also reserve
          availability.
        </div>
      )}
    </section>
  );
}
function BusinessTeam() {
  const { ws, user, open, run } = useApp();
  const owned = ws?.businesses.filter((b) => b.owner_id === user?.id) ?? [];
  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <h3>Business team</h3>
        {owned.length > 0 && (
          <button
            className="text-link"
            onClick={() =>
              open({
                title: "Good work happens together.",
                action: "business.invite",
                submit: "Create team invitation",
                fields: [
                  {
                    name: "business_id",
                    label: "Business",
                    options: owned.map((b) => ({ value: b.id, label: b.name })),
                  },
                  {
                    name: "email",
                    label: "Their account email",
                    type: "email",
                  },
                  {
                    name: "role",
                    label: "Business permission",
                    options: [
                      {
                        value: "manager",
                        label: "Manager · quotes and operations",
                      },
                      { value: "worker", label: "Worker · assigned jobs only" },
                      {
                        value: "accounts",
                        label: "Accounts · financial records",
                      },
                    ],
                  },
                ],
                note: "The invited person must sign into the matching account and accept. Ownership cannot be delegated through an invitation.",
              })
            }
          >
            Invite team member <Plus size={14} />
          </button>
        )}
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Person</th>
              <th>Business</th>
              <th>Permission</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {ws?.businessMembers.map((m) => (
              <tr key={`${m.business_id}-${m.user_id}`}>
                <td>
                  <strong>{m.name}</strong>
                  <small>{m.email}</small>
                </td>
                <td>{m.business_name}</td>
                <td>{m.role}</td>
                <td>
                  {m.role !== "owner" && (
                    <button
                      className="text-link"
                      onClick={() =>
                        run("business.member.revoke", {
                          business_id: m.business_id,
                          user_id: m.user_id,
                        })
                      }
                    >
                      Revoke access
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {ws?.businessInvites
              .filter((i) => i.status === "pending")
              .map((i) => (
                <tr key={i.id}>
                  <td>{i.email}</td>
                  <td>{i.business_name}</td>
                  <td>{i.role} · invited</td>
                  <td>
                    {i.email === user?.email ? (
                      <button
                        className="text-link"
                        onClick={() =>
                          run("business.invite.accept", { id: i.id })
                        }
                      >
                        Accept invitation
                      </button>
                    ) : (
                      <span className="muted">Awaiting acceptance</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!ws?.businessMembers.length && !ws?.businessInvites.length && (
        <div className="panel-empty">
          Business team invitations appear here when a business owner invites
          you.
        </div>
      )}
    </section>
  );
}
function Documents() {
  const { ws, user, open, refresh, notify } = useApp();
  const [busy, setBusy] = useState(false);
  const review = ["reviewer", "admin"].includes(user?.role || "");
  const businesses =
    ws?.businesses.filter((b) =>
      ["owner", "manager"].includes(b.membership || ""),
    ) ?? [];
  return (
    <section className="panel document-panel">
      <div className="panel-heading">
        <h3>Private business documents</h3>
        <ShieldCheck size={17} />
      </div>
      {businesses.length > 0 && (
        <form
          className="document-upload"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setBusy(true);
            try {
              const r = await fetch("/api/documents", {
                method: "POST",
                body: form,
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              await refresh();
              notify("Document uploaded for review.");
            } catch (e) {
              notify((e as Error).message, true);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="field">
            <span>Business</span>
            <select name="business_id">
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>PDF, JPEG or PNG · maximum 5 MB</span>
            <input
              name="file"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              required
            />
          </label>
          <button className="button outline small" disabled={busy}>
            {busy ? "Uploading…" : "Upload for review"}
          </button>
        </form>
      )}
      {ws?.documents.map((d) => (
        <div className="simple-row" key={d.id}>
          <span className="row-icon">
            <FileText size={18} />
          </span>
          <div>
            <strong>{d.name}</strong>
            <small>
              {d.business_name} · {Math.ceil(d.size / 1024)} KB
            </small>
            {d.review_note && <p className="small-text">{d.review_note}</p>}
          </div>
          <Status value={d.status} />
          <a className="text-link" href={`/api/documents/${d.id}`} download>
            Download <Download size={14} />
          </a>
          {review && (
            <button
              className="text-link"
              onClick={() =>
                open({
                  title: "Review supporting document",
                  action: "document.review",
                  data: { id: d.id },
                  submit: "Save document decision",
                  fields: [
                    {
                      name: "status",
                      label: "Decision",
                      options: [
                        "approved",
                        "changes_requested",
                        "rejected",
                      ].map((v) => ({
                        value: v,
                        label: v.replaceAll("_", " "),
                      })),
                    },
                    { name: "note", label: "Review notes", type: "textarea" },
                  ],
                  note: "A document review records your manual assessment. It does not replace an identity-verification provider.",
                })
              }
            >
              Review
            </button>
          )}
        </div>
      ))}
      {!ws?.documents.length && (
        <div className="panel-empty">
          Documents are private to authorized business managers and verification
          staff.
        </div>
      )}
    </section>
  );
}
function Guests() {
  const { ws, open, run } = useApp();
  const [eventId, setEventId] = useState("all");
  const rows =
    ws?.guests.filter((g) => eventId === "all" || g.event_id === eventId) ?? [];
  return (
    <>
      <PageHeader
        eyebrow="THE PEOPLE WHO MAKE THE DAY"
        title="Room for everyone you love."
        description="Keep your guest list, party sizes, dietary notes and RSVP responses together."
        action={
          <button
            className="button primary"
            onClick={() =>
              open({
                title: "Another lovely person at the table.",
                action: "guest.create",
                submit: "Add to guest list",
                fields: [
                  {
                    name: "event_id",
                    label: "Celebration",
                    options: ws?.events
                      .filter((e) => e.can_edit)
                      .map((e) => ({ value: e.id, label: e.name })),
                  },
                  { name: "name", label: "Guest or family name" },
                  {
                    name: "email",
                    label: "Email · optional",
                    type: "email",
                    required: false,
                  },
                  {
                    name: "party_size",
                    label: "People in this party",
                    type: "number",
                    min: 1,
                    max: 100,
                    value: 1,
                  },
                  {
                    name: "rsvp",
                    label: "Response",
                    options: ["pending", "attending", "declined"].map((v) => ({
                      value: v,
                      label: v,
                    })),
                  },
                  {
                    name: "dietary",
                    label: "Dietary or accessibility notes",
                    type: "textarea",
                    required: false,
                  },
                ],
                note: "This records a guest locally. It does not send an email or invitation.",
              })
            }
          >
            <Plus size={16} />
            Add guest
          </button>
        }
      />
      <div className="stats-grid three">
        {[
          ["Invited", rows.reduce((s, g) => s + g.party_size, 0)],
          [
            "Attending",
            rows
              .filter((g) => g.rsvp === "attending")
              .reduce((s, g) => s + g.party_size, 0),
          ],
          [
            "Awaiting a reply",
            rows
              .filter((g) => g.rsvp === "pending")
              .reduce((s, g) => s + g.party_size, 0),
          ],
        ].map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>
              {label}
              <Users size={17} />
            </span>
            <strong>{value}</strong>
            <small>Includes everyone in each party</small>
          </div>
        ))}
      </div>
      <label className="guest-filter field">
        <span>Filter by celebration</span>
        <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <option value="all">All celebrations</option>
          {ws?.events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </label>
      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Celebration</th>
                <th>Party size</th>
                <th>Response</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <td>
                    <strong>{g.name}</strong>
                    <small>{g.email}</small>
                  </td>
                  <td>{g.event_name}</td>
                  <td>{g.party_size}</td>
                  <td>
                    <select
                      aria-label={`RSVP for ${g.name}`}
                      value={g.rsvp}
                      onChange={(e) =>
                        run("guest.rsvp", { id: g.id, rsvp: e.target.value })
                      }
                    >
                      {["pending", "attending", "declined"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td>{g.dietary || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty
            title="The best part is who’s there."
            body="Start adding the people who will make your celebration special."
          />
        )}
      </div>
    </>
  );
}
