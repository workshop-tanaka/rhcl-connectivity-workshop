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

## Testar localmente

```bash
helm lint . && helm template t . --set deployer.domain=apps.exemplo.com | head -50
ansible-playbook --syntax-check -i localhost, playbooks/site.yml
```

O conteúdo Antora renderiza com o [showroom-content](https://github.com/rhpds/showroom-content)
ou qualquer Antora 3 (`npx antora site.yml`).
