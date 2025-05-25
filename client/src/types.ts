 export interface Task {
  id: string;
  title: string;
  completed: boolean;
  updatedAt: number;
  deleted?: boolean;
}