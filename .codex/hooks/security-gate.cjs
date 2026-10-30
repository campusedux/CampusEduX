#!/usr/bin/env node
'use strict';

// Disabled by .codex/config.toml. Do not execute, trust, or enable before review.
// This gate only blocks; it never grants approval or runs package/Git commands.
// Explicit approval must be handled outside this hook. There is no text/token bypass.
// Hooks and command regexes do not replace the host's sandbox/secret-read controls.
const fs = require('fs');
const path = require('path');

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
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
    /\balter\s+table\b[\s\S]*\bno\s+force\s+row\s+level\s+security\b/i.test(text) ||
    /\b(?:insert\s+into|update\s+\S+\s+set|delete\s+from|truncate|merge\s+into|(?:create|alter)\s+policy|grant|revoke)\b/i.test(text);
}

function sensitivePath(value) {
  const file = String(value || '').replace(/\\/g, '/').toLowerCase();
  if (!file) return null;
  if (/(?:^|\/)\.env(?:\.|$)/.test(file) || /(?:^|\/)(?:credentials?|secrets?)(?:\.|\/|$)/.test(file)) {
    return ['deny', 'Environment and credential files cannot be read or changed by the agent. Use approved secret references instead.'];
  }
  if (/(?:^|\/)supabase\/(?:migrations|functions)\//.test(file) || /(?:^|\/)migrations?\//.test(file)) {
    return ['deny', 'Database migrations, RLS, and Edge Function changes require explicit human approval.'];
  }
  if (/(?:^|\/)(?:auth|oauth|authorization|permissions?|payments?|billing)(?:\/|\.|-|_)/.test(file) ||
      /(?:^|\/)(?:supabase\/config\.toml|vercel\.json|netlify\.toml|docker-compose(?:\.[^.]+)?\.ya?ml|\.github\/workflows\/)/.test(file)) {
    return ['deny', 'Authentication, authorization, payment, or production-configuration changes require explicit human approval.'];
  }
  return null;
}

function commandRisk(text) {
  if (likelySecret(text)) return ['deny', 'A likely credential was detected in the command; the command was blocked without exposing its value.'];
  if (/\b(?:cat|less|more|head|tail|sed|awk|grep|rg|strings|source|\.\s+|type)\b[^;\n]*(?:^|[\s"'])[^\s"']*(?:\.env(?:\.[^\s"']*)?|(?:^|\/)credentials?(?:\.[^\s"']*)?|\bcredentials?\.[^\s"']+|(?:^|\/)secrets?(?:\.[^\s"']*)?|\bsecrets?\.[^\s"']+|(?:id_rsa|id_ed25519|\.pem|\.p12|\.pfx|\.key))(?:$|[\s"'])/i.test(text)) return ['deny', 'Reading environment or private credential files is blocked by CampusEduX safety policy.'];
  if (/\b(?:cat|less|more|head|tail|sed|awk|grep|rg|strings|source|\.\s+|type|cp|base64|xxd|openssl|jq)\b[^;\n]*(?:^|[\s"'])[^\s"']*(?:\.env(?:\.[^\s"']*)?|(?:^|\/)credentials?(?:\.[^\s"']*)?|\bcredentials?\.[^\s"']+|(?:^|\/)secrets?(?:\.[^\s"']*)?|\bsecrets?\.[^\s"']+|(?:id_rsa|id_ed25519|[^\s"']*\.pem|[^\s"']*\.p12|[^\s"']*\.pfx|[^\s"']*\.key))(?:$|[\s"'])/i.test(text)) return ['deny', 'Reading environment or private credential files is blocked by CampusEduX safety policy.'];
  if (/\bgit\b[\s\S]*\bpush\b/i.test(text)) return ['deny', 'CampusEduX never pushes. Commit approval does not authorize a push.'];
  if (/\b(?:rm|rmdir|unlink)\b|find\b[\s\S]*\s-delete\b|git\s+clean\b/i.test(text)) return ['deny', 'File deletion or cleanup requires explicit human approval.'];
  if (/\b(?:terraform|pulumi)\s+destroy\b|\bsupabase\s+projects?\s+delete\b|\b(?:vercel|netlify)\s+(?:remove|delete)\b|\bgh\s+repo\s+delete\b/i.test(text)) return ['deny', 'Deleting production infrastructure or a repository is blocked by CampusEduX safety policy.'];
  if (dangerousSql(text)) return ['deny', 'Destructive SQL or RLS/policy removal is blocked by CampusEduX safety policy.'];
  if (/\b(?:dropdb|psql|supabase\s+db\s+(?:reset|push)|prisma\s+migrate\s+reset)\b[\s\S]*\b(?:prod|production|live)\b/i.test(text) && /\b(?:drop\s+(?:table|database|schema)|truncate(?:\s+table)?|delete\s+from)\b/i.test(text)) return ['deny', 'Production database destruction is blocked by CampusEduX safety policy.'];
  if (/\b(?:psql\b[^;\n]*(?:\s(?:-f|--file)(?:=|\s+)|\s<\s*)[^;\n]+|supabase\s+(?:db\s+push|migration\s+(?:up|repair|squash))|(?:prisma\s+migrate\s+deploy|knex\s+migrate:(?:latest|up)|sequelize\s+db:migrate|flyway\s+migrate|liquibase\s+update|alembic\s+upgrade|django-admin\s+migrate|python\s+manage\.py\s+migrate|rails\s+db:migrate|drizzle-kit\s+migrate|typeorm\s+migration:run)\b)/i.test(text)) return ['deny', 'Database migration execution requires explicit human approval.'];
  if (/\b(?:vercel\s+--prod|netlify\s+deploy[\s\S]*--prod|supabase\s+(?:functions\s+deploy|db\s+push)|(?:deploy|release)[\s\S]*\b(?:prod|production)\b)/i.test(text)) return ['deny', 'Production deployment requires explicit human approval.'];
  if (/\b(?:rotate|rotation)\b[\s\S]*\b(?:credential|secret|token|api[_-]?key|key)\b/i.test(text)) return ['deny', 'Credential rotation requires explicit human approval.'];
  if (/\b(?:stripe|razorpay|paypal|payment)[\s\S]*\b(?:credentials?|secrets?|api[_-]?keys?|keys?)\b/i.test(text)) return ['deny', 'Payment credential changes require explicit human approval.'];
  if (/\bgit\s+(?:commit|push)\b/i.test(text)) return ['deny', 'Git commits and pushes require explicit human approval.'];
  if (/\bgit\s+(?:checkout\s+-b|switch\s+-c|branch(?:\s+(?!-[dD])))\b/i.test(text)) return ['deny', 'Creating a branch requires explicit human approval.'];
  return null;
}


function projectContext(event) {
  // Resolve from this installed script, not untrusted event/env project variables.
  const root = fs.realpathSync(path.resolve(__dirname, '..', '..'));
  const cwd = fs.realpathSync(event.cwd);
  const relative = path.relative(root, cwd);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    throw new Error('outside repository');
  }
  return { root, cwd };
}

function contained(root, target) {
  const relative = path.relative(root, target);
  return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}

function checkedPath(context, filename) {
  if (typeof filename !== 'string' || !filename.trim() || /[\x00-\x1f]/.test(filename)) {
    throw new Error('invalid path');
  }
  const target = path.resolve(context.cwd, filename);
  if (!contained(context.root, target)) throw new Error('path escapes repository');
  // Resolve the closest existing ancestor so new files cannot escape via symlinks.
  let ancestor = target;
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) throw new Error('missing ancestor');
    ancestor = parent;
  }
  const realAncestor = fs.realpathSync(ancestor);
  if (!contained(context.root, realAncestor)) throw new Error('symlink escapes repository');
  const realTarget = path.resolve(realAncestor, path.relative(ancestor, target));
  // Check both names: an in-repository symlink must not hide a sensitive target.
  for (const candidate of [target, realTarget]) {
    const policyPath = path.relative(context.root, candidate).replace(/\\/g, '/');
    const protectedPath = /(?:^|\/)(?:\.git|\.aws|\.ssh|\.codex|\.claude|\.agents)(?:\/|$)/.test(policyPath) ||
      /(?:^|\/)(?:AGENTS(?:\.override)?\.md|CLAUDE\.md|\.mcp\.json)$/.test(policyPath);
    if (protectedPath) return ['deny', 'Configuration, credentials, and Git metadata require separate human review.'];
    if (/\.(?:pem|p12|pfx|key|jks|keystore)$|(?:^|\/)(?:\.pgpass|\.netrc|\.git-credentials)$/.test(policyPath)) {
      return ['deny', 'Credential and private-key files are blocked.'];
    }
    const risk = sensitivePath(policyPath);
    if (risk) return risk;
  }
  return null;
}

function parsePatch(command) {
  if (typeof command !== 'string') throw new Error('missing patch');
  const lines = command.replace(/\r\n/g, '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  if (lines[0] !== '*** Begin Patch' || lines.at(-1) !== '*** End Patch') {
    throw new Error('invalid patch envelope');
  }
  const paths = [];
  const additions = [];
  let operation = null;
  let moved = false;
  for (const line of lines.slice(1, -1)) {
    const header = /^\*\*\* (Add|Update|Delete) File: (.+)$/.exec(line);
    if (header) {
      operation = header[1];
      moved = false;
      if (operation === 'Delete') throw new Error('file deletion requires human review');
      paths.push(header[2]);
      continue;
    }
    const move = /^\*\*\* Move to: (.+)$/.exec(line);
    if (move) {
      if (operation !== 'Update' || moved) throw new Error('invalid move');
      paths.push(move[1]);
      moved = true;
      continue;
    }
    if (!operation) throw new Error('content before file');
    if (line.startsWith('+')) additions.push(line.slice(1));
    else if (operation !== 'Add' &&
      (line.startsWith('-') || line.startsWith(' ') || line === '' ||
       line.startsWith('@@') || line === '*** End of File')) {
      // Removed/context text does not become newly written secret-bearing content.
    } else {
      throw new Error('unsupported patch syntax');
    }
  }
  if (!paths.length) throw new Error('empty patch');
  return { paths, additions: additions.join('\n') };
}

function simpleReadRisk(context, command) {
  // This is deliberately a small grammar, not a shell parser. Reject quoting,
  // expansion, redirection, operators, comments, and executable path aliases.
  // Never resolve aliases, inspect Git config, launch commands, or read content.
  if (!/^[A-Za-z0-9_./= \t-]+$/.test(command)) {
    return ['deny', 'Shell syntax or expansion outside the reviewed read-only subset requires separate human review.'];
  }
  const words = command.trim().split(/[ \t]+/);
  if (words[0] === 'git' && words[1] === 'status') {
    const statusOptions = new Set([
      '--short', '-s', '--branch', '-b', '--porcelain',
      '--porcelain=v1', '--porcelain=v2', '--untracked-files=no',
      '--untracked-files=normal', '--untracked-files=all',
    ]);
    if (words.slice(2).every((word) => statusOptions.has(word))) return null;
    return ['deny', 'Unreviewed Git status arguments require separate human review.'];
  }
  if (words[0] === 'cat' && words.length > 1) {
    // Only explicit source paths: no stdin, options, directories, or arbitrary
    // files such as scripts/configuration that may carry sensitive material.
    for (const filename of words.slice(1)) {
      if (filename.startsWith('-') || !/\.(?:[cm]?[jt]sx?|css|scss)$/.test(filename)) {
        return ['deny', 'Only explicit repository source-file reads are reviewed.'];
      }
      try {
        const risk = checkedPath(context, filename);
        if (risk) return risk;
      } catch {
        return ['deny', 'Unable to verify the source-file path; read blocked for review.'];
      }
    }
    return null;
  }
  // Unknown programs/subcommands include unresolved aliases, package runners,
  // write utilities, alternate shells, launch wrappers, and HTTP clients.
  // Deny all HTTP clients rather than trying to infer production from a URL.
  return ['deny', 'Command outside the reviewed read-only subset requires separate human review.'];
}

function shellRisk(command, context) {
  // Never Push also covers option-prefixed git invocations.
  if (/\bgit\b[\s\S]*\bpush\b/i.test(command)) {
    return ['deny', 'CampusEduX never pushes.'];
  }
  // Reject execution of arbitrary code/wrappers and indirect Git options for review.
  if (/(?:^|[\s;&|])(?:\S*\/)?(?:node|python3?|bash|sh|eval|env|xargs|sudo|powershell|pwsh)(?:\s|$)/i.test(command) ||
      /\bgit\s+-/i.test(command)) {
    return ['deny', 'Interpreter, wrapper, or option-prefixed Git commands require separate human review.'];
  }
  if (/(?:^|[\s;&|])(?:\S*\/)?(?:psql|pg_dump|pg_restore|createdb|dropdb|supabase|vercel|netlify|eas|gh)(?:\s|$)/i.test(command) ||
      /\bnpx\s+(?:supabase|vercel|netlify|eas)\b/i.test(command)) {
    return ['deny', 'Database, hosting, or privileged service commands require separate human review.'];
  }
  if (/\b(?:npm|pnpm|yarn|pip3?|apt(?:-get)?)\s+(?:install|i|add|uninstall|remove|purge|publish)\b/i.test(command)) {
    return ['deny', 'Package installation, removal, and publication require explicit approval.'];
  }
  if (/\bgit\s+(?:merge|rebase|reset|clean|restore|rm|tag|cherry-pick|revert|stash|checkout|switch|branch|remote|config)\b/i.test(command)) {
    return ['deny', 'Git mutations require separate human approval; existing work must be preserved.'];
  }
  if (/(?:^|[\s/])(?:\.env(?:\.[^\s/]*)?|credentials?(?:\.[^\s/]*)?|secrets?(?:\.[^\s/]*)?|\.ssh|\.aws|\.pgpass|\.netrc|\.git-credentials)(?:$|[\s/])|\.(?:pem|p12|pfx|key|jks|keystore)\b/i.test(command)) {
    return ['deny', 'Access to credential and environment files is blocked.'];
  }
  // The original detection patterns remain below; every approval-needed result blocks.
  return commandRisk(command) || simpleReadRisk(context, command);
}

function evaluate(event) {
  if (!event || event.hook_event_name !== 'PreToolUse' ||
      typeof event.cwd !== 'string' || !event.tool_input ||
      typeof event.tool_input !== 'object' || Array.isArray(event.tool_input)) {
    return ['deny', 'Invalid hook input; operation blocked for review.'];
  }
  let context;
  try {
    context = projectContext(event);
  } catch {
    return ['deny', 'Unable to verify the repository root and working directory.'];
  }
  if (event.tool_name === 'Bash') {
    if (typeof event.tool_input.command !== 'string' || !event.tool_input.command.trim()) {
      return ['deny', 'Missing shell command; operation blocked for review.'];
    }
    return shellRisk(event.tool_input.command, context);
  }
  if (event.tool_name === 'apply_patch') {
    try {
      const patch = parsePatch(event.tool_input.command);
      for (const filename of patch.paths) {
        const risk = checkedPath(context, filename);
        if (risk) return risk;
      }
      if (likelySecret(patch.additions)) return ['deny', 'Likely secret in added patch content; operation blocked.'];
      if (dangerousSql(patch.additions)) return ['deny', 'Destructive SQL or RLS weakening is blocked.'];
      return null;
    } catch {
      return ['deny', 'Unsupported, deleting, or unsafe patch; obtain separate human review.'];
    }
  }
  // MCP is disabled in project config. Enabling it must include separate tool-policy review.
  return ['deny', 'This gate has no reviewed policy for this tool; operation blocked.'];
}

function main() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    if (raw.length > 2 * 1024 * 1024) {
      deny('Hook input exceeds the reviewed size limit.');
      return;
    }
    const risk = evaluate(JSON.parse(raw));
    if (risk) deny(risk[1]);
  } catch {
    deny('Unable to validate hook input; operation blocked for review.');
  }
}

main();
