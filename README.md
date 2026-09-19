# rhcl-connectivity-workshop

Workshop **Red Hat Connectivity Link — a API como plataforma**, empacotado
para o [RHDP Field Sourced Content](https://github.com/rhpds/field-sourced-content-template)
(item *Field Sourced Content - OpenShift Base*).

O motor é o repositório [rhcl-connectivity-demo](https://github.com/workshop-tanaka/rhcl-connectivity-demo):
`provision.sh` monta a plataforma, `demo.sh` conduz cada ato. Este repositório
só o **embala**: um Job que o clona numa tag e o executa, o Showroom com o
roteiro, e o `userinfo` que o RHDP mostra na página do pedido.

```
rhcl-connectivity-workshop/
├── Chart.yaml, values.yaml      chart Helm (padrao Ansible do template)
├── templates/                   Namespace, SA + cluster-admin, ConfigMap, Job
├── playbooks/site.yml           o Job: clone -> new-env -> provision -> preflight -> showroom -> userinfo
├── playbooks/roles/deploy-showroom   copiado do template do RHPDS
├── site.yml, ui-config.yml      Antora + UI do Showroom
├── content/                     o roteiro, um modulo por ato
└── catalog/                     stub para o catalogo comunitario do RHPDS
```

## Como pedir no RHDP

Item **Field Sourced Content - OpenShift Base**, com:

| parâmetro | valor |
| --- | --- |
| `host_ocp4_installer_version` | `4.21` (validado); 4.22 deve funcionar, não foi medido |
| `cluster_size` | `multinode`, 3 workers |
| `create_multi_user` | `false` — o desenho é single-tenant (um Gateway, um `kuadrant-system`) |
| `existing_gitops` | `false` — o CI instala o GitOps; o Job não |
| repositório | `https://github.com/workshop-tanaka/rhcl-connectivity-workshop.git`, `main`, path `.` |

Não há ELB nem DNS público nesse item: o Gateway é publicado por Route
passthrough com o certificado do próprio cluster. Por isso o ato de
TLSPolicy/DNSPolicy (3b) **não** entra neste workshop.

## O que o Job faz (~25–40 min)

1. pré-flight de RBAC;
2. clona `rhcl-connectivity-demo` na tag de `values.yaml` (`demo.ref`);
3. `new-env.sh` gera a camada de hostname a partir do domínio que o RHDP injeta;
4. `provision.sh operators mesh platform gateway devportal demo tracing dashboards`;
5. `preflight.sh core` — o Job **falha** se o caminho de dados não responde;
6. publica o Showroom com hosts, chaves de teste e URLs lidos do cluster;
7. escreve o ConfigMap `userinfo`.

A camada de demo (`base/`) **não** é um Application do Argo de propósito: quatro
atos editam objetos ao vivo (canário, fault injection, Limitador a zero,
PERMISSIVE) e `selfHeal` os reverteria em segundos.

## Promover uma versão nova da demo

Mude `demo.ref` em `values.yaml` para a tag nova e faça commit. O Job nunca
clona `main`.

## `rollout restart` NÃO atualiza os atributos

Editar o conteúdo e rodar `oc rollout restart deploy/showroom` republica o
**texto**, porque o Showroom clona o repositório de novo. Mas os valores que o
conteúdo cita — hosts, chaves, URLs do GitLab e do Dev Spaces — vêm do
ConfigMap `user_data`, que **só o playbook escreve**.

Consequência medida duas vezes em 2026-09-18/19: a página publicada mostra o
texto novo com os **placeholders** (`cluster-guid.dominio.exemplo`), e os links
não abrem. Nada avisa.

| mudou o quê | o que basta |
| --- | --- |
| só o texto de uma página | `rollout restart` |
| qualquer atributo novo, ou um valor do cluster | **sync do Job** |

```bash
argocd app sync rhcl-workshop     # ou o patch em .operation do README abaixo
```

## Se o Job falhar: corrigir e fazer push não basta

O Job é um *hook* de Sync do Argo, e hook não entra na comparação de estado:
depois de uma falha a Application aparece `Synced/Healthy` e o auto-sync
**não** reexecuta nada, mesmo com commit novo (medido em 2026-09-18, três
vezes). Depois do push, dispare o sync à mão:

```bash
argocd app sync rhcl-workshop            # ou, sem o CLI:
oc patch application rhcl-workshop -n openshift-gitops --type merge \
  -p '{"operation":{"sync":{"revision":"main","prune":true}}}'
```

Como o `provision.sh` é idempotente, a reexecução leva ~3 min.

## Medido no primeiro deploy (cluster-nsvz5, OCP 4.22.13, 2026-09-18)

| etapa | tempo |
| --- | --- |
| operators → dashboards, do zero | 6 min |
| reexecução (idempotente) | 2 min |
| Showroom (clone + Antora + pull das imagens) | 2 min |
| Job inteiro, do zero | ~12 min |

Veredito do `demo.sh check` **de dentro do terminal do Showroom**, no fim da
fase 0: `[OK]` com 3 avisos, todos da mesma família — RHDH e GitLab não
instalados (fora de propósito) e *OpenAPI não sincronizado*, porque o
APIProduct da camada de release aponta o spec para o catalog-server do RHDH,
que não existe aqui. Efeito: a aba *Definition* do API Catalog no console diz
"not yet synced"; nenhum ato depende dela. Apontar o spec para outro lugar é
assunto da fase 2, junto com o ato 6.

Dentro do terminal do Showroom: `oc whoami` é a SA `showroom` com cluster-admin,
`oc whoami -t` devolve token, e `git`, `python3` e `curl` existem — tudo que o
`demo.sh` precisa. `~` aponta para `/data` (não gravável); o volume persistente
é `/home/lab-user`.

**SCC fixada de propósito.** Com cluster-admin a SA do pod passa a poder usar a
SCC `anyuid`, que vence a `restricted-v2` por prioridade: o pod nasce (ou
renasce num restart) como uid 1000 e o volume, montado `root:755` sem
`fsGroup`, deixa de ser gravável — e os arquivos que o participante já tinha
ficam de outro dono. O playbook anota o Deployment com
`openshift.io/required-scc: restricted-v2`, então o uid é sempre o mesmo e o
`fsGroup` torna `/home/lab-user` gravável. Medido nas duas ordens no nsvz5.

## Testar localmente

```bash
helm lint . && helm template t . --set deployer.domain=apps.exemplo.com | head -50
ansible-playbook --syntax-check -i localhost, playbooks/site.yml
```

O conteúdo Antora renderiza com o [showroom-content](https://github.com/rhpds/showroom-content)
ou qualquer Antora 3 (`npx antora site.yml`).
