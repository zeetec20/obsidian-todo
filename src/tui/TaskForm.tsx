import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { TextareaRenderable } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { STATUSES, type NewTaskInput, type Status, type Task } from "../core/types.ts";
import { useTheme } from "./theme.tsx";
import { DateInput } from "./DateInput.tsx";
import { Dropdown } from "./Dropdown.tsx";
import { Button } from "./Modal.tsx";

const SENTINEL = " new";

export function TaskForm({
  task,
  categories,
  defaultCategory,
  onSubmit,
  onCancel,
  onError,
}: {
  task?: Task;
  categories: string[];
  defaultCategory?: string;
  onSubmit: (input: NewTaskInput) => void;
  onCancel: () => void;
  onError: (msg: string) => void;
}) {
  const theme = useTheme();
  const { height: termH } = useTerminalDimensions();
  const formHeight = Math.max(14, termH - 4);
  const startNew = !!task && !categories.includes(task.category);
  const initialCategory =
    task && categories.includes(task.category)
      ? task.category
      : defaultCategory && categories.includes(defaultCategory)
        ? defaultCategory
        : categories[0] ?? "";
  const [name, setName] = useState(task?.name ?? "");
  const [category, setCategory] = useState(initialCategory);
  const [newMode, setNewMode] = useState(startNew || categories.length === 0);
  const [newCat, setNewCat] = useState(startNew ? task!.category : "");
  const [due, setDue] = useState(task?.due ?? "");
  const [status, setStatus] = useState<Status>(task?.status ?? "backlog");
  const [tags, setTags] = useState((task?.tags ?? []).join(", "));
  const initialDesc = task?.description ?? "";
  const [focusIdx, setFocusIdx] = useState(0);
  const descRef = useRef<TextareaRenderable>(null);
  const descCache = useRef(task?.description ?? "");

  // Ordered field keys → tab/visual order. newcat sits right after category.
  const fields = [
    "name",
    "category",
    ...(newMode ? ["newcat"] : []),
    "due",
    "status",
    "tags",
    "description",
    "save",
    "cancel",
  ];
  const fi = Math.min(focusIdx, fields.length - 1);
  const cur = fields[fi];
  const on = (key: string) => cur === key;

  // Poll plainText while description is focused; cache on blur.
  // Needed because scrollbox virtual rendering can drop the ref's live value.
  useEffect(() => {
    const sync = () => {
      const v = descRef.current?.plainText;
      if (v !== undefined) descCache.current = v;
    };
    if (cur !== "description") { sync(); return; }
    const id = setInterval(sync, 100);
    return () => { clearInterval(id); sync(); };
  }, [cur]);

  function submit() {
    const cat = (newMode ? newCat : category).trim();
    if (!name.trim()) return onError("Name is required.");
    if (!cat) return onError("Category is required.");
    const liveVal = descRef.current?.plainText;
    const desc = (liveVal !== undefined && liveVal !== initialDesc) ? liveVal : descCache.current;
    onSubmit({
      name: name.trim(),
      category: cat,
      due: due.trim() || undefined,
      status,
      tags: tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean),
      description: desc,
    });
  }

  useKeyboard((key) => {
    if (key.name === "escape") return onCancel();
    if (key.name === "tab") {
      setFocusIdx((i) => {
        const len = fields.length;
        return key.shift ? (i - 1 + len) % len : (i + 1) % len;
      });
      return;
    }
    if (key.name === "return" || key.name === "enter") {
      if (cur === "save") submit();
      else if (cur === "cancel") onCancel();
      else if (cur === "description") return; // let the textarea insert a newline
      else setFocusIdx((i) => (i + 1) % fields.length); // Enter acts like Tab
    }
  });

  const focusKey = (key: string) => () => setFocusIdx(Math.max(0, fields.indexOf(key)));
  const label = (key: string, text: string) => (
    <box onMouseDown={focusKey(key)} style={{ flexDirection: "row", flexShrink: 0 }}>
      <text fg={on(key) ? theme.accent : theme.muted}>{text}</text>
    </box>
  );
  const Field = ({
    focused,
    onMouseDown,
    children,
  }: {
    focused: boolean;
    onMouseDown?: () => void;
    children: ReactNode;
  }) => (
    <box
      onMouseDown={onMouseDown}
      style={{
        borderStyle: "rounded",
        borderColor: focused ? theme.accent : theme.border,
        paddingLeft: 1,
        paddingRight: 1,
        backgroundColor: theme.bg,
        flexShrink: 0,
      }}
    >
      {children}
    </box>
  );

  return (
    <box
      style={{
        flexDirection: "column",
        width: 60,
        height: formHeight,
        flexShrink: 0,
        padding: 2,
        gap: 0,
        borderStyle: "rounded",
        borderColor: theme.accent,
        backgroundColor: theme.bg,
      }}
      title={task ? ` Edit ${task.id} ` : " New task "}
    >
      <scrollbox scrollX={false} style={{ flexGrow: 1 }}>
        {label("name", "Name *")}
        <Field focused={on("name")} onMouseDown={focusKey("name")}>
          <input focused={on("name")} value={name} onInput={setName} placeholder="Task name" style={{ flexGrow: 1 }} />
        </Field>

        {label("category", "Category *")}
        <box onMouseDown={focusKey("category")} style={{ flexDirection: "column", flexShrink: 0 }}>
          <Dropdown
            focused={on("category")}
            value={newMode ? SENTINEL : category}
            options={[
              ...categories.map((c) => ({ label: c, value: c })),
              { label: "＋ New category…", value: SENTINEL },
            ]}
            onChange={(v) => {
              if (v === SENTINEL) setNewMode(true);
              else {
                setNewMode(false);
                setCategory(v);
              }
            }}
          />
        </box>
        {newMode ? (
          <>
            {label("newcat", "New category name *")}
            <Field focused={on("newcat")} onMouseDown={focusKey("newcat")}>
              <input
                focused={on("newcat")}
                value={newCat}
                onInput={setNewCat}
                placeholder="e.g. Side Project"
                style={{ flexGrow: 1 }}
              />
            </Field>
          </>
        ) : null}

        {label("due", "Due (optional)")}
        <Field focused={on("due")} onMouseDown={focusKey("due")}>
          <DateInput value={due} focused={on("due")} onChange={setDue} />
        </Field>

        {label("status", "Status")}
        <box onMouseDown={focusKey("status")} style={{ flexDirection: "column", flexShrink: 0 }}>
          <Dropdown
            focused={on("status")}
            value={status}
            options={STATUSES.map((s) => ({ label: s, value: s }))}
            onChange={(v) => setStatus(v as Status)}
          />
        </box>

        {label("tags", "Tags (comma separated, optional)")}
        <Field focused={on("tags")} onMouseDown={focusKey("tags")}>
          <input focused={on("tags")} value={tags} onInput={setTags} placeholder="auth, urgent" style={{ flexGrow: 1 }} />
        </Field>

        {label("description", "Description (optional)")}
        <Field focused={on("description")} onMouseDown={focusKey("description")}>
          <textarea
            ref={descRef}
            focused={on("description")}
            initialValue={task?.description ?? ""}
            placeholder="Markdown description…"
            style={{ height: 5, flexGrow: 1 }}
          />
        </Field>
        <box style={{ flexShrink: 0 }}>
          <text fg={theme.muted}>Tip: press e on a task to edit the description in your $EDITOR</text>
        </box>
      </scrollbox>

      <box style={{ flexDirection: "row", gap: 2, marginTop: 1, marginBottom: 1, height: 3, justifyContent: "center" }}>
        <Button label="Save" focused={on("save")} onClick={submit} />
        <Button label="Cancel" focused={on("cancel")} onClick={onCancel} />
      </box>
      <text fg={theme.muted}>Tab/Enter next · Shift+Tab back · Esc cancel</text>
    </box>
  );
}
