
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('DIRECT_URL present:', !!process.env.DIRECT_URL);
