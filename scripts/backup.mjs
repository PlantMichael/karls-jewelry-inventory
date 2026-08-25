/**
 * Snapshots the SQLite database into backups/ and prunes old copies.
 *
 * Runs from "Start Inventory.bat" before the server boots, so the database is
 * guaranteed to be closed and a plain file copy is safe. Also available on
 * demand via `npm run backup`.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEEP = 10;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = join(root, 'prisma', 'jewelry.db');
const backupDir = join(root, 'backups');

if (!existsSync(dbPath)) {
	console.log('No database yet — nothing to back up.');
	process.exit(0);
}

mkdirSync(backupDir, { recursive: true });

// 2026-08-25T18:57:24.123Z -> 2026-08-25_185724
const stamp = new Date().toISOString().replace(/:/g, '').replace(/\..+$/, '').replace('T', '_');
const target = join(backupDir, `jewelry-${stamp}.db`);

copyFileSync(dbPath, target);

// If the database is in WAL mode these hold recent writes, so keep them together.
for (const suffix of ['-wal', '-shm']) {
	if (existsSync(dbPath + suffix)) copyFileSync(dbPath + suffix, target + suffix);
}

const sizeKb = Math.max(1, Math.round(statSync(target).size / 1024));
console.log(`Backed up to backups/jewelry-${stamp}.db (${sizeKb} KB)`);

// Prune oldest, counting only the main .db files so -wal/-shm ride along.
const snapshots = readdirSync(backupDir)
	.filter((name) => /^jewelry-.+\.db$/.test(name))
	.sort();

for (const name of snapshots.slice(0, Math.max(0, snapshots.length - KEEP))) {
	for (const suffix of ['', '-wal', '-shm']) {
		const stale = join(backupDir, name + suffix);
		if (existsSync(stale)) unlinkSync(stale);
	}
	console.log(`Removed old backup ${name}`);
}
