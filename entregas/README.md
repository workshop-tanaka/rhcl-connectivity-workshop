# Entregas

Um arquivo por ambiente entregue a um cliente ou turma: para quem, quando, em
qual cluster, de qual edição, e com que versões **medidas** -- o que permite
identificar o ambiente num chamado e recriá-lo depois.

## Registrar uma entrega (cinco minutos, no dia)

1. Copie `MODELO.md` para `AAAA-MM-DD-cliente.md` (ex.: `2026-11-03-abc.md`).
2. Preencha o cabeçalho: cliente, data, quem conduz, cluster (GUID e domínio),
   o pedido no RHDP (item, `revision`, OpenShift, participantes) e a edição.
3. Com a turma no ar, cole no arquivo a saída de
   `bash scripts/versoes.sh --md` e a última linha do `bash scripts/preflight.sh`
   (rodados no repositório da demo, como admin do cluster).
4. Commit no `main`. Durante a semana, acrescente ao *Diário* o que mudou à
   mão, incidentes e pedidos do cliente.

Nada de senha, chave ou log bruto no arquivo: só versões, nomes e vereditos.

## Recriar uma entrega

1. Abra o arquivo da entrega e faça o **mesmo pedido** no RHDP: mesma
   `revision` (a edição, ex. `v1.0-rhcl`) e a mesma versão de OpenShift.
2. Suba a turma como de costume (`docs/IMPLANTACAO.md` na demo).
3. Rode `bash scripts/versoes.sh --md` no cluster novo e compare com a tabela
   do arquivo: o que diferir é o que o catálogo passou a servir desde então.
4. Se o cliente guardou o próprio trabalho (Encerramento, *Leve o seu
   trabalho*), ele importa o repositório no GitLab novo.

## Índice

| data | cliente | edição | cluster | estado |
| --- | --- | --- | --- | --- |
| 2026-10-27 | desenvolvimento (Sandro) | 1.0 | cluster-mz8j7 | em uso |
