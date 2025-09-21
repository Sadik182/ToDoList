import TodoClient from "./components/TodoClient/TodoClient";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Welcome to MyTodo</h1>
      <TodoClient />
    </main>
  );
}
