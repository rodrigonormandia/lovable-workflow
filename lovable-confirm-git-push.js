// PreToolUse global (Bash|PowerShell): em PROJETO DO LOVABLE, todo `git push` pede
// confirmação do usuário na hora — mesmo com "Bash(git push:*)" liberado. Exceção: modo
// bypass (permission_mode = bypassPermissions), em que o usuário delega a decisão. Motivo: cada commit que chega na main gera um build cobrado no Lovable; a
// sessão é uma entrega e sobe uma vez, quando o usuário pedir (skill lovable-workflow).
//
// Projeto do Lovable = tem .claude/lovable-project.json (vínculo gravado pela skill) ou
// um CLAUDE.md com a seção "Projeto no Lovable". Procura na pasta da sessão, na pasta do
// comando (inclusive `cd <dir>` / `git -C <dir>` dentro dele) e no repositório principal
// de uma worktree. Fora disso, não responde nada e o fluxo segue normal.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const PUSH_RE = /\bgit\b(?:\s+-C\s+("[^"]+"|'[^']+'|\S+))?(?:\s+-c\s+\S+)*\s+push\b/;

function stripQuotes(s) {
  return s.replace(/^["']|["']$/g, "");
}

function toNative(p) {
  // Git Bash: /e/Projetos/x -> E:/Projetos/x
  const m = /^\/([a-zA-Z])\/(.*)$/.exec(p);
  return m ? `${m[1].toUpperCase()}:/${m[2]}` : p;
}

// Projeto em que o usuario deu autonomia de push: "push_autonomy": true no
// .claude/lovable-project.json. Ali o push nao pede confirmacao (a regra de um
// commit por entrega continua valendo, quem a cumpre e o agente).
function hasPushAutonomy(dir) {
  let d = path.resolve(dir);
  for (let i = 0; i < 30; i++) {
    const f = path.join(d, ".claude", "lovable-project.json");
    if (fs.existsSync(f)) {
      try { return JSON.parse(fs.readFileSync(f, "utf8")).push_autonomy === true; } catch { return false; }
    }
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return false;
}

function isLovableDir(dir) {
  let d = path.resolve(dir);
  for (let i = 0; i < 30; i++) {
    if (fs.existsSync(path.join(d, ".claude", "lovable-project.json"))) return true;
    const md = path.join(d, "CLAUDE.md");
    if (fs.existsSync(md)) {
      try {
        if (/^#{2,3} Projeto no Lovable\b/m.test(fs.readFileSync(md, "utf8"))) return true;
      } catch { /* ignora */ }
    }
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return false;
}

function mainRepoOf(dir) {
  try {
    const common = execFileSync("git", ["-C", dir, "rev-parse", "--path-format=absolute", "--git-common-dir"], {
      encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 3000,
    }).trim();
    return common ? path.dirname(common) : null;
  } catch {
    return null;
  }
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try { input = JSON.parse(raw); } catch { return; }
  // Modo bypass: o usuário delegou as decisões ao agente (pedido dele em
  // 2026-10-08). A regra de um commit por entrega continua com o agente.
  if (input?.permission_mode === "bypassPermissions") return;
  const command = String(input?.tool_input?.command ?? "");
  const push = PUSH_RE.exec(command);
  if (!push) return;

  const base = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const dirs = new Set([base]);
  if (process.env.CLAUDE_PROJECT_DIR) dirs.add(process.env.CLAUDE_PROJECT_DIR);
  if (push[1]) dirs.add(path.resolve(base, toNative(stripQuotes(push[1]))));
  for (const m of command.matchAll(/(?:^|[;&|]\s*)(?:cd|Set-Location)\s+("[^"]+"|'[^']+'|[^\s;&|]+)/g)) {
    dirs.add(path.resolve(base, toNative(stripQuotes(m[1]))));
  }
  for (const d of [...dirs]) {
    const main = mainRepoOf(d);
    if (main) dirs.add(main);
  }

  if (![...dirs].some((d) => fs.existsSync(d) && isLovableDir(d))) return;
  const lovable = [...dirs].filter((d) => fs.existsSync(d) && isLovableDir(d));
  if (lovable.every((d) => hasPushAutonomy(d))) return;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason:
        "Projeto do Lovable: git push na main = build cobrado (um por commit). Confirme só se você pediu para subir agora.",
    },
  }));
});
