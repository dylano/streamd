/// <reference types="vite-plus/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_SERVER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
declare const __BUILD_COMMIT__: string;
declare const __BUILD_TIME__: string;
