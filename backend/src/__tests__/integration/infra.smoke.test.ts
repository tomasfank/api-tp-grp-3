import fs from 'fs';
import path from 'path';

// ── Infrastructure smoke tests ──────────────────────────────────────────────
//
// These are static, file-system assertions (no DB, no HTTP). They guard the
// presence and basic shape of the infrastructure artifacts so that a missing
// or malformed Dockerfile / compose file / CI workflow / seed script is caught
// by the test suite rather than at deploy time.
//
// Requirements: 1.1 (Dockerfile), 1.2 (docker-compose), 1.3 & 1.5 (CI workflow
// triggered on pull_request), 12.5 (seed script exposed via npm).

// Resolve the repo root from this file's location: src/__tests__/integration → ../../..
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

const readIfExists = (relPath: string): string | null => {
  const abs = path.join(REPO_ROOT, relPath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf-8') : null;
};

// ── Dockerfile (Requirement 1.1) ────────────────────────────────────────────

describe('infra — Dockerfile', () => {
  it('existe en la raíz del repositorio', () => {
    const dockerfile = path.join(REPO_ROOT, 'Dockerfile');
    expect(fs.existsSync(dockerfile)).toBe(true);
  });

  it('tiene contenido no vacío y define una imagen base con FROM', () => {
    const content = readIfExists('Dockerfile');
    expect(content).not.toBeNull();
    expect(content!.trim().length).toBeGreaterThan(0);
    expect(content!).toMatch(/^\s*FROM\s+/m);
  });
});

// ── docker-compose (Requirement 1.2) ────────────────────────────────────────

describe('infra — docker-compose', () => {
  it('existe en la raíz del repositorio', () => {
    const compose = path.join(REPO_ROOT, 'docker-compose.yaml');
    expect(fs.existsSync(compose)).toBe(true);
  });

  it('define los servicios api y mongo', () => {
    const content = readIfExists('docker-compose.yaml');
    expect(content).not.toBeNull();

    // Service keys are declared under `services:` as indented, colon-terminated
    // entries. Match them at the start of a line to avoid false positives from
    // comments or values.
    expect(content!).toMatch(/^\s*services\s*:/m);
    expect(content!).toMatch(/^\s{2,}api\s*:/m);
    expect(content!).toMatch(/^\s{2,}mongo\s*:/m);
  });
});

// ── GitHub Actions workflow (Requirements 1.3, 1.5) ─────────────────────────

describe('infra — GitHub Actions workflow', () => {
  const WORKFLOWS_DIR = '.github/workflows';

  const listWorkflowFiles = (): string[] => {
    const abs = path.join(REPO_ROOT, WORKFLOWS_DIR);
    if (!fs.existsSync(abs)) return [];
    return fs
      .readdirSync(abs)
      .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
  };

  it('existe al menos un workflow en .github/workflows/', () => {
    const files = listWorkflowFiles();
    expect(files.length).toBeGreaterThanOrEqual(1);
  });

  it('al menos un workflow declara el trigger pull_request', () => {
    const files = listWorkflowFiles();
    expect(files.length).toBeGreaterThanOrEqual(1);

    const hasPullRequestTrigger = files.some((file) => {
      const content = readIfExists(path.join(WORKFLOWS_DIR, file));
      return content !== null && /^\s*pull_request\s*:?/m.test(content);
    });

    expect(hasPullRequestTrigger).toBe(true);
  });
});

// ── npm seed script (Requirement 12.5) ──────────────────────────────────────

describe('infra — script seed en package.json', () => {
  it('package.json existe y define el script "seed"', () => {
    const content = readIfExists('package.json');
    expect(content).not.toBeNull();

    const pkg = JSON.parse(content!) as {
      scripts?: Record<string, string>;
    };

    expect(pkg.scripts).toBeDefined();
    expect(typeof pkg.scripts!.seed).toBe('string');
    expect(pkg.scripts!.seed.trim().length).toBeGreaterThan(0);
  });
});
