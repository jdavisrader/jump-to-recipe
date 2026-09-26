/**
 * One-off: copy local `/uploads/...` files to Vercel Blob and point the DB at them.
 *
 * Dry run by default; pass `--apply` to upload and update rows. Safe to re-run:
 * files already in Blob are reused, and only rows still holding `/uploads/...`
 * are touched — so it can run again after the final cutover restore.
 *
 * Usage (from jump-to-recipe/):
 *   UPLOADS_DIR=~/pi-uploads DATABASE_URL=<neon unpooled> BLOB_READ_WRITE_TOKEN=<token> \
 *     npx tsx scripts/migrate-uploads-to-blob.ts [--apply]
 *
 * UPLOADS_DIR is the folder that contains recipes/, recipe-photos/, cookbooks/, avatars/.
 */
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import postgres from 'postgres';
import { put, head, BlobNotFoundError } from '@vercel/blob';

const IMAGE_COLUMNS = [
  { table: 'recipe_photos', column: 'file_path' },
  { table: 'recipes', column: 'image_url' },
  { table: 'cookbooks', column: 'cover_image_url' },
  { table: 'users', column: 'image' },
] as const;

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
};

const apply = process.argv.includes('--apply');

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. See usage at the top of this script.`);
    process.exit(1);
  }
  return value;
}

// `/uploads/recipe-photos/<id>/a.jpg` → `uploads/recipe-photos/<id>/a.jpg`, the
// same key layout new uploads use (see src/lib/blob-storage.ts).
function toBlobPathname(localUrl: string): string {
  return localUrl.replace(/^\/+/, '');
}

async function findExistingBlobUrl(pathname: string): Promise<string | null> {
  try {
    return (await head(pathname)).url;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

async function uploadFile(localUrl: string, uploadsDir: string): Promise<string | null> {
  const relativePath = localUrl.replace(/^\/uploads\//, '');
  const filePath = path.resolve(uploadsDir, relativePath);
  if (!filePath.startsWith(path.resolve(uploadsDir) + path.sep) || !existsSync(filePath)) {
    return null;
  }

  const pathname = toBlobPathname(localUrl);
  const existingUrl = await findExistingBlobUrl(pathname);
  if (existingUrl) return existingUrl;

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  const blob = await put(pathname, await readFile(filePath), {
    access: 'public',
    contentType,
    addRandomSuffix: false,
  });
  return blob.url;
}

async function main() {
  const uploadsDir = requireEnv('UPLOADS_DIR');
  const sql = postgres(requireEnv('DATABASE_URL'), { max: 1 });
  if (apply) requireEnv('BLOB_READ_WRITE_TOKEN');

  console.log(apply ? 'APPLY mode — uploading and updating rows\n' : 'DRY RUN — nothing will change (pass --apply)\n');

  const missingFiles: string[] = [];
  let migratedRows = 0;

  for (const { table, column } of IMAGE_COLUMNS) {
    const rows = await sql<{ value: string; count: number }[]>`
      select ${sql(column)} as value, count(*)::int as count
      from ${sql(table)}
      where ${sql(column)} like '/uploads/%'
      group by 1`;
    const rowCount = rows.reduce((sum, row) => sum + row.count, 0);
    console.log(`${table}.${column}: ${rows.length} files referenced by ${rowCount} rows`);

    for (const { value, count } of rows) {
      if (!apply) {
        const localPath = path.resolve(uploadsDir, value.replace(/^\/uploads\//, ''));
        if (!existsSync(localPath)) missingFiles.push(`${table}.${column}: ${value}`);
        continue;
      }

      const blobUrl = await uploadFile(value, uploadsDir);
      if (!blobUrl) {
        missingFiles.push(`${table}.${column}: ${value}`);
        continue;
      }

      await sql`update ${sql(table)} set ${sql(column)} = ${blobUrl} where ${sql(column)} = ${value}`;
      migratedRows += count;
    }
  }

  console.log(`\n${apply ? 'Updated' : 'Would update'} rows: ${apply ? migratedRows : '(see counts above)'}`);
  if (missingFiles.length > 0) {
    console.log(`\n${missingFiles.length} referenced files not found in UPLOADS_DIR (rows left unchanged):`);
    missingFiles.forEach((entry) => console.log(`  - ${entry}`));
  }

  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
