#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function input() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

function decision(kind, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: kind,
      permissionDecisionReason: reason,
    },
  }));
}

function command(cwd, args) {
  return spawnSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function repository(cwd) {
  const result = command(cwd, ['rev-parse', '--show-toplevel']);
  return result.status === 0 ? result.stdout.trim() : null;
}

function likelySecret(text) {
  const patterns = [
    /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/i,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bASIA[0-9A-Z]{16}\b/,
    /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
    /\b(?:sb_secret|sb_publishable)_[A-Za-z0-9_-]{16,}\b/i,
    /\b(?:supabase[_-]?(?:service[_-]?role|anon(?:ymous)?)[_-]?key)\b\s*[:=]\s*["']?eyJ[A-Za-z0-9_.-]{20,}/i,
    /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/,
    /\bwhsec_[A-Za-z0-9]{16,}\b/,
    /\b(?:xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{30,})\b/,
    /\b(?:dop_v1_[a-f0-9]{64}|glpat-[A-Za-z0-9_-]{20,})\b/i,
    /\b(?:ya29\.[A-Za-z0-9_-]{20,}|1\/\/0[A-Za-z0-9_-]{20,})\b/,
  ];
  if (patterns.some((pattern) => pattern.test(text))) return true;

  const labels = /\b(?:api[_-]?key|access[_-]?key|secret[_-]?key|auth[_-]?token|access[_-]?token|refresh[_-]?token|id[_-]?token|token|password|passwd|pwd|private[_-]?key|client[_-]?secret|webhook[_-]?secret|webhook[_-]?token|authorization|bearer|stripe[_-]?(?:secret|key)|razorpay[_-]?(?:key|secret)|paypal[_-]?(?:secret|client[_-]?secret)|supabase[_-]?(?:key|service[_-]?role)|aws[_-]?(?:secret|access)[_-]?key|azure[_-]?(?:client[_-]?secret|storage[_-]?key)|google[_-]?(?:api[_-]?key|private[_-]?key))\b/i;
  const assignment = /(?:^|[\s,{])([A-Za-z0-9_-]+)\s*[:=]\s*["']?([^\s"',;]+)/g;
  for (const match of text.matchAll(assignment)) {
    if (!labels.test(match[1])) continue;
    const value = match[2].toLowerCase();
    if (value.length >= 8 && !/^(?:x+|\*+|<[^>]+>|\$\{[^}]+\}|example|placeholder|changeme|your[_-]?|undefined|null|true|false)$/i.test(value)) return true;
  }

  const option = /(?:--?(?:api[_-]?key|access[_-]?key|token|password|passwd|secret|credential|client[_-]?secret|webhook[_-]?secret))(?:=|\s+)["']?([^\s"',;]+)/gi;
  for (const match of text.matchAll(option)) {
    const value = match[1].toLowerCase();
    if (value.length >= 8 && !/^(?:x+|\*+|<[^>]+>|\$\{[^}]+\}|example|placeholder|changeme|your[_-]?|undefined|null|true|false)$/i.test(value)) return true;
  }
  return false;
}

function dangerousSql(text) {
  return /\bdrop\s+(?:table|database|schema)\b/i.test(text) ||
    /\bdisable\s+row\s+level\s+security\b/i.test(text) ||
    /\bdrop\s+policy\b/i.test(text) ||
    /\balter\s+table\b[\s\S]*\bno\s+force\s+row\s+level\s+security\b/i.test(text);
}

function sensitivePath(value) {
  const file = String(value || '').replace(/\\/g, '/').toLowerCase();
  if (!file) return null;
  if (/(?:^|\/)\.env(?:\.|$)/.test(file) || /(?:^|\/)(?:credentials?|secrets?)(?:\.|\/|$)/.test(file)) {
    return ['deny', 'Environment and credential files cannot be read or changed by the agent. Use approved secret references instead.'];
  }
  if (/(?:^|\/)supabase\/migrations\//.test(file) || /(?:^|\/)migrations?\//.test(file)) {
    return ['ask', 'Database migrations and RLS policy changes require explicit human approval.'];
  }
  if (/(?:^|\/)(?:auth|oauth|authorization|permissions?|payments?|billing)(?:\/|\.|-|_)/.test(file) ||
      /(?:^|\/)(?:supabase\/config\.toml|vercel\.json|netlify\.toml|docker-compose(?:\.[^.]+)?\.ya?ml|\.github\/workflows\/)/.test(file)) {
    return ['ask', 'Authentication, authorization, payment, or production-configuration changes require explicit human approval.'];
  }
  return null;
}

function stagedDiff(root) {
  const result = command(root, ['diff', '--cached', '--no-ext-diff', '--unified=0']);
  return result.status === 0 ? result.stdout : null;
}

function stagedSecret(root) {
  const diff = stagedDiff(root);
  if (diff === null) return null;
  return diff.split('\n').some((line) => line.startsWith('+') && !line.startsWith('+++') && likelySecret(line.slice(1)));
}

function pushRangeSecret(root) {
  const upstream = command(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
  if (upstream.status !== 0) return null;
  const diff = command(root, ['diff', '--no-ext-diff', '--unified=0', '@{upstream}...HEAD']);
  if (diff.status !== 0) return null;
  return diff.stdout.split('\n').some((line) => line.startsWith('+') && !line.startsWith('+++') && likelySecret(line.slice(1)));
}

function stagedPaths(root) {
  const result = command(root, ['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
  return result.status === 0 ? result.stdout.split('\n').filter(Boolean) : null;
}

function runPackage(root, app, script) {
  const result = spawnSync('npm', ['run', script], {
    cwd: path.join(root, app),
    stdio: 'ignore',
    timeout: 120000,
  });
  return result.status === 0 && !result.error;
}

function verifyCommit(root) {
  const paths = stagedPaths(root);
  if (!paths) return 'Unable to inspect staged files; commit blocked.';
  const whitespace = command(root, ['diff', '--cached', '--check']);
  if (whitespace.status !== 0) return 'Staged diff has whitespace errors; commit blocked.';
  if (stagedSecret(root) === null) return 'Unable to scan the staged diff for secrets; commit blocked.';
  if (stagedSecret(root)) return 'Likely secret detected in staged changes; commit blocked. Remove it or use an approved secret reference.';

  const generated = /(?:^|\/)(?:node_modules|\.next|dist|build|coverage|\.expo|web-build)(?:\/|$)|\/supabase\/\.temp\//;
  if (paths.some((file) => generated.test(file))) return 'Staged generated or local-state files detected; commit blocked.';

  for (const app of ['mobile-app', 'admin-panel', 'website']) {
    const appFiles = paths.filter((file) => file.startsWith(`${app}/`));
    const sourceChanged = appFiles.some((file) => /\.(?:[cm]?[jt]sx?)$/.test(file) && !/(?:^|\/)(?:tests?|__tests__)(?:\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file));
    const testsChanged = appFiles.some((file) => /(?:^|\/)(?:tests?|__tests__)(?:\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file));
    if (sourceChanged && !runPackage(root, app, 'typecheck')) return `${app} typecheck failed; commit blocked.`;
    if (sourceChanged && !runPackage(root, app, 'lint')) return `${app} lint failed; commit blocked.`;
    if ((sourceChanged || testsChanged) && !runPackage(root, app, 'test')) return `${app} tests failed; commit blocked.`;
  }
  return null;
}

function commandRisk(text) {
  if (likelySecret(text)) return ['deny', 'A likely credential was detected in the command; the command was blocked without exposing its value.'];
  if (/\b(?:cat|less|more|head|tail|sed|awk|grep|rg|strings|source|\.\s+|type)\b[^;\n]*(?:^|[\s"'])[^\s"']*(?:\.env(?:\.[^\s"']*)?|(?:^|\/)credentials?(?:\.[^\s"']*)?|\bcredentials?\.[^\s"']+|(?:^|\/)secrets?(?:\.[^\s"']*)?|\bsecrets?\.[^\s"']+|(?:id_rsa|id_ed25519|\.pem|\.p12|\.pfx|\.key))(?:$|[\s"'])/i.test(text)) return ['deny', 'Reading environment or private credential files is blocked by CampusEduX safety policy.'];
    if (/\b(?:cat|less|more|head|tail|sed|awk|grep|rg|strings|source|\.\s+|type|cp|base64|xxd|openssl|jq)\b[^;\n]*(?:^|[\s"'])[^\s"']*(?:\.env(?:\.[^\s"']*)?|(?:^|\/)credentials?(?:\.[^\s"']*)?|\bcredentials?\.[^\s"']+|(?:^|\/)secrets?(?:\.[^\s"']*)?|\bsecrets?\.[^\s"']+|(?:id_rsa|id_ed25519|[^\s"']*\.pem|[^\s"']*\.p12|[^\s"']*\.pfx|[^\s"']*\.key))(?:$|[\s"'])/i.test(text)) return ['deny', 'Reading environment or private credential files is blocked by CampusEduX safety policy.'];
  if (/\bgit\s+push\b[\s\S]*(?:--force(?:-with-lease)?\b|-f\b)/i.test(text)) return ['ask', 'Force-push requires explicit human approval.'];
  if (/\b(?:rm|rmdir|unlink)\b|find\b[\s\S]*\s-delete\b|git\s+clean\b/i.test(text)) return ['ask', 'File deletion or cleanup requires explicit human approval.'];
  if (/\b(?:terraform|pulumi)\s+destroy\b|\bsupabase\s+projects?\s+delete\b|\b(?:vercel|netlify)\s+(?:remove|delete)\b|\bgh\s+repo\s+delete\b/i.test(text)) return ['deny', 'Deleting production infrastructure or a repository is blocked by CampusEduX safety policy.'];
  if (dangerousSql(text)) return ['deny', 'Destructive SQL or RLS/policy removal is blocked by CampusEduX safety policy.'];
  if (/\b(?:dropdb|psql|supabase\s+db\s+(?:reset|push)|prisma\s+migrate\s+reset)\b[\s\S]*\b(?:prod|production|live)\b/i.test(text) && /\b(?:drop\s+(?:table|database|schema)|truncate(?:\s+table)?|delete\s+from)\b/i.test(text)) return ['deny', 'Production database destruction is blocked by CampusEduX safety policy.'];
  if (/\b(?:psql\b[^;\n]*(?:\s(?:-f|--file)(?:=|\s+)|\s<\s*)[^;\n]+|supabase\s+(?:db\s+push|migration\s+(?:up|repair|squash))|(?:prisma\s+migrate\s+deploy|knex\s+migrate:(?:latest|up)|sequelize\s+db:migrate|flyway\s+migrate|liquibase\s+update|alembic\s+upgrade|django-admin\s+migrate|python\s+manage\.py\s+migrate|rails\s+db:migrate|drizzle-kit\s+migrate|typeorm\s+migration:run)\b)/i.test(text)) return ['ask', 'Database migration execution requires explicit human approval.'];
  if (/\b(?:vercel\s+--prod|netlify\s+deploy[\s\S]*--prod|supabase\s+(?:functions\s+deploy|db\s+push)|(?:deploy|release)[\s\S]*\b(?:prod|production)\b)/i.test(text)) return ['ask', 'Production deployment requires explicit human approval.'];
  if (/\b(?:rotate|rotation)\b[\s\S]*\b(?:credential|secret|token|api[_-]?key|key)\b/i.test(text)) return ['ask', 'Credential rotation requires explicit human approval.'];
  if (/\b(?:stripe|razorpay|paypal|payment)[\s\S]*\b(?:credentials?|secrets?|api[_-]?keys?|keys?)\b/i.test(text)) return ['ask', 'Payment credential changes require explicit human approval.'];
  if (/\bgit\s+(?:commit|push)\b/i.test(text)) return ['ask', 'Git commits and pushes require explicit human approval.'];
  if (/\bgit\s+(?:checkout\s+-b|switch\s+-c|branch(?:\s+(?!-[dD])))\b/i.test(text)) return ['ask', 'Creating a branch requires explicit human approval.'];
  return null;
}

const event = input();
const tool = event.tool_name;
const toolInput = event.tool_input || {};
const payload = tool === 'Bash' || tool === 'PowerShell' ? String(toolInput.command || '') : `${toolInput.content || ''}\n${toolInput.new_string || ''}`;
const pathRisk = sensitivePath(toolInput.file_path || toolInput.path);

if (tool === 'Read' && pathRisk) {
  decision(pathRisk[0], pathRisk[1]);
} else if ((tool === 'Edit' || tool === 'Write') && likelySecret(payload)) {
  decision('deny', 'Likely secret detected; the file change was blocked without exposing its value.');
} else if (tool === 'Edit' || tool === 'Write') {
  const risk = pathRisk || commandRisk(payload) ||
    (/(?:\b(?:create|alter|drop)\s+policy\b|\b(?:enable|disable)\s+row\s+level\s+security\b)/i.test(payload)
      ? ['ask', 'RLS policy changes require explicit human approval.']
      : null);
  if (risk) decision(risk[0], risk[1]);
} else if (tool === 'Bash' || tool === 'PowerShell') {
  const risk = commandRisk(payload);
  if (risk) {
    decision(risk[0], risk[1]);
  } else if (/\bgit\s+commit\b/i.test(payload)) {
    const root = repository(event.cwd || process.cwd());
    const failure = root ? verifyCommit(root) : 'Unable to find the repository root; commit blocked.';
    if (failure) decision('deny', failure);
  } else if (/\bgit\s+push\b/i.test(payload)) {
    const root = repository(event.cwd || process.cwd());
    const staged = root && stagedSecret(root);
    const pushed = root && pushRangeSecret(root);
    if (!root || staged === null || pushed === null || staged || pushed) decision('deny', 'Likely secret detected or changes could not be scanned; push blocked.');
  }
}
