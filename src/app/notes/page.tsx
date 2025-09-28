"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Note } from "@/types";

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
  const [content, setContent] = useState("");
  const [date, setDate] = useState(isoDate());
  const [stage, setStage] = useState<Note["stage"]>("Idea");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editStage, setEditStage] = useState<Note["stage"]>("Idea");

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

  // group notes by date (descending)
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

  async function createNote(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content, date, stage }),
      });
      if (!res.ok) throw new Error("Failed to create note");
      const newNote = await res.json();
      setNotes((s) => [newNote, ...s]);
      setTitle("");
      setContent("");
      setStage("Idea");
      setDate(isoDate());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStage(id: string, newStage: Note["stage"]) {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setNotes((s) => s.map((n) => (n._id === id ? updated : n)));
    } catch (err) {
      console.error(err);
    }
  }

  function startEdit(n: Note) {
    setEditingId(n._id || null);
    setEditTitle(n.title);
    setEditContent(n.content || "");
    setEditStage(n.stage);
  }

  async function saveEdit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!editingId) return;
    try {
      const res = await fetch(`/api/notes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent,
          stage: editStage,
        }),
      });
      if (!res.ok) throw new Error("Failed to update note");
      const updated = await res.json();
      setNotes((s) => s.map((n) => (n._id === editingId ? updated : n)));
      setEditingId(null);
    } catch (err) {
      console.error(err);
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <div className="text-sm text-gray-500">Daily notes & stages</div>
      </div>

      {/* Create note form */}
      <form
        onSubmit={createNote}
        className="bg-white p-4 rounded shadow mb-6 grid gap-3 md:grid-cols-3"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="p-2 border rounded col-span-1 md:col-span-1"
          required
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Note content (optional)"
          className="p-2 border rounded col-span-1 md:col-span-1"
        />
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border rounded"
          />
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as Note["stage"])}
            className="p-2 border rounded"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            disabled={loading}
            type="submit"
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded"
          >
            Add Note
          </button>
        </div>
      </form>

      {/* Grouped notes by date */}
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
                  className="p-3 bg-gray-50 rounded flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{n.title}</div>
                      <div className="text-xs text-gray-500 px-2 py-1 rounded bg-white border">
                        {n.stage}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      {n.content}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleString()
                        : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                </li>
              ))}
            </ul>

            {/* Edit inline panel */}
            {editingId && (
              <div className="mt-4 border-t pt-3">
                <form
                  onSubmit={saveEdit}
                  className="flex flex-col gap-2 md:flex-row md:items-start md:gap-3"
                >
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="p-2 border rounded flex-1"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="p-2 border rounded w-full md:w-2/3"
                  />
                  <select
                    value={editStage}
                    onChange={(e) =>
                      setEditStage(e.target.value as Note["stage"])
                    }
                    className="p-2 border rounded"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      type="button"
                      className="px-4 py-2 bg-gray-200 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
