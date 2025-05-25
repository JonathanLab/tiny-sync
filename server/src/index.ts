import { getTasks, saveTask } from "@/db";
import { TaskArraySchema } from "@/schema";
import cors from "cors";
import express from "express";
import { broadcastTask, setupWebSocket } from "./websocket";

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

const server = app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

app.post("/api/sync", (req, res) => {
    const unvalidatedTasks = req.body;

    const { success, data: tasks } = TaskArraySchema.safeParse(unvalidatedTasks);
    if (!success) {
        console.error("[/api/sync]: invalid tasks", tasks);
        res.sendStatus(400);
        return;
    }

    // TODO: We should probably batch if used in larger scale.
    for (const task of tasks) {
        saveTask(task);
        broadcastTask(task);
    }

  res.status(200).json({ status: "ok" });
});

app.get("/api/tasks", async (_req, res) => {
    const tasks = getTasks();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    res.status(200).json(tasks);
});

setupWebSocket(server);