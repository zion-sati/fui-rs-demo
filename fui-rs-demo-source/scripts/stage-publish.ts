import { cpSync, rmSync } from 'node:fs';

rmSync('published', { recursive: true, force: true });
cpSync('public', 'published', { recursive: true });
