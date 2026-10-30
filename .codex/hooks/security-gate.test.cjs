'use strict';

// Run explicitly: node .codex/hooks/security-gate.test.cjs
// Security expectations intentionally fail where the unchanged gate abstains.
// Fixtures exist only in memory. Command/SQL/patch payloads are never executed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const hookPath = path.join(__dirname, 'security-gate.cjs');
const registrationPath = path.join(__dirname, '..', 'hooks.json');
const hookSource = fs.readFileSync(hookPath, 'utf8');
const registrationSource = fs.readFileSync(registrationPath, 'utf8');
const hookScript = new vm.Script(hookSource, { filename: 'security-gate.cjs' });
const root = '/synthetic/campusedux';
const outside = '/synthetic/outside';

function event(toolName, toolInput, overrides = {}) {
  return {
    hook_event_name: 'PreToolUse',
    cwd: root,
    tool_name: toolName,
    tool_input: toolInput,
    ...overrides,
  };
}

function shell(command, overrides) {
  return event('Bash', { command }, overrides);
}

function patch(filename, content = 'export const fixture = true;') {
  return event('apply_patch', {
    command: `*** Begin Patch\n*** Add File: ${filename}\n+${content}\n*** End Patch`,
  });
}

function evaluate(input, { raw = false, syntheticEnvironment = {} } = {}) {
  const inputText = raw ? input : JSON.stringify(input);
  const existing = new Set([
    root, `${root}/website`, `${root}/website/src`, `${root}/safe`,
    `${root}/.codex`, `${root}/.codex/hooks`, outside,
    // This is path metadata only: no environment or credential contents exist.
    `${root}/.env.synthetic`,
  ]);
  const links = new Map([
    [`${root}/outside-link`, outside],
    [`${root}/inside-link`, `${root}/safe`],
    [`${root}/secret-link`, `${root}/.env.synthetic`],
  ]);
  let output = '';
  let stdinReads = 0;
  const syntheticFs = Object.freeze({
    readFileSync(fd, encoding) {
      assert.equal(fd, 0, 'Only synthetic stdin may be read');
      assert.equal(encoding, 'utf8');
      stdinReads += 1;
      return inputText;
    },
    existsSync(filename) {
      return existing.has(filename) || links.has(filename);
    },
    realpathSync(filename) {
      if (links.has(filename)) return links.get(filename);
      if (existing.has(filename)) return filename;
      throw new Error('Missing synthetic path');
    },
  });
  const sandbox = {
    __dirname: `${root}/.codex/hooks`,
    require(name) {
      if (name === 'fs') return syntheticFs;
      if (name === 'path') return path.posix;
      throw new Error('Only synthetic filesystem and path helpers are available');
    },
    process: Object.freeze({
      env: Object.freeze({ ...syntheticEnvironment }),
      stdout: Object.freeze({
        write(chunk) {
          assert.equal(typeof chunk, 'string');
          output += chunk;
        },
      }),
    }),
  };
  // No real process, filesystem-write, network, or command-launch APIs are exposed.
  hookScript.runInNewContext(sandbox, {
    timeout: 1000,
    contextCodeGeneration: { strings: false, wasm: false },
  });
  assert.equal(stdinReads, 1);
  if (output === '') return { decision: 'abstain', output };
  const result = JSON.parse(output);
  assert.equal(result.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(result.hookSpecificOutput.permissionDecision, 'deny');
  assert.equal(typeof result.hookSpecificOutput.permissionDecisionReason, 'string');
  assert.ok(result.hookSpecificOutput.permissionDecisionReason.length > 0);
  return { decision: 'deny', output };
}

function expectDecision(name, input, expected = 'deny', options) {
  test(name, () => {
    const result = evaluate(input, options);
    // Deliberately omit input payloads from assertion diagnostics.
    assert.equal(result.decision, expected, 'Hook did not satisfy this security expectation');
  });
}

for (const [name, input] of [
  ['read-only Git status', shell('git status --short')],
  ['ordinary source read', shell('cat website/src/example.ts')],
  ['ordinary source addition', patch('website/src/example.ts')],
  ['absolute source path inside fixture', patch(`${root}/website/src/example.ts`)],
  ['working directory inside fixture', shell('git status', { cwd: `${root}/website` })],
  ['internal symlink to ordinary directory', patch('inside-link/example.ts')],
  ['removed synthetic sensitive text', event('apply_patch', {
    command: '*** Begin Patch\n*** Update File: website/src/example.ts\n@@\n-password=synthetic-sensitive-marker\n+const fixture = true;\n*** End Patch',
  })],
]) expectDecision(`ALLOW: ${name}`, input, 'abstain');

for (const [name, input] of [
  ['missing event', null],
  ['wrong event type', shell('git status', { hook_event_name: 'PostToolUse' })],
  ['missing working directory', shell('git status', { cwd: undefined })],
  ['nonexistent working directory', shell('git status', { cwd: '/synthetic/missing' })],
  ['working directory outside fixture', shell('git status', { cwd: outside })],
  ['spoofed project root cannot authorize outside cwd', shell('git status', { cwd: outside, project_root: outside })],
  ['missing tool input', event('Bash', undefined)],
  ['array tool input', event('Bash', [])],
  ['null tool input', event('Bash', null)],
  ['missing command', event('Bash', {})],
  ['non-string command', event('Bash', { command: 1 })],
  ['empty command', shell('   ')],
  ['unknown tool', event('synthetic_unknown_tool', {})],
  ['MCP query tool', event('mcp__synthetic__execute_sql', { query: 'SELECT 1' })],
  ['MCP mutation tool', event('mcp__synthetic__apply_migration', { query: 'DELETE FROM fixture' })],
]) expectDecision(`DENY input: ${name}`, input);

for (const [name, raw] of [
  ['empty input', ''], ['invalid JSON', '{'], ['scalar JSON', '"fixture"'],
  ['array JSON', '[]'], ['missing event fields', '{}'],
  ['oversized input', ' '.repeat(2 * 1024 * 1024 + 1)],
]) expectDecision(`DENY raw input: ${name}`, raw, 'deny', { raw: true });

for (const [name, filename] of [
  ['parent traversal', '../outside.ts'],
  ['absolute path outside fixture', `${outside}/example.ts`],
  ['symlink escape', 'outside-link/new/example.ts'],
  ['sensitive symlink target', 'secret-link'],
  ['control character in path', 'website/src/invalid\u0000.ts'],
  ['Codex configuration', '.codex/config.toml'],
  ['root policy', 'AGENTS.md'], ['Claude policy', 'CLAUDE.md'],
  ['Git metadata', '.git/config'], ['credential-store path', '.aws/config'],
  ['environment path', '.env.synthetic'], ['private-key path', 'fixture.key'],
  ['mobile migration', 'mobile-app/supabase/migrations/9999_fixture.sql'],
  ['admin migration', 'admin-panel/supabase/migrations/9999_fixture.sql'],
  ['Edge Function', 'mobile-app/supabase/functions/fixture/index.ts'],
  ['authentication code', 'website/src/lib/auth.ts'],
  ['payment code', 'website/src/lib/payments.ts'],
  ['production hosting configuration', 'vercel.json'],
]) expectDecision(`DENY patch path: ${name}`, patch(filename));

for (const [name, command] of [
  ['delete operation', '*** Begin Patch\n*** Delete File: website/src/example.ts\n*** End Patch'],
  ['missing envelope', '*** Add File: website/src/example.ts\n+fixture'],
  ['missing end marker', '*** Begin Patch\n*** Add File: website/src/example.ts\n+fixture'],
  ['empty patch', '*** Begin Patch\n*** End Patch'],
  ['unsupported patch syntax', '*** Begin Patch\n*** Add File: website/src/example.ts\nfixture\n*** End Patch'],
  ['move into configuration', '*** Begin Patch\n*** Update File: website/src/example.ts\n*** Move to: .codex/config.toml\n@@\n-old\n+new\n*** End Patch'],
]) expectDecision(`DENY patch syntax: ${name}`, event('apply_patch', { command }));

for (const [name, content] of [
  ['drop table SQL', 'DROP TABLE fixture;'],
  ['disabled RLS SQL', 'ALTER TABLE fixture DISABLE ROW LEVEL SECURITY;'],
  ['drop policy SQL', 'DROP POLICY fixture ON fixture;'],
  ['removed forced RLS SQL', 'ALTER TABLE fixture NO FORCE ROW LEVEL SECURITY;'],
  ['synthetic credential assignment', 'password=synthetic-sensitive-marker'],
]) expectDecision(`DENY patch content: ${name}`, patch('website/src/example.ts', content));

for (const [name, command] of [
  ['Git push', 'git push'], ['force push', 'git push --force'],
  ['option-prefixed push', 'git -C . push'], ['absolute Git push', '/usr/bin/git push'],
  ['explicit approval text', 'git push # human approved'],
  ['database mutation', "psql -c 'DELETE FROM fixture'"],
  ['absolute database executable', "/usr/bin/psql -c 'DELETE FROM fixture'"],
  ['Supabase migration', 'supabase db push'],
  ['wrapped migration', 'npx supabase db push'],
  ['other migration tool', 'prisma migrate deploy'],
  ['production deployment', 'vercel --prod'],
  ['absolute deployment executable', '/usr/local/bin/vercel --prod'],
  ['Edge Function deployment', 'supabase functions deploy fixture'],
  ['production hosting deletion', 'vercel remove fixture'],
  ['production project deletion', 'supabase projects delete fixture'],
  ['Git commit', 'git commit -m fixture'],
  ['branch creation', 'git switch -c fixture'],
  ['repository deletion', 'rm -rf .'],
  ['Node wrapper', 'node -e "fixture()"'],
  ['absolute Node wrapper', '/usr/bin/node -e "fixture()"'],
  ['Python wrapper', 'python3 -c "fixture()"'],
  ['shell wrapper', 'bash -lc "printf fixture"'],
  ['environment wrapper', 'env git status'],
  ['privilege wrapper', 'sudo git status'],
  ['dependency installation', 'npm install fixture'],
  ['environment read string', 'cat .env.synthetic'],
  ['private-key read string', 'cat fixture.key'],
  ['synthetic credential command', 'printf fixture --password=synthetic-sensitive-marker'],
]) expectDecision(`DENY command: ${name}`, shell(command));

// These are security requirements, not assertions that current bypasses are safe.
// Failing tests must stay visible until a separately approved hook fix is reviewed.
for (const [name, command] of [
  ['Git staging needs approval', 'git add .'],
  ['npm clean installation needs approval', 'npm ci'],
  ['npm command execution needs approval', 'npm exec -- fixture'],
  ['npm command alias needs approval', 'npm x -- fixture'],
  ['npm global options need approval', 'npm --prefix=website ci'],
  ['npm lifecycle script needs approval', 'npm run fixture'],
  ['unresolved Git alias needs review', 'git synthetic-publish'],
  ['unresolved shell alias needs review', 'synthetic-publish'],
  ['absolute Git alias needs review', '/usr/bin/git synthetic-publish'],
  ['alternate shell wrapper needs review', 'zsh -c "printf fixture"'],
  ['absolute alternate shell needs review', '/bin/zsh -c "printf fixture"'],
  ['command wrapper needs review', 'command printf fixture'],
  ['launch wrapper needs review', 'nohup fixture'],
  ['policy write through redirection', 'printf fixture > .codex/config.toml'],
  ['policy write through tee', 'printf fixture | tee AGENTS.md'],
  ['migration write through redirection', 'printf fixture > mobile-app/supabase/migrations/9999_fixture.sql'],
  ['production configuration write through copy', 'cp fixture vercel.json'],
  ['indirect sensitive read', 'cat "$SYNTHETIC_FILE"'],
  ['split push command expansion', 'gi""t pu""sh'],
  ['production access via HTTP', 'curl https://production.campusedux.invalid'],
  ['production mutation via HTTP', 'curl -X POST https://production.campusedux.invalid/rest/v1/fixture'],
  ['production deployment option ordering', 'vercel deploy --prod'],
]) expectDecision(`SECURITY REQUIREMENT: ${name}`, shell(command));

for (const [name, content] of [
  ['database row mutation in SQL outside migrations', 'DELETE FROM fixture;'],
  ['truncate database rows outside migrations', 'TRUNCATE TABLE fixture;'],
  ['permissive policy outside migrations', 'CREATE POLICY fixture ON fixture USING (true);'],
]) expectDecision(`SECURITY REQUIREMENT: ${name}`, patch('website/fixture.sql', content));

test('DENY: synthetic environment approval cannot bypass push prohibition', () => {
  const result = evaluate(shell('git push'), {
    syntheticEnvironment: { CAMPUS_EDUX_APPROVED: 'true', SYNTHETIC_APPROVAL: 'true' },
  });
  assert.equal(result.decision, 'deny');
});

test('DENY: added synthetic sensitive text is never echoed', () => {
  const marker = 'synthetic-sensitive-marker';
  const result = evaluate(patch('website/src/example.ts', `password=${marker}`));
  assert.equal(result.decision, 'deny');
  assert.ok(!result.output.includes(marker));
});

test('REGISTRATION: supported canonical tools match without running launcher', () => {
  const config = JSON.parse(registrationSource);
  const groups = config.hooks.PreToolUse;
  for (const name of ['Bash', 'apply_patch', 'mcp__synthetic__execute_sql']) {
    assert.ok(groups.some(group => new RegExp(group.matcher).test(name)));
  }
  assert.equal(groups[0].hooks[0].type, 'command');
  assert.equal(groups[0].hooks[0].timeout, 10);
});

test('BOUNDARY: unknown local tools are outside the configured matcher', () => {
  const groups = JSON.parse(registrationSource).hooks.PreToolUse;
  assert.ok(!groups.some(group => new RegExp(group.matcher).test('synthetic_unknown_tool')));
});

test('BOUNDARY: original hook and registration remain unchanged', () => {
  assert.equal(fs.readFileSync(hookPath, 'utf8'), hookSource);
  assert.equal(fs.readFileSync(registrationPath, 'utf8'), registrationSource);
});
