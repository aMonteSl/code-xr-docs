import { access, cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { testedProjects } from '../src/content/testedProjectsContent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const importRoot = path.join(rootDir, 'dashboard-imports');
const publicDashboardsRoot = path.join(rootDir, 'public', 'dashboards');

const pathExists = async (targetPath) => {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const getExportDirectories = async (projectImportDir) => {
  const entries = await readdir(projectImportDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name);
};

await mkdir(importRoot, { recursive: true });
await mkdir(publicDashboardsRoot, { recursive: true });

for (const project of testedProjects.filter((item) => item.content.dashboardPreview)) {
  const projectImportDir = path.join(importRoot, project.id);
  const projectPublicDir = path.join(publicDashboardsRoot, project.id);

  await mkdir(projectImportDir, { recursive: true });

  const exportDirectories = await getExportDirectories(projectImportDir);

  if (exportDirectories.length > 1) {
    throw new Error(
      `Multiple dashboard exports found for "${project.id}" in ${projectImportDir}. Keep exactly one export folder there before building.`
    );
  }

  if (exportDirectories.length === 0) {
    console.log(`[dashboards] ${project.id}: no new export detected, keeping current published dashboard.`);
    continue;
  }

  const sourceExportDir = path.join(projectImportDir, exportDirectories[0]);
  const sourceIndex = path.join(sourceExportDir, 'index.html');

  if (!(await pathExists(sourceIndex))) {
    throw new Error(
      `Dashboard export for "${project.id}" is missing index.html at ${sourceIndex}.`
    );
  }

  await rm(projectPublicDir, { recursive: true, force: true });
  await cp(sourceExportDir, projectPublicDir, { recursive: true, force: true });

  console.log(
    `[dashboards] ${project.id}: synced export "${exportDirectories[0]}" to public/dashboards/${project.id}.`
  );
}
