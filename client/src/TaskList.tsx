import { taskStore } from "@/stores/taskStore";
import { Task } from "@/types";
import { observer } from "mobx-react-lite";

export const TaskList = observer(() => {
  const handleToggle = (task: Task) => {
    taskStore.save({
      ...task,
      completed: !task.completed,
    });
  };

  const handleDelete = (taskId: string) => {
    taskStore.delete(taskId);
  };

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {taskStore.sortedTasks.map((task) => (
        <li key={task.id} style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ cursor: "pointer", flex: 1 }}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => handleToggle(task)}
              style={{ marginRight: "0.5rem" }}
            />
            <span style={{ textDecoration: task.completed ? "line-through" : "none" }}>
              {task.title}
            </span>
          </label>
          <button
            onClick={() => handleDelete(task.id)}
            style={{
              padding: "0.25rem 0.5rem",
              background: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
});