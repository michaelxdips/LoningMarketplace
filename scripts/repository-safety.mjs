import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const TEXT_FILE_MAX_BYTES = 1_000_000;
const SENSITIVE_ASSIGNMENT = /\b(?:[A-Z][A-Z0-9_]*(?:PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY)|DATABASE_URL)\s*=\s*([^\s#]+)/g;
const HIGH_SIGNAL_PATTERNS = [
  ['private-key', /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/],
  ['openai-api-key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
];

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}

function isSafeExample(value) {
  return /^(?:your-|example|test-|placeholder|changeme|<|\$\{|localhost|127\.0\.0\.1|\[::1\]|minioadmin|loning_[a-z0-9_]*|.*\.test(?:[:/]|$))/i.test(value)
    || /^(?:postgres|postgresql):\/\/[^@/]+@(?:localhost|127\.0\.0\.1|\[::1\]|[^/]+\.test)(?::\d+)?\//i.test(value);
}

export function scanSecretText(file, text) {
  const findings = [];
  for (const [kind, pattern] of HIGH_SIGNAL_PATTERNS) {
    const match = text.match(pattern);
    if (match?.index !== undefined) findings.push({ file, line: lineNumber(text, match.index), kind });
  }
  for (const match of text.matchAll(SENSITIVE_ASSIGNMENT)) {
    const value = match[1];
    if (!value || isSafeExample(value)) continue;
    findings.push({ file, line: lineNumber(text, match.index ?? 0), kind: 'sensitive-assignment' });
  }
  return findings;
}

export function isForbiddenTrackedPath(path) {
  const normalized = path.replaceAll('\\', '/');
  if (/(^|\/)\.env(?:\.[^/]+)?$/i.test(normalized) && !/\.env\.example$/i.test(normalized)) return true;
  if (/(^|\/)(?:node_modules|dist|build|coverage|test-results|playwright-report|playwright\/\.auth|\.phase0-runtime)(?:\/|$)/.test(normalized)) return true;
  if (/(^|\/)audit-media-temp-[^/]+\.(?:jpe?g|png|webp)$/i.test(normalized)) return true;
  return /\.(?:dump|backup|bak|sql\.gz)$/i.test(normalized);
}

export function findHygieneViolations(paths) {
  return paths.filter(isForbiddenTrackedPath);
}

function trackedFiles() {
  const output = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' });
  return output.split('\0').filter(Boolean);
}

function scanTrackedFiles() {
  const findings = [];
  for (const path of trackedFiles()) {
    const absolute = resolve(ROOT, path);
    let content;
    try {
      const buffer = readFileSync(absolute);
      if (buffer.length > TEXT_FILE_MAX_BYTES || buffer.includes(0)) continue;
      content = buffer.toString('utf8');
    } catch {
      continue;
    }
    findings.push(...scanSecretText(path, content));
  }
  return findings;
}

function reportFindings(findings) {
  for (const finding of findings) console.error(`Repository safety violation: ${finding.kind} at ${finding.file}:${finding.line}`);
}

function main() {
  const mode = process.argv[2];
  if (mode === 'secrets') {
    const findings = scanTrackedFiles();
    reportFindings(findings);
    if (findings.length) process.exitCode = 1;
    else console.log('Secret pattern check passed for tracked text files.');
    return;
  }
  if (mode === 'hygiene') {
    const violations = findHygieneViolations(trackedFiles());
    for (const path of violations) console.error(`Repository hygiene violation: tracked artifact ${path}`);
    if (violations.length) process.exitCode = 1;
    else console.log('Repository hygiene check passed.');
    return;
  }
  console.error('Usage: node scripts/repository-safety.mjs <secrets|hygiene>');
  process.exitCode = 2;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) main();
