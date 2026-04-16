"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createClient,
  type Lead,
  type LeadStatus,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/supabase";

type SortKey = "business_name" | "city" | "category" | "status" | "created_at";

export function LeadsDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (!cancelled) setLeads(data as Lead[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => l.category && s.add(l.category));
    return Array.from(s).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        l.business_name.toLowerCase().includes(q) ||
        (l.phone ?? "").toLowerCase().includes(q) ||
        (l.city ?? "").toLowerCase().includes(q) ||
        (l.address ?? "").toLowerCase().includes(q) ||
        (l.notes ?? "").toLowerCase().includes(q)
      );
    });
    arr.sort((a, b) => {
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [leads, search, statusFilter, categoryFilter, sortKey, sortDir]);

  const stats = useMemo(() => {
    const s: Record<LeadStatus, number> = {
      new: 0,
      called: 0,
      interested: 0,
      not_interested: 0,
      closed: 0,
    };
    leads.forEach((l) => {
      s[l.status]++;
    });
    return s;
  }, [leads]);

  async function updateLead(id: string, updates: Partial<Lead>) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    );
    const { error } = await supabase.from("leads").update(updates).eq("id", id);
    if (error) alert("Update failed: " + error.message);
  }

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  function exportCSV() {
    const rows = [
      ["Business Name", "Phone", "Address", "Category", "City", "Status", "Notes"],
      ...filtered.map((l) => [
        l.business_name,
        l.phone,
        l.address ?? "",
        l.category ?? "",
        l.city ?? "",
        STATUS_LABELS[l.status],
        l.notes ?? "",
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-200">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Leads CRM</h1>
            <p className="text-xs text-zinc-500">
              {leads.length} total · {filtered.length} shown
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/import"
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800"
            >
              Import CSV
            </Link>
            <button
              onClick={exportCSV}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800"
            >
              Export
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-6 py-5">
        {/* Stats cards */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(Object.keys(stats) as LeadStatus[]).map((k) => (
            <button
              key={k}
              onClick={() => setStatusFilter(statusFilter === k ? "all" : k)}
              className={`rounded-md border px-3 py-2 text-left transition-colors ${
                statusFilter === k
                  ? "border-zinc-500 bg-zinc-800"
                  : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
              }`}
            >
              <div className="text-xs text-zinc-400">{STATUS_LABELS[k]}</div>
              <div className="text-lg font-semibold">{stats[k]}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, city, notes..."
            className="flex-1 min-w-[220px] rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as LeadStatus | "all")
            }
            className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none"
          >
            <option value="all">All statuses</option>
            {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((k) => (
              <option key={k} value={k}>
                {STATUS_LABELS[k]}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
          {loading && (
            <div className="p-8 text-center text-sm text-zinc-500">
              Loading leads...
            </div>
          )}
          {error && (
            <div className="p-8 text-center text-sm text-rose-400">
              {error}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-zinc-500">
              No leads yet. <Link href="/import" className="underline">Import a CSV</Link> to get started.
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-400">
                    <Th onClick={() => toggleSort("business_name")} active={sortKey === "business_name"} dir={sortDir}>
                      Business
                    </Th>
                    <th className="px-4 py-2 font-medium">Phone</th>
                    <Th onClick={() => toggleSort("city")} active={sortKey === "city"} dir={sortDir}>
                      City
                    </Th>
                    <Th onClick={() => toggleSort("category")} active={sortKey === "category"} dir={sortDir}>
                      Category
                    </Th>
                    <Th onClick={() => toggleSort("status")} active={sortKey === "status"} dir={sortDir}>
                      Status
                    </Th>
                    <th className="px-4 py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <LeadRow
                      key={l.id}
                      lead={l}
                      expanded={expanded === l.id}
                      onToggle={() =>
                        setExpanded(expanded === l.id ? null : l.id)
                      }
                      onUpdate={(u) => updateLead(l.id, u)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: "asc" | "desc";
}) {
  return (
    <th
      className="cursor-pointer select-none px-4 py-2 font-medium hover:text-zinc-200"
      onClick={onClick}
    >
      {children}
      {active && <span className="ml-1">{dir === "asc" ? "▲" : "▼"}</span>}
    </th>
  );
}

function LeadRow({
  lead,
  expanded,
  onToggle,
  onUpdate,
}: {
  lead: Lead;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (u: Partial<Lead>) => void;
}) {
  const [notesDraft, setNotesDraft] = useState(lead.notes ?? "");

  useEffect(() => {
    setNotesDraft(lead.notes ?? "");
  }, [lead.notes]);

  return (
    <>
      <tr
        className="border-b border-zinc-800/60 hover:bg-zinc-900/50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-2.5">
          <div className="font-medium text-zinc-100">{lead.business_name}</div>
          <div className="text-xs text-zinc-500">{lead.address}</div>
        </td>
        <td className="px-4 py-2.5 font-mono text-xs text-zinc-300">
          <a
            href={`tel:${lead.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-zinc-100 hover:underline"
          >
            {lead.phone}
          </a>
        </td>
        <td className="px-4 py-2.5 text-zinc-400">{lead.city}</td>
        <td className="px-4 py-2.5 text-zinc-400">{lead.category}</td>
        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
          <select
            value={lead.status}
            onChange={(e) =>
              onUpdate({ status: e.target.value as LeadStatus })
            }
            className={`rounded-md border px-2 py-1 text-xs ${STATUS_COLORS[lead.status]}`}
          >
            {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((k) => (
              <option key={k} value={k} className="bg-zinc-900 text-zinc-200">
                {STATUS_LABELS[k]}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2.5 text-xs text-zinc-500 max-w-[200px] truncate">
          {lead.notes || <span className="italic">Click to add notes</span>}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-zinc-800 bg-zinc-900/30">
          <td colSpan={6} className="px-4 py-3">
            <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
              Notes
            </label>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={() => {
                if (notesDraft !== (lead.notes ?? "")) {
                  onUpdate({ notes: notesDraft });
                }
              }}
              rows={3}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-2 text-sm focus:border-zinc-600 focus:outline-none"
              placeholder="Add notes about this lead..."
            />
          </td>
        </tr>
      )}
    </>
  );
}
