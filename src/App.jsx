import { useEffect, useState, useRef } from "react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { api } from "./api";
import TaskItem from "./TaskItem.jsx";

const THEME_KEY = "drift-theme";

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(getInitialTheme);
  const reorderTimeout = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    api.list().then((data) => {
      setTasks(data);
      setLoading(false);
    });
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const created = await api.create(trimmed);
    setTasks((prev) => [created, ...prev]);
    setTitle("");
  };

  const toggleTask = async (task) => {
    const updated = await api.update(task.id, { done: !task.done });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  };

  const saveTitle = async (id, newTitle) => {
    const updated = await api.update(id, { title: newTitle });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const saveTags = async (id, tags) => {
    const updated = await api.update(id, { tags });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const saveDueDate = async (id, dueDate) => {
    const patch = dueDate ? { due_date: dueDate } : { clear_due_date: true };
    const updated = await api.update(id, patch);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const deleteTask = async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await api.remove(id);
  };

  // Drag-to-reorder: update local order instantly, then debounce the
  // network call so a fast drag doesn't spam the API.
  const handleReorder = (newOrder) => {
    setTasks(newOrder);
    clearTimeout(reorderTimeout.current);
    reorderTimeout.current = setTimeout(() => {
      api.reorder(newOrder.map((t) => t.id)).catch(() => {});
    }, 400);
  };

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <div className="app">
      <motion.div
        className="header"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="header-top">
          <div>
            <h1>Drift</h1>
            <p>A quiet place to keep track of what's next.</p>
          </div>
          <button
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            aria-label="Toggle dark mode"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ☀️
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  🌙
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>

      <form className="add-bar" onSubmit={addTask}>
        <input
          type="text"
          placeholder="Add a task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" disabled={!title.trim()} aria-label="Add task">
          +
        </button>
      </form>

      {!loading && tasks.length > 0 && (
        <div className="section-label">
          <span>Tasks</span>
          <span>{remaining} remaining</span>
        </div>
      )}

      <Reorder.Group as="ul" axis="y" values={tasks} onReorder={handleReorder} className="list">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onSave={saveTitle}
              onSaveTags={saveTags}
              onSaveDueDate={saveDueDate}
              onDelete={deleteTask}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {!loading && tasks.length === 0 && (
        <div className="empty-state">Nothing here yet — add your first task above.</div>
      )}
    </div>
  );
}
