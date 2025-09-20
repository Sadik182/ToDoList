import TodoClient from "./components/TodoClient/TodoClient";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Welcome to MyTodo</h1>
      <p className="mb-6 text-gray-700">
        This is a simple todo application built with Next.js and TypeScript.
      </p>
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-2xl font-semibold mb-3">Your Todos</h2>
        <TodoClient />
      </section>
    </main>
  );
}
