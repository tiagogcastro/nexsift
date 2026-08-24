# NexSift: contrato de publicacao (referencia do GPT Editor)

Editorial version: 2026-08-20

Arquivo de referencia embutido na ferramenta `editorialInstructions` do connector MCP. Detalha o contrato das operacoes, o exemplo de payload e os codigos de erro relevantes para a rotina editorial.

## Payload de exemplo

```json
{
  "post": {
    "title": "AWS cria microcredential de IA generativa para estudantes e profissionais iniciantes",
    "description": "A AWS abriu uma microcredential de IA generativa com verificacao formal e baixo atrito de entrada, o que muda como estudantes e times podem sinalizar competencia basica em GenAI.",
    "content": "Markdown do sinal em pt-BR. Imagens inline (`![alt](url)`) podem ser usadas no ponto exato em que ajudam a leitura. Ex.: `![Tela do programa](https://exemplo.com/screenshot.png)`.",
    "whyItMatters": "A credencial reduz barreira de entrada e pode alterar trilhas de formacao, criterios de triagem e distribuicao de treinamento em nuvem e IA.",
    "whatToWatch": "Observar reconhecimento de mercado, adocao por programas educacionais, custo futuro e se a trilha vira requisito de outras certificacoes.",
    "topics": ["industry", "cloud"],
    "signalDate": "2026-08-20",
    "signalType": "opportunity",
    "depth": "practical",
    "tags": ["aws", "microcredential", "education", "genai"],
    "coverImage": {
      "url": "https://exemplo.com/hero.png",
      "alt": "Tela da pagina oficial da microcredential de IA generativa da AWS",
      "caption": "Fonte: AWS"
    },
    "sources": [
      {
        "title": "Titulo exato da pagina oficial",
        "publisher": "AWS",
        "url": "https://...",
        "publishedAt": "2026-08-20T10:00:00Z",
        "editorialStatus": "verified",
        "editoriallyVerifiedAt": "2026-08-20T10:12:00Z"
      }
    ],
    "relevanceScore": 8.1,
    "confidenceScore": 8.8
  }
}
```

## Regras do contrato

- `slug`: nao enviar. O backend gera `{topic-primario}-{titulo-em-slug}-{signalDate}` com a mesma funcao usada por `resolvePost`.
- `signalDate`: data real do acontecimento, formato `YYYY-MM-DD`.
- `signalType`: `release` | `risk` | `shift` | `research` | `industry` | `opportunity`.
- `depth`: `practical` | `deep`.
- `title`: 8 a 140 caracteres.
- `description`: 30 a 260 caracteres.
- `whyItMatters`: 30 a 800 caracteres.
- `whatToWatch`: 30 a 500 caracteres, obrigatorio.
- `content`: markdown em pt-BR, minimo 100 caracteres. Imagens inline `![alt](url)` sao permitidas.
- `coverImage`: opcional, fortemente recomendada quando houver imagem realmente util.
- `topics`: 1 a 3, apenas `ai`, `development`, `cloud`, `devops`, `security`, `industry`, `design`. O PRIMEIRO e o topico PRIMARIO: define o slug e a unica pagina de topico onde o sinal aparece. Tópicos adicionais sao contextuais e nunca geram pagina propria; so entram se forem genuinamente centrais ao conteudo.
- `tags`: ate 10, em minusculas, estritamente ligadas ao sinal.
- `sources`: 1 ou mais; cada item precisa de `title`, `publisher`, `url` e, para publicar, `editorialStatus: "verified"` e `editoriallyVerifiedAt`.
- `relevanceScore`: 0 a 10. Gate minimo 6.5.
- `confidenceScore`: 0 a 10. Gate minimo 7.

## Semantica de fontes

- A rotina pode descobrir fatos em blogs, docs, changelogs, GitHub Releases, videos, papers, programas educacionais ou press releases.
- Isso nao muda a regra de verificacao: a URL em `sources` deve ter sido localizada e aberta com sucesso.
- `editorialStatus` e `editoriallyVerifiedAt` sao obrigatorios no payload final das fontes publicadas.
- `validateSource` faz a verificacao mecanica e devolve `requestedUrl`, `finalUrl`, `status`, `pageTitle`, `contentType`, `sourceStatus`, `attempts`, `retryable` e `errorCode`.
- Nao existem, por enquanto, campos `sourceType` ou `sourceRole` no contrato persistido. A estrategia de fontes e editorial, nao tipada no payload atual.

## Semantica de imagens

- `coverImage` deve apontar para uma imagem aberta com sucesso em uma das paginas de fonte do sinal.
- O backend baixa a imagem, valida o formato e guarda uma copia local no bucket.
- Formatos aceitos: jpeg, png, webp, avif e gif. Maximo 5MB. SVG nao e aceito.
- Imagem forte e recomendada, mas nao e gate absoluto.
- Se uma imagem falhar por motivo permanente (`IMAGE_REJECTED`), troque a URL ou publique sem imagem.
- Se falhar por motivo transitorio (`RATE_LIMITED`, `UPSTREAM_TIMEOUT`, `SOURCE_UNAVAILABLE`), aplique retry e, se necessario, tente outra imagem valida.

## Operacoes principais

- `listRecentPosts`: lista sinais recentes. Filtros opcionais: `since`, `topic`, `signalType`, `limit` e `detail`.
  - `detail: "full"` retorna resumos com `sources`.
  - `detail: "compact"` retorna itens leves para coverage check, discovery e modo degradado.
- `resolvePost`: recebe `{ title, primaryTopic, signalDate }` e devolve `{ exists, slug, post? }`, usando exatamente a mesma funcao de slug da publicacao.
- `getPost`: retorna o sinal completo por slug.
- `publishPost`: publica ou atualiza um sinal.
- `validateSource`: valida uma URL candidata.
- `replaceSource`: substitui uma fonte validando a nova URL antes de gravar.
- `auditSources`: revalida as fontes publicadas.
- `deletePost`: exclui um sinal.

## Validacao no servidor

A Lambda valida o payload com Zod, aplica os gates editoriais e reabre mecanicamente cada `sources[].url` antes de gravar. Respostas principais:

- `201`: sinal publicado ou atualizado.
- `400`: JSON malformado.
- `401` `AUTH_ERROR`: token invalido.
- `404` `NOT_FOUND`: sinal ou rota inexistente.
- `422` `VALIDATION_ERROR`: payload invalido ou verificacao editorial ausente em `sources[]`.
- `422` `EDITORIAL_GATE_REJECTED`: score ou gate nao atendido.
- `422` `SOURCE_REJECTED`: fonte quebrada, bloqueada, irrelevante ou inadequada.
- `422` `IMAGE_REJECTED`: imagem invalida, inadequada ou rejeitada definitivamente.
- `503` `LIST_FAILED`: falha transitória ao listar sinais recentes.
- `503` `SOURCE_UNAVAILABLE`: upstream temporariamente indisponivel.
- `503` `RATE_LIMITED`: rate limit transitório.
- `504` `UPSTREAM_TIMEOUT`: timeout na verificacao ou no proxy MCP/API.
- `500` `INTERNAL_ERROR`: falha interna nao classificada.

## Estrategia de retries

Use retry apenas para erros transitórios: timeout, networking, 429, 5xx ou `temporarily_unavailable`. Nao faca retry automatico para payload invalido, gate nao atendido, 401, 404 esperado, `SOURCE_REJECTED` ou `IMAGE_REJECTED` definitivo.

## Deduplicacao e resolucao de identidade

- `resolvePost` e a forma preferida de deduplicacao.
- Nao deduza slug manualmente.
- Mesmo slug = mesmo sinal. Atualize apenas quando houver novidade material.

## Link rot

Fonte valida na publicacao que vira 404 depois nao torna automaticamente o sinal invalido. Procure URL oficial nova, changelog, docs, release ou fonte primaria equivalente. Se existir equivalente valida, use `replaceSource`. Para publicacoes novas, a regra continua rigida: fonte quebrada nao publica.
