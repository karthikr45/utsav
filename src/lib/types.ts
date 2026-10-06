export const cities = ["Hyderabad", "Nellore", "Wanaparthy"] as const;
export const categories = [
  "All services",
  "Venues",
  "Decoration",
  "Catering",
  "Photography",
  "Cakes",
  "Entertainment",
  "Rentals",
  "Planning",
] as const;
export type Role =
  | "customer"
  | "vendor"
  | "planner"
  | "operations"
  | "reviewer"
  | "support"
  | "finance"
  | "admin";
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  city: string;
  business_id?: string;
  membership?: string;
};
export type Business = {
  id: string;
  name: string;
  kind: string;
  category: string;
  city: string;
  areas: string[];
  description: string;
  image: string;
  status: string;
  price: number;
  tagline: string;
  owner_id: string;
  created_at: string;
  review_note?: string;
  membership?: string;
  verification: string;
};
export type Offering = {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  inclusions: string[];
  exclusions: string[];
  image: string;
  category: string;
  city: string;
  business_name: string;
  status: string;
};
export type EventRecord = {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  city: string;
  date: string;
  guests: number;
  budget: number;
  venue: string;
  status: string;
  created_at: string;
  owner_name?: string;
  can_edit?: boolean;
};
export type Quote = {
  id: string;
  event_id: string;
  business_id: string;
  offering_id: string;
  status: string;
  amount: number;
  scope: string;
  version: number;
  expires_at: string;
  event_name: string;
  event_date: string;
  business_name: string;
  customer_name?: string;
  city: string;
  note: string;
  can_manage?: boolean;
  can_approve?: boolean;
  items?: { label: string; quantity: number; unit_price: number }[];
};
export type Booking = {
  id: string;
  event_id: string;
  business_id: string;
  quote_id: string;
  status: string;
  amount: number;
  deposit: number;
  paid: number;
  scope: string;
  event_name: string;
  business_name: string;
  event_date: string;
  city: string;
  owner_id: string;
  financial_redacted?: boolean;
  hold_until?: string;
  can_manage?: boolean;
  can_approve?: boolean;
};
export type Task = {
  id: string;
  event_id: string;
  title: string;
  done: boolean;
  due_date: string;
  event_name: string;
};
export type Ticket = {
  id: string;
  event_id: string;
  user_id: string;
  subject: string;
  body: string;
  status: string;
  reply: string;
  event_name: string;
  created_at: string;
  user_name: string;
};
export type Message = {
  id: string;
  quote_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name: string;
  event_name: string;
  business_name: string;
};
export type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};
export type Workspace = {
  guests: Record<string, any>[];
  user: User;
  events: EventRecord[];
  quotes: Quote[];
  bookings: Booking[];
  businesses: Business[];
  tasks: Task[];
  tickets: Ticket[];
  messages: Message[];
  notifications: Notification[];
  payments: Record<string, any>[];
  audit: Record<string, any>[];
  members: Record<string, any>[];
  changes: Record<string, any>[];
  documents: Record<string, any>[];
  businessInvites: Record<string, any>[];
  businessMembers: Record<string, any>[];
  blocks: Record<string, any>[];
  users: User[];
  demo: boolean;
};
export const money = (value: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
export const dateLabel = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
