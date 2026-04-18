import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Placeholders used during build when env vars aren't set.
  // The real client only runs in the browser once env vars are injected.
  return createBrowserClient(
    url || "https://placeholder.supabase.co",
    key || "placeholder-key",
  );
}

export function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export type LeadStatus =
  | "new"
  | "called"
  | "no_answer"
  | "call_later"
  | "wrong_number"
  | "not_in_service"
  | "owners_not_there"
  | "emailed"
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
  rating: number | null;
  review_count: number | null;
  created_at: string;
  updated_at: string;
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  called: "Called",
  no_answer: "No Answer",
  call_later: "Call Later",
  wrong_number: "Wrong Number",
  not_in_service: "Not in Service",
  owners_not_there: "Owners Not There",
  emailed: "Emailed",
  interested: "Interested",
  not_interested: "Not Interested",
  closed: "Closed",
};

export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  called: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  no_answer: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  call_later: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  wrong_number: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  not_in_service: "bg-red-900/30 text-red-400 border-red-900/40",
  owners_not_there: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  emailed: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  interested: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  not_interested: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  closed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};
