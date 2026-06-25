import { editorState, useEditorState } from "@/editor/EditorState";
import { LofiFileType } from "@/editor/repository";
import { InnerApp } from "@/InnerApp";
import { useRerenderOnEvent } from "@/util/hooks";
import { basename, dirname, join, resolve } from "@tauri-apps/api/path";
import { getMatches } from "@tauri-apps/plugin-cli";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import { error } from '@tauri-apps/plugin-log';
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";

function removeFileExtension(fileName: string): string {
  if (fileName.endsWith(".lofi.png")) {
    return fileName.slice(0, -".lofi.png".length);
  }
  const parts = fileName.split(".");
  // If there is only one part, return the original fileName
  if (parts.length === 1) return fileName;
  return parts.slice(0, -1).join(".");
}

async function blobToBytes(data: Blob): Promise<Uint8Array> {
  return new Uint8Array(await data.arrayBuffer());
}

let initialized = false;

async function loadInitialFile(
  name: string,
  loaded: (fileType: LofiFileType) => void | Promise<void>,
) {
  try {
    const fileData = await readFile(name);
    const state = await editorState;
    const fileType = await state.repository.loadProject(
      new Blob([fileData]),
      await resolve(name),
    );
    await loaded(fileType);
  } catch (e) {
    const fileName = name.split(/[\\/]/).slice(-1)[0];
    toast.error(
      "Error loading " +
        fileName +
        ": " +
        (e instanceof Error ? e.message : String(e)),
    );
    error(`Error loading initial file: ${e}:`);
  }
}

export function TauriApp() {
  const state = useEditorState();
  useRerenderOnEvent(state.onProjectDataChanged);
  const [currentFile, setCurrentFile] = useState<{
    directory: string;
    fullFilePath: string;
    fileName: string;
    baseFileName: string;
    type: LofiFileType;
  } | null>(null);

  useEffect(() => {
    if (initialized) return;
    initialized = true;
    (async () => {
      let loaded = false;
      try {
        const matches = await getMatches();
        const fileArg = matches.args.file?.value;
        if (typeof fileArg === "string" && fileArg.length > 0) {
          await loadInitialFile(fileArg, async (type) => {
            setCurrentFile(await toCurrentFile(fileArg, type));
            loaded = true;
          });
        }
      } finally {
        if (!loaded) {
          state.repository.clear();
        }
      }
    })();
  }, []);

  const toCurrentFile = async (fullFilePath: string, type: LofiFileType) => {
    const fileName = await basename(fullFilePath);
    return {
      fullFilePath,
      directory: await dirname(fullFilePath),
      fileName,
      baseFileName: removeFileExtension(fileName),
      type,
    } as const;
  };

  return (
    <InnerApp
      controls={{
        projectName: currentFile ? currentFile.baseFileName : "Untitled",
        saveAs: (data, filename, title) => {
          (async () => {
            const result = await saveDialog({
              title,
              defaultPath:
                currentFile === null
                  ? undefined
                  : await join(currentFile.directory, filename),
            });
            if (result) {
              await writeFile(result, await blobToBytes(data));
              toast.success(`File saved: ${await basename(result)}`);
            }
          })();
        },
        hideUploadDownload: true,
        rightControls: (args) => (
          <>
            <Button
              onClick={async () => {
                const result = await openDialog({
                  title: "Open LoFi Mockup",
                  defaultPath: currentFile?.directory,
                  multiple: false,
		  directory: false,
                  filters: [
                    { name: "LoFi Mockup", extensions: ["lofi", "lofi.png"] },
                  ],
                });
                if (result) {
                  // Handle the selected file here
                  const fullFilePath = result;
                  try {
                    const fileData = await readFile(fullFilePath);
                    const type = await state.repository.loadProject(
                      new Blob([fileData]),
                      await resolve(fullFilePath),
                      true,
                    );

                    setCurrentFile(await toCurrentFile(fullFilePath, type));
                  } catch (e) {
                    toast.error(
                      "Error loading " +
                        (await basename(fullFilePath)) +
                        ": " +
                        (e instanceof Error ? e.message : String(e)),
                    );
                    error(`Error loading file: ${e}`);
                  }
                }
              }}
            >
              Open...
            </Button>
            {currentFile && (
              <Button
                disabled={!state.dirty}
                onClick={async () => {
                  const data =
                    currentFile.type === "png"
                      ? await args.createLofiPng()
                      : await args.createZip(false);
                  await writeFile(
                    currentFile.fullFilePath,
                    await blobToBytes(data),
                  );
                  state.clearDirtyFlag();
                  toast.success(`File saved: ${currentFile.fileName}`);
                }}
              >
                Save {currentFile.fileName}
              </Button>
            )}
            <Button
              onClick={async () => {
                const result = await saveDialog({
                  title: "Save LoFi Mockup",
                  filters: [
                    { name: "LoFi Mockup", extensions: ["lofi" ] },
                    { name: "LoFi Mockup PNG", extensions: ["lofi.png"] },
                  ],
                  defaultPath: currentFile?.fullFilePath ?? "project.lofi",
                });
                if (result) {
                  const type: LofiFileType = result
                    .toLowerCase()
                    .endsWith(".png")
                    ? "png"
                    : "lofi";
                  const data =
                    type === "png"
                      ? await args.createLofiPng()
                      : await args.createZip(false);
		  const bytes = await blobToBytes(data)
                  await writeFile(result, bytes);
                  setCurrentFile(await toCurrentFile(result, type));
                  toast.success(`File saved: ${await basename(result)}`);
                  state.clearDirtyFlag();
                }
              }}
            >
              Save As ...
            </Button>
          </>
        ),
        hideExports: true,
        topMenuItems: (args) => [
          currentFile != null && {
            label: "Revert to " + currentFile.fileName,
            onClick: async () => {
              if (!currentFile) return;
              try {
                const fileData = await readFile(currentFile.fullFilePath);
                await state.repository.loadProject(
                  new Blob([fileData]),
                  currentFile.fullFilePath,
                  true,
                );
                toast.success(`Reverted to ${currentFile.fileName}`);
              } catch (e) {
                toast.error(
                  "Error reverting to " +
                    currentFile.fileName +
                    ": " +
                    (e instanceof Error ? e.message : String(e)),
                );
                error(`Error reverting file: ${e}`);
              }
            },
          },
          args.exportPdf(),
          currentFile != null && {
            label: "Export as " + currentFile.baseFileName + ".pdf",
            onClick: async () => {
              if (args.pdfInProgress) return;
              var pdf = await args.createPdf();
              await writeFile(
                await join(
                  currentFile.directory,
                  currentFile.baseFileName + ".pdf",
                ),
                await blobToBytes(pdf),
              );
              toast.success(`File saved: ${currentFile.baseFileName + ".pdf"}`);
            },
          },
          args.exportPng(),
          currentFile != null && {
            label: "Export as " + currentFile.baseFileName + ".png",
            onClick: async () => {
              var png = await args.createPng();
              await writeFile(
                await join(
                  currentFile.directory,
                  currentFile.baseFileName + ".png",
                ),
                await blobToBytes(png),
              );
              toast.success(`File saved: ${currentFile.baseFileName + ".png"}`);
            },
          },
          args.exportLofiPng(),
          currentFile != null && {
            label: "Export as " + currentFile.baseFileName + ".lofi.png",
            onClick: async () => {
              var png = await args.createLofiPng();
              await writeFile(
                await join(
                  currentFile.directory,
                  currentFile.baseFileName + ".lofi.png",
                ),
                await blobToBytes(png),
              );
              toast.success(
                `File saved: ${currentFile.baseFileName + ".lofi.png"}`,
              );
            },
          },
        ],
      }}
    />
  );
}
