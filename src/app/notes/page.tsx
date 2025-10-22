"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Note } from "@/types";
import ProtectedRoute from "../components/ProtectedRoute";

const STAGES = [
  "Idea",
  "Draft",
  "In Progress",
  "Reviewed",
  "Completed",
] as const;

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export default function NotesClient() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<Note["stage"]>("Idea");

  // note body represented as an array of lines (numbered)
  const [lines, setLines] = useState<string[]>([""]);

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // edit buffers when editing an existing note
  const [editTitle, setEditTitle] = useState("");
  const [editStage, setEditStage] = useState<Note["stage"]>("Idea");
  const [editLines, setEditLines] = useState<string[]>([]);

  // fetch notes
  async function fetchNotes() {
    try {
      const res = await fetch("/api/notes");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setNotes(
        data.map((n: any) => ({ ...n, _id: n._id?.toString?.() || n._id }))
      );
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  // group notes by date descending
  const groupedByDate = useMemo(() => {
    const map: Record<string, Note[]> = {};
    notes.forEach((n) => {
      map[n.date] ??= [];
      map[n.date].push(n);
    });
    const keys = Object.keys(map).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    return keys.map((k) => ({ date: k, notes: map[k] }));
  }, [notes]);

  // helpers for lines
  function updateLine(idx: number, value: string, set = setLines) {
    set((prev) => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  }
  function addLine(afterIdx?: number, set = setLines) {
    set((prev) => {
      const copy = [...prev];
      const insertAt =
        typeof afterIdx === "number" ? afterIdx + 1 : copy.length;
      copy.splice(insertAt, 0, "");
      return copy;
    });
  }
  function removeLine(idx: number, set = setLines) {
    set((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy.length ? copy : [""];
    });
  }

  // create a new note — date is ALWAYS current date
  async function createNote(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        content: lines.join("\n").trim(),
        date: isoDate(), // enforce current date
        stage,
      };
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create note");
      const newNote = await res.json();
      setNotes((s) => [newNote, ...s]);
      // reset editor
      setTitle("");
      setStage("Idea");
      setLines([""]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // start editing an existing note (prefill edit buffers)
  function startEdit(note: Note) {
    setEditingId(note._id || null);
    setEditTitle(note.title);
    setEditStage(note.stage);
    // split saved content into lines; if empty, start with one empty line
    setEditLines(note.content ? (note.content as string).split("\n") : [""]);
    // scroll into view? optional
  }

  // save edits to a note (update). We keep date untouched when editing.
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
      if (!res.ok) throw new Error("Failed to update note");
      const updated = await res.json();
      setNotes((s) => s.map((n) => (n._id === editingId ? updated : n)));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteNote(id?: string) {
    if (!id) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setNotes((s) => s.filter((n) => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  // update stage quickly from list
  async function updateStage(id: string, newStage: Note["stage"]) {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to update stage`);
      }
      
      const updated = await res.json();
      setNotes((s) => s.map((n) => (n._id === id ? updated : n)));
    } catch (err) {
      console.error("Error updating stage:", err);
      // You could add a toast notification here to show the error to the user
      alert(`Failed to update stage: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // small helper to render lines as numbered list (used for preview and saved notes)
  function LinesViewer({ lines }: { lines: string[] }) {
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
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Notes</h1>
          <div className="text-sm text-gray-500">
            Daily notes — take structured notes with stages
          </div>
        </div>

        {/* NOTE Editor Card */}
        <div className="bg-white rounded shadow p-4 mb-8 flex flex-col">
          {/* Header: title + stage */}
          <div className="flex items-start gap-4 mb-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="flex-1 p-3 border rounded text-lg font-medium"
              aria-label="Note title"
            />
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as Note["stage"])}
              className="p-2 border rounded"
              aria-label="Note stage"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Body: numbered lines editor */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="space-y-2">
                {lines.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-6 text-right text-sm text-gray-600 pt-3 select-none">
                      {idx + 1}.
                    </div>
                    <textarea
                      value={line}
                      onChange={(e) => updateLine(idx, e.target.value)}
                      rows={1}
                      className="flex-1 p-2 border rounded resize-none"
                      placeholder="Type note line..."
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => addLine(idx)}
                        className="px-2 py-1 text-xs bg-gray-100 rounded"
                        aria-label={`Add line after ${idx + 1}`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded"
                        aria-label={`Remove line ${idx + 1}`}
                      >
                        −
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-sm text-gray-500">
                Tip: press the + button to add a new numbered line.
              </div>
            </div>

            {/* Live preview */}
            <div className="w-1/3 border-l pl-4 hidden md:block">
              <div className="text-xs text-gray-500 mb-2">Preview</div>
              <LinesViewer lines={lines} />
            </div>
          </div>

          {/* Footer: Save button bottom-right */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={(e) => createNote(e)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow"
            >
              Save (today)
            </button>
          </div>
        </div>

        {/* Edit panel (if editing) */}
        {editingId && (
          <div className="bg-white rounded shadow p-4 mb-6">
            <div className="flex items-start gap-4 mb-3">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 p-2 border rounded text-lg font-medium"
              />
              <select
                value={editStage}
                onChange={(e) => setEditStage(e.target.value as Note["stage"])}
                className="p-2 border rounded"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {editLines.map((line, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-6 text-right text-sm text-gray-600 pt-3 select-none">
                    {idx + 1}.
                  </div>
                  <textarea
                    value={line}
                    onChange={(e) => {
                      setEditLines((prev) => {
                        const copy = [...prev];
                        copy[idx] = e.target.value;
                        return copy;
                      });
                    }}
                    rows={1}
                    className="flex-1 p-2 border rounded resize-none"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditLines((prev) => {
                          const copy = [...prev];
                          copy.splice(idx + 1, 0, "");
                          return copy;
                        });
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 rounded"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditLines((prev) => {
                          const copy = [...prev];
                          copy.splice(idx, 1);
                          return copy.length ? copy : [""];
                        });
                      }}
                      className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded"
                    >
                      −
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
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

        {/* Grouped notes list */}
        <div className="space-y-6">
          {groupedByDate.length === 0 && (
            <div className="text-gray-500">No notes yet.</div>
          )}

          {groupedByDate.map((g) => (
            <div key={g.date} className="bg-white p-4 rounded shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium">
                    {new Date(g.date).toLocaleDateString(undefined, {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-gray-400">{g.date}</div>
                </div>
                <div className="text-sm text-gray-600">
                  {g.notes.length} {g.notes.length === 1 ? "note" : "notes"}
                </div>
              </div>

              <ul className="space-y-3">
                {g.notes.map((n) => (
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
                        <LinesViewer lines={(n.content || "").split("\n")} />
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
                          updateStage(n._id!, e.target.value as Note["stage"])
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
                          onClick={() => deleteNote(n._id)}
                          className="text-sm text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
