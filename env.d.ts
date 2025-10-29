
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_ACCESS_TOKEN: string;
    }
  }
}

export {}
