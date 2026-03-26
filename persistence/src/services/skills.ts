import { db } from '../db/connection.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ProjectSkill {
  id: string;
  project: string;
  skill_name: string;
  skill_version?: string;
  skill_type?: string;
  detected_from: string;
  file_path?: string;
  confidence: number;
  detected_at: string;
  updated_at: string;
}

export interface SkillInput {
  project: string;
  skill_name: string;
  skill_version?: string;
  skill_type?: string;
  detected_from: string;
  file_path?: string;
  confidence?: number;
}

import { randomUUID } from 'crypto';

function generateId(): string {
  return randomUUID();
}

// =====================================================
// SKILLS SERVICE
// =====================================================

/**
 * Detect and save a skill
 */
export function detectSkill(input: SkillInput): ProjectSkill {
  const id = generateId();
  const now = new Date().toISOString();
  
  // Check if already exists
  const existing = db.prepare(`
    SELECT * FROM project_skills 
    WHERE project = ? AND skill_name = ? AND detected_from = ?
  `).get(input.project, input.skill_name, input.detected_from) as ProjectSkill | undefined;
  
  if (existing) {
    // Update existing
    const stmt = db.prepare(`
      UPDATE project_skills SET
        skill_version = ?,
        skill_type = ?,
        file_path = ?,
        confidence = ?,
        updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      input.skill_version || existing.skill_version,
      input.skill_type || existing.skill_type,
      input.file_path || existing.file_path,
      input.confidence || existing.confidence,
      now,
      existing.id
    );
    return getSkillById(existing.id)!;
  }
  
  const stmt = db.prepare(`
    INSERT INTO project_skills (
      id, project, skill_name, skill_version, skill_type, detected_from, file_path, confidence, detected_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    input.project,
    input.skill_name,
    input.skill_version || null,
    input.skill_type || null,
    input.detected_from,
    input.file_path || null,
    input.confidence || 1.0,
    now,
    now
  );
  
  return getSkillById(id)!;
}

/**
 * Get skill by ID
 */
export function getSkillById(id: string): ProjectSkill | undefined {
  const stmt = db.prepare('SELECT * FROM project_skills WHERE id = ?');
  return stmt.get(id) as ProjectSkill | undefined;
}

/**
 * Get all skills for a project
 */
export function getProjectSkills(project: string): ProjectSkill[] {
  const stmt = db.prepare('SELECT * FROM project_skills WHERE project = ? ORDER BY skill_name');
  return stmt.all(project) as ProjectSkill[];
}

/**
 * Get skills by type
 */
export function getSkillsByType(project: string, type: string): ProjectSkill[] {
  const stmt = db.prepare('SELECT * FROM project_skills WHERE project = ? AND skill_type = ?');
  return stmt.all(project, type) as ProjectSkill[];
}

/**
 * Search skills
 */
export function searchSkills(project: string, query: string): ProjectSkill[] {
  const stmt = db.prepare(`
    SELECT * FROM project_skills 
    WHERE project = ? AND (skill_name LIKE ? OR skill_type LIKE ?)
  `);
  const pattern = `%${query}%`;
  return stmt.all(project, pattern, pattern) as ProjectSkill[];
}

/**
 * Delete a skill
 */
export function deleteSkill(id: string): boolean {
  const stmt = db.prepare('DELETE FROM project_skills WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Get skill statistics for a project
 */
export function getSkillStats(project: string): {
  total: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
} {
  const stmt = db.prepare('SELECT * FROM project_skills WHERE project = ?');
  const skills = stmt.all(project) as ProjectSkill[];
  
  const byType: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  
  for (const skill of skills) {
    const type = skill.skill_type || 'unknown';
    const source = skill.detected_from || 'unknown';
    byType[type] = (byType[type] || 0) + 1;
    bySource[source] = (bySource[source] || 0) + 1;
  }
  
  return {
    total: skills.length,
    byType,
    bySource
  };
}

// =====================================================
// AUTO-DETECTION HELPERS
// =====================================================

/**
 * Detect skills from package.json
 */
export function detectFromPackageJson(projectPath: string, projectName: string): ProjectSkill[] {
  const pkgPath = join(projectPath, 'package.json');
  const detected: ProjectSkill[] = [];
  
  if (existsSync(pkgPath)) {
    try {
      const content = readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);
      
      // Detect language runtime
      if (pkg.engines?.node) {
        detected.push(detectSkill({
          project: projectName,
          skill_name: 'node',
          skill_version: pkg.engines.node,
          skill_type: 'runtime',
          detected_from: 'package.json.engines',
          file_path: pkgPath
        }));
      }
      
      // Detect dependencies as frameworks/libraries
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const [name, version] of Object.entries(deps)) {
        const type = inferSkillType(name);
        if (type) {
          detected.push(detectSkill({
            project: projectName,
            skill_name: name,
            skill_version: version as string,
            skill_type: type,
            detected_from: 'package.json',
            file_path: pkgPath
          }));
        }
      }
    } catch (e) {
      console.error('Error parsing package.json:', e);
    }
  }
  
  return detected;
}

/**
 * Detect skills from composer.json (PHP)
 */
export function detectFromComposerJson(projectPath: string, projectName: string): ProjectSkill[] {
  const composerPath = join(projectPath, 'composer.json');
  const detected: ProjectSkill[] = [];
  
  if (existsSync(composerPath)) {
    try {
      const content = readFileSync(composerPath, 'utf-8');
      const composer = JSON.parse(content);
      
      // Detect PHP version
      if (composer.require?.php) {
        detected.push(detectSkill({
          project: projectName,
          skill_name: 'php',
          skill_version: composer.require.php,
          skill_type: 'runtime',
          detected_from: 'composer.json.require.php',
          file_path: composerPath
        }));
      }
      
      // Detect dependencies
      const deps = { ...composer.require, ...composer['require-dev'] };
      for (const [name, version] of Object.entries(deps)) {
        if (name === 'php') continue;
        const type = inferSkillType(name);
        if (type) {
          detected.push(detectSkill({
            project: projectName,
            skill_name: name,
            skill_version: version as string,
            skill_type: type,
            detected_from: 'composer.json',
            file_path: composerPath
          }));
        }
      }
    } catch (e) {
      console.error('Error parsing composer.json:', e);
    }
  }
  
  return detected;
}

/**
 * Detect skills from pyproject.toml or requirements.txt (Python)
 */
export function detectFromPython(projectPath: string, projectName: string): ProjectSkill[] {
  const detected: ProjectSkill[] = [];
  
  // Check pyproject.toml
  const pyprojectPath = join(projectPath, 'pyproject.toml');
  if (existsSync(pyprojectPath)) {
    try {
      const content = readFileSync(pyprojectPath, 'utf-8');
      // Simple parsing - just detect python and main deps
      if (content.includes('python')) {
        const pythonMatch = content.match(/python\s*=\s*["']?([^"'"\s]+)["']?/);
        detected.push(detectSkill({
          project: projectName,
          skill_name: 'python',
          skill_version: pythonMatch?.[1] || '3.x',
          skill_type: 'runtime',
          detected_from: 'pyproject.toml',
          file_path: pyprojectPath
        }));
      }
    } catch (e) {
      console.error('Error parsing pyproject.toml:', e);
    }
  }
  
  return detected;
}

/**
 * Infer skill type from name
 */
function inferSkillType(name: string): string | null {
  const frameworks = ['react', 'vue', 'angular', 'next', 'nuxt', 'svelte', 'express', 'fastify', 'nest', 'laravel', 'symfony', 'django', 'flask', 'fastapi', 'spring'];
  const languages = ['typescript', 'javascript', 'python', 'php', 'go', 'rust', 'java', 'ruby', 'swift', 'kotlin'];
  const libraries = ['lodash', 'axios', 'puppeteer', 'playwright', 'vitest', 'jest', 'mocha', 'chai', 'tailwind', 'sass', 'less'];
  const tools = ['eslint', 'prettier', 'webpack', 'vite', 'rollup', 'tsc', 'babel', 'nodemon', 'pm2', 'docker', 'k8s', 'terraform'];
  
  const lower = name.toLowerCase();
  
  if (frameworks.some(f => lower.includes(f))) return 'framework';
  if (languages.some(l => lower === l || lower.startsWith(l + '-'))) return 'language';
  if (tools.some(t => lower.includes(t))) return 'tool';
  if (libraries.some(l => lower.includes(l))) return 'library';
  
  return 'library'; // Default
}

/**
 * Auto-detect all skills in a project
 */
export function autoDetectSkills(projectPath: string, projectName: string): ProjectSkill[] {
  const allDetected: ProjectSkill[] = [];
  
  allDetected.push(...detectFromPackageJson(projectPath, projectName));
  allDetected.push(...detectFromComposerJson(projectPath, projectName));
  allDetected.push(...detectFromPython(projectPath, projectName));
  
  return allDetected;
}

export default {
  detectSkill,
  getSkillById,
  getProjectSkills,
  getSkillsByType,
  searchSkills,
  deleteSkill,
  getSkillStats,
  detectFromPackageJson,
  detectFromComposerJson,
  detectFromPython,
  autoDetectSkills
};