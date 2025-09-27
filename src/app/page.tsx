import TodoClient from "./components/TodoClient/TodoClient";

export default function Home() {
  return (
    <main className="max-w-8xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Welcome to MyTodo</h1>
      <TodoClient />
    </main>
  );
}
