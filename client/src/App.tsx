import { taskStore } from "@/stores/taskStore";
import { TaskForm } from "@/TaskForm";
import { TaskList } from "@/TaskList";
import { observer } from "mobx-react-lite";

export const App = observer(() => {
  if (taskStore.loading) return <p>Loading...</p>;

  return (
    <main style={{ maxWidth: 600, margin: "2rem auto", padding: "1rem" }}>
      <h1>Tasks</h1>
      <TaskForm />
      <TaskList />
    </main>
  );
});
