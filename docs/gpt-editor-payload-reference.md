# NexSift: contrato de publicação (referência do GPT Editor)

Arquivo de referência para anexar em **Conhecimento** no GPT "NexSift Editor". Detalha o contrato da action `publishPost` e o exemplo de payload.

## Payload de exemplo

```json
{
  "post": {
    "type": "article",
    "slug": "cloud-2026-08-12",
    "title": "Título claro e direto do sinal",
    "description": "Resumo de 1-2 frases sobre o que mudou.",
    "content": "Markdown do post completo em pt-BR.",
    "whyItMatters": "Por que isso importa para devs fullstack/cloud.",
    "topics": ["cloud"],
    "tags": ["aws", "lambda"],
    "sources": [
      {
        "title": "Título exato da fonte",
        "publisher": "Publicador da fonte",
        "url": "https://...",
        "publishedAt": "2026-08-12T10:00:00Z"
      }
    ],
    "relevanceScore": 8
  }
}
```

## Regras do contrato

- `type`: sempre `article` por enquanto.
- `slug`: `{topic-primario}-{YYYY-MM-DD}`. É estável: republicar com o mesmo slug atualiza o post existente em vez de duplicar. Use sempre a data do dia da rotina.
- `title`: 8 a 140 caracteres.
- `description`: 30 a 260 caracteres.
- `whyItMatters`: 30 a 800 caracteres.
- `content`: markdown em pt-BR, mínimo de 100 caracteres. Sem imagens. Links para as fontes inline no ponto da afirmação, além do array `sources`.
- `topics`: 1 a 3, apenas dos valores válidos: `ai`, `cloud`, `development`, `devops`, `career`, `finance`. O primeiro é o tópico primário e define o slug.
- `tags`: até 10, em minúsculas, estritamente ligadas ao conteúdo do post. Não use tags de tópicos que não são centrais ao conteúdo.
- `sources`: 1 ou mais; cada um com `title`, `publisher` e `url` obrigatórios; `publishedAt` opcional em ISO 8601. Liste todas as fontes usadas e só URLs reais verificadas (acesse cada URL e confirme resposta 200).
- `relevanceScore`: 0 a 10, justificado por impacto técnico, novidade, relevância prática, credibilidade da fonte e amplitude de devs afetados. Abaixo de 7 não publica.
- Não invente nomes, versões, datas, valores ou números.

## Validação no servidor

A Lambda valida o payload com Zod (schema `postDraftSchema`). Respostas possíveis:

- `201`: post publicado (retorna `ok`, `slug`, `publishedAt`, `updatedAt`).
- `401`: token inválido.
- `422`: payload inválido (retorna a lista de issues; corrija e tente uma vez).
- `400`: JSON malformado.

## Endpoint

- GET `/` (operationId `listRecentPosts`): lista os posts recentes (anti-repetição).
- POST `/` (operationId `publishPost`): publica um post.
