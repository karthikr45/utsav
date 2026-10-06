"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  MapPin,
  ChevronDown,
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Heart,
  LoaderCircle,
} from "lucide-react";
import type { Business, Offering, User, Workspace } from "@/lib/types";
import { cities } from "@/lib/types";
import { Modal, Form, type Field } from "./ui";
import { Marketplace } from "./marketplace";
import { WorkspaceView } from "./workspace";
type ModalConfig = {
  title: string;
  subtitle?: string;
  fields: Field[];
  submit: string;
  action: string;
  data?: Record<string, any>;
  after?: () => void;
  note?: string;
};
type AppContextType = {
  user: User | null;
  city: string;
  setCity: (city: string) => void;
  businesses: Business[];
  offerings: Offering[];
  reviews: Record<string, any>[];
  ws: Workspace | null;
  demo: boolean;
  loading: boolean;
  go: (path: string) => void;
  path: string;
  open: (config: ModalConfig) => void;
  run: (action: string, data?: any) => Promise<boolean>;
  refresh: () => Promise<void>;
  notify: (text: string, error?: boolean) => void;
  newEvent: () => void;
  requestQuote: (offering: Offering) => void;
  logout: () => void;
};
const AppContext = createContext<AppContextType>(null!);
export const useApp = () => useContext(AppContext);
export async function api(path: string, data?: unknown) {
  const r = await fetch(`/api/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await r.json();
  if (!r.ok) throw new Error(result.error || "Please try again.");
  return result;
}
export function Brand({ light = false }: { light?: boolean }) {
  const { go } = useApp();
  return (
    <button
      className={`brand ${light ? "light" : ""}`}
      onClick={() => go("/")}
      aria-label="Utsav home"
    >
      <span className="brand-mark">✳</span>utsav
      <span className="brand-dot">.</span>
    </button>
  );
}
export function Application() {
  const router = useRouter();
  const path = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [city, setCityValue] = useState("Hyderabad");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [reviews, setReviews] = useState<Record<string, any>[]>([]);
  const [ws, setWs] = useState<Workspace | null>(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const [mobile, setMobile] = useState(false);
  const go = useCallback(
    (p: string) => {
      router.push(p);
      setMobile(false);
      window.scrollTo(0, 0);
    },
    [router],
  );
  const notify = useCallback(
    (text: string, error = false) => setToast({ text, error }),
    [],
  );
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  const refresh = useCallback(async () => {
    try {
      const [cat, auth] = await Promise.all([api("catalog"), api("auth/me")]);
      setBusinesses(cat.businesses);
      setOfferings(cat.offerings);
      setReviews(cat.reviews ?? []);
      setUser(auth.user);
      setDemo(auth.demo);
      if (auth.user) setWs(await api("workspace"));
      else setWs(null);
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setLoading(false);
    }
  }, [notify]);
  useEffect(() => {
    const saved = localStorage.getItem("utsav-city");
    if (saved && cities.includes(saved as any)) setCityValue(saved);
    void refresh();
  }, [refresh]);
  const setCity = (value: string) => {
    setCityValue(value);
    localStorage.setItem("utsav-city", value);
  };
  const open = (m: ModalConfig) => {
    setError("");
    setModal(m);
  };
  const run = async (action: string, data: any = {}) => {
    try {
      await api("commands", { action, data });
      await refresh();
      notify("Saved. Everything is up to date.");
      return true;
    } catch (e) {
      notify((e as Error).message, true);
      return false;
    }
  };
  const newEvent = () => {
    if (!user) {
      go("/login");
      return;
    }
    open({
      title: "Every celebration starts here.",
      subtitle: "A few details now. The beautiful details come next.",
      action: "event.create",
      submit: "Create my celebration",
      fields: [
        {
          name: "name",
          label: "Give your event a name",
          placeholder: "e.g. Aarav’s first birthday",
        },
        {
          name: "type",
          label: "What are we celebrating?",
          value:
            sessionStorage.getItem("utsav-occasion") === "Any celebration"
              ? "Birthday"
              : sessionStorage.getItem("utsav-occasion") || "Birthday",
          options: [
            "Birthday",
            "Wedding",
            "Engagement",
            "Housewarming",
            "Baby shower",
            "Corporate event",
            "Other",
          ].map((v) => ({ value: v, label: v })),
        },
        {
          name: "city",
          label: "City",
          value: city,
          options: cities.map((v) => ({ value: v, label: v })),
        },
        {
          name: "date",
          label: "Event date",
          type: "date",
          value: sessionStorage.getItem("utsav-date") || "",
          min: new Date().toISOString().slice(0, 10),
        },
        {
          name: "guests",
          label: "Number of guests",
          type: "number",
          min: 1,
          value: 50,
        },
        {
          name: "budget",
          label: "Your budget (₹)",
          type: "number",
          min: 1,
          value: 50000,
        },
        {
          name: "venue",
          label: "Venue or neighborhood",
          placeholder: "Still deciding? Leave this blank.",
          required: false,
        },
      ],
      after: () => go("/dashboard/events"),
    });
  };
  const requestQuote = (o: Offering) => {
    if (!user) {
      go("/login");
      return;
    }
    const events = ws?.events.filter((e) => e.city === o.city) ?? [];
    if (!events.length) {
      notify(`Create an event in ${o.city} first, then request your quote.`);
      newEvent();
      return;
    }
    open({
      title: "Let’s make it yours.",
      subtitle: `Request a personalized quote from ${o.business_name}.`,
      action: "quote.request",
      data: { offering_id: o.id },
      submit: "Send enquiry",
      fields: [
        {
          name: "event_id",
          label: "Your celebration",
          options: events.map((e) => ({ value: e.id, label: e.name })),
        },
        {
          name: "note",
          label: "Anything you have in mind?",
          type: "textarea",
          placeholder: "Your style, colors, must-haves, or questions…",
          required: false,
        },
      ],
      note: "This is an enquiry, not a confirmed booking. Your supplier will confirm availability and final pricing.",
      after: () => go("/dashboard/quotes"),
    });
  };
  const logoutFn = async () => {
    await api("auth/logout", {});
    await refresh();
    go("/");
  };
  const value = {
    user,
    city,
    setCity,
    businesses,
    offerings,
    reviews,
    ws,
    demo,
    loading,
    go,
    path,
    open,
    run,
    refresh,
    notify,
    newEvent,
    requestQuote,
    logout: logoutFn,
  };
  const dashboard = path.startsWith("/dashboard");
  return (
    <AppContext.Provider value={value}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {dashboard ? (
        <WorkspaceView />
      ) : (
        <>
          <header className="header">
            <div className="nav-wrap">
              <Brand />
              <div className="city-picker">
                <MapPin size={15} />
                <select
                  aria-label="Select city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  {cities.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={12} />
              </div>
              <nav className={mobile ? "public-nav mobile-open" : "public-nav"}>
                <button
                  onClick={() => go("/explore")}
                  className={path === "/explore" ? "active" : ""}
                >
                  Explore vendors
                </button>
                <button
                  onClick={() => go("/packages")}
                  className={path === "/packages" ? "active" : ""}
                >
                  Event packages
                </button>
                <button onClick={() => go("/planners")}>Find a planner</button>
              </nav>
              <div className="nav-actions">
                <button
                  className="business-link"
                  onClick={() => go("/partner")}
                >
                  For businesses <ArrowUpRight size={14} />
                </button>
                <span className="nav-divider" />
                {user ? (
                  <button
                    className="button small primary"
                    onClick={() => go("/dashboard")}
                  >
                    {user.name.split(" ")[0]}’s workspace{" "}
                    <ArrowUpRight size={15} />
                  </button>
                ) : (
                  <button
                    className="button small outline"
                    onClick={() => go("/login")}
                  >
                    Sign in <ArrowRight size={15} />
                  </button>
                )}
                <button
                  className="icon-button mobile-toggle"
                  aria-label="Toggle menu"
                  onClick={() => setMobile(!mobile)}
                >
                  {mobile ? <X /> : <Menu />}
                </button>
              </div>
            </div>
          </header>
          <main id="main">
            {path === "/login" || path === "/register" ? (
              <AuthPage />
            ) : path === "/partner" ? (
              <PartnerPage />
            ) : path.startsWith("/help") || path.startsWith("/policies") ? (
              <HelpPage />
            ) : (
              <Marketplace />
            )}
          </main>
          <Footer />
        </>
      )}
      {modal && (
        <Modal
          title={modal.title}
          subtitle={modal.subtitle}
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          <Form
            fields={modal.fields}
            submit={modal.submit}
            busy={busy}
            error={error}
            onSubmit={async (data) => {
              setBusy(true);
              setError("");
              try {
                await api("commands", {
                  action: modal.action,
                  data: { ...modal.data, ...data },
                });
                await refresh();
                setModal(null);
                notify("Saved. You’re all set.");
                modal.after?.();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {modal.note && <p className="form-note">{modal.note}</p>}
          </Form>
        </Modal>
      )}
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{toast.text}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
}
function AuthPage() {
  const { path, go, refresh, demo } = useApp();
  const register = path === "/register";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const login = async (data: any) => {
    setBusy(true);
    setError("");
    try {
      await api(register ? "auth/register" : "auth/login", data);
      await refresh();
      go("/dashboard");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-layout">
      <div className="auth-art">
        <span className="eyebrow">GOOD PEOPLE. BEAUTIFUL MOMENTS.</span>
        <h1>
          Your next
          <br />
          beautiful chapter
          <br />
          <em>starts here.</em>
        </h1>
        <p>
          A thoughtful space for your biggest days
          <br />
          and all the little celebrations in between.
        </p>
        <div className="auth-ornament">✳</div>
      </div>
      <div className="auth-form">
        <span className="eyebrow">WELCOME TO UTSAV</span>
        <h2>
          {register
            ? "Make room for something wonderful."
            : "A lovely place to return to."}
        </h2>
        <p>
          {register
            ? "Create your account and start planning."
            : "Sign in to pick up where you left off."}
        </p>
        <Form
          key={path}
          fields={[
            ...(register
              ? [{ name: "name", label: "Your name", placeholder: "Full name" }]
              : []),
            {
              name: "email",
              label: "Email address",
              type: "email",
              placeholder: "you@example.com",
            },
            {
              name: "password",
              label: "Password",
              type: "password",
              placeholder: "At least 12 characters",
            },
          ]}
          submit={register ? "Create account" : "Sign in"}
          busy={busy}
          error={error}
          onSubmit={login}
        />
        <p className="auth-switch">
          {register ? "Already part of Utsav?" : "New here?"}{" "}
          <button
            className="text-link"
            onClick={() => go(register ? "/login" : "/register")}
          >
            {register ? "Sign in" : "Create an account"}
          </button>
        </p>
        {demo && (
          <div className="demo-login">
            <span className="eyebrow">EXPLORE THE LOCAL PREVIEW</span>
            <p>Fictional accounts, separate permissions. No real payments.</p>
            <div className="demo-role-grid">
              {[
                "customer",
                "vendor",
                "planner",
                "operations",
                "reviewer",
                "support",
                "finance",
                "admin",
              ].map((role) => (
                <button
                  key={role}
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);
                    api("auth/login", {
                      email: `${role}@utsav.local`,
                      password: "UtsavDemo2026!",
                    })
                      .then(refresh)
                      .then(() => go("/dashboard"))
                      .catch((e) => setError(e.message))
                      .finally(() => setBusy(false));
                  }}
                >
                  {role}
                  <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function PartnerPage() {
  const { user, go, open, city } = useApp();
  const apply = () => {
    if (!user) {
      go("/register");
      return;
    }
    open({
      title: "Your craft deserves a bigger stage.",
      subtitle:
        "Tell us about your business. Our team will review your application.",
      action: "business.submit",
      submit: "Submit for review",
      fields: [
        { name: "name", label: "Business name" },
        {
          name: "kind",
          label: "Business type",
          options: [
            { value: "vendor", label: "Service provider / vendor" },
            { value: "planner", label: "Event planner" },
          ],
        },
        {
          name: "category",
          label: "Primary service",
          options: [
            "Decoration",
            "Catering",
            "Photography",
            "Cakes",
            "Venues",
            "Entertainment",
            "Rentals",
            "Planning",
          ].map((v) => ({ value: v, label: v })),
        },
        {
          name: "city",
          label: "Primary city",
          value: city,
          options: cities.map((v) => ({ value: v, label: v })),
        },
        { name: "price", label: "Starting price (₹)", type: "number", min: 1 },
        { name: "tagline", label: "Your business in one sentence" },
        {
          name: "description",
          label: "Tell us about your services",
          type: "textarea",
        },
      ],
      note: "Submitting does not publish your profile. Verification and payment readiness are separate steps.",
      after: () => go("/dashboard/business"),
    });
  };
  return (
    <>
      <section className="partner-hero container">
        <span className="eyebrow">FOR THE PEOPLE WHO MAKE IT HAPPEN</span>
        <h1>
          Small business.
          <br />
          <em>Extraordinary possibilities.</em>
        </h1>
        <p>
          You bring the craft. We bring a thoughtful way to connect with
          customers, send clear proposals, and grow your business.
        </p>
        <button className="button primary" onClick={apply}>
          List your business <ArrowUpRight size={18} />
        </button>
        <span className="partner-footnote">
          Independent creators, local teams, and established businesses welcome.
        </span>
      </section>
      <section className="container partner-grid">
        {[
          [
            "01",
            "A storefront that feels like you",
            "Showcase your services, packages and the details that make your business special.",
          ],
          [
            "02",
            "Enquiries with real context",
            "Start with a date, location, guest count and a brief—not an endless guessing game.",
          ],
          [
            "03",
            "Everything in one place",
            "Keep proposals, bookings, conversations and payment records connected.",
          ],
        ].map(([n, title, body]) => (
          <article className="feature-card" key={n}>
            <span className="step-number">{n}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </section>
      <div className="container partner-callout">
        <Sparkles />
        <h2>Local talent. Room to flourish.</h2>
        <p>Now welcoming businesses in Hyderabad, Nellore and Wanaparthy.</p>
      </div>
    </>
  );
}
function HelpPage() {
  const { path, go, user, open } = useApp();
  return (
    <section className="container help-page">
      <span className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</span>
      <h1>
        {path.includes("policies")
          ? "Clear expectations. Better celebrations."
          : "We’re here for the details."}
      </h1>
      <div className="help-grid">
        {[
          [
            "How does a booking work?",
            "Create an event, request a quote and confirm the scope. Accepting a proposal reserves your supplier; the required payment completes confirmation.",
          ],
          [
            "Are displayed prices final?",
            "Catalog prices are starting estimates with a stated unit. Your supplier confirms your date, quantities, travel and final scope in a versioned quote.",
          ],
          [
            "Can I change or cancel?",
            "Request a change before delivery. Supplier amendments need customer approval. Cancellation requests go through support, with refunds tracked separately. This local preview uses a full-refund cancellation policy for demonstration.",
          ],
          [
            "What does a verification badge mean?",
            "A listing review only means the listed information was reviewed. It is not a quality guarantee, identity check or payment-provider verification.",
          ],
          [
            "How is my data shared?",
            "Suppliers see information relevant to their enquiries and bookings. Event collaborators receive only the permissions assigned to them.",
          ],
          [
            "Are payments live?",
            "The local preview uses explicitly simulated payments and fictional suppliers. Production payment, identity verification and email providers must be configured before real customer use.",
          ],
        ].map(([title, body]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <button
        className="button primary"
        onClick={() =>
          user
            ? open({
                title: "How can we help?",
                action: "ticket.create",
                submit: "Open support case",
                fields: [
                  { name: "subject", label: "Subject" },
                  {
                    name: "body",
                    label: "Tell us what happened",
                    type: "textarea",
                  },
                ],
              })
            : go("/login")
        }
      >
        Contact customer care <ArrowRight size={17} />
      </button>
    </section>
  );
}
function Footer() {
  const { go, demo } = useApp();
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div>
          <Brand />
          <p>
            For the moments
            <br />
            that become memories.
          </p>
        </div>
        <div>
          <span className="eyebrow">YOUR NEXT CELEBRATION</span>
          <button onClick={() => go("/explore")}>Explore local vendors</button>
          <button onClick={() => go("/packages")}>
            Thoughtfully made packages
          </button>
          <button onClick={() => go("/planners")}>Find your planner</button>
        </div>
        <div>
          <span className="eyebrow">LET’S MAKE IT HAPPEN</span>
          <button onClick={() => go("/partner")}>Join as a business</button>
          <button onClick={() => go("/help")}>Help & support</button>
          <button onClick={() => go("/policies")}>Policies & privacy</button>
        </div>
        <div className="footer-cities">
          <span className="eyebrow">ROOTED LOCALLY</span>
          <p>
            Hyderabad
            <br />
            Nellore
            <br />
            Wanaparthy
          </p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} Utsav. Made for meaningful moments.
        </span>
        <span>
          {demo ? (
            "Local preview · Fictional suppliers & sample pricing"
          ) : (
            <>
              Made with care <Heart size={12} />
            </>
          )}
        </span>
      </div>
    </footer>
  );
}
