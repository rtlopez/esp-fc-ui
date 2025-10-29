import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

(function loadEnvAll(mode: string = process.env.NODE_ENV || "development") {
  const root = process.cwd();
  const files = [`.env.${mode}.local`, `.env.${mode}`, `.env.local`, `.env` ];
  for (const file of files) {
    if (fs.existsSync(file)) {
      dotenv.config({
        path: path.join(root, file),
        override: false,
        quiet: true
      });
    }
  }
})()