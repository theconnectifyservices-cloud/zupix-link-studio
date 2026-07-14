export type ID = string;

export type Nullable<T> = T | null;
export type Maybe<T> = T | null | undefined;

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type Role = "owner" | "admin" | "editor" | "viewer";
