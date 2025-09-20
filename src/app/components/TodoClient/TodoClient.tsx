"use client";

import React, { useEffect, useState } from "react";

type Todo = {
  _id?: string;
  text: string;
  completed: boolean;
  createdAt?: string;
};

export default function TodoClient() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
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

  async function addTodo(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const newTodo = await res.json();
      setTodos((s) => [newTodo, ...s]);
      setText("");
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">My To-Do List</h1>
        <p className="text-sm text-gray-500">
          Add tasks, mark complete, delete.
        </p>
      </div>

      <form onSubmit={addTodo} className="flex gap-2 mb-6">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 p-2 border rounded"
        />
        <button
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add
        </button>
      </form>

      <ul className="space-y-3">
        {todos.length === 0 && <li className="text-gray-500">No tasks yet.</li>}
        {todos.map((t) => (
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
              <span className={t.completed ? "line-through text-gray-400" : ""}>
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
  );
}
