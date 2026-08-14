# NexSift: contrato de publicação (referência do GPT Editor)

Arquivo de referência embutido na ferramenta `editorialInstructions` do connector MCP (rotina via ChatGPT Tasks). Detalha o contrato das operações e o exemplo de payload.

## Payload de exemplo

```json
{
  "post": {
    "title": "Título claro e direto do sinal",
    "description": "Resumo de 1-2 frases sobre o que mudou.",
    "content": "Markdown do sinal completo em pt-BR.",
    "whyItMatters": "Por que isso muda algo para quem constrói, opera, projeta ou decide sobre tecnologia.",
    "whatToWatch": "O que observar agora: acompanhar o rollout, a adoção, o patch, a migração ou a resposta do ecossistema.",
    "topics": ["security", "cloud"],
    "signalDate": "2026-08-11",
    "signalType": "risk",
    "depth": "practical",
    "tags": ["openssl", "cve"],
    "coverImage": {
      "url": "https://www.openssl.org/blog/openssl-3.5-release.png",
      "alt": "Visão geral das mudanças do OpenSSL 3.5",
      "caption": "Fonte: blog oficial do OpenSSL"
    },
    "sources": [
      {
        "title": "Título exato da fonte",
        "publisher": "Publicador da fonte",
        "url": "https://...",
        "publishedAt": "2026-08-11T10:00:00Z"
      }
    ],
    "relevanceScore": 8.4,
    "confidenceScore": 9.0
  }
}
```

## Regras do contrato

- `slug`: não enviar. O backend gera `{topic-primario}-{titulo-em-slug}-{signalDate}` (título reduzido a no máximo 40 caracteres). O slug é estável: republicar no mesmo slug atualiza o sinal existente; títulos diferentes geram slugs diferentes, mesmo no mesmo tópico e na mesma data.
- `signalDate`: data real do acontecimento, formato `YYYY-MM-DD`. Não é a data da publicação.
- `signalType`: `release` | `risk` | `shift` | `research` | `industry` | `opportunity`.
- `depth`: `practical` | `deep`.
- `title`: 8 a 140 caracteres.
- `description`: 30 a 260 caracteres.
- `whyItMatters`: 30 a 800 caracteres.
- `whatToWatch`: 30 a 500 caracteres, obrigatório. O próximo movimento concreto para acompanhar (rollout, adoção, patch, migração, resposta do ecossistema, breaking change). Não repita a `description`.
- `content`: markdown em pt-BR, mínimo de 100 caracteres. Sem imagens no markdown: a imagem do sinal é a `coverImage`, renderizada como capa acima do conteúdo. Links para as fontes inline no ponto da afirmação, além do array `sources`. Não é necessário ter todos os campos acima do mínimo: densidade, não comprimento. Explique pelo menos uma consequência técnica, operacional, econômica ou estratégica concreta. O que observar agora vive no campo estruturado `whatToWatch`, não no markdown.
- `coverImage` (opcional, recomendada): objeto com `url`, `alt` (1-200 caracteres, obrigatório) e `caption` (até 300, opcional). A `url` deve ser a de uma imagem aberta com sucesso em uma das páginas de fonte do sinal (diagrama, gráfico ou screenshot que ilustre o sinal; nunca logotipo genérico da empresa). O backend baixa a imagem na publicação, valida e guarda uma cópia no bucket: formatos aceitos jpeg, png, webp, avif e gif, máximo 5MB, sem SVG. Se o download ou a validação falhar, a publicação é rejeitada com `422` `Cover image rejected` e o motivo: corrija a URL ou republique sem a capa. Para reutilizar imagens, prefira aquelas da própria página da fonte.
- `topics`: 1 a 3, apenas dos valores válidos: `ai`, `development`, `cloud`, `devops`, `security`, `industry`, `design`. O primeiro é o tópico primário e define o slug.
- `tags`: até 10, em minúsculas, estritamente ligadas ao conteúdo do sinal.
- `sources`: 1 ou mais; cada um com `title`, `publisher` e `url` obrigatórios; `publishedAt` opcional em ISO 8601. Liste todas as fontes usadas. O `title` deve ser o título real da página.
- O sinal pode (e deve) ter **mais de uma fonte** quando fatos diferentes vierem de páginas primárias distintas (ex.: anúncio + changelog + release). Cada `sources[].url` é verificada individualmente pelo backend: se qualquer uma falhar, a publicação é rejeitada. Não agrupe URLs diferentes em uma única entrada.
- `relevanceScore`: 0 a 10. Gate: mínimo 6.5. Faixas: 9.0-10 excepcional; 8.0-8.9 forte; 7.0-7.9 relevante; 6.0-6.9 útil para segmento específico.
- `confidenceScore`: 0 a 10. Gate: mínimo 7.
- Não invente nomes, versões, datas, valores ou números.

## Semântica de fonte verificada

Uma URL encontrada em busca é apenas um **candidato a fonte**. Ela só vira fonte do sinal depois que for: localizada, aberta, com página recuperada, publisher confirmado, conteúdo inspecionado, acontecimento confirmado, data confirmada e fatos principais confirmados.

- Nunca invente, reconstrua ou deduza uma URL; a URL em `sources` deve ser exatamente uma URL que foi aberta com sucesso.
- HTTP 200 é necessário, mas não é prova suficiente. Detecte soft-404 (página 200 com "not found" no título), homepage genérica, página removida, redirect irrelevante ou conteúdo diferente.
- Use `validateSource` antes de publicar: o backend abre a URL, segue redirects (com proteção contra endereços privados), registra `finalUrl`, `httpStatus`, `pageTitle`, `contentType`, `checkedAt` e `sourceStatus`.
- Estados de fonte: `healthy` (aberta e sem redirect), `redirected` (redirect válido para o conteúdo), `temporarily_unavailable` (erro 5xx, 429 ou falha de rede), `broken` (404/410, soft-404, redirect para homepage, host bloqueado), `replaced` (fonte substituída via `replaceSource` ou auditoria).

## Validação no servidor

A Lambda valida o payload com Zod (schema `postDraftSchema`), aplica os gates editoriais e **reabre mecanicamente cada `sources[].url`** antes de gravar. O backend não confia na afirmação do editor de que a fonte foi verificada: ele confirma as propriedades mecânicas no momento da publicação e registra a verificação no sinal gravado. Respostas possíveis:

- `201`: sinal publicado (retorna `ok`, `slug`, `operation` = `created` | `updated`, `publishedAt`, `updatedAt`).
- `400`: JSON malformado.
- `401`: token inválido.
- `404`: sinal não encontrado (em `getPost` e `deletePost`).
- `422`: payload inválido, gate não atendido, `Source verification failed` com a lista de fontes rejeitadas ou `Cover image rejected` com o motivo (corrija e tente uma vez; se falhar de novo, descarte ou publique sem a capa).
- `500`: falha de publicação.

## Endpoints

- GET `/` (operationId `listRecentPosts`): lista os sinais recentes. Filtros opcionais: `since` (ISO 8601), `topic`, `signalType`, `limit` (padrão 30, máximo 100).
- GET `/posts/{slug}` (operationId `getPost`): retorna o sinal completo, incluindo os dados de verificação de cada fonte.
- POST `/` (operationId `publishPost`): publica ou atualiza um sinal.
- POST `/validate-source` (operationId `validateSource`): abre e valida uma URL candidata. Body: `{ "url": "https://..." }`. Resposta 200 com o resultado da verificação; 422 com o motivo quando a URL for rejeitada.
- POST `/audit-sources` (operationId `auditSources`): revalida todas as fontes de todos os sinais publicados, atualiza o registro de verificação e devolve contagem por estado. Use periodicamente (ex.: semanal) para detectar link rot.
- POST `/posts/{slug}/sources/{index}/replace` (operationId `replaceSource`): substitui a fonte no índice `index` do sinal por uma URL nova. Body: `{ "newUrl": "https://...", "reason": "..." }`. O backend abre e valida a URL antes de gravar; a URL original fica no histórico de substituições. Use no fluxo de link rot quando existir fonte primária equivalente.
- DELETE `/posts/{slug}` (operationId `deletePost`): exclui um sinal.

## Link rot (fonte que deixa de existir)

Fonte válida na publicação que vira 404 depois não significa automaticamente que o sinal esteja errado. Antes de remover o sinal, procure: nova URL oficial, changelog oficial, documentação oficial, release oficial ou fonte primária equivalente. Se existir equivalente válida, use `replaceSource` para trocar a URL e preservar o sinal. Somente retire o sinal se a perda da evidência comprometer a confiabilidade factual. Para publicações novas, a regra é rígida: fonte quebrada não publica.
