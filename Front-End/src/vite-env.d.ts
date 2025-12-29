interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_COURSE_ID: string;
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
