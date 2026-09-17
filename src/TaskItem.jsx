import { useState, useRef } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";

const SWIPE_DELETE_THRESHOLD = -90;

function formatDueDate(iso) {
  if (!iso) return null;
  const due = new Date(iso);
  const now = new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDay - today) / (1000 * 60 * 60 * 24));

  let label;
  if (diffDays < 0) label = `Overdue · ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  else if (diffDays === 0) label = "Due today";
  else if (diffDays === 1) label = "Due tomorrow";
  else if (diffDays <= 6) label = `Due ${due.toLocaleDateString(undefined, { weekday: "short" })}`;
  else label = `Due ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  const state = diffDays < 0 ? "overdue" : diffDays <= 1 ? "soon" : "later";
  return { label, state };
}

// Deterministic color for a tag name so the same tag always looks the same.
const TAG_HUES = [210, 265, 150, 25, 340, 190];
function tagHue(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return TAG_HUES[hash % TAG_HUES.length];
}

export default function TaskItem({ task, onToggle, onSave, onSaveTags, onSaveDueDate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [editingDate, setEditingDate] = useState(false);

  const dragControls = useDragControls();
  const swipeX = useRef(0);

  const tags = (task.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
  const due = formatDueDate(task.due_date);

  const commit = () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== task.title) {
      onSave(task.id, trimmed);
    } else {
      setDraft(task.title);
    }
  };

  const commitTag = () => {
    const trimmed = tagDraft.trim();
    setAddingTag(false);
    setTagDraft("");
    if (!trimmed) return;
    const next = [...tags, trimmed];
    onSaveTags(task.id, next.join(","));
  };

  const removeTag = (name) => {
    const next = tags.filter((t) => t !== name);
    onSaveTags(task.id, next.join(","));
  };

  const commitDate = (value) => {
    setEditingDate(false);
    onSaveDueDate(task.id, value ? new Date(value).toISOString() : null);
  };

  return (
    <Reorder.Item
      as="li"
      value={task}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="task-row-wrap"
    >
      {/* Delete affordance revealed underneath while swiping */}
      <div className="swipe-backdrop" aria-hidden="true">
        Delete
      </div>

      <motion.div
        className="task-row"
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.2, right: 0 }}
        onDrag={(_, info) => (swipeX.current = info.offset.x)}
        onDragEnd={() => {
          if (swipeX.current < SWIPE_DELETE_THRESHOLD) onDelete(task.id);
        }}
      >
        <span
          className="drag-handle"
          onPointerDown={(e) => dragControls.start(e)}
          aria-label="Drag to reorder"
        >
          ⠿
        </span>

        <motion.button
          className={`checkbox ${task.done ? "done" : ""}`}
          onClick={() => onToggle(task)}
          whileTap={{ scale: 0.85 }}
          aria-label={task.done ? "Mark as not done" : "Mark as done"}
        >
          {task.done && (
            <motion.svg
              width="12"
              height="10"
              viewBox="0 0 12 10"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25 }}
            >
              <motion.path
                d="M1 5L4.5 8.5L11 1.5"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </motion.button>

        <div className="task-main">
          {editing ? (
            <input
              className="task-edit-input"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setDraft(task.title);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <span
              className={`task-title ${task.done ? "done" : ""}`}
              onDoubleClick={() => setEditing(true)}
            >
              {task.title}
            </span>
          )}

          <div className="task-meta">
            {due && (
              editingDate ? (
                <input
                  type="date"
                  className="date-input"
                  autoFocus
                  defaultValue={task.due_date ? task.due_date.slice(0, 10) : ""}
                  onBlur={(e) => commitDate(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitDate(e.target.value)}
                />
              ) : (
                <button className={`due-badge ${due.state}`} onClick={() => setEditingDate(true)}>
                  {due.label}
                </button>
              )
            )}
            {!due && editingDate && (
              <input
                type="date"
                className="date-input"
                autoFocus
                onBlur={(e) => commitDate(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitDate(e.target.value)}
              />
            )}

            {tags.map((tag) => (
              <motion.span
                key={tag}
                className="tag-pill"
                style={{ "--tag-hue": tagHue(tag) }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => removeTag(tag)}
                title="Click to remove"
              >
                {tag}
              </motion.span>
            ))}

            {addingTag ? (
              <input
                className="tag-input"
                autoFocus
                value={tagDraft}
                placeholder="tag"
                onChange={(e) => setTagDraft(e.target.value)}
                onBlur={commitTag}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTag();
                  if (e.key === "Escape") {
                    setTagDraft("");
                    setAddingTag(false);
                  }
                }}
              />
            ) : (
              <button className="meta-add-btn" onClick={() => setAddingTag(true)} aria-label="Add tag">
                + tag
              </button>
            )}
            {!due && !editingDate && (
              <button className="meta-add-btn" onClick={() => setEditingDate(true)} aria-label="Set due date">
                + date
              </button>
            )}
          </div>
        </div>

        <div className="row-actions">
          <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Edit">
            Edit
          </button>
          <button className="icon-btn danger" onClick={() => onDelete(task.id)} aria-label="Delete">
            Delete
          </button>
        </div>
      </motion.div>
    </Reorder.Item>
  );
}
