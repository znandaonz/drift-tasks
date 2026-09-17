const BASE_URL = "https://drift-tasks-production.up.railway.app";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  list: () => request("/tasks"),
  create: (title, extra = {}) =>
    request("/tasks", { method: "POST", body: JSON.stringify({ title, ...extra }) }),
  update: (id, patch) =>
    request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  remove: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  reorder: (orderedIds) =>
    request("/tasks/reorder", { method: "PUT", body: JSON.stringify({ order: orderedIds }) }),
};
