"use client";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  CalendarDays,
  Search,
  SlidersHorizontal,
  Check,
  Heart,
  Camera,
  UtensilsCrossed,
  Flower2,
  Building2,
  CakeSlice,
  Music2,
  Armchair,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Leaf,
  Plus,
  Minus,
} from "lucide-react";
import { useApp } from "./application";
import { SectionTitle, TextLink, Empty, Badge } from "./ui";
import { categories, money, type Offering, type Business } from "@/lib/types";
import { photos } from "@/lib/catalog";
const categoryIcons: Record<string, any> = {
  Venues: Building2,
  Decoration: Flower2,
  Catering: UtensilsCrossed,
  Photography: Camera,
  Cakes: CakeSlice,
  Entertainment: Music2,
  Rentals: Armchair,
  Planning: Sparkles,
};
export function Marketplace() {
  const { path, go } = useApp();
  if (path.startsWith("/vendors/"))
    return <VendorPage id={path.split("/")[2]} />;
  if (path.startsWith("/packages/"))
    return <PackagePage id={path.split("/")[2]} />;
  if (["/explore", "/packages", "/planners"].includes(path))
    return <ExplorePage />;
  if (path !== "/")
    return (
      <section className="container help-page">
        <Empty
          title="This page has wandered off."
          body="Let’s find your way back to something wonderful."
          action={
            <button className="button primary" onClick={() => go("/")}>
              Back to home
            </button>
          }
        />
      </section>
    );
  return <HomePage />;
}
function HomePage() {
  const { city, setCity, go, offerings, businesses, newEvent, loading } =
    useApp();
  const [eventType, setEventType] = useState("Any celebration");
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span /> A LITTLE LESS PLANNING. A LOT MORE JOY.
          </div>
          <h1>
            For moments
            <br />
            worth <em>celebrating.</em>
          </h1>
          <p>
            Wonderful local people. Thoughtful event packages.
            <br className="desktop-only" /> Everything your celebration needs,
            beautifully together.
          </p>
          <div className="hero-cta">
            <button className="button primary" onClick={newEvent}>
              Plan my celebration <ArrowUpRight size={18} />
            </button>
            <button className="button text" onClick={() => go("/explore")}>
              Find your people <ArrowRight size={17} />
            </button>
          </div>
          <div className="hero-reassurance">
            <span>
              <Check size={14} /> Clear, itemized quotes
            </span>
            <span>
              <Check size={14} /> Local businesses
            </span>
            <span>
              <Check size={14} /> Your kind of budget
            </span>
          </div>
          <div className="hero-bottom-note">
            <span className="tiny-star">✳</span>
            <span>
              BIG DAYS. LITTLE GATHERINGS.
              <br />
              <strong>ALL THE MOMENTS THAT MATTER.</strong>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            className="hero-photo"
            src={photos.hero}
            alt="An intimate outdoor celebration set beneath warm lights"
          />
          <div className="hero-photo-shade" />
          <div className="hero-stamp">
            made for
            <br />
            <em>memories</em>
            <span>✳</span>
          </div>
          <div className="hero-image-caption">
            <span className="eyebrow">
              YOUR PEOPLE. YOUR PLACE. YOUR MOMENT.
            </span>
            <h3>
              A beautiful day
              <br />
              begins with a little possibility.
            </h3>
          </div>
          <div className="floating-note">
            <span className="note-icon">
              <Flower2 size={23} />
            </span>
            <div>
              <strong>Thoughtfully brought together</strong>
              <span>From the first idea to the final little detail.</span>
            </div>
          </div>
        </div>
      </section>
      <div className="container search-container">
        <div className="search-bar">
          <label>
            <MapPin size={20} />
            <span>
              <small>WHERE’S THE CELEBRATION?</small>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Search city"
              >
                {["Hyderabad", "Nellore", "Wanaparthy"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </span>
          </label>
          <label>
            <Sparkles size={20} />
            <span>
              <small>WHAT’S THE OCCASION?</small>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                aria-label="Event occasion"
              >
                {[
                  "Any celebration",
                  "Birthday",
                  "Wedding",
                  "Housewarming",
                  "Baby shower",
                  "Engagement",
                  "Corporate event",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </span>
          </label>
          <label className="search-date">
            <CalendarDays size={20} />
            <span>
              <small>WHEN’S YOUR BIG DAY?</small>
              <input
                type="date"
                aria-label="Preferred event date"
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) =>
                  sessionStorage.setItem("utsav-date", e.target.value)
                }
              />
            </span>
          </label>
          <button
            className="button primary"
            onClick={() => {
              sessionStorage.setItem("utsav-occasion", eventType);
              go("/explore");
            }}
          >
            <Search size={18} /> Explore possibilities
          </button>
        </div>
      </div>
      <section className="container section categories-section">
        <SectionTitle
          label="ALL THE RIGHT PEOPLE, IN ONE PLACE"
          title="A little of everything you need."
          action={
            <TextLink onClick={() => go("/explore")}>
              Explore all services
            </TextLink>
          }
        />
        <div className="category-grid">
          {Object.entries(categoryIcons).map(([category, Icon], i) => (
            <button
              className="category-tile"
              key={category}
              onClick={() => {
                sessionStorage.setItem("utsav-category", category);
                go("/explore");
              }}
            >
              <span className={`category-icon cat-${i}`}>
                <Icon size={26} strokeWidth={1.4} />
              </span>
              <span>{category}</span>
              <ArrowUpRight size={13} />
            </button>
          ))}
        </div>
      </section>
      <section className="packages-section">
        <div className="container section">
          <SectionTitle
            label="A BEAUTIFUL PLACE TO START"
            title="Less planning. More celebrating."
            action={
              <TextLink onClick={() => go("/packages")}>
                Discover every package
              </TextLink>
            }
          />
          <div className="section-subline">
            <p>Thoughtfully put together. Ready to make your own.</p>
            <span>
              <MapPin size={13} /> In {city}
            </span>
          </div>
          <div className="package-grid">
            {loading ? (
              <Skeletons />
            ) : (
              offerings
                .filter((o) => o.city === city)
                .slice(0, 3)
                .map((o) => <PackageCard key={o.id} offering={o} />)
            )}
            {!loading && !offerings.some((o) => o.city === city) && (
              <Empty
                title="Your celebration starts with a conversation."
                body="Tell us what you’re imagining and request a custom proposal."
                action={
                  <button className="button primary" onClick={newEvent}>
                    Create an event
                  </button>
                }
              />
            )}
          </div>
        </div>
      </section>
      <section className="container section local-section">
        <SectionTitle
          label="LOCAL TALENT. LOVELY POSSIBILITIES."
          title="Meet the people behind the magic."
          action={
            <TextLink onClick={() => go("/explore")}>
              Meet your local vendors
            </TextLink>
          }
        />
        <div className="vendor-grid">
          {businesses
            .filter((b) => b.city === city)
            .slice(0, 4)
            .map((b) => (
              <VendorCard business={b} key={b.id} />
            ))}
        </div>
      </section>
      <section className="how-section container">
        <div className="how-intro">
          <span className="eyebrow">FROM “WHAT IF” TO “WHAT A DAY”</span>
          <h2>
            A lovely celebration.
            <br />
            <em>A simpler way there.</em>
          </h2>
          <p>
            Keep the excitement.
            <br />
            Leave the scattered spreadsheets behind.
          </p>
          <button className="button outline" onClick={newEvent}>
            Let’s get started <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="how-steps">
          {[
            [
              "01",
              "Tell us what you’re dreaming of.",
              "A date, a place, a budget. Start with the details you know.",
            ],
            [
              "02",
              "Find people who get your vision.",
              "Explore local talent and compare clear, personalized proposals.",
            ],
            [
              "03",
              "Bring it all beautifully together.",
              "Confirm your bookings and keep every little detail in one place.",
            ],
          ].map(([n, t, d]) => (
            <div className="how-step" key={n}>
              <span>{n}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="planner-banner container">
        <div className="planner-banner-photo">
          <img
            src={photos.flowers}
            alt="Thoughtfully styled flowers at a celebration"
          />
        </div>
        <div>
          <span className="eyebrow">A LITTLE HELP GOES A LONG WAY</span>
          <h2>
            Your vision.
            <br />
            <em>In thoughtful hands.</em>
          </h2>
          <p>
            Connect with a local planner who can bring your ideas to life—and
            give you a little room to enjoy it all.
          </p>
          <button className="button primary" onClick={() => go("/planners")}>
            Find your planner <ArrowUpRight size={17} />
          </button>
        </div>
        <span className="banner-flower">✳</span>
      </section>
      <section className="values-strip container">
        <span>
          <ShieldCheck size={21} /> Clear scope, fewer surprises
        </span>
        <span>
          <Leaf size={21} /> Rooted in local communities
        </span>
        <span>
          <Heart size={21} /> Built around your celebration
        </span>
      </section>
    </>
  );
}
function Skeletons() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div className="skeleton-card" key={i}>
          <div />
          <span />
          <span />
        </div>
      ))}
    </>
  );
}
export function PackageCard({ offering: o }: { offering: Offering }) {
  const { go } = useApp();
  return (
    <article className="package-card">
      <button className="card-image" onClick={() => go(`/packages/${o.id}`)}>
        <img src={o.image} alt={o.name} loading="lazy" />
        <span className="image-label">{o.category}</span>
        <span className="image-arrow">
          <ArrowUpRight size={20} />
        </span>
      </button>
      <div className="package-content">
        <span className="card-location">
          <MapPin size={12} />
          {o.city} <span>·</span> {o.business_name}
        </span>
        <button className="card-title" onClick={() => go(`/packages/${o.id}`)}>
          {o.name}
        </button>
        <p>{o.inclusions.slice(0, 2).join(" · ")}</p>
        <div className="card-price">
          <div>
            <small>STARTING AT</small>
            <strong>
              {money(o.price)} <span>/ {o.unit}</span>
            </strong>
          </div>
          <button
            onClick={() => go(`/packages/${o.id}`)}
            aria-label={`View ${o.name}`}
          >
            <ArrowUpRight size={21} />
          </button>
        </div>
      </div>
    </article>
  );
}
export function VendorCard({ business: b }: { business: Business }) {
  const { go } = useApp();
  return (
    <article className="vendor-card">
      <button className="vendor-image" onClick={() => go(`/vendors/${b.id}`)}>
        <img src={b.image} alt={`${b.name} event inspiration`} loading="lazy" />
        <span className="image-label">{b.category}</span>
      </button>
      <div>
        <span className="card-location">
          <MapPin size={12} />
          {b.city}
        </span>
        <button className="vendor-title" onClick={() => go(`/vendors/${b.id}`)}>
          {b.name}
        </button>
        <p>{b.tagline}</p>
        <div className="vendor-bottom">
          <span>
            From <strong>{money(b.price)}</strong>
          </span>
          <ArrowUpRight size={16} />
        </div>
      </div>
    </article>
  );
}
function ExplorePage() {
  const { path, city, go, businesses, offerings, loading } = useApp();
  const packages = path === "/packages";
  const planners = path === "/planners";
  const [category, setCategory] = useState("All services");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recommended");
  const [budget, setBudget] = useState("all");
  useEffect(() => {
    const c = sessionStorage.getItem("utsav-category");
    if (c) {
      setCategory(c);
      sessionStorage.removeItem("utsav-category");
    } else setCategory(planners ? "Planning" : "All services");
  }, [path, planners]);
  const filtered = businesses.filter(
    (b) =>
      b.city === city &&
      (!planners || b.kind === "planner") &&
      (category === "All services" || b.category === category) &&
      `${b.name} ${b.description} ${b.category}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (budget === "all" || b.price <= Number(budget)),
  );
  const selected = offerings.filter(
    (o) =>
      o.city === city &&
      (category === "All services" || o.category === category) &&
      `${o.name} ${o.category} ${o.business_name}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (budget === "all" || o.price <= Number(budget)),
  );
  if (sort === "low") {
    filtered.sort((a, b) => a.price - b.price);
    selected.sort((a, b) => a.price - b.price);
  }
  if (sort === "high") {
    filtered.sort((a, b) => b.price - a.price);
    selected.sort((a, b) => b.price - a.price);
  }
  return (
    <>
      <div className="explore-intro container">
        <div className="breadcrumbs">
          <button onClick={() => go("/")}>Home</button>
          <ChevronRight size={12} />
          <span>
            {packages
              ? "Event packages"
              : planners
                ? "Event planners"
                : "Local vendors"}
          </span>
        </div>
        <span className="eyebrow">GOOD THINGS BEGIN WITH THE RIGHT PEOPLE</span>
        <h1>
          {packages ? (
            <>
              A little inspiration.
              <br />
              <em>A beautiful starting point.</em>
            </>
          ) : planners ? (
            <>
              Big ideas.
              <br />
              <em>Thoughtful hands.</em>
            </>
          ) : (
            <>
              Your celebration.
              <br />
              <em>Meet your people.</em>
            </>
          )}
        </h1>
        <p>
          {packages
            ? "Discover packages you can shape around your occasion."
            : planners
              ? "Find someone who cares about the details as much as you do."
              : `Discover local talent and independent businesses in ${city}.`}
        </p>
      </div>
      <div className="container explore-controls">
        <div className="search-input">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services, styles or businesses"
            aria-label="Search marketplace"
          />
        </div>
        <div className="filter-select">
          <SlidersHorizontal size={15} />
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            aria-label="Maximum starting price"
          >
            <option value="all">Any starting price</option>
            <option value="10000">Under ₹10,000</option>
            <option value="25000">Under ₹25,000</option>
            <option value="50000">Under ₹50,000</option>
          </select>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort results"
        >
          <option value="recommended">Featured order</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>
      <div className="container">
        <div className="filter-chips">
          {(planners ? ["Planning"] : categories).map((c) => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="result-count">
          <span>
            {packages ? selected.length : filtered.length}{" "}
            {packages ? "packages" : "businesses"} in <strong>{city}</strong>
          </span>
          <span>Final availability confirmed by your supplier</span>
        </div>
        <div
          className={
            packages
              ? "package-grid explore-results"
              : "vendor-grid explore-results"
          }
        >
          {loading ? (
            <Skeletons />
          ) : packages ? (
            selected.map((o) => <PackageCard key={o.id} offering={o} />)
          ) : (
            filtered.map((b) => <VendorCard key={b.id} business={b} />)
          )}
        </div>
        {!loading && (packages ? selected : filtered).length === 0 && (
          <Empty
            title="Something a little more specific?"
            body="Try another service or price range. You can also create an event and request help."
            action={
              <button
                className="button outline"
                onClick={() => {
                  setCategory("All services");
                  setSearch("");
                  setBudget("all");
                }}
              >
                Reset filters
              </button>
            }
          />
        )}
      </div>
    </>
  );
}
function VendorPage({ id }: { id: string }) {
  const { businesses, offerings, go, loading, reviews } = useApp();
  const b = businesses.find((b) => b.id === id);
  if (loading)
    return (
      <div className="container section">
        <Skeletons />
      </div>
    );
  if (!b)
    return (
      <div className="container section">
        <Empty
          title="This listing isn’t available."
          body="It may be under review or no longer accepting enquiries."
          action={
            <button className="button primary" onClick={() => go("/explore")}>
              Explore vendors
            </button>
          }
        />
      </div>
    );
  return (
    <div className="container detail-page">
      <div className="breadcrumbs">
        <button onClick={() => go("/explore")}>Explore vendors</button>
        <ChevronRight size={12} />
        <span>{b.name}</span>
      </div>
      <div className="vendor-hero">
        <img src={b.image} alt={b.name} />
        <div>
          <Badge>
            {b.category} · {b.city}
          </Badge>
          <h1>{b.name}</h1>
          <p>{b.tagline}</p>
          <span className="verification-label">
            <ShieldCheck size={16} />
            {b.verification}
          </span>
        </div>
      </div>
      <div className="vendor-description">
        <div>
          <span className="eyebrow">THE PEOPLE BEHIND THE DETAILS</span>
          <h2>Thoughtfully made, locally rooted.</h2>
          <p>{b.description}</p>
        </div>
        <div className="info-box">
          <MapPin size={20} />
          <h3>At home in {b.city}</h3>
          <p>
            Serving {b.areas.join(", ")}. Confirm travel and setup requirements
            in your quote.
          </p>
        </div>
      </div>
      <SectionTitle
        label="MAKE IT YOURS"
        title="Start with something lovely."
      />
      <div className="package-grid">
        {offerings
          .filter((o) => o.business_id === b.id)
          .map((o) => (
            <PackageCard key={o.id} offering={o} />
          ))}
      </div>
      <div className="public-reviews">
        {reviews
          .filter((r) => r.business_id === b.id)
          .map((r) => (
            <article className="review-entry" key={r.id}>
              <div>
                <strong>{r.author}</strong>
                <Badge tone="green">Completed booking</Badge>
                <span aria-label={`${r.rating} out of 5 stars`}>
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>
              </div>
              <p>{r.body}</p>
            </article>
          ))}
      </div>
      <div className="review-note">
        <Heart size={20} />
        <div>
          <strong>Every real celebration deserves a real review.</strong>
          <p>
            Reviews become available after completed bookings. Sample listings
            do not carry fabricated ratings.
          </p>
        </div>
      </div>
    </div>
  );
}
function PackagePage({ id }: { id: string }) {
  const { offerings, requestQuote, go, loading } = useApp();
  const o = offerings.find((o) => o.id === id);
  const [guests, setGuests] = useState(50);
  if (loading)
    return (
      <div className="container section">
        <Skeletons />
      </div>
    );
  if (!o)
    return (
      <div className="container section">
        <Empty
          title="This package isn’t available."
          body="Explore another starting point for your celebration."
          action={
            <button className="button primary" onClick={() => go("/packages")}>
              Explore packages
            </button>
          }
        />
      </div>
    );
  return (
    <div className="container detail-page">
      <div className="breadcrumbs">
        <button onClick={() => go("/packages")}>Packages</button>
        <ChevronRight size={12} />
        <span>{o.name}</span>
      </div>
      <div className="package-detail">
        <div>
          <img className="package-detail-photo" src={o.image} alt={o.name} />
          <div className="package-story">
            <span className="eyebrow">SMALL DETAILS. BIG FEELINGS.</span>
            <h2>Room for your own kind of wonderful.</h2>
            <p>{o.description}</p>
            <div className="inclusion-grid">
              <div>
                <h3>Thoughtfully included</h3>
                {o.inclusions.map((t) => (
                  <p key={t}>
                    <Check size={16} />
                    {t}
                  </p>
                ))}
              </div>
              <div>
                <h3>Not included</h3>
                {o.exclusions.map((t) => (
                  <p key={t}>
                    <Minus size={15} />
                    {t}
                  </p>
                ))}
              </div>
            </div>
            <div className="info-box">
              <h3>A clear quote before you commit.</h3>
              <p>
                Your supplier confirms the date, scope, travel charges and
                cancellation terms. Sending an enquiry does not charge you or
                confirm a booking.
              </p>
            </div>
          </div>
        </div>
        <aside className="package-booking">
          <Badge>{o.category}</Badge>
          <h1>{o.name}</h1>
          <button
            className="text-link"
            onClick={() => go(`/vendors/${o.business_id}`)}
          >
            by {o.business_name} <ArrowUpRight size={14} />
          </button>
          <span className="detail-location">
            <MapPin size={15} />
            {o.city}
          </span>
          <div className="detail-price">
            <small>STARTING AT</small>
            <strong>
              {money(o.price)}
              <span> / {o.unit}</span>
            </strong>
          </div>
          {o.unit === "guest" && (
            <label className="field">
              <span>Estimate your guest count</span>
              <input
                type="number"
                min={1}
                value={guests}
                onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
              />
              <small>Estimated food total: {money(o.price * guests)}</small>
            </label>
          )}
          <button className="button primary" onClick={() => requestQuote(o)}>
            Request a personalized quote <ArrowUpRight size={18} />
          </button>
          <p className="booking-note">
            No payment now. Just a beautiful beginning.
          </p>
          <div className="booking-benefits">
            <span>
              <Check size={15} /> An itemized proposal
            </span>
            <span>
              <Check size={15} /> Direct supplier conversation
            </span>
            <span>
              <Check size={15} /> All the details in one place
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
