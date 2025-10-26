"use client";

import React, { useEffect, useMemo, useState } from "react";

type Stage = "Idea" | "Draft" | "In Progress" | "Reviewed" | "Completed";

type Note = {
  _id?: string;
  title: string;
  content: string; // newline separated lines
  date: string; // YYYY-MM-DD
  stage: Stage;
  createdAt?: string;
};

const STAGES: Stage[] = [
  "Idea",
  "Draft",
  "In Progress",
  "Reviewed",
  "Completed",
];

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export default function NotesDashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Editor state (for new note)
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<Stage>("Idea");
  const [lines, setLines] = useState<string[]>([""]);

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStage, setEditStage] = useState<Stage>("Idea");
  const [editLines, setEditLines] = useState<string[]>([]);

  async function fetchNotes() {
    try {
      const res = await fetch("/api/notes");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setNotes(
        data.map(
          (n: {
            _id: string;
            title: string;
            content: string;
            userId: string;
          }) => ({ ...n, _id: n._id?.toString?.() || n._id })
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  // Group by date desc
  const grouped = useMemo(() => {
    const map = new Map<string, Note[]>();
    notes.forEach((n) => {
      if (!map.has(n.date)) map.set(n.date, []);
      map.get(n.date)!.push(n);
    });
    return Array.from(map.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([date, notes]) => ({ date, notes }));
  }, [notes]);

  function formatShort(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // lines helpers - removed unused functions

  // createNote function removed as it's not used

  function startEdit(n: Note) {
    setEditingId(n._id || null);
    setEditTitle(n.title);
    setEditStage(n.stage);
    setEditLines(n.content ? n.content.split("\n") : [""]);
  }

  async function saveEdit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!editingId) return;
    setLoading(true);
    try {
      const payload = {
        title: editTitle.trim(),
        content: editLines.join("\n").trim(),
        stage: editStage,
      };
      const res = await fetch(`/api/notes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setNotes((s) => s.map((x) => (x._id === editingId ? updated : x)));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id?: string) {
    if (!id) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setNotes((s) => s.filter((n) => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  async function updateStage(id: string, newStage: Stage) {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${res.status}: Failed to update stage`
        );
      }

      const updated = await res.json();
      setNotes((s) => s.map((n) => (n._id === id ? updated : n)));
    } catch (err) {
      console.error("Error updating stage:", err);
      alert(
        `Failed to update stage: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }

  function LinesPreview({ lines }: { lines: string[] }) {
    return (
      <ol className="list-decimal list-inside space-y-1">
        {lines.map((l, i) => (
          <li key={i} className="text-sm text-gray-800">
            {l || <span className="text-gray-400 italic">—</span>}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left: Dates */}
      <div className="md:col-span-1 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium font-bold mb-3">All Notes</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-gray-500">
              <th className="pb-2">Date</th>
              <th className="pb-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {grouped.length === 0 && (
              <tr>
                <td colSpan={2} className="text-gray-500 py-2">
                  No notes
                </td>
              </tr>
            )}
            {grouped.map((g) => (
              <tr
                key={g.date}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  setSelectedDate(selectedDate === g.date ? null : g.date)
                }
              >
                <td className="py-2">{formatShort(g.date)}</td>
                <td className="py-2">{g.notes.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right: selected date notes + editor */}
      <div className="md:col-span-2 bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Notes</h2>
          <div className="text-sm text-gray-500">
            Create and manage daily notes
          </div>
        </div>

        {!selectedDate && (
          <p className="text-gray-500">
            Select a date on the left to view its notes.
          </p>
        )}

        {selectedDate && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">
                  {new Date(selectedDate).toLocaleDateString(undefined, {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="text-xs text-gray-400">{selectedDate}</div>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-sm text-gray-600"
              >
                Close
              </button>
            </div>

            <ul className="space-y-3 mb-6">
              {grouped
                .find((g) => g.date === selectedDate)
                ?.notes.map((n) => (
                  <li
                    key={n._id}
                    className="p-3 bg-gray-50 rounded flex flex-col md:flex-row md:items-start md:justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-lg">{n.title}</div>
                        <div className="text-xs text-gray-500 px-2 py-1 rounded bg-white border">
                          {n.stage}
                        </div>
                      </div>
                      <div className="mt-2">
                        <LinesPreview lines={(n.content || "").split("\n")} />
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleString()
                          : ""}
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2">
                      <select
                        value={n.stage}
                        onChange={(e) =>
                          updateStage(n._id!, e.target.value as Stage)
                        }
                        className="p-1 border rounded text-sm"
                        aria-label="Change stage"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(n)}
                          className="text-sm text-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(n._id)}
                          className="text-sm text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                )) ?? (
                <div className="text-gray-500">No notes for this date.</div>
              )}
            </ul>
          </>
        )}

        {/* Edit panel (modal-like inline) */}
        {editingId && (
          <div className="mt-6 bg-white border p-4 rounded">
            <div className="flex items-start gap-4 mb-3">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 p-2 border rounded text-lg font-medium"
              />
              <select
                value={editStage}
                onChange={(e) => setEditStage(e.target.value as Stage)}
                className="p-2 border rounded"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 mb-3">
              {editLines.map((line, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-6 text-right text-sm text-gray-600 pt-3 select-none">
                    {idx + 1}.
                  </div>
                  <textarea
                    value={line}
                    onChange={(e) =>
                      setEditLines((p) => {
                        const copy = [...p];
                        copy[idx] = e.target.value;
                        return copy;
                      })
                    }
                    rows={1}
                    className="flex-1 p-2 border rounded resize-none"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setEditLines((p) => {
                          const copy = [...p];
                          copy.splice(idx + 1, 0, "");
                          return copy;
                        })
                      }
                      className="px-2 py-1 text-xs bg-gray-100 rounded"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditLines((p) => {
                          const copy = [...p];
                          copy.splice(idx, 1);
                          return copy.length ? copy : [""];
                        })
                      }
                      className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded"
                    >
                      −
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={(e) => saveEdit(e)}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Save changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
