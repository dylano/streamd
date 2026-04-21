const API_BASE = "/api";

let currentUserId: number | null = null;

export function setApiUserId(id: number | null) {
  currentUserId = id;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(currentUserId ? { "X-User-Id": String(currentUserId) } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, error.error || res.statusText);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE",
    }),
};

// User API methods — these don't require X-User-Id (pre-auth)
export const userApi = {
  lookup: (name: string) =>
    request<{ id: number; name: string }>(`/users?name=${encodeURIComponent(name)}`),

  create: (name: string) =>
    request<{ id: number; name: string }>("/users", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  validate: (id: number) => request<{ id: number; name: string }>(`/users/${id}`),

  listAll: () => request<{ id: number; name: string }[]>("/users/all"),

  getUserShows: (userId: number) => request<import("../types").Show[]>(`/users/${userId}/shows`),
};
