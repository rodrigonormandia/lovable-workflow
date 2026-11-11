// PreToolUse global (matcher `mcp__.*[Ll]ovable.*__(send_message|deploy_project)`):
// aplica a autonomia por etapa gravada no .claude/lovable-project.json do projeto
// (skill lovable-workflow, item 4 do setup).
//
// - project_id da chamada diferente do vinculo gravado      -> deny
// - send_message com "prompt_autonomy" diferente de true    -> deny (manual = entregar o bloco para o usuario colar)
// - deploy_project com "publish_autonomy" diferente de true -> ask
//
// Vale TAMBEM em modo bypass (decisao do usuario em 2026-11-06): "manual" no .json e uma
// escolha explicita para aquele projeto e pesa mais que o bypass geral. O hook de push
// (lovable-confirm-git-push.js) continua pulando o bypass.
//
// Sem .claude/lovable-project.json alcancavel (pasta da sessao, CLAUDE_PROJECT_DIR ou
// repositorio principal da worktree), nao responde nada: quem governa e o texto da skill.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

function findLinkFile(dir) {
  let d = path.resolve(dir);
  for (let i = 0; i < 30; i++) {
    const f = path.join(d, ".claude", "lovable-project.json");
    if (fs.existsSync(f)) return f;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return null;
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

function reply(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: decision,
      permissionDecisionReason: reason,
    },
  }));
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try { input = JSON.parse(raw); } catch { return; }
  const tool = String(input?.tool_name ?? "");
  const kind = /__send_message$/.test(tool) ? "prompt" : /__deploy_project$/.test(tool) ? "publish" : null;
  if (!kind || !/lovable/i.test(tool)) return;

  const dirs = [];
  for (const d of [input.cwd, process.env.CLAUDE_PROJECT_DIR]) if (d && fs.existsSync(d)) dirs.push(d);
  for (const d of [...dirs]) { const m = mainRepoOf(d); if (m) dirs.push(m); }
  let file = null;
  for (const d of dirs) { file = findLinkFile(d); if (file) break; }
  if (!file) return;

  let link;
  try { link = JSON.parse(fs.readFileSync(file, "utf8")); } catch {
    reply("ask", `Nao consegui ler ${file}. Confirme a chamada ao Lovable manualmente.`);
    return;
  }

  const pid = String(input?.tool_input?.project_id ?? "");
  if (link.project_id && pid && pid !== link.project_id) {
    reply("deny", `project_id ${pid} nao e o projeto vinculado a este repositorio (${link.project_id}, em ${file}). Todo project_id sai do vinculo; outro projeto exige confirmacao explicita do usuario.`);
    return;
  }

  if (kind === "prompt" && link.prompt_autonomy !== true) {
    reply("deny", "Envio de prompt esta MANUAL neste projeto (prompt_autonomy). Entregue o prompt em bloco de codigo, com --- na primeira e na ultima linha, para o usuario colar no Lovable. Para mudar: /lovable-workflow setup.");
    return;
  }
  if (kind === "publish" && link.publish_autonomy !== true) {
    reply("ask", "Publish esta MANUAL neste projeto (publish_autonomy). Aprove so se voce pediu para publicar agora.");
  }
});
