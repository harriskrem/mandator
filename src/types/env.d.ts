/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_BASE_URL: string
  readonly VITE_TURN_USERNAME: string
  readonly VITE_TURN_CREDENTIAL: string
  readonly VITE_SIGNAL_SERVER_URL: string
  readonly VITE_SHARE_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
