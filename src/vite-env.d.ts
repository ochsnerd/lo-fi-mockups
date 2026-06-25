/// <reference types="vite/client" />
interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_VARIANT: "native" | "web" | "xwiki" | "vscode" | "tauri";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
