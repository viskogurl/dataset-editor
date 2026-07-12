interface WritableFileHandle {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}

interface SaveFileHandle {
  createWritable(): Promise<WritableFileHandle>;
}

interface FilePickerWindow extends Window {
  showSaveFilePicker?: (options: unknown) => Promise<SaveFileHandle>;
}

export async function saveTextFile(
  content: string,
  fileName: string,
  mimeType: string,
): Promise<void> {
  const pickerWindow = globalThis as unknown as FilePickerWindow;
  if (!pickerWindow.showSaveFilePicker) {
    downloadTextFile(content, fileName, mimeType);
    return;
  }

  const handle = await pickerWindow.showSaveFilePicker({
    suggestedName: fileName,
    types: [{
      description: "JSON Lines file",
      accept: { [mimeType]: [".jsonl"] },
    }],
  });
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export function downloadTextFile(
  content: string,
  fileName: string,
  mimeType: string,
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
