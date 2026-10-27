# Entrega: desenvolvimento — 2026-10-27

| campo | valor |
| --- | --- |
| cliente / turma | ambiente de desenvolvimento, user1..user5 |
| data | 2026-10-26 (provisionado) |
| quem conduz | Sandro Tanaka |
| cluster | `cluster-mz8j7`, `apps.cluster-mz8j7.dyn.redhatworkshops.io` |
| pedido no RHDP | item `rhcl-connectivity-workshop`, `revision` `workshop-v0.73-rhcl` no pedido; republicado onda a onda até `workshop-v0.89-rhcl`, OpenShift 4.22.18, 5 participantes |
| edição / build | 1.0 / `workshop-v0.89` |

## Versões medidas no dia

| camada | componente | versão |
| --- | --- | --- |
| Plataforma | OpenShift | `4.22.18` |
| Plataforma | Kubernetes | `v1.35.8` |
| Connectivity Link | RHCL (operador) | `1.4.3` |
| Connectivity Link | Authorino (operador) | `1.4.3` |
| Connectivity Link | Limitador (operador) | `1.4.2` |
| Connectivity Link | Authorino no ar | `imagem por digest (c4a5a8f911a5)` |
| Connectivity Link | Limitador no ar | `imagem por digest (793a38ce1b56)` |
| Ambiente | GitLab | `3.5.1` |
| Ambiente | Keycloak | `26.6.7-opr.1` |
| Ambiente | cert-manager | `1.20.1` |
| Ambiente | Dev Spaces | `3.31.0` |
| Ambiente | Grafana | `5.25.0` |
| Ambiente | Tempo (traces) | `0.22.0-4` |
| Ambiente | OpenTelemetry | `0.158.0-202610221301` |
| Ambiente | GitOps (Argo CD) | `1.22.2` |

## Veredito no dia

`[OK] núcleo pronto (1 avisos)` -- o aviso é o salto Gateway -> Authorino/Limitador em texto claro (estado da plataforma nesta sessão).

## Diário

- 2026-10-27: tracing do Connectivity Link ligado (Tempo e collector em `tracing-system`, `debug`); plugins de console do Pipelines e do Argo CD habilitados; regras de alerta da plataforma aplicadas; `portal-build` apagado. Janela de sizing rodada no Gateway do instrutor e revertida.
