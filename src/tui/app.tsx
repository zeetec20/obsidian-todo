import { useEffect, useMemo, useRef, useState } from "react";
import { createCliRenderer, SyntaxStyle, TextAttributes } from "@opentui/core";
import {
  createRoot,
  useKeyboard,
  useRenderer,
  useSelectionHandler,
  useTerminalDimensions,
} from "@opentui/react";
import {
  addVault,
  loadConfig,
  removeVault,
  resolveEditor,
  saveConfig,
  type Config,
} from "../core/config.ts";
import {
  addTask,
  deleteCategory,
  deleteTask,
  filterTasks,
  listCategories,
  loadAllTasks,
  updateTask,
} from "../core/repo.ts";
import { editText, openExternal } from "../core/editor.ts";
import { extractImages } from "../core/parser.ts";
import { detectSystemMode, resolveTheme } from "../core/theme.ts";
import {
  STATUSES,
  type Filter,
  type NewTaskInput,
  type Status,
  type Task,
} from "../core/types.ts";
import { basename, dirname, resolve } from "path";
import { ThemeProvider } from "./theme.tsx";
import { HomeScreen } from "./HomeScreen.tsx";
import { TaskList, type ListRow } from "./TaskList.tsx";
import { TaskDetail } from "./TaskDetail.tsx";
import { CategoryDashboard } from "./CategoryDashboard.tsx";
import { TaskForm } from "./TaskForm.tsx";
import { HelpPanel } from "./HelpPanel.tsx";
import { Modal, Button } from "./Modal.tsx";
import { Overlay } from "./Overlay.tsx";
import { ThemePicker } from "./ThemePicker.tsx";
import { SelectModal } from "./SelectModal.tsx";
import { DateRangeModal } from "./DateRangeModal.tsx";
import { FilterBar } from "./FilterBar.tsx";
import { ICON } from "./icons.ts";
import { Toast, type ToastData, type ToastKind } from "./Toast.tsx";
import { StatusBar, STATUS_TABS, tabStatus } from "./StatusBar.tsx";

type Mode =
  | "vault"
  | "list"
  | "form"
  | "help"
  | "confirm"
  | "theme"
  | "status"
  | "catfilter"
  | "datefilter";

const HINTS = [
  { icon: ICON.nav, key: "j/k", label: "move" },
  { icon: ICON.search, key: "/", label: "search" },
  { icon: ICON.new, key: "n", label: "new" },
  { icon: ICON.filter, key: "c/f", label: "filter" },
  { icon: ICON.theme, key: "t", label: "theme" },
  { icon: ICON.help, key: "?", label: "help" },
  { icon: ICON.quit, key: "q", label: "quit" },
];

const MODAL_MODES: Mode[] = [
  "form",
  "vault",
  "theme",
  "status",
  "catfilter",
  "datefilter",
];

function App({
  initialConfig,
  syntaxStyle,
  openNew,
}: {
  initialConfig: Config;
  syntaxStyle: SyntaxStyle;
  openNew: boolean;
}) {
  const renderer = useRenderer();
  const { width } = useTerminalDimensions();
  const [config, setConfig] = useState<Config>(initialConfig);
  const [activeVault, setActiveVault] = useState<string | undefined>(
    initialConfig.lastVault,
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>({});
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [mode, setMode] = useState<Mode>("vault");
  const [editTask, setEditTask] = useState<Task | undefined>(undefined);
  const [searchMode, setSearchMode] = useState(false);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState(0); // 0=All, 1..n=STATUSES[i-1]
  const [confirmBtn, setConfirmBtn] = useState(0); // 0=Delete, 1=Cancel
  const [pendingDelete, setPendingDelete] = useState<ListRow | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [themeBefore, setThemeBefore] = useState<{ theme?: string; mode?: "auto" | "light" | "dark" }>({});
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sysMode = useMemo(() => detectSystemMode(), []);
  const theme = resolveTheme(config.theme, config.mode, sysMode);
  const vault = activeVault;
  const listInner = Math.max(20, Math.floor(width * 0.45) - 2);
  const maxTitle = Math.max(10, listInner - 14);
  const maxMeta = Math.max(16, listInner);
  const lastClick = useRef<{ index: number; time: number }>({ index: -1, time: 0 });

  function pushToast(msg: string, kind: ToastKind = "info") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, kind });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  // Tasks after category/created/search filters (status applied separately by the tab bar).
  const baseFiltered = useMemo(
    () =>
      filterTasks(tasks, {
        category: filter.category,
        createdFrom: filter.createdFrom,
        createdTo: filter.createdTo,
        search: search || undefined,
      }),
    [tasks, filter.category, filter.createdFrom, filter.createdTo, search],
  );
  const filtered = useMemo(() => {
    const st = tabStatus(statusTab);
    return st ? baseFiltered.filter((t) => t.status === st) : baseFiltered;
  }, [baseFiltered, statusTab]);

  const [categories, setCategories] = useState<string[]>([]);
  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of categories) m.set(c, 0);
    for (const t of tasks) m.set(t.category, (m.get(t.category) ?? 0) + 1);
    return m;
  }, [tasks, categories]);

  // Combined navigable rows: category headers + their filtered tasks.
  // Empty categories only show in the default unfiltered view (so they stay
  // deletable) — when a filter is active, hiding them keeps spacing consistent.
  const showEmptyCats =
    statusTab === 0 &&
    !search &&
    !filter.category &&
    !filter.createdFrom &&
    !filter.createdTo;
  const rows = useMemo<ListRow[]>(() => {
    const byCat = new Map<string, Task[]>();
    for (const c of categories) byCat.set(c, []);
    for (const t of filtered) {
      if (!byCat.has(t.category)) byCat.set(t.category, []);
      byCat.get(t.category)!.push(t);
    }
    const out: ListRow[] = [];
    for (const c of [...byCat.keys()].sort()) {
      const ts = byCat
        .get(c)!
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      if (ts.length === 0 && !showEmptyCats) continue;
      const isCollapsed = collapsed.has(c);
      out.push({
        type: "category",
        category: c,
        count: categoryCounts.get(c) ?? ts.length,
        collapsed: isCollapsed,
      });
      if (!isCollapsed)
        ts.forEach((t, i) => out.push({ type: "task", task: t, n: i + 1 }));
    }
    return out;
  }, [filtered, categories, categoryCounts, collapsed, showEmptyCats]);

  const safeIndex = selectedIndex < 0 ? -1 : Math.min(selectedIndex, rows.length - 1);
  const selectedRow = safeIndex < 0 ? undefined : rows[safeIndex];
  const selectedTask =
    selectedRow?.type === "task" ? selectedRow.task : undefined;

  async function reload(v = vault) {
    if (!v) return;
    try {
      setTasks(await loadAllTasks(v));
      setCategories(await listCategories(v));
    } catch (e) {
      pushToast(`Load failed: ${(e as Error).message}`, "error");
    }
  }

  async function refresh() {
    await reload();
    pushToast("Refreshed", "success");
  }

  useEffect(() => {
    if (vault) renderer.setTerminalTitle(`otodo — ${basename(vault)}`);
    if (openNew && initialConfig.lastVault) {
      confirmVault(initialConfig.lastVault).then(() => setMode("form"));
    }
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSelectionHandler((sel) => {
    const t = sel.getSelectedText();
    if (t && t.trim()) {
      renderer.copyToClipboardOSC52(t);
      pushToast("Copied selection", "success");
    }
  });

  function quit() {
    renderer.destroy();
    process.exit(0);
  }

  async function confirmVault(path: string) {
    const next = addVault(config, path);
    setConfig(next);
    setActiveVault(next.lastVault);
    await saveConfig(next);
    setMode("list");
    await reload(next.lastVault);
    renderer.setTerminalTitle(`otodo — ${basename(next.lastVault!)}`);
    pushToast(`Vault: ${basename(next.lastVault!)}`, "success");
  }

  async function detachVault(path: string) {
    const next = removeVault(config, path);
    setConfig(next);
    await saveConfig(next);
    pushToast(`Detached ${basename(path)}`, "info");
  }

  function openThemePicker() {
    setThemeBefore({ theme: config.theme, mode: config.mode });
    setMode("theme");
  }
  function previewTheme(name: string, m: "auto" | "light" | "dark") {
    setConfig((c) => ({ ...c, theme: name, mode: m }));
  }
  async function saveTheme(name: string, m: "auto" | "light" | "dark") {
    const next = { ...config, theme: name, mode: m };
    setConfig(next);
    setMode("list");
    await saveConfig(next);
    pushToast(`Theme: ${name} (${m})`, "success");
  }
  function cancelTheme() {
    setConfig((c) => ({ ...c, theme: themeBefore.theme, mode: themeBefore.mode }));
    setMode("list");
  }

  async function editDescription() {
    if (!selectedTask) return;
    const editor = resolveEditor(config);
    renderer.suspend();
    let text = selectedTask.description;
    try {
      text = await editText(
        editor,
        selectedTask.description,
        selectedTask.id.replace(/\W/g, ""),
      );
    } finally {
      renderer.resume();
    }
    await updateTask({ ...selectedTask, description: text });
    await reload();
    pushToast(`Saved ${selectedTask.id}`, "success");
  }

  function copyTask() {
    if (!selectedTask) return;
    renderer.copyToClipboardOSC52(
      selectedTask.description || selectedTask.name,
    );
    pushToast(`Copied ${selectedTask.id}`, "success");
  }

  async function handleFormSubmit(input: NewTaskInput) {
    if (!vault) return;
    if (editTask) {
      if (input.category !== editTask.category) {
        await deleteTask(editTask);
        await addTask(vault, input, tasks);
      } else {
        await updateTask({
          ...editTask,
          name: input.name,
          due: input.due,
          status: input.status ?? editTask.status,
          tags: input.tags ?? [],
          description: input.description ?? editTask.description,
        });
      }
      pushToast(`Updated ${editTask.id}`, "success");
    } else {
      const t = await addTask(vault, input, tasks);
      pushToast(`Created ${t.id}`, "success");
    }
    setEditTask(undefined);
    setMode("list");
    await reload();
  }

  function askDelete() {
    if (!selectedRow) return;
    if (selectedRow.type === "category") {
      const n = categoryCounts.get(selectedRow.category) ?? 0;
      if (n > 0) {
        pushToast(
          `Clear ${n} task(s) in ${selectedRow.category} first`,
          "error",
        );
        return;
      }
    }
    setPendingDelete(selectedRow);
    setConfirmBtn(0);
    setMode("confirm");
  }

  async function doDelete() {
    const p = pendingDelete;
    setMode("list");
    setPendingDelete(null);
    if (!p) return;
    if (p.type === "task") {
      await deleteTask(p.task);
      pushToast(`Deleted ${p.task.id}`, "success");
    } else {
      await deleteCategory(vault!, p.category);
      if (filter.category === p.category)
        setFilter((f) => ({ ...f, category: undefined }));
      pushToast(`Deleted category ${p.category}`, "success");
    }
    // Keep selection where it was so focus lands on the nearest remaining row.
    await reload();
  }

  async function changeStatus(status: string) {
    setMode("list");
    if (!selectedTask) return;
    await updateTask({ ...selectedTask, status: status as Status });
    await reload();
    pushToast(`${selectedTask.id} → ${status}`, "success");
  }

  function openImage() {
    if (!selectedTask) return;
    const imgs = extractImages(selectedTask.description);
    if (!imgs.length) {
      pushToast("No images in this task", "info");
      return;
    }
    openExternal(resolve(dirname(selectedTask.filePath), imgs[0]!.path));
    pushToast("Opened image", "info");
  }

  function editSelected() {
    if (selectedTask) {
      setEditTask(selectedTask);
      setMode("form");
    }
  }

  function toggleCollapse(category: string) {
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(category)) n.delete(category);
      else n.add(category);
      return n;
    });
  }

  function activateSelected() {
    if (!selectedRow) return;
    if (selectedRow.type === "category") toggleCollapse(selectedRow.category);
    else editSelected();
  }

  useKeyboard((key) => {
    if (MODAL_MODES.includes(mode)) return; // child modal handles input
    if (mode === "help") {
      if (key.name === "escape" || key.name === "?" || key.sequence === "?")
        setMode("list");
      return;
    }
    if (mode === "confirm") {
      if (key.name === "y") doDelete();
      else if (key.name === "n" || key.name === "escape") {
        setPendingDelete(null);
        setMode("list");
      } else if (
        key.name === "left" ||
        key.name === "right" ||
        key.name === "tab" ||
        key.name === "h" ||
        key.name === "l"
      )
        setConfirmBtn((b) => (b === 0 ? 1 : 0));
      else if (key.name === "return" || key.name === "enter")
        confirmBtn === 0
          ? doDelete()
          : (setPendingDelete(null), setMode("list"));
      return;
    }
    if (searchMode) {
      if (
        key.name === "escape" ||
        key.name === "return" ||
        key.name === "enter"
      )
        setSearchMode(false);
      return; // input handles characters
    }

    const ch = key.name;
    if (ch === "j" || ch === "down")
      setSelectedIndex((i) => (i >= rows.length - 1 ? 0 : i + 1));
    else if (ch === "k" || ch === "up")
      setSelectedIndex((i) => (i <= 0 ? rows.length - 1 : i - 1));
    else if (ch === "g") setSelectedIndex(0);
    else if (ch === "G") setSelectedIndex(rows.length - 1);
    else if (ch === "q") quit();
    else if (ch === "return" || ch === "enter") activateSelected();
    else if (ch === "space" || key.sequence === " ") {
      if (selectedRow?.type === "category")
        toggleCollapse(selectedRow.category);
    } else if (ch === "n") {
      setEditTask(undefined);
      setMode("form");
    } else if (ch === "e" && !key.shift) editDescription();
    else if ((ch === "e" && key.shift) || ch === "E") editSelected();
    else if (ch === "s") {
      if (selectedTask) setMode("status");
    } else if (ch === "d") askDelete();
    else if (ch === "y") copyTask();
    else if (ch === "l" || ch === "right") {
      setStatusTab((t) => (t + 1) % STATUS_TABS);
      setSelectedIndex(-1);
    } else if (ch === "h" || ch === "left") {
      setStatusTab((t) => (t - 1 + STATUS_TABS) % STATUS_TABS);
      setSelectedIndex(-1);
    } else if (ch === "r") refresh();
    else if (ch === "V") setMode("vault");
    else if (ch === "c") setMode("catfilter");
    else if (ch === "f") setMode("datefilter");
    else if (ch === "t") openThemePicker();
    else if (ch === "x") {
      setFilter({});
      setSearch("");
      pushToast("Filters cleared", "info");
    } else if (ch === "i") openImage();
    else if (ch === "/" || key.sequence === "/") setSearchMode(true);
    else if (ch === "?" || key.sequence === "?") setMode("help");
  });

  // ----- Render -----
  const root = (children: React.ReactNode) => (
    <ThemeProvider value={theme}>
      <box
        style={{
          flexDirection: "column",
          flexGrow: 1,
          backgroundColor: theme.bg,
        }}
      >
        {children}
      </box>
    </ThemeProvider>
  );

  if (mode === "vault" || !vault) {
    return root(
      <>
        <HomeScreen
          vaults={config.vaults ?? []}
          lastVault={config.lastVault}
          onConfirm={confirmVault}
          onDetach={detachVault}
          onQuit={quit}
        />
        <Toast toast={toast} />
      </>,
    );
  }

  const listActive = !searchMode && mode === "list";

  // Hide all hints but quit when the footer (chips + hints) wouldn't fit on one line.
  const hintsLen =
    HINTS.reduce((s, h) => s + 2 + h.key.length + 1 + h.label.length, 0) +
    (HINTS.length - 1) * 5;
  let chipsLen = 0;
  if (filter.category) chipsLen += 3 + filter.category.length + 3;
  if (filter.createdFrom || filter.createdTo)
    chipsLen += 3 + (filter.createdFrom ?? "*").length + 1 + (filter.createdTo ?? "*").length + 3;
  if (search) chipsLen += 3 + search.length + 3;
  if (chipsLen > 0) chipsLen += 9; // "x clear"
  const compactHints = chipsLen + hintsLen + 6 > width;

  function pick(i: number) {
    const now = Date.now();
    const prev = lastClick.current;
    const dbl = prev.index === i && now - prev.time < 350;
    lastClick.current = { index: i, time: now };
    setSelectedIndex(i);
    setMode("list");
    if (dbl && rows[i]?.type === "category") {
      toggleCollapse((rows[i] as { category: string }).category);
    }
  }

  return root(
    <>
      <box
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: 1,
          paddingLeft: 1,
          paddingRight: 1,
        }}
      >
        <text
          attributes={TextAttributes.BOLD}
          fg={theme.accent}
          style={{ flexShrink: 0 }}
        >
          ▌ O T O D O
        </text>
        <box
          style={{
            flexGrow: 1,
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          {searchMode ? (
            <box style={{ flexDirection: "row", width: 40, flexShrink: 0 }}>
              <text fg={theme.accent}>{ICON.search + "  "}</text>
              <input
                focused
                value={search}
                onInput={setSearch}
                placeholder="search tasks…"
                style={{ flexGrow: 1 }}
              />
            </box>
          ) : null}
        </box>
        <text fg={theme.muted} style={{ flexShrink: 0 }}>
          <span fg={theme.accent}>{ICON.vault + " "}</span>
          {basename(vault)}
          {"   "}
          <span fg={theme.accent}>{ICON.tasks + " "}</span>
          {filtered.length} task{filtered.length === 1 ? "" : "s"}
          {"   "}
          <span fg={theme.accent}>{ICON.theme + " "}</span>
          {config.theme ?? "obsidian"}
        </text>
      </box>

      <box style={{ flexDirection: "row", flexGrow: 1 }}>
        <box
          style={{
            width: "45%",
            flexShrink: 0,
            flexDirection: "column",
            borderStyle: "rounded",
            borderColor: listActive ? theme.accent : theme.border,
          }}
          title=" tasks "
        >
          <TaskList
            rows={rows}
            selectedIndex={safeIndex}
            focused={listActive}
            maxTitle={maxTitle}
            maxMeta={maxMeta}
            onPick={pick}
          />
        </box>
        {selectedRow?.type === "category" ? (
          <CategoryDashboard
            category={selectedRow.category}
            tasks={tasks.filter((t) => t.category === selectedRow.category)}
          />
        ) : (
          <TaskDetail task={selectedTask} syntaxStyle={syntaxStyle} />
        )}
      </box>

      <StatusBar
        tasks={baseFiltered}
        tab={statusTab}
        focused={listActive}
        onSelect={(i) => {
          setStatusTab(i);
          setSelectedIndex(-1);
        }}
      />

      <box
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingLeft: 1,
          paddingRight: 1,
          marginBottom: 1,
        }}
      >
        <box style={{ flexDirection: "row", flexShrink: 1 }}>
          <FilterBar filter={filter} search={search || undefined} />
        </box>
        <text fg={theme.muted} style={{ flexShrink: 0 }}>
          {(compactHints ? HINTS.filter((h) => h.key === "q") : HINTS).map((h, i) => (
            <span key={h.key}>
              {i > 0 ? <span fg={theme.muted}>{"  ·  "}</span> : null}
              <span fg={theme.muted}>{h.icon + " "}</span>
              <span fg={theme.accent}>{h.key}</span>
              <span fg={theme.muted}>{" " + h.label}</span>
            </span>
          ))}
        </text>
      </box>

      {mode === "confirm" && pendingDelete ? (
        <Modal title="Confirm delete">
          <box style={{ alignItems: "center" }}>
            <text fg={theme.fg}>
              {pendingDelete.type === "task"
                ? `Delete ${pendingDelete.task.id} "${pendingDelete.task.name}" ?`
                : `Delete category "${pendingDelete.category}" ?`}
            </text>
          </box>
          <box
            style={{
              flexDirection: "row",
              gap: 2,
              marginTop: 1,
              justifyContent: "center",
            }}
          >
            <Button label="Delete" focused={confirmBtn === 0} danger onClick={doDelete} />
            <Button
              label="Cancel"
              focused={confirmBtn === 1}
              onClick={() => {
                setPendingDelete(null);
                setMode("list");
              }}
            />
          </box>
          <box style={{ alignItems: "center" }}>
            <text fg={theme.muted}>
              ←→/Tab switch · Enter confirm · y/n · Esc
            </text>
          </box>
        </Modal>
      ) : null}

      {mode === "form" ? (
        <Overlay>
          <TaskForm
            task={editTask}
            categories={categories}
            defaultCategory={
              selectedRow?.type === "category" ? selectedRow.category : selectedTask?.category
            }
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setEditTask(undefined);
              setMode("list");
            }}
          />
        </Overlay>
      ) : null}

      {mode === "help" ? (
        <Overlay>
          <HelpPanel />
        </Overlay>
      ) : null}

      {mode === "theme" ? (
        <Overlay>
          <ThemePicker
            current={config.theme ?? "obsidian"}
            currentMode={config.mode ?? "auto"}
            onPreview={previewTheme}
            onSave={saveTheme}
            onCancel={cancelTheme}
          />
        </Overlay>
      ) : null}

      {mode === "status" && selectedTask ? (
        <Overlay>
          <SelectModal
            title={`Status — ${selectedTask.id}`}
            current={selectedTask.status}
            options={STATUSES.map((s) => ({ label: s, value: s }))}
            onSelect={changeStatus}
            onCancel={() => setMode("list")}
          />
        </Overlay>
      ) : null}

      {mode === "catfilter" ? (
        <Overlay>
          <SelectModal
            title="Filter: category"
            current={filter.category ?? "__all"}
            options={[
              { label: "All categories", value: "__all" },
              ...categories.map((c) => ({
                label: c,
                value: c,
                hint: `${categoryCounts.get(c) ?? 0}`,
              })),
            ]}
            onSelect={(v) => {
              setFilter((f) => ({
                ...f,
                category: v === "__all" ? undefined : v,
              }));
              setSelectedIndex(-1);
              setMode("list");
            }}
            onCancel={() => setMode("list")}
          />
        </Overlay>
      ) : null}

      {mode === "datefilter" ? (
        <Overlay>
          <DateRangeModal
            from={filter.createdFrom}
            to={filter.createdTo}
            onApply={(from, to) => {
              setFilter((f) => ({ ...f, createdFrom: from, createdTo: to }));
              setSelectedIndex(-1);
              setMode("list");
            }}
            onClear={() => {
              setFilter((f) => ({
                ...f,
                createdFrom: undefined,
                createdTo: undefined,
              }));
              setMode("list");
            }}
            onCancel={() => setMode("list")}
          />
        </Overlay>
      ) : null}

      <Toast toast={toast} />
    </>,
  );
}

export async function runTui(opts: { openNew?: boolean } = {}): Promise<void> {
  const config = await loadConfig();
  const renderer = await createCliRenderer({ exitOnCtrlC: true });
  const syntaxStyle = SyntaxStyle.create();
  createRoot(renderer).render(
    <App
      initialConfig={config}
      syntaxStyle={syntaxStyle}
      openNew={!!opts.openNew}
    />,
  );
}
