"use client";

import React, { useEffect, useMemo, useState } from "react";

type Todo = {
  _id?: string;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  createdAt?: string;
};

export default function Dashboard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"todos" | "notes">("todos");

  async function fetchTodos() {
    try {
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTodos(
        data.map((t: any) => ({ ...t, _id: t._id?.toString?.() || t._id }))
      );
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchTodos();
  }, []);

  // Group by date and compute stats
  const grouped = useMemo(() => {
    const map = new Map<string, { todos: Todo[]; completed: number }>();
    todos.forEach((t) => {
      if (!map.has(t.date)) map.set(t.date, { todos: [], completed: 0 });
      const entry = map.get(t.date)!;
      entry.todos.push(t);
      if (t.completed) entry.completed += 1;
    });
    // sort by date desc (recent first)
    return Array.from(map.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([date, { todos, completed }]) => ({ date, todos, completed }));
  }, [todos]);

  function formatShort(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  async function toggleComplete(id?: string, current = false) {
    if (!id) return;
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !current }),
      });
      const updated = await res.json();
      setTodos((s) => s.map((t) => (t._id === id ? updated : t)));
    } catch (err) {
      console.error(err);
    }
  }

  async function remove(id?: string) {
    if (!id) return;
    try {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
      setTodos((s) => s.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-6 max-w-8xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("todos")}
            className={`px-3 py-1 rounded ${
              activeTab === "todos" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1 rounded ${
              activeTab === "notes" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            Notes
          </button>
        </div>
      </div>

      {activeTab === "todos" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Dates table */}
          <div className="md:col-span-1 bg-white p-4 rounded shadow">
            <h2 className="text-lg font-medium font-bold mb-3">All Todos</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm text-gray-500">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {grouped.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-gray-500 py-2">
                      No todos
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
                    <td className="py-2">
                      {g.todos.length} ({g.completed}/{g.todos.length} done)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right: Selected date todos */}
          <div className="md:col-span-2 bg-white p-4 rounded shadow">
            <h2 className="text-lg font-medium mb-3">Todos</h2>
            {!selectedDate && (
              <p className="text-gray-500">
                Select a date on the left to view its todos.
              </p>
            )}
            {selectedDate && (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">
                        {new Date(selectedDate).toLocaleDateString(undefined, {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-gray-400">
                        {selectedDate}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="text-sm text-gray-600"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <ul className="space-y-3">
                  {grouped
                    .find((g) => g.date === selectedDate)
                    ?.todos.map((t) => (
                      <li
                        key={t._id}
                        className="p-3 bg-gray-50 rounded flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={!!t.completed}
                            onChange={() =>
                              toggleComplete(t._id, !!t.completed)
                            }
                          />
                          <span
                            className={
                              t.completed ? "line-through text-gray-400" : ""
                            }
                          >
                            {t.text}
                          </span>
                        </div>
                        <div className="flex gap-3 items-center">
                          <button
                            onClick={() => remove(t._id)}
                            className="text-sm text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    )) ?? (
                    <div className="text-gray-500">No todos for this date.</div>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-medium mb-3">Notes (placeholder)</h2>
          <p className="text-gray-500">
            Notes feature will be here — you can add, edit and group notes
            later.
          </p>
        </div>
      )}
    </div>
  );
}
