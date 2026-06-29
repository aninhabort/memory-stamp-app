# QA Checklist — Arquitetura Memory Stamp (migração Firebase → Supabase)

Checklist de validação manual para a refatoração de auth/storage/sync (`AuthContext`, `StorageService`, `CloudStorageService`, `PendingSyncService`, `useStamps`, `useVolumes`, `useUserName`). Este documento não cobre revisão de código — é para uso durante teste exploratório no app rodando (Expo/iOS/Android/simulador).

## Como usar

- Preencha **Status** com `Pass`, `Fail` ou `Bloqueado` e use **Notas** para prints, mensagens de erro ou IDs de stamp/volume usados no teste.
- Sempre que um caso falhar, anote o estado exato (qual conta, qual dispositivo, online/offline) para reprodução.
- Casos marcados com 🔍 sugerem inspecionar diretamente o backend/AsyncStorage, não só a UI.

## Setup do ambiente de teste

- [ ] Duas contas de teste já criadas e confirmadas no Supabase Auth (ex.: `qa1@teste.com`, `qa2@teste.com`).
- [ ] Acesso ao Supabase Dashboard → Table Editor → tabela `user_data`, para conferir o que cada conta tem salvo na nuvem.
- [ ] Acesso a um inspetor de AsyncStorage (Flipper com plugin AsyncStorage, React Native Debugger, ou um log temporário) para conferir as chaves `@memory_stamp_app:<userId>:*`.
- [ ] Forma de simular offline: modo avião do dispositivo/simulador, ou desligar Wi‑Fi/dados.
- [ ] Se possível, dois dispositivos/simuladores (ou um dispositivo + acesso direto ao Supabase) para testar sync entre devices.
- [ ] Build atual instalada e rodando (`npx expo start`), apontando para o projeto Supabase correto (não produção, se houver ambiente de teste).

---

## 1. Isolamento de dados por usuário

### TC-1.1 — Duas contas no mesmo dispositivo não compartilham stamps/volumes
- **Pré-condições:** Conta A (`qa1`) e Conta B (`qa2`) já existem.
- **Passos:**
  1. Login com Conta A. Criar 2 stamps com títulos identificáveis (ex.: "STAMP-A1", "STAMP-A2") e 1 volume extra ("VOL-A").
  2. Logout.
  3. Login com Conta B.
  4. Verificar Coleção, Busca e lista de volumes.
- **Resultado esperado:** Conta B não vê nenhum stamp/volume da Conta A. Conta B começa com o volume padrão "Passport" (ou o que já tinha previamente) e nenhuma das entradas criadas no passo 1.
- **Status:** [x] Pass [ ] Fail [ ] Bloqueado
- **Notas:** QA2 viu apenas STAMP-QA2-001, não viu STAMP-QA1-001. Isolamento confirmat

### TC-1.2 🔍 — Chaves no AsyncStorage são namespaced por userId
- **Passos:**
  1. Com Conta A logada, inspecionar AsyncStorage.
  2. Repetir login com Conta B e inspecionar de novo.
- **Resultado esperado:** Existem chaves separadas por conta, no formato `@memory_stamp_app:<userId-A>:stamps` e `@memory_stamp_app:<userId-B>:stamps` (mesmo padrão para `volumes`, `userName`, `pendingSync`). Nenhuma conta lê a chave da outra.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-1.3 🔍 — Isolamento também vale na nuvem
- **Passos:** Com as duas contas populadas (TC-1.1), abrir a tabela `user_data` no Supabase Dashboard.
- **Resultado esperado:** Uma linha por `user_id`, cada uma só com os dados da própria conta.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

---

## 2. Logout e troca de conta

### TC-2.1 — Logout não apaga dados locais da conta
- **Passos:**
  1. Logado como Conta A com stamps criados, fazer logout.
  2. Login novamente com Conta A.
- **Resultado esperado:** Todos os stamps/volumes da Conta A continuam lá após o logout/login — o logout não limpa o storage local namespaced dessa conta.
- **Status:** [x] Pass [ ] Fail [ ] Bloqueado
- **Notas:** Dados de QA1 persistiram após logout/login. Nenhuma perda.

### TC-2.2 — Troca rápida de conta (A → B → A) preserva dados de ambas
- **Passos:**
  1. Login A, criar "STAMP-A".
  2. Logout, login B, criar "STAMP-B".
  3. Logout, login A de novo.
- **Resultado esperado:** Conta A vê só "STAMP-A". Ao logar B novamente, B só vê "STAMP-B". Nenhum dado cruzou entre contas.
- **Status:** [x] Pass [ ] Fail [ ] Bloqueado
- **Notas:** QA1 vê apenas STAMP-QA1-001, QA2 vê apenas STAMP-QA2-001. Isolamento bidirecional confirmado.

### TC-2.3 — Estado de auth reage corretamente ao `onAuthStateChange`
- **Passos:** Fazer logout e observar a tela imediatamente após (sem fechar o app).
- **Resultado esperado:** App navega para tela de login/onboarding sem mostrar dados da conta anterior, mesmo que brevemente. `userId`, `userName`, `userEmail` voltam a `null` no contexto.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

---

## 3. Migração dos dados antigos (pré-namespacing → namespaced)

> Cenário: usuário que já tinha dados salvos antes da migração para chaves por conta (chaves legadas `@memory_stamp_app:stamps`, `:volumes`, `:userName`).

### TC-3.1 — Migração ocorre no primeiro login após o update
- **Pré-condições:** É necessário simular dados legados. Se não houver build antiga disponível, popular manualmente as chaves legadas via debugger antes do primeiro login (`@memory_stamp_app:stamps`, `@memory_stamp_app:volumes`, `@memory_stamp_app:userName`).
- **Passos:**
  1. Garantir que as chaves legadas existem e que a conta de teste ainda não tem chaves namespaced.
  2. Fazer login com essa conta pela primeira vez.
  3. Verificar Coleção/Volumes/Nome de usuário.
- **Resultado esperado:** Os dados legados aparecem como se fossem dessa conta (stamps, volumes, nome). 🔍 As chaves legadas (`@memory_stamp_app:stamps` etc., sem userId) deixam de existir no AsyncStorage após o login.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-3.2 — Dados legados não "ressurgem" para uma segunda conta
- **Passos:**
  1. Repetir TC-3.1 com a Conta A (migração consome as chaves legadas).
  2. Logout, login com Conta B (nova, sem dados próprios).
- **Resultado esperado:** Conta B não recebe os dados legados — eles já foram apagados/consumidos pela Conta A. Conta B começa vazia (ou só com o volume padrão).
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-3.3 — Migração não sobrescreve dados que a conta já tenha
- **Passos:**
  1. Conta A já tem stamps próprios salvos sob sua chave namespaced.
  2. Simular existência de chaves legadas também presentes.
  3. Logar com Conta A.
- **Resultado esperado:** Os stamps/volumes/nome já existentes da Conta A não são sobrescritos pelos dados legados (a migração só preenche o que estiver vazio). Chaves legadas são removidas mesmo assim.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-3.4 — Migração de ícones emoji → Ionicons e `photo` → `photos`
- **Passos:** Usar um stamp antigo com ícone em emoji (ex.: "✈️") e/ou campo `photo` único (sem `photos`). Carregar a tela de Coleção.
- **Resultado esperado:** O ícone aparece convertido para o ícone Ionicons equivalente; a foto antiga aparece corretamente na lista `photos`. Não há erro nem ícone quebrado.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

---

## 4. Criação, edição e deleção de stamps

### TC-4.1 — Criar stamp
- **Passos:** Criar um stamp novo com todos os campos (título, data, local, categoria, foto, cor, ícone, nota).
- **Resultado esperado:** Stamp aparece imediatamente na Coleção e na Busca, com `createdAt` e `updatedAt` preenchidos. 🔍 Após alguns segundos, o stamp aparece na linha `user_data.stamps` no Supabase com a foto já como URL (não `file://`).
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-4.2 — Editar stamp
- **Passos:** Editar título, categoria e foto de um stamp existente.
- **Resultado esperado:** Alterações refletem na UI imediatamente; `updatedAt` é atualizado para um timestamp mais recente que `createdAt`. 🔍 Mudança propaga para a nuvem.
- **Status:** [x] Pass [ ] Fail [ ] Bloqueado
- **Notas:** Editado título, localização e cor. Refletiu na Coleção e na Busca imediatamente.

### TC-4.3 — Deletar stamp
- **Passos:** Deletar um stamp existente (com foto).
- **Resultado esperado:** Stamp desaparece de Coleção/Busca imediatamente. Fotos associadas são removidas do Storage (verificar se não ficam órfãs, se houver acesso ao bucket).
- **Status:** [x] Pass [ ] Fail [ ] Bloqueado
- **Notas:** Stamp deletado desapareceu da Coleção e da Busca imediatamente.

### TC-4.4 — Criar/editar/deletar stamp offline
- **Passos:** Ativar modo avião. Criar um stamp, editar outro, deletar um terceiro.
- **Resultado esperado:** Todas as operações funcionam normalmente na UI mesmo sem rede (offline-first). Nenhum erro bloqueante é mostrado ao usuário.
- **Status:** [x] Pass [ ] Fail [ ] Bloqueado
- **Notas:** Teste adaptado para simulador. Será validado em device real.

---

## 5. Criação, edição e deleção de volumes

### TC-5.1 — Criar volume
- **Passos:** Criar um novo volume com nome customizado.
- **Resultado esperado:** Volume aparece na lista com label em romano sequencial correto (ex.: se já existem 2 ativos, o novo é "VOLUME III") e ano atual.
- **Status:** [x] Pass [ ] Fail [ ] Bloqueado
- **Notas:** Volume criado com label correto e ano exibido.

### TC-5.2 — Deletar volume com stamps associados
- **Passos:** Criar um volume novo, adicionar 2 stamps a ele, depois deletar o volume.
- **Resultado esperado:** Volume desaparece da lista. Os 2 stamps associados também desaparecem de Coleção/Busca (foram tombstoned em cascata), sem precisar deletá-los manualmente.
- **Status:** [ ] Pass [x] Fail [ ] Bloqueado
- **Notas:** BUG: Stamps criados dentro do volume novo não aparecem no volume quando aberto. Volume novo também exibe vazio mesmo com stamps criados dentro. Possível problema de associação volumeId.

### TC-5.3 — Não é possível deletar o último volume
- **Passos:** Deletar volumes até restar apenas 1, então tentar deletar esse último.
- **Resultado esperado:** A deleção do último volume é bloqueada (retorna `false`/não remove); a UI mantém pelo menos um volume visível (o padrão "Passport", se aplicável).
- **Status:** [x] Pass [ ] Fail [ ] Bloqueado
- **Notas:** Deleção do último volume bloqueada com sucesso. Passport permanece.

### TC-5.4 — Stamps "sem volume" continuam aparecendo no volume padrão
- **Passos:** Usar um stamp criado antes da feature de volumes (sem `volumeId`), abrir o volume "Passport"/default.
- **Resultado esperado:** Esse stamp aparece dentro do volume default, sem precisar de migração manual (`isInVolume` trata `volumeId` ausente como pertencente ao `default`).
- **Status:** [ ] Pass [x] Fail [ ] Bloqueado
- **Notas:** BUG: Stamp criado sem especificar volume não apareceu em lugar nenhum (não em Passport, não na Coleção geral). Problema na lógica de volumeId padrão.

---

## 6. Tombstones / `deletedAt`

### TC-6.1 — Item deletado não aparece na UI mas permanece como tombstone
- **Passos:** Deletar um stamp. 🔍 Inspecionar o AsyncStorage local (`stamps`) e a linha `user_data` na nuvem.
- **Resultado esperado:** O stamp não aparece em nenhuma tela, mas continua presente no array armazenado (local e nuvem) com `deletedAt` e `updatedAt` preenchidos — não foi removido do array.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-6.2 — Tombstone sobrevive a um merge com cópia "mais antiga" de outro device
- **Passos (requer 2 devices/sessões ou edição manual via Supabase):**
  1. Device 1: criar stamp "STAMP-X", sincronizar com a nuvem.
  2. Device 2 (mesma conta, sem ter sincronizado ainda): abrir o app já tendo "STAMP-X" localmente sem o delete.
  3. Device 1: deletar "STAMP-X" (gera tombstone, `updatedAt` mais recente).
  4. Device 2: forçar sync (foco na tela de Coleção/Busca) puxando a versão tombstoned da nuvem.
- **Resultado esperado:** O delete feito no Device 1 "vence" o merge — "STAMP-X" some também no Device 2, mesmo que o Device 2 ainda tivesse a cópia não deletada localmente.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-6.3 — Volume tombstoned não reaparece após sync
- **Passos:** Deletar um volume, forçar um `syncVolumesFromCloud` (ex.: sair e voltar para a tela do Passaporte).
- **Resultado esperado:** Volume deletado não reaparece na lista após o sync.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

---

## 7. Sync offline-first

### TC-7.1 — Escrita local acontece mesmo sem rede
- **Passos:** Modo avião ativado. Criar/editar/deletar um stamp ou volume.
- **Resultado esperado:** Operação é refletida instantaneamente na UI (não espera rede). Nenhuma tela de loading bloqueante ou erro impede a ação.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-7.2 — Merge local + nuvem ao focar na tela (Coleção/Busca)
- **Passos (2 devices/sessões com a mesma conta):**
  1. Device 1 online: criar "STAMP-SYNC-1".
  2. Device 2 (mesma conta, app já aberto antes do passo 1): navegar para Coleção ou Busca (dispara `syncStampsFromCloud` via `useFocusEffect`).
- **Resultado esperado:** Device 2 passa a exibir "STAMP-SYNC-1" sem precisar reiniciar o app.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-7.3 — Merge não perde itens criados localmente durante o sync
- **Passos:** Com Device 2 offline, criar "STAMP-LOCAL". Reconectar a rede e navegar para a tela de Coleção (dispara sync).
- **Resultado esperado:** "STAMP-LOCAL" continua existindo após o sync (merge é união por id, não substituição) e é enviado para a nuvem.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-7.4 — Seed inicial da nuvem quando conta nova só tem dados locais
- **Passos:** Conta nova, sem dados na nuvem ainda, mas com dados locais (ex.: vindos da migração legada). Fazer login.
- **Resultado esperado:** 🔍 Após o login, a linha `user_data` da conta no Supabase passa a conter os stamps/volumes que só existiam localmente (seed automático), incluindo fotos já convertidas para URL.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-7.5 — Nuvem vazia confirmada não sobrescreve dados reais (proteção contra falso "vazio")
- **Passos:** Login em um device com a rede instável logo após abrir o app (idealmente nos primeiros ~1-2s), em uma conta que já tem dados reais na nuvem.
- **Resultado esperado:** Mesmo que a primeira tentativa de leitura da nuvem falhe (retry de 1.5s previsto em `CloudStorageService.getUserData`), os dados reais da conta não são sobrescritos por um estado vazio local. Se a leitura falhar de fato (sem rede), nada é apagado — o seed/sync simplesmente não roda nesse ciclo.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

---

## 8. Pending sync

### TC-8.1 🔍 — Falha ao empurrar para a nuvem marca `pendingSync`
- **Passos:** Modo avião. Criar/editar um stamp. Inspecionar AsyncStorage.
- **Resultado esperado:** A chave `@memory_stamp_app:<userId>:pendingSync` aparece com `{"stamps": true}` (ou `volumes`/`userName`, dependendo da ação).
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-8.2 — Pending sync é resolvido ao voltar a ter rede (foreground)
- **Passos:** Repetir TC-8.1, depois desativar modo avião e levar o app para background e trazer de volta para foreground (ou apenas aguardar o evento de `AppState` mudar para `active`).
- **Resultado esperado:** O dado pendente é reenviado para a nuvem automaticamente; a flag em `pendingSync` é removida (chave inteira é apagada quando não há mais nada pendente).
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-8.3 — Pending sync também é resolvido ao focar a tela de Coleção/Busca
- **Passos:** Repetir TC-8.1. Sem usar background/foreground, apenas navegar para a tela de Coleção ou Busca (sem rede ainda) e depois religar a rede e navegar de novo.
- **Resultado esperado:** `syncStampsFromCloud`/`syncVolumesFromCloud` chamam o flush no início; assim que a rede volta e a tela é focada novamente, o pendente é enviado.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-8.4 — Múltiplas flags pendentes (stamps + volumes + userName) ao mesmo tempo
- **Passos:** Offline, criar um stamp, criar um volume e editar o nome de usuário, tudo na mesma sessão offline. Voltar para online.
- **Resultado esperado:** Todas as três flags (`stamps`, `volumes`, `userName`) ficam marcadas como pendentes enquanto offline e são limpas independentemente conforme cada push individual tem sucesso.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

---

## 9. Retorno do app do background

### TC-9.1 — Foreground dispara retry de pending sync
- Ver TC-8.2 (cobre o caso principal). Confirmar especificamente que o listener de `AppState` ('active') é o gatilho, ex.: indo para home do sistema e voltando ao app (não apenas navegação interna).
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-9.2 — Sessão permanece válida após o app voltar do background
- **Passos:** Logar, deixar o app em background por alguns minutos, retornar ao app.
- **Resultado esperado:** Usuário continua autenticado (não precisa logar de novo); `userId`/`userName` continuam corretos.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-9.3 — Background durante uma operação em andamento (upload de foto)
- **Passos:** Criar um stamp com foto em uma rede lenta; imediatamente colocar o app em background antes do upload terminar; retornar ao foreground depois de alguns segundos.
- **Resultado esperado:** O upload da foto e o push para a nuvem completam (ou falham de forma tratada, indo para pending sync) sem crashar o app nem deixar o stamp num estado inconsistente (ex.: sem foto e sem erro visível).
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

---

## 10. Comportamento com falha de rede

### TC-10.1 — Falha de rede durante `getUserData` não trava a UI
- **Passos:** Modo avião ativado antes de abrir o app. Logar (se sessão já existir, abrir o app direto) e navegar pelas telas.
- **Resultado esperado:** App carrega os dados locais normalmente; nenhuma tela fica presa em loading esperando a nuvem. Mensagens de erro de rede (se houver) não bloqueiam o uso do app.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-10.2 — Rede instável durante push (timeout/erro intermitente)
- **Passos:** Usar um throttle de rede (Network Link Conditioner, ou alternar Wi‑Fi rapidamente) enquanto cria/edita stamps repetidamente.
- **Resultado esperado:** Nenhuma escrita local é perdida; falhas de push resultam em `pendingSync` marcado e log de warning (`console.warn`), nunca em crash ou em erro propagado para o usuário.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-10.3 — Login/signup com rede ausente
- **Passos:** Modo avião ativado, tentar fazer login ou signup.
- **Resultado esperado:** Erro claro e tratado é mostrado ao usuário (não um crash ou tela branca); ao reconectar, login funciona normalmente.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-10.4 — Upload de foto falha por rede e não corrompe o stamp
- **Passos:** Offline, criar um stamp com foto.
- **Resultado esperado:** A foto continua acessível localmente (URI local) e exibida na UI mesmo sem ter sido enviada para o Storage; ao reconectar e reabrir a tela, o upload deve eventualmente ocorrer em segundo plano.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

---

## 11. Fluxo signup / login / logout

### TC-11.1 — Signup com confirmação de e-mail pendente
- **Passos:** Criar conta nova com e-mail real acessível.
- **Resultado esperado:** Mensagem indicando que é necessário confirmar o e-mail antes de logar (signup não loga automaticamente, pois não há sessão até a confirmação). Usuário não fica em estado autenticado "fantasma".
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-11.2 — Signup com e-mail já existente
- **Passos:** Tentar criar conta com um e-mail já cadastrado.
- **Resultado esperado:** Mensagem "This email is already registered" (ou equivalente em PT, se traduzido na UI), sem criar conta duplicada.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-11.3 — Signup com senha fraca / e-mail inválido
- **Passos:** Tentar signup com senha curta (<6 caracteres) e, em outro teste, com e-mail malformado.
- **Resultado esperado:** Mensagens específicas e corretas para cada caso ("Password should be at least 6 characters" / "Invalid email address"), sem confundir uma validação com outra.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-11.4 — Login com credenciais inválidas
- **Passos:** Tentar logar com senha errada.
- **Resultado esperado:** Mensagem "Invalid email or password", sem autenticar e sem expor detalhes técnicos do erro.
- **Status:** [x] Pass [ ] Fail [ ] Bloqueado
- **Notas:** Mensagem de erro exibida corretamente. Não autenticou.

### TC-11.5 — Login com e-mail não confirmado
- **Passos:** Logar com uma conta cujo e-mail nunca foi confirmado.
- **Resultado esperado:** Mensagem "Please confirm your email before signing in.", sem autenticar.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-11.6 — Rate limit de tentativas de login
- **Passos:** Tentar logar várias vezes seguidas com senha errada até atingir o rate limit do Supabase.
- **Resultado esperado:** Mensagem "Too many failed attempts. Please try again later.", sem crash.
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

### TC-11.7 — Logout efetivo
- **Passos:** Logar, depois fazer logout.
- **Resultado esperado:** Sessão do Supabase é encerrada (`isAuthenticated` volta a `false`); app navega para a tela de login/onboarding; nenhuma chamada subsequente usa o `userId` antigo (ex.: nenhum novo push para a nuvem em nome da conta anterior).
- **Status:** [x] Pass [ ] Fail [ ] Bloqueado
- **Notas:** Logout efetivo. App voltou para tela de Login. Nenhum dado anterior visível.

### TC-11.8 — Nome de usuário definido no signup aparece corretamente
- **Passos:** Signup com nome "QA Teste", confirmar e-mail, logar.
- **Resultado esperado:** `userName` exibido no app é "QA Teste" desde o primeiro login, tanto localmente quanto refletido na nuvem (`user_data.user_name`).
- **Status:** [ ] Pass [ ] Fail [ ] Bloqueado
- **Notas:**

---

## Resumo de execução

| Seção | Total de casos | Pass | Fail | Bloqueado |
|---|---|---|---|---|
| 1. Isolamento de dados | 3 | | | |
| 2. Logout e troca de conta | 3 | | | |
| 3. Migração de dados antigos | 4 | | | |
| 4. CRUD de stamps | 4 | | | |
| 5. CRUD de volumes | 4 | | | |
| 6. Tombstones/deletedAt | 3 | | | |
| 7. Sync offline-first | 5 | | | |
| 8. Pending sync | 4 | | | |
| 9. Retorno do background | 3 | | | |
| 10. Falha de rede | 4 | | | |
| 11. Signup/login/logout | 8 | | | |
| **Total** | **45** | | | |
