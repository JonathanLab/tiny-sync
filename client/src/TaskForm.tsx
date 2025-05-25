import { taskStore } from "@/stores/taskStore";
import { useState } from "react";

export function TaskForm() {
  const [title, setTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await taskStore.save({
      id: crypto.randomUUID(),
      title,
      completed: false,
    });

    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task..."
        style={{ padding: "0.5rem", width: "70%" }}
      />
      <button type="submit" style={{ padding: "0.5rem 1rem" }}>
        Add
      </button>
    </form>
  );
}
