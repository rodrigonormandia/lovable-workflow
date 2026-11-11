---
name: lovable-workflow
description: >-
  Regras de segurança e fluxo de trabalho para projetos hospedados no Lovable
  (lovable.dev) com two-way sync GitHub <-> Lovable. Use SEMPRE que estiver
  trabalhando em um repositório vinculado ao Lovable — mesmo que o usuário não
  mencione "Lovable" explicitamente — especialmente antes de: fazer commits/push,
  criar ou alterar Edge Functions ou Migrations do Supabase, mexer em branches,
  renomear/mover o repositório, ou editar arquivos auto-gerados. Acione também
  quando o projeto mencionar Lovable Cloud, lovable.app, "sync com o Lovable",
  ou quando houver um CLAUDE.md indicando integração com o Lovable. Usa o MCP
  oficial do Lovable (SQL, migrations, Publish sem prompt cobrado) e pede para
  instalá-lo quando não estiver instalado.
license: Proprietária — ver LICENSE.txt
metadata:
  author: Rodrigo Normandia
  owner: Rodrigo Normandia
  contact: rnrsouza@hotmail.com
  created: 2026-11-06
  version: 1.3.0
  ip-status: PI Preexistente
  trigger: Trabalhar em repositório sincronizado com Lovable; commits, push, edge functions, migrations, branches, MCP do Lovable, custo de builds
---

<!--
AUTORIA E TITULARIDADE
Autor: Rodrigo Normandia
Titular: Rodrigo Normandia
Criado em: 2026-06-30 | Versão: 1.3.0 | Última revisão: 2026-11-06
© 2026 Rodrigo Normandia. Todos os direitos reservados.
Propriedade Intelectual Preexistente do titular. O uso por terceiros depende de
licença escrita, não exclusiva, intransferível, limitada ao uso interno.
Nenhum direito é cedido pela entrega ou uso deste material.
-->

# Lovable Workflow

O **Lovable** (https://lovable.dev) é uma plataforma AI-powered para criar
aplicações full-stack via linguagem natural. Características:

- Gera código React/TypeScript automaticamente.
- Integra nativamente com Supabase.
- O push atualiza só o **preview**; a produção só muda no **Publish** (ver
  "Deploy e produção").
- **O GitHub é a fonte da verdade** quando conectado.

Projetos no Lovable usam **two-way sync** com o GitHub: edições no Lovable viram
commits automáticos no GitHub, e commits no GitHub sincronizam de volta para o
Lovable.

```
Lovable Editor  <---->  GitHub Repository  <---->  IDE Local (Claude Code)
     |                        |                        |
     v                        v                        v
  Auto-commit            Fonte da verdade          git push
```

Isso muda como você deve trabalhar. As regras abaixo existem para **não quebrar a
sincronização** (o que torna o projeto inacessível no Lovable) e para garantir que
mudanças cheguem corretamente ao ambiente de produção.

## Como saber se é um projeto Lovable

Procure por sinais antes de assumir: um `CLAUDE.md`/`README` mencionando Lovable,
uma URL `*.lovable.app`, um link `lovable.dev/projects/...`, ou o usuário dizendo
que o projeto "roda no Lovable". Na dúvida, pergunte — as regras a seguir só se
aplicam quando há sync ativo com o Lovable.

## Regras que NUNCA devem ser quebradas

Estas ações desconectam o projeto ou travam o sync
([doc do git sync](https://docs.lovable.dev/integrations/git-sync-overview)):

1. **Não deletar** o repositório GitHub — o sync para.
2. **Não mover** o repositório para conta/organização **sem conexão** no
   workspace do Lovable — o projeto é desconectado. (Para destino conectado, o
   sync acompanha.)
3. **Não reescrever o histórico** da branch sincronizada (force-push, rebase,
   squash do que já está na `main`).
4. **Não deletar branches** antes de voltar para `main` no Lovable (o Lovable
   sincroniza uma branch por vez; a doc não trata da deleção — regra de
   experiência).
5. **Não editar o mesmo arquivo** simultaneamente no Lovable e localmente — os
   históricos divergem (ver "Quando o Lovable e o GitHub divergem").

**Renomear** repositório, conta ou organização no GitHub **não** quebra o sync:
a doc diz que o Lovable acompanha. Ainda assim, evite sem necessidade (URLs,
remotes e o `git_remote` do vínculo mudam) e, se acontecer, atualize o `.json`.

Se o usuário pedir uma das ações da lista, **alerte sobre o risco antes de
prosseguir** e confirme que ele entende a consequência.

### Quando o Lovable e o GitHub divergem

Se o Lovable commita em cima de uma `main` que o GitHub já passou (ex.: prompt
enviado antes do sync do seu push), ele **não** gera conflito de merge: empurra
as mudanças dele para uma branch `lovable-sync` (`lovable-sync-<n>`), mostra a
barra "alterações salvas em uma branch de sincronização" e, no próximo sync, a
versão do GitHub prevalece. Para não perder o trabalho dele:

1. `git fetch origin` e veja o que a branch traz:
   `git diff --name-status origin/main...origin/lovable-sync-<n>`.
2. Se tiver algo a manter: `git merge --no-ff origin/lovable-sync-<n>` na `main`
   (merge comum — squash/rebase são proibidos) e push.
3. Na tela Git do Lovable, "Verificar trabalho salvo" pode abrir um backup
   **antigo**. Confira com `git merge-base --is-ancestor` se o conteúdo já está na
   `main`; se está, escolha **"Manter versão do repositório"**.

Histórico reescrito também gera backup da cópia do Lovable, restaurável pelo
dono do projeto.

## Fluxo seguro de edição local

O risco principal é editar localmente algo que o Lovable também alterou. Para
evitar conflitos:

1. **`git pull` antes de começar** qualquer trabalho — o Lovable pode ter feito
   commits desde a última vez.
2. Commits locais podem ser pequenos durante o trabalho, mas **o que sobe é um
   commit por entrega** (ver "Custo: cada commit é um build cobrado").
3. **Faça push ao terminar a entrega** que o usuário precisa testar — não espere
   ele pedir. O usuário testa pela URL do Lovable, então o código precisa estar
   lá. Terminar a entrega, não cada tarefa intermediária.
4. **`git pull` de novo antes de editar** se já passou um tempo desde o início da
   sessão. O Lovable commita sozinho enquanto você trabalha — inclusive correções
   que ninguém pediu (ex.: "Fixed 4 monitoring findings"). Em sessões longas,
   puxar duas ou três vezes é normal. Se o usuário disser "o remoto atualizou",
   puxe antes de tocar em qualquer arquivo.
5. Antes de mexer em arquivos que aparecem como modificados/não commitados no
   `git status`, confirme a origem dessas mudanças. Elas podem ter vindo do
   Lovable **ou de outra sessão local trabalhando na mesma `main`**.
6. **Nunca** use `git add -A`, `git add .` ou `git commit -a`: você varreria para
   dentro do seu commit o trabalho inacabado de outra sessão. Faça `git add` dos
   seus arquivos, um a um. Antes do push, confira `git log origin/main..HEAD` e
   envie só o seu commit: `git push origin <hash>:main`.

## Custo: cada commit é um build cobrado

**Observado (não está na doc):** o Lovable gera **um build por commit que chega
na `main`**, não um por push. No chat do Lovable isso aparece como um card
("Detalhes" / "Visualizar") por commit. Já aconteceu: um módulo executado por
subagentes subiu 17 commits num único push e virou 17 builds; somados aos ajustes
e migrations do mesmo dia, foram 21 builds para um trabalho que caberia em 2 ou 3.

**O que a doc diz:** editar e commitar localmente não consome crédito; crédito
sai de mensagem ao agente (build/plan/chat), de hosting e de uso do Cloud
([créditos](https://docs.lovable.dev/introduction/credits-and-usage.md)). A doc
não esclarece o custo do build por commit — por isso a regra abaixo continua
valendo como precaução, já que o card por commit é real.

Regras para manter o custo baixo:

1. **Um commit por push.** Commits intermediários (um por tarefa de um plano,
   commits de subagentes, "wip") ficam só locais. Antes do push, junte-os:

   ```
   git fetch origin
   git log --oneline origin/main..HEAD     # confirme que são só os seus
   git reset --soft origin/main
   git commit -m "feat(modulo): resumo da entrega" -m "- parte 1
   - parte 2"
   git push origin HEAD:main
   ```

   Se `origin/main..HEAD` tiver commit de outra sessão, não faça o reset: crie
   uma branch a partir de `origin/main`, aplique só os seus commits com
   `cherry-pick --no-commit`, faça um commit único e envie esse hash.
2. **Documentação vai no commit da entrega.** Spec, plano e atualização do
   `CLAUDE.md` não sobem em commits ou pushes separados.
3. **Valide antes de subir, não depois.** Quando o projeto roda localmente
   (`npm run dev` apontando para o Supabase Cloud), confira a tela você mesmo no
   navegador antes do push. O preview do Lovable não é ambiente de teste: cada
   "sobe para eu ver" custa um build.
4. **A sessão é a entrega, não o pedido.** Numa conversa com vários pedidos em
   sequência (ajustes por print, "agora faça X"), **não faça push ao fim de cada
   pedido**: acumule tudo localmente (valide no servidor local) e, quando a
   entrega estiver concluída e validada, suba **um commit, um push** — **sem
   pedir confirmação** (o usuário autorizou o push único em 2026-10-05; não
   pergunte "posso subir?"). O que continua proibido é o push intermediário:
   um por pedido de ajuste da mesma rodada. Já aconteceu: cinco pedidos na
   mesma tarde, cada um "fechado" em um commit e um push — cinco builds,
   quando o combinado era um. Se o usuário ainda está mandando ajustes em
   sequência, espere a rodada fechar antes de subir.
   Migration aplicada pelo MCP **não** depende do push do front quando é só
   aditiva — mas o front que a usa só sobe junto com o resto.
5. **Evite migrations extras.** No planejamento, levante o que costuma virar
   migration depois do deploy: preenchimento de dados antigos (backfill) e
   valores fixos que o admin vai querer configurar. Cada migration a mais custa
   um build do push **e** outro do prompt de deploy.
6. **Um prompt de deploy por entrega.** Cada prompt enviado ao Lovable também
   vira commit e build. Junte num mesmo prompt todas as migrations e edge
   functions da entrega, em vez de pedir uma por vez. O que não depende do agente
   (SQL, teste, Publish) vai pelo MCP, sem prompt — ver "MCP do Lovable".
7. **Nunca reescreva o que já está na `main`** para "economizar" (rebase/squash
   com `--force`): o build já foi cobrado e o force push arrisca o sync.

### Trava de push (hook global)

Regra escrita não bastou — já aconteceu de virar cinco pushes numa tarde. Por isso
existe um hook **global** que pede confirmação do usuário a cada `git push` em
projeto do Lovable, mesmo com `Bash(git push:*)` liberado — **exceto em modo bypass**, em que o usuário delega a decisão ao agente (não pergunte nada nesse modo):

- Script: `~/.claude/hooks/lovable-confirm-git-push.js`
- Registro: `~/.claude/settings.json` → `hooks.PreToolUse`, matcher `Bash|PowerShell`,
  comando `node C:/Users/<usuário>/.claude/hooks/lovable-confirm-git-push.js`
- **Só age em projeto do Lovable**: a pasta (ou o repositório principal da worktree,
  ou o `cd`/`git -C` dentro do comando) tem `.claude/lovable-project.json` ou um
  `CLAUDE.md` com a seção "Projeto no Lovable". Em qualquer outro projeto não faz
  nada. É mais um motivo para o vínculo do "Segundo passo" existir em todo projeto
  do Lovable: sem ele, a trava não reconhece o projeto.

Ao acionar esta skill, **confira se o hook está instalado** (o script existe e o
`settings.json` global o registra). Se faltar, ofereça instalar — o script vai
junto com esta skill (`lovable-confirm-git-push.js`, na pasta da skill): copie-o
para `~/.claude/hooks/`. Na falta dele, recrie com o mesmo comportamento: detectar
`git push` no comando, conferir se é projeto do Lovable e responder
`{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "ask",
"permissionDecisionReason": "..."}}`. Ao mexer no `settings.json`, **mescle** com o
que existe (nunca sobrescreva) e valide o JSON. Configuração nova só passa a valer
depois de o usuário abrir `/hooks` ou reiniciar o Claude Code.

A trava não substitui a regra: ela existe para barrar o push **intermediário**.
Para o push único da entrega concluída, não pergunte no chat — vá direto ao
`git push`; se o hook pedir confirmação, o usuário aprova ali.

Projeto com `"push_autonomy": true` no `.claude/lovable-project.json` (resposta
do "Terceiro passo") não recebe a pergunta do hook: o usuário delegou o push. A
regra de um commit por entrega continua valendo — quem a cumpre é você.

### Trava de autonomia do MCP (hook global)

Um segundo hook aplica as respostas do "Terceiro passo" às chamadas do MCP que
cobram ou publicam:

- Script: `~/.claude/hooks/lovable-autonomia-mcp.js` (vai junto com esta skill)
- Registro: `~/.claude/settings.json` → `hooks.PreToolUse`, matcher
  `mcp__.*[Ll]ovable.*__(send_message|deploy_project)` (pega o plugin e o
  conector do claude.ai), comando `node C:/Users/<usuário>/.claude/hooks/lovable-autonomia-mcp.js`
- `project_id` diferente do gravado no `.json` ⇒ **recusa** a chamada.
- `send_message` com `prompt_autonomy` diferente de `true` ⇒ **recusa** e manda
  entregar o bloco para o usuário colar.
- `deploy_project` com `publish_autonomy` diferente de `true` ⇒ **pergunta**.
- **Vale também em modo bypass**: "manual" no `.json` é escolha explícita do
  usuário para aquele projeto e pesa mais que o bypass geral (decisão de
  2026-11-06). O hook de push é que pula o bypass.
- Sem `.json` alcançável, não faz nada.
- `query_database` fica fora de propósito: mistura leitura e escrita, e separar
  por palavra-chave no SQL daria falso alarme. A migration manual é regra escrita
  (ver "Regras de uso").

Confira os **dois** hooks ao acionar a skill e instale o que faltar, do mesmo
jeito (copiar da pasta da skill, mesclar no `settings.json`, validar o JSON).

**Quando a edição é feita via Lovable (não local):**

1. O Lovable faz **commits automáticos** — **cada prompt = um commit**.
2. Marque versões estáveis com **bookmark** no histórico do projeto.
3. Se algo quebrar, **restaure a versão marcada**. Restaurar volta o **código** e
   refaz o deploy das edge functions, mas **nunca volta os dados do banco**
   ([histórico](https://docs.lovable.dev/features/projects/history.md)).

**Como reconhecer um commit feito pelo Lovable:**

- Autor `gpt-engineer-app[bot]`.
- Trailer `X-Lovable-Edit-ID: edt-...` no corpo da mensagem.
- Assunto genérico: "Changes", "Work in progress", "Fixed N monitoring findings".

Serve para saber se uma mudança veio da plataforma ou de um colega/sessão. Para
descobrir quem escreve num diretório:
`git log --format='%an | %ad | %s' --date=short -- <caminho>`.

## MCP do Lovable — use antes de pedir prompt

### Primeiro passo: confirmar que o MCP está instalado

Ao acionar esta skill, **antes de qualquer trabalho com o Lovable**, verifique se
as ferramentas do MCP existem na sessão: procure por `lovable` entre as
ferramentas disponíveis (nomes como `mcp__plugin_lovable_lovable__query_database`
ou `mcp__lovable__query_database`; se estiverem como *deferred*, carregue-as com
`ToolSearch` pela palavra `lovable`).

**Se não houver nenhuma ferramenta do Lovable, pare e peça ao usuário para
instalar** — não siga no fluxo de prompt sem antes oferecer a instalação. Entregue
a mensagem assim:

```
O MCP do Lovable não está instalado nesta máquina. Com ele, SQL, testes,
migrations e Publish saem de graça, sem prompt cobrado no editor.
Posso instalar agora (plugin oficial, escopo de usuário)?
  claude plugin install lovable@claude-plugins-official
Depois é preciso reiniciar o Claude Code; na primeira chamada abre o login
do Lovable no navegador.
```

Com o "sim" do usuário, rode o comando via Bash e peça para ele reiniciar o
Claude Code (as ferramentas só aparecem numa sessão nova). Só use o fluxo de
prompt sem MCP se o usuário recusar a instalação — e, nesse caso, não pergunte
de novo na mesma sessão.

**Instalado não é conectado.** Confirme a conexão com uma chamada grátis
(`get_me`). Se ela pedir autenticação ou falhar, **recomende conectar** antes de
seguir:

```
O MCP do Lovable está instalado, mas não conectado. Para conectar:
abra /mcp, escolha o servidor do Lovable e faça o login no navegador
(a conta é a do workspace do projeto). Sem isso, SQL, migrations e
Publish voltam a depender de prompt cobrado.
```

Pode haver duas instalações do mesmo MCP (o plugin `mcp__plugin_lovable_lovable__*`
e o conector do claude.ai `mcp__claude_ai_Lovable__*`). Basta uma conectada;
use a que respondeu ao `get_me` na sessão inteira.

### Recomendado: plugin Superpowers

Confira se as skills `superpowers:*` estão disponíveis na sessão. Se não
estiverem, **recomende** (não bloqueie o resto) — uma vez por sessão:

```
Recomendo instalar o plugin Superpowers (oficial, escopo de usuário):
  claude plugin install superpowers@claude-plugins-official
Ele traz o fluxo brainstorming → spec → plano → execução, que casa com
"nada muda sem spec aprovada" e junta o trabalho numa entrega só
(menos pushes, menos builds). Depois é preciso reiniciar o Claude Code.
```

Com o "sim", rode o comando e peça o reinício. Recusou ⇒ siga sem ele e não
pergunte de novo na mesma sessão.

### Segundo passo: vínculo do repositório local com o projeto do Lovable

O MCP enxerga **a conta inteira** (vários workspaces, dezenas de projetos, alguns
com nomes parecidos). Nenhuma chamada que recebe `project_id` pode partir de
busca por nome ou de memória. O vínculo fica em
**`.claude/lovable-project.json`** na raiz do repositório:

```json
{
  "project_id": "<uuid do projeto no Lovable>",
  "project_name": "<nome no Lovable>",
  "workspace_id": "<id>",
  "workspace_name": "<nome>",
  "git_remote": "<saída de git remote get-url origin>",
  "editor_url": "https://lovable.dev/projects/<uuid>",
  "verified_at": "AAAA-MM-DD",
  "verified_by": "<como foi provado>",
  "push_autonomy": false,
  "prompt_autonomy": false,
  "migration_autonomy": false,
  "publish_autonomy": false
}
```

Os quatro `*_autonomy` vêm do "Terceiro passo". **Campo ausente vale manual**
(`false`).

**Com o arquivo presente — conferir antes da primeira chamada da sessão:**

1. `git remote get-url origin` precisa ser igual a `git_remote`. Diferente ⇒ o
   arquivo veio de outro repositório: pare e refaça o vínculo.
2. `list_edits` do `project_id` (limit 5) e `git fetch origin`: pelo menos um
   `commit_sha` devolvido precisa existir localmente
   (`git cat-file -e <sha>`). Nenhum existe ⇒ o projeto não é este repositório:
   pare, avise o usuário e não chame mais nada.
3. Passou ⇒ use **só** esse `project_id` na sessão inteira. Pedido do usuário
   que cite outro projeto ("roda no dn.dash") exige confirmação explícita e
   nunca altera o arquivo.
4. Faltam os campos `*_autonomy` (vínculo antigo) ⇒ faça as perguntas do
   "Terceiro passo" **uma vez** e grave as respostas.

**Sem o arquivo — criar o vínculo (uma vez por repositório):**

1. `list_workspaces` e `list_projects` (com `query` pelo nome provável do repo,
   do `CLAUDE.md` ou da URL `*.lovable.app`).
2. Para cada candidato, `list_edits` e conferir se os `commit_sha` existem no
   git local, como acima. **O vínculo só vale com essa prova** — nome parecido
   não basta.
3. Mostre ao usuário o projeto encontrado (nome, workspace, editor_url e o
   commit em comum) e peça confirmação.
4. Grave `.claude/lovable-project.json`. O arquivo é local — se `.claude/` for
   versionada no projeto, adicione-o ao `.gitignore` junto com a próxima
   entrega.
5. **Registre o vínculo no `CLAUDE.md` do projeto** (se não houver
   `CLAUDE.md`, crie um só com esta seção), para que outra máquina, um clone
   novo ou outro agente saibam desde o início qual é o projeto:

   ```markdown
   ## Projeto no Lovable

   - Projeto: `<nome>` — `<project_id>`
   - Workspace: `<workspace_name>` (`<workspace_id>`)
   - Editor: <editor_url>
   - Vínculo provado em AAAA-MM-DD pelo commit `<sha curto>`, presente no
     Lovable e no git. Toda chamada ao MCP do Lovable usa só este `project_id`.
   ```

   **Não faça commit só para isso** (seria um build cobrado). Deixe a alteração
   no working tree e inclua o `CLAUDE.md` no próximo commit de entrega, avisando
   o usuário que ela vai junto. Se o vínculo já estiver no `CLAUDE.md`, não
   reescreva.

**Arquivo local faltando, mas vínculo no `CLAUDE.md`:** recrie o `.json` a
partir da seção "Projeto no Lovable" e repita a conferência dos commits antes
de usar. O `CLAUDE.md` diz qual projeto; a conferência prova que ainda é ele.
**Se os dois divergirem**, pare e pergunte — não escolha um.

Mais de um candidato com prova, ou nenhum ⇒ pergunte ao usuário; não escolha.

### Terceiro passo: autonomia por etapa

Logo depois do vínculo, pergunte ao usuário (ferramenta de perguntas com
opções, uma pergunta por etapa, **"Manual" como opção recomendada**) e grave as
respostas no `.claude/lovable-project.json`:

| Campo | Automático (`true`) | Manual (`false`, padrão) |
|---|---|---|
| `push_autonomy` | `git push` da entrega concluída sem a pergunta do hook | O hook pede confirmação a cada push |
| `prompt_autonomy` | Prompt de deploy enviado pelo `send_message` sem perguntar (cobra crédito) | Entregar o bloco `---` para o usuário colar no Lovable |
| `migration_autonomy` | Migration aplicada pelo `query_database` logo após o push, sem perguntar | Mostrar o SQL e esperar o ok antes de aplicar |
| `publish_autonomy` | `deploy_project` assim que tudo estiver aplicado | Avisar que está no preview e esperar o ok |

As respostas ficam **só no `.json`** (local, gitignorado), não no `CLAUDE.md`:
autonomia é delegação nesta máquina. Clone novo ⇒ rodar o setup de novo.

**O automático não dispensa nada disto:**

- esperar o commit do push aparecer em `list_edits` antes do `send_message`;
- um prompt por entrega, com "não altere outros arquivos" e "não chame rota nem
  função que grave dados, nem para testar; teste só leitura" — e depois conferir
  no banco as tabelas que a função toca, em vez de confiar no relato do agente;
- migration só depois do push, com o arquivo inteiro e SQL idempotente;
- o SQL aplicado aparece no relato, mesmo sem pergunta;
- não publicar front que depende de edge function ainda não deployada;
- escrita avulsa no banco (fora de migration da entrega) continua pedindo
  confirmação;
- o teste visual no preview antes do Publish (ver "Deploy e produção").

**Regras permanentes no knowledge do projeto (opcional, com ok).** Ao fim do
setup, ofereça gravar no knowledge do projeto no Lovable as regras que hoje se
repetem em todo prompt: "não altere arquivos fora do pedido", "não chame rota
nem função que grave dados, nem para testar; teste só leitura", "migration
sempre idempotente". Assim o agente as lê em toda mensagem. Como fazer:

1. `get_project_knowledge` primeiro — `set_project_knowledge` **substitui o
   conteúdo inteiro** (limite de 10 mil caracteres).
2. Junte o texto atual com as regras novas, mostre o resultado ao usuário e só
   grave com o ok dele (altera o projeto no Lovable).
3. Knowledge é instrução, não trava: continue escrevendo as proibições
   críticas no prompt de deploy e conferindo o banco depois.
4. **Design system: confie sempre no DS vinculado ao projeto** (o projeto de
   design system do workspace no Lovable — `list_design_systems`). No knowledge,
   mande seguir esse DS e diga que ele prevalece; **não repita valores** (cor,
   fonte, raio): eles envelhecem e brigam com o DS. Knowledge que manda seguir
   outro DS (herdado de outro projeto) é erro — proponha a troca ao usuário.

### `/lovable-workflow setup`

Com o argumento `setup`, rode os passos 1 a 3 **mesmo com o `.json` presente**:
confira MCP (instalado **e** conectado), Superpowers e hooks, refaça a conferência do vínculo (o existente só é
reaproveitado se a prova dos commits passar) e refaça as perguntas do
"Terceiro passo", mostrando a resposta atual de cada etapa. É o caminho para o
usuário mudar uma autonomia sem editar o arquivo à mão.

### O que o MCP oferece

O plugin oficial (`lovable@claude-plugins-official`) conecta o servidor MCP
`https://mcp.lovable.dev` (OAuth no navegador na primeira chamada; o usuário faz
o login). Pela documentação, **só `send_message` e `create_project` consomem
créditos** — o resto é grátis. Isso troca vários prompts cobrados por chamadas
diretas:

| Necessidade | Antes (prompt cobrado) | Agora |
|---|---|---|
| Consulta de diagnóstico, script de teste SQL | Prompt pedindo para rodar | `query_database` (grátis) |
| Aplicar migration já commitada | Prompt "aplique a migration" | `query_database` com o conteúdo do arquivo (grátis) |
| Publicar (Share → Publish) | Usuário clica no editor | `deploy_project` (grátis; pedir o Publish **pelo chat** do projeto cobra crédito) |
| Ver o que o bot do Lovable mudou | `git log` / perguntar | `list_edits`, `get_diff`, leitura de arquivos |
| Deploy de edge function | Prompt | **Continua sendo prompt** — não há ferramenta para isso nem para ler logs de edge function; via MCP é `send_message`, que cobra igual |

### Regras de uso

1. **Todo `project_id` sai de `.claude/lovable-project.json`**, conferido no
   início da sessão (ver "Segundo passo"). Nunca de busca por nome, de memória
   ou de outro repositório.
2. **`query_database` escreve direto em produção.** Leitura e scripts de teste
   que sempre desfazem (`BEGIN ... ROLLBACK` / erro proposital no fim) podem
   rodar direto. **Qualquer escrita ou alteração de schema mostra o SQL e pede
   confirmação explícita** antes. Única exceção: migration da entrega com
   `migration_autonomy: true` — aplica sem perguntar e mostra o SQL no relato.
3. **Migration aplicada por `query_database`:** rode o arquivo **inteiro, sem
   adaptar**, depois do push (o arquivo precisa estar na `main` primeiro). Como
   o registro de migrations do Lovable pode não saber que ela foi aplicada, o
   SQL precisa ser idempotente (ver "Migration sempre idempotente") — se a
   plataforma reaplicar depois, vira no-op. Na primeira vez num projeto,
   confira depois se a migration aparece como aplicada e registre o resultado
   no CLAUDE.md do projeto.
4. **`deploy_project` publica em produção.** Com `publish_autonomy: true`,
   publique assim que a entrega estiver aplicada e testada no preview; sem ele,
   só quando o usuário pedir ou com confirmação. Edge function nova ainda não
   publicada pelo prompt ⇒ não publique o front que depende dela.
5. **`send_message` cobra créditos** (e gera commit + build): use só para o que
   exige o agente (deploy de edge function). Com `prompt_autonomy: true`, envie
   sem perguntar; sem ele, entregue o bloco para o usuário colar (o hook recusa
   o envio). Sempre um único prompt por entrega, com todas as funções.
6. **`send_message` pausado (`awaiting_input`):** o agente parou pedindo
   aprovação de uma ferramenta. Mostre ao usuário o `tool_id` e os `params`,
   pegue a decisão dele e responda com **`respond_to_approval`** (o `event_id`
   da pausa + o `message_id` da mensagem do usuário). **Nunca responda com novo
   `send_message`** — ele cancela a ferramenta pendente e cobra outro prompt.
   Pausa com `requires_secure_form`: passe o `editor_url` ao usuário e não peça
   nem aceite segredo no chat.
7. **Prompt demorado:** o `send_message` espera no máximo 600 s e então volta
   `in_progress` com o `message_id`. Acompanhe com `get_message` — **não reenvie**
   o prompt (seria outra cobrança e outro commit).
8. **Publish recusado por segurança:** `deploy_project` pode voltar
   `security_critical_findings` quando o workspace bloqueia publicação com
   achado crítico. Relate os achados ao usuário e pare. Corrigir ou ignorar é na
   Security view do projeto, por decisão dele — nunca marque achado como
   ignorado por conta própria.
9. **Sem MCP conectado ou sem login**, peça a instalação/login conforme
   "Primeiro passo" acima. O fluxo de prompt descrito em "Edge Functions e
   Migrations" só vale se o usuário recusar — e avise que aquela etapa poderia
   ter sido grátis.

## Deploy e produção

- A **produção** é publicada pelo próprio Lovable (Share → Publish), em uma URL
  `*.lovable.app`.
- **Não faça deploy por outros meios** (Vercel, Netlify, etc.) sem antes
  sincronizar com o Lovable — isso diverge o que está no ar do que o Lovable
  conhece.
- **O push não publica.** Ao sincronizar, o Lovable atualiza só o **preview**; a
  produção muda apenas no Publish (`deploy_project` ou o botão) — "it never
  publishes" ([git sync](https://docs.lovable.dev/integrations/git-sync-overview)).
  Por isso a produção pode estar atrás da `main`: confira antes de afirmar que
  algo "está no ar".
- **Edge Functions e Migrations** também não entram em produção com o sync (ver
  seção própria abaixo).

### Teste visual no preview antes do Publish (vale sempre)

Toda mudança que aparece na tela passa pelo preview antes do Publish — **com
`publish_autonomy` automático ou manual**; a configuração não cobre esta regra.
Depois do push e do sync (`latest_commit_sha` do `get_project` igual ao seu
commit), abra a URL de preview no navegador, percorra a tela alterada e tire
print. Mudança de **layout** também espera o ok do usuário antes do Publish.
Só então `deploy_project`.

**O preview usa o banco de produção** — todo draft lê e grava no mesmo banco do
app publicado ([database](https://docs.lovable.dev/features/database.md)). No
preview, só navegue e leia: não salve formulário, não envie mensagem, não crie
registro sem o usuário pedir. Cenário que precisa de dado novo vai na empresa ou
conta de teste que o projeto indicar.

## Ambiente Lovable Cloud — o que você NÃO consegue fazer

O app roda em produção no **Lovable Cloud**. Tipicamente você **não tem**:

- Acesso direto ao Supabase (banco e auth são gerenciados pelo Lovable).
- Como aplicar migration ou publicar edge function sem passar pelo Lovable.

Mas o **frontend costuma rodar localmente** (`npm run dev`, lendo o Supabase
Cloud pelo `.env`). Use isso para conferir telas e ajustes visuais antes do push
— é o que evita builds cobrados só para "ver como ficou". O que depende de
migration ou edge function nova só dá para validar depois do deploy no Lovable.

### Como validar localmente (passo a passo)

1. **Trabalhe numa worktree a partir de `origin/main`** (`git worktree add ../<nome> origin/main -b <branch>`):
   a `main` local pode estar dezenas de commits atrás.
2. **Dependências:** a worktree nasce sem `node_modules`. Instale nela com o gestor
   do lockfile do projeto (`bun.lock` ⇒ `bun install --frozen-lockfile`;
   `package-lock.json` ⇒ `npm ci`). Não use junction/symlink para o `node_modules`
   da pasta principal: ele pode estar desatualizado (falta pacote novo e o Vite
   nem sobe). O `.env` vem junto com a worktree se estiver versionado; se não,
   copie da pasta principal.
3. **Checagens antes da tela:** typecheck com o tsconfig certo
   (`tsc --noEmit -p tsconfig.app.json` — `tsc` sem `-p` não checa nada), lint dos
   arquivos tocados e os testes puros do projeto.
4. **Servidor:** `npx vite --port <porta livre> --strictPort` em segundo plano,
   com o maior timeout permitido. Ao passar do limite a tarefa é encerrada, mas o
   processo pode continuar segurando a porta — se a nova subida falhar com porta
   ocupada, confira com `curl http://localhost:<porta>` antes de trocar de porta.
5. **Login é do usuário.** Abra a URL local no navegador e peça para ele entrar
   (nunca digite a senha dele). Diga qual papel a conta precisa ter para o teste
   (Admin, Head, Closer…). O que exige outro papel e não dá para testar com a
   conta dele fica coberto por teste puro — diga isso no relato.
6. **Na tela:** percorra o fluxo pedido, inclusive os cantos (mês sem dado, id
   inválido na URL, botão Voltar), e salve prints para o relato. Efeito que só
   aparece para outro papel pode ser ligado **temporariamente** para conferir e
   desligado antes do commit — confira no diff que voltou.
7. **Não salve nada pela tela** que grave em produção sem o usuário pedir: o
   `.env` aponta para o banco real.
8. O que depende de migration ou edge function ainda não aplicada aparece
   quebrado na tela local — valide o SQL à parte (SELECT só de leitura, ou a
   migration dentro de uma transação desfeita via MCP) e diga o que ficou para
   depois do deploy.

**Implicação prática:** valide localmente o que for possível, depois
`commit único -> push -> Lovable sincroniza o preview -> teste no preview ->
Publish`. Não prometa "testei e funciona" sobre o que você não executou — diga o
que foi conferido localmente, o que foi conferido no preview e o que o usuário
ainda precisa validar.

## Edge Functions e Migrations — exigem prompt de deploy

O Lovable **não faz deploy automático** de Edge Functions nem de Migrations do
Supabase ao sincronizar o código. O código chega ao repositório, mas **não entra
em produção** sozinho.

Por isso: **sempre que criar ou alterar uma Edge Function**, prepare o prompt de
deploy: com `prompt_autonomy: true` ele vai pelo `send_message`; sem ele,
entregue-o pronto para o usuário colar no Lovable. **Migration** vai por
`query_database` quando o MCP estiver conectado (com ou sem pergunta, conforme
`migration_autonomy`; ver "MCP do Lovable"); o prompt é o caminho alternativo.
Use este modelo:

---
Faça deploy da edge function `nome-da-funcao`.
(ou: Aplique a migration `nome-do-arquivo.sql`.)

Mudanças no código:
1. [descrever mudança 1]
2. [descrever mudança 2]

O código já está no repositório GitHub (commit XXXXXXX). Por favor, faça o deploy.
---

Sempre inclua o **hash do commit** real depois do push, para o Lovable saber qual
versão deployar.

### Onde as migrations moram muda sem aviso — confirme antes de criar uma

O Lovable **mudou** o diretório de migrations ao longo da vida de um mesmo
projeto. Já foi visto: `supabase/migrations/` (timestamp no nome) e, em projetos
mais novos, `drizzle/migrations/` (numerado `00NN_nome.sql`) com:

- `drizzle/migrations/meta/_journal.json` — **toda migration precisa de uma
  entrada aqui** (`idx`, `version`, `when` em epoch ms, `tag` = nome do arquivo
  sem `.sql`), senão não é aplicada;
- `drizzle/migrations/meta/00NN_snapshot.json` — snapshot por migration, encadeado
  por `prevId` (copie o anterior, troque `id` e `prevId`);
- `drizzle/schema.ts` **vazio de propósito** ("auto-generated and intentionally
  left blank") — o SQL é escrito à mão, o drizzle-kit não gera nada;
- `drizzle.config.ts` lendo `LOVABLE_DB_MIGRATION_URL` — é esse env var que
  denuncia que o diretório é da plataforma, e não escolha de alguém do time.

**Os dois diretórios podem coexistir**, com o bot escrevendo num e as sessões
locais no outro — foi o que aconteceu por três dias num projeto real, e ninguém
percebeu. Antes de criar uma migration, descubra onde o **bot** está escrevendo:

```
git log --format='%an | %ad | %s' --date=short -- drizzle/migrations | head
git log --format='%an | %ad | %s' --date=short -- supabase/migrations | head
```

Escreva no mesmo diretório que o `gpt-engineer-app[bot]` usa hoje. Se o CLAUDE.md
do projeto disser outra coisa, o repositório é que está certo — corrija o
CLAUDE.md.

### Migration sempre idempotente

Escreva **todo** SQL de migration como re-executável: `ADD COLUMN IF NOT EXISTS`,
`CREATE ... IF NOT EXISTS`, `CREATE OR REPLACE`, e constraint dentro de um
`DO $$ ... IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = ...) ...`
(Postgres não tem `ADD CONSTRAINT IF NOT EXISTS`).

Motivo: o Lovable às vezes **cria uma migration própria com SQL idêntico** em vez
de aplicar a que você commitou, e pode reaplicar a sua. SQL idempotente faz a
duplicata virar no-op em vez de erro.

### Os tipos do Supabase ficam atrás da sua migration

`src/integrations/supabase/types.ts` só é regenerado **depois** que o Lovable
aplica a migration. Até lá, as colunas novas não existem para o TypeScript e
`tsc` reprova o código que as usa. Mantenha o cast que o projeto já usa
(`from("tabela" as any)`, `as unknown as Tipo`) e **não** edite o types.ts à mão
para "adiantar" — ele é sobrescrito.

### Formato de entrega dos prompts (obrigatório)

Todo texto destinado ao Lovable deve ser entregue **dentro de um bloco de código**,
com uma linha `---` como primeira e como última linha **do próprio bloco**:

````
```
---
Faça deploy da edge function `nome-da-funcao`.

Mudanças no código:
1. [descrever mudança 1]

O código já está no repositório GitHub (commit XXXXXXX). Por favor, faça o deploy.
---
```
````

**Por que o bloco de código é obrigatório:** a saída do assistente é renderizada
como markdown no terminal. Entregar o prompt como texto puro **deforma o
conteúdo** — já aconteceu: o `---` colou na primeira linha do texto, a indentação
dos itens sumiu, as linhas em branco entre eles foram engolidas e as crases viraram
destaque de sintaxe. O usuário copiava um prompt já corrompido. O bloco de código
preserva quebras de linha, indentação e caracteres literalmente.

**Por que os `---` vão dentro do bloco:** marcam de forma inequívoca onde o texto a
copiar começa e termina. Fora do bloco eles virariam linha horizontal do markdown e
desapareceriam.

Regras:

- **NÃO** entregar como texto puro fora de bloco de código.
- **NÃO** usar linhas longas de hífens (`--------------`) — apenas `---`.
- **NÃO** incluir a linha "Prompt para Lovable:" dentro do bloco.

Isso vale para **qualquer** pedido ao Lovable, não só deploy: consultas SQL de
diagnóstico, leitura de logs de edge function, checagem de secrets configurados,
pedidos de alteração de UI, etc.

O banco é **Supabase Cloud** (não local). Para alterações manuais no banco ou para
aplicar uma migration sem passar pelo prompt do Lovable, use o **Supabase
Dashboard** ou a **CLI do Supabase**.

## Estrutura e convenções geradas pelo Lovable

O Lovable segue convenções fixas — respeite-as para que o sync e a regeneração de
código não conflitem:

- Componentes em `src/components/`
- Páginas em `src/pages/`
- Componentes shadcn/ui em `src/components/ui/`
- Tipos do Supabase auto-gerados em `src/integrations/supabase/types.ts`

## Arquivos que NÃO devem ser editados manualmente

- `src/integrations/supabase/types.ts` — auto-gerado pelo Lovable/Supabase; é
  regenerado e suas edições manuais são perdidas/conflitam.
- Lockfiles (`package-lock.json`, `bun.lock`, `bun.lockb`) — gerenciados pelo
  gestor de pacotes, e o Lovable já **trocou de gestor** no meio de um projeto
  (apagou `package-lock.json` e `bun.lockb`, adicionou `bun.lock`). Depois de um
  pull assim, reinstale as dependências antes de rodar qualquer coisa.
- `.lovable/` — interno do Lovable (se existir). Inclui `.lovable/plan/*.md`, os
  planos que a plataforma escreve sozinha; servem de leitura para saber o que o
  Lovable andou fazendo, mas não se edita.

## Boas práticas de prompting (quando o trabalho for via Lovable)

Quando você for sugerir prompts para o usuário enviar ao editor do Lovable:

1. **Seja específico**: cite a página/rota exata (ex.: `/dashboard`) e o
   comportamento esperado.
2. **Use guardrails**: diga o que NÃO deve ser alterado (ex.: "não editar
   `Auth.tsx`").
3. **Repita instruções importantes**: a memória do Lovable é limitada entre prompts.
4. **Quebre em partes menores e testáveis**: evite muitas mudanças de uma vez.
5. **Defina o papel**: se o app tem múltiplos roles (Admin, usuário comum),
   especifique para qual o comportamento se aplica.

## Checklist antes de commitar

1. Rodar o lint do projeto (ex.: `npm run lint`) e corrigir erros, quando possível.
2. `git pull` primeiro, para evitar conflito com o Lovable.
3. Atualizar a documentação do projeto (ex.: `CLAUDE.md`) se a arquitetura mudou.
4. Mensagens de commit claras e em português.
5. Commits intermediários juntados num só (`origin/main..HEAD` deve mostrar um
   commit) — cada commit que chega na `main` é um build cobrado.
6. Push ao fim da entrega. Depois, conforme as autonomias do `.json`:
   migrations e testes SQL pelo `query_database` (migration pergunta antes se
   `migration_autonomy` for manual); edge functions num único prompt de deploy,
   enviado pelo `send_message` ou entregue no mesmo turno do push; teste no
   preview; Publish (pergunta antes se `publish_autonomy` for manual).

## Recuperação se algo quebrar

- **Sync quebrou:** não entre em pânico. Verifique se o repositório GitHub ainda
  existe e se o destino (caso tenha sido movido) tem conexão no workspace do
  Lovable. Barra de "branch de sincronização" ⇒ ver "Quando o Lovable e o GitHub
  divergem". Em último caso, oriente contatar o suporte do Lovable.
- **Código quebrou:** restaure uma versão marcada (bookmark) no histórico do
  Lovable — volta o código, não os dados — ou `git revert` local + push.
