import { tmpdir } from "os";
import { join } from "path";

/**
 * Open the given markdown in `$EDITOR` (nvim/nano/...) and return the edited
 * text. The caller is responsible for releasing/restoring the TUI renderer
 * around this call, since the editor takes over the terminal.
 */
export async function editText(
  editor: string,
  initial: string,
  slug = "task",
): Promise<string> {
  const tmp = join(tmpdir(), `otodo-${slug}-${Date.now()}.md`);
  await Bun.write(tmp, initial);

  const proc = Bun.spawn([editor, tmp], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  await proc.exited;

  const result = await Bun.file(tmp).text();
  try {
    await Bun.file(tmp).delete();
  } catch {
    // best effort cleanup
  }
  return result;
}

/** Open a file/image in the OS default application. */
export function openExternal(path: string): void {
  const cmd =
    process.platform === "darwin"
      ? ["open", path]
      : process.platform === "win32"
        ? ["cmd", "/c", "start", "", path]
        : ["xdg-open", path];
  try {
    Bun.spawn(cmd, { stdout: "ignore", stderr: "ignore", stdin: "ignore" });
  } catch {
    // ignore — no opener available
  }
}
