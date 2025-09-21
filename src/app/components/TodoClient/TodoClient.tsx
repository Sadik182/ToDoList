"use client";

import React, { useEffect, useState } from "react";

type Todo = {
  _id?: string;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  createdAt?: string;
};

export default function TodoClient() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todayText, setTodayText] = useState("");
  const [selectedDateText, setSelectedDateText] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchTodos();
  }, []);

  // Updated addTodo to work for both forms
  async function addTodo(
    e?: React.FormEvent,
    todoDate?: string,
    todoText?: string,
    setTodoText?: React.Dispatch<React.SetStateAction<string>>
  ) {
    e?.preventDefault();
    if (!todoText?.trim()) return;

    const todoForDate = todoDate || date;

    setLoading(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: todoText.trim(), date: todoForDate }),
      });
      const newTodo = await res.json();
      setTodos((s) => [newTodo, ...s]);
      setTodoText && setTodoText(""); // clear the input after adding
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

  // Group todos by date
  const groupedTodos = todos.reduce((acc: Record<string, Todo[]>, todo) => {
    if (!acc[todo.date]) acc[todo.date] = [];
    acc[todo.date].push(todo);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedTodos).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  function formatDateTitle(dateStr: string) {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return `ToDo for ${d.toLocaleDateString(undefined, options)}`;
  }

  return (
    <div className="max-w-3xl px-4 py-8 bg-white rounded shadow">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">My To-Do List</h1>
        <p className="text-sm text-gray-500">
          Add tasks for today or any date.
        </p>
      </div>

      {/* Form for Today */}
      <form
        onSubmit={(e) =>
          addTodo(
            e,
            new Date().toISOString().slice(0, 10),
            todayText,
            setTodayText
          )
        }
        className="flex gap-2 mb-4"
      >
        <input
          value={todayText}
          onChange={(e) => setTodayText(e.target.value)}
          placeholder="Add a task for today..."
          className="flex-1 p-2 border rounded"
        />
        <button
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Today
        </button>
      </form>

      {/* Form for any date */}
      <form
        onSubmit={(e) =>
          addTodo(e, date, selectedDateText, setSelectedDateText)
        }
        className="flex gap-2 mb-6"
      >
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          value={selectedDateText}
          onChange={(e) => setSelectedDateText(e.target.value)}
          placeholder="Add a task for selected date..."
          className="flex-1 p-2 border rounded"
        />
        <button
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Add
        </button>
      </form>

      {/* Display Todos grouped by date */}
      {sortedDates.length === 0 && (
        <p className="text-gray-500">No tasks yet.</p>
      )}
      {sortedDates.map((d) => (
        <div key={d} className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{formatDateTitle(d)}</h2>
          <ul className="space-y-3">
            {groupedTodos[d].map((t) => (
              <li
                key={t._id}
                className="p-3 bg-white rounded shadow flex items-center justify-between"
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
        </div>
      ))}
    </div>
  );
}
