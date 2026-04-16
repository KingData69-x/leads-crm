"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Row = {
  business_name: string;
  phone: string;
  address: string;
  category: string;
  city: string;
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(cell);
        cell = "";
      } else if (c === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (c === "\r") {
        // skip
      } else {
        cell += c;
      }
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export default function ImportPage() {
  const supabase = useMemo(() => createClient(), []);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function handleFile(f: File) {
    setFile(f);
    setStatus("Parsing...");
    const text = await f.text();
    const parsed = parseCSV(text);
    if (parsed.length < 2) {
      setStatus("File is empty or invalid.");
      return;
    }
    const header = parsed[0].map((h) => h.trim().toLowerCase());
    const col = (names: string[]) =>
      header.findIndex((h) => names.some((n) => h.includes(n)));

    const iName = col(["business", "name"]);
    const iPhone = col(["phone"]);
    const iAddr = col(["address"]);
    const iCat = col(["category"]);
    const iCity = col(["city"]);

    if (iName === -1 || iPhone === -1) {
      setStatus(
        "Could not find required columns. CSV must have 'Business Name' and 'Phone' columns.",
      );
      return;
    }

    const result: Row[] = [];
    for (let i = 1; i < parsed.length; i++) {
      const r = parsed[i];
      result.push({
        business_name: r[iName] ?? "",
        phone: r[iPhone] ?? "",
        address: iAddr !== -1 ? (r[iAddr] ?? "") : "",
        category: iCat !== -1 ? (r[iCat] ?? "") : "",
        city: iCity !== -1 ? (r[iCity] ?? "") : "",
      });
    }
    setRows(result);
    setStatus(`Parsed ${result.length} rows. Click Import to upload.`);
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setBusy(true);
    setStatus("Uploading...");
    try {
      const batchSize = 500;
      let uploaded = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from("leads").insert(batch);
        if (error) throw error;
        uploaded += batch.length;
        setStatus(`Uploading... ${uploaded} / ${rows.length}`);
      }
      setStatus(`Done! ${uploaded} leads imported.`);
      setRows([]);
      setFile(null);
    } catch (e) {
      setStatus("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-200">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Import CSV</h1>
            <p className="text-xs text-zinc-500">
              Upload a leads CSV to add to your CRM
            </p>
          </div>
          <Link
            href="/"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            ← Back to leads
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="mb-2 text-lg font-semibold">Upload file</h2>
          <p className="mb-4 text-sm text-zinc-400">
            CSV should have columns: <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">Business Name</code>,{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">Phone</code>,{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">Address</code>,{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">Category</code>,{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">City</code>
          </p>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-zinc-700 bg-zinc-900 p-8 hover:border-zinc-600 hover:bg-zinc-900/70">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <span className="text-sm text-zinc-300">
              {file ? file.name : "Click to select a CSV file"}
            </span>
            {file && (
              <span className="text-xs text-zinc-500">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            )}
          </label>

          {status && (
            <p className="mt-4 text-sm text-zinc-400">{status}</p>
          )}

          {rows.length > 0 && (
            <>
              <div className="mt-4 overflow-hidden rounded-md border border-zinc-800">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-900 text-zinc-500 uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-left font-medium">Phone</th>
                      <th className="px-3 py-2 text-left font-medium">Category</th>
                      <th className="px-3 py-2 text-left font-medium">City</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((r, i) => (
                      <tr key={i} className="border-t border-zinc-800">
                        <td className="px-3 py-1.5 text-zinc-200">{r.business_name}</td>
                        <td className="px-3 py-1.5 font-mono text-zinc-400">{r.phone}</td>
                        <td className="px-3 py-1.5 text-zinc-400">{r.category}</td>
                        <td className="px-3 py-1.5 text-zinc-400">{r.city}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 5 && (
                  <div className="border-t border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-500">
                    ...and {rows.length - 5} more
                  </div>
                )}
              </div>

              <button
                disabled={busy}
                onClick={handleImport}
                className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {busy ? "Importing..." : `Import ${rows.length} leads`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
