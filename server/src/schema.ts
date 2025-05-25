import { z } from "zod";

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  completed: z.boolean(),
  updatedAt: z.number(),
  deleted: z.boolean().optional()
});

export const TaskArraySchema = z.array(TaskSchema);

export type Task = z.infer<typeof TaskSchema>;
