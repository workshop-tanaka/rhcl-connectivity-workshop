# Roteiro das edições: o que cada uma pretende medir

A parte 8.1 do guia ("O que esta edição ainda não mediu") lista as afirmações
que a edição corrente nao pode entregar como fato. Esta e a contrapartida: o
que esta mapeado para virar medida, no mesmo formato das partes do guia (o
comando, a saida esperada e "o que isso diz"). Edicao e intencao, nao
promessa: cada item entra quando for medido num cluster e revisado.

| item (como aparece na 8.1) | o que medir | edicao prevista | onde entraria |
| --- | --- | --- | --- |
| capacidade por replica de Gateway, Authorino e Limitador | o metodo da 8.2 aplicado num cluster de homologacao: carga em degraus, qual componente satura primeiro; publicado como metodo com exemplo, nunca como numero recomendado | 1.2 | leitura na Fase 7 |
| o corte de trafego ao trocar a classe do Gateway | trocar nativo <-> Service Mesh com trafego e medir o intervalo sem resposta | 1.2 | Fase 1 (leitura) e 8.3 |
| mover uma rota de um Gateway para outro | hostname, certificado e status das policies do lado do consumidor | 1.2 | 8.3 (D2) |
| a troca de rota com o mesmo hostname | corte, DNS e certificado no instante da troca | 1.2 | 8.2 e 8.3 (migracao) |
| mTLS no salto interno sem Service Mesh | se ha caminho suportado no provedor nativo; se nao, documentar que nao ha | 1.1 (leitura) | Fase 1 e 8.3 (D8) |
| parceiro como sistema entrando por OIDC, com o plano vindo do token | client credentials no Keycloak, plano por claim | 1.2 | 3.3 ou Extra |
| tracing com amostragem: p99 e CPU | nivel padrao com amostragem, mesmo gerador de carga | 1.2, junto com o tracing como parte do guia | Fase 6 |
| memoria do Limitador por contador ativo; HA do store | contadores crescentes ate o OOM; store com e sem replica | 1.2 | 8.2 |
| series criadas pela dimensao por parceiro com centenas de parceiros | gerar N chaves e medir cardinalidade no Prometheus | 1.2 | 4.2 e 8.3 (D9/D10) |
| dois clusters na borda: limite global e DNS comum | segundo cluster no pedido do RHDP; store compartilhado; DNSPolicy nos dois | 1.3 | Fase 7 |
| se o no infra admite esses componentes | confirmar com a Red Hat (regra de subscription); nao e medida de cluster | 1.1 (leitura) | 8.2 |
| CORS na borda | **feito na v0.134**: o preflight OPTIONS passa anonimo na AuthPolicy, vai a um backend que responde 200 (o echo, por ReferenceGrant) e os cabecalhos Access-Control-* vem de ResponseHeaderModifier na HTTPRoute; GET com chave leva Allow-Origin. Extra 'CORS: a API chamada do navegador' | 1.1 | Extra; a 4.1 aponta para ele |

Itens que saem da lista quando medidos: a 8.1 e este arquivo mudam juntos, na
mesma onda.
