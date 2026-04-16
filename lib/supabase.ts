import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export type LeadStatus =
  | "new"
  | "called"
  | "interested"
  | "not_interested"
  | "closed";

export type Lead = {
  id: string;
  business_name: string;
  phone: string;
  address: string;
  category: string;
  city: string;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  called: "Called",
  interested: "Interested",
  not_interested: "Not Interested",
  closed: "Closed",
};

export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  called: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  interested: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  not_interested: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  closed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};
