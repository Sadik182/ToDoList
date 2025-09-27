"use client";

import React, { useEffect, useState } from "react";

type Todo = {
  _id?: string;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  createdAt?: string;
};

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export default function TodoClient() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todayText, setTodayText] = useState("");
  const [tomorrowText, setTomorrowText] = useState("");
  const [loading, setLoading] = useState(false);

  // Dates & formatted strings are computed on the client only to avoid SSR/client mismatch
  const [todayISO, setTodayISO] = useState<string | null>(null);
  const [tomorrowISO, setTomorrowISO] = useState<string | null>(null);
  const [friendlyToday, setFriendlyToday] = useState<string | null>(null);
  const [friendlyTomorrow, setFriendlyTomorrow] = useState<string | null>(null);

  // Fetch todos after mount (client-only)
  async function fetchTodos() {
    try {
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTodos(
        data.map((t: any) => ({
          ...t,
          _id: t._id?.toString?.() || t._id,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }

  // compute dates and friendly titles on client after mount
  useEffect(() => {
    function computeDates() {
      const now = new Date();
      const tISO = isoDate(now);
      const tm = new Date(now);
      tm.setDate(now.getDate() + 1);
      const tmISO = isoDate(tm);

      // Use the user's locale for friendliness — but only on client so server/client won't mismatch
      const friendlyOpts: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "short",
      };

      setTodayISO(tISO);
      setTomorrowISO(tmISO);
      setFriendlyToday(
        new Date(tISO).toLocaleDateString(undefined, friendlyOpts)
      );
      setFriendlyTomorrow(
        new Date(tmISO).toLocaleDateString(undefined, friendlyOpts)
      );
    }

    computeDates();
    fetchTodos();

    // schedule re-compute at next midnight so panels naturally shift
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      2
    ); // slight offset to avoid edge-bugs
    const ms = nextMidnight.getTime() - now.getTime();
    const t = setTimeout(() => {
      computeDates();
      fetchTodos(); // refresh to move tomorrow -> today if needed
    }, ms);

    return () => clearTimeout(t);
  }, []);

  // Generic addTodo for both panels
  async function addTodo(
    e?: React.FormEvent,
    todoDate?: string,
    todoText?: string,
    setTodoText?: React.Dispatch<React.SetStateAction<string>>
  ) {
    e?.preventDefault();
    if (!todoText?.trim()) return;

    const todoForDate = todoDate || todayISO!;
    setLoading(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: todoText.trim(), date: todoForDate }),
      });
      if (!res.ok) throw new Error("Failed to create todo");
      const newTodo = await res.json();
      setTodos((s) => [newTodo, ...s]);
      setTodoText && setTodoText("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleComplete(id?: string, current = false) {
    if (!id) return;
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !current }),
      });
      if (!res.ok) throw new Error("Failed to update todo");
      const updated = await res.json();
      setTodos((s) => s.map((t) => (t._id === id ? updated : t)));
    } catch (err) {
      console.error(err);
    }
  }

  async function remove(id?: string) {
    if (!id) return;
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setTodos((s) => s.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  // while client hasn't computed the dates yet, show safe fallbacks (avoids hydration mismatch)
  const todaysTodos = todayISO ? todos.filter((t) => t.date === todayISO) : [];
  const tomorrowsTodos = tomorrowISO
    ? todos.filter((t) => t.date === tomorrowISO)
    : [];

  return (
    <div className="max-w-8xl mx-auto px-4 py-8 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">My To-Do Home</h1>
        <p className="text-sm text-gray-500">Quick view: today and tomorrow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Panel */}
        <section className="bg-white px-2 py-4 rounded shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium">
                {/* Friendly title only rendered client-side (null on server) */}
                {friendlyToday ? `Today — ${friendlyToday}` : "Today"}
              </h2>
              <div className="text-xs text-gray-400">{todayISO ?? ""}</div>
            </div>
            <div className="text-sm text-gray-600">
              {todaysTodos.length === 0
                ? "No task"
                : `${todaysTodos.length} ${
                    todaysTodos.length === 1 ? "task" : "tasks"
                  }`}
            </div>
          </div>

          <form
            className="flex gap-2 mb-4"
            onSubmit={(e) =>
              addTodo(e, todayISO ?? isoDate(), todayText, setTodayText)
            }
          >
            <input
              value={todayText}
              onChange={(e) => setTodayText(e.target.value)}
              placeholder="Add a task for today..."
              className="flex-1 p-2 border rounded"
            />
            <button
              disabled={loading}
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Add
            </button>
          </form>

          <ul className="space-y-3 max-h-90 h-100 overflow-y-auto pr-1">
            {todaysTodos.length === 0 && (
              <li className="text-gray-500">No tasks for today.</li>
            )}
            {todaysTodos.map((t) => (
              <li
                key={t._id}
                className="p-3 bg-gray-50 rounded flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!t.completed}
                    onChange={() => toggleComplete(t._id, !!t.completed)}
                  />
                  <span
                    className={t.completed ? "line-through text-gray-400" : ""}
                  >
                    {t.text}
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => remove(t._id)}
                    className="text-sm text-red-500 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Tomorrow's Panel */}
        <section className="bg-white p-4 rounded shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium">
                {friendlyTomorrow
                  ? `Tomorrow — ${friendlyTomorrow}`
                  : "Tomorrow"}
              </h2>
              <div className="text-xs text-gray-400">{tomorrowISO ?? ""}</div>
            </div>
            <div className="text-sm text-gray-600">
              {tomorrowsTodos.length === 0
                ? "No task"
                : `${tomorrowsTodos.length} ${
                    tomorrowsTodos.length === 1 ? "task" : "tasks"
                  }`}
            </div>
          </div>

          <form
            className="flex gap-2 mb-4"
            onSubmit={(e) =>
              addTodo(
                e,
                tomorrowISO ?? isoDate(new Date(Date.now() + 86400000)),
                tomorrowText,
                setTomorrowText
              )
            }
          >
            <input
              value={tomorrowText}
              onChange={(e) => setTomorrowText(e.target.value)}
              placeholder="Add a task for tomorrow..."
              className="flex-1 p-2 border rounded"
            />
            <button
              disabled={loading}
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Add
            </button>
          </form>

          <ul className="space-y-3">
            {tomorrowsTodos.length === 0 && (
              <li className="text-gray-500">No tasks for tomorrow.</li>
            )}
            {tomorrowsTodos.map((t) => (
              <li
                key={t._id}
                className="p-3 bg-gray-50 rounded flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!t.completed}
                    onChange={() => toggleComplete(t._id, !!t.completed)}
                  />
                  <span
                    className={t.completed ? "line-through text-gray-400" : ""}
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
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
