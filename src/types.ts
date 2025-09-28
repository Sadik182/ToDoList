// src/types.ts (or inside each file)
export type Note = {
  _id?: string;
  title: string;
  content?: string;
  date: string; // YYYY-MM-DD
  stage: "Idea" | "Draft" | "In Progress" | "Reviewed" | "Completed";
  createdAt?: string;
};
