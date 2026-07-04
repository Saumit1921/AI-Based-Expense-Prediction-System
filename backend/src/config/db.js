import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let databaseUrl = 'file:./dev.db';

if (process.env.VERCEL === '1') {
  const sourceDb = path.resolve(__dirname, '../../prisma/dev.db');
  const destDb = '/tmp/dev.db';

  console.log(`[VERCEL DETECTED] SQLite Source DB Path: ${sourceDb}`);
  console.log(`[VERCEL DETECTED] SQLite Target DB Path: ${destDb}`);

  try {
    if (!fs.existsSync(destDb)) {
      console.log('[VERCEL DB SETUP] destDb does not exist. Copying source database...');
      // Ensure the directory exists (though /tmp always exists)
      const destDir = path.dirname(destDb);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(sourceDb, destDb);
      console.log('[VERCEL DB SETUP] SQLite database successfully copied to writeable storage.');
    } else {
      console.log('[VERCEL DB SETUP] destDb already exists in /tmp. Reusing existing file.');
    }
    databaseUrl = `file:${destDb}`;
  } catch (err) {
    console.error('[VERCEL DB SETUP] Error copying SQLite database:', err);
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export default prisma;

