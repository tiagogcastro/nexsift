# NexSift: contrato de publicação (referência do GPT Editor)

Arquivo de referência para anexar em **Conhecimento** no GPT "NexSift Editor". Detalha o contrato das actions e o exemplo de payload.

## Payload de exemplo

```json
{
  "post": {
    "title": "Título claro e direto do sinal",
    "description": "Resumo de 1-2 frases sobre o que mudou.",
    "content": "Markdown do sinal completo em pt-BR.",
    "whyItMatters": "Por que isso muda algo para quem constrói, opera, projeta ou decide sobre tecnologia.",
    "topics": ["security", "cloud"],
    "signalDate": "2026-08-11",
    "signalType": "risk",
    "depth": "practical",
    "tags": ["openssl", "cve"],
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
- `content`: markdown em pt-BR, mínimo de 100 caracteres. Sem imagens. Links para as fontes inline no ponto da afirmação, além do array `sources`.
- `topics`: 1 a 3, apenas dos valores válidos: `ai`, `development`, `cloud`, `devops`, `security`, `industry`, `design`. O primeiro é o tópico primário e define o slug.
- `tags`: até 10, em minúsculas, estritamente ligadas ao conteúdo do sinal.
- `sources`: 1 ou mais; cada um com `title`, `publisher` e `url` obrigatórios; `publishedAt` opcional em ISO 8601. Liste todas as fontes usadas e só URLs reais verificadas (acesse cada URL e confirme resposta 200).
- `relevanceScore`: 0 a 10. Gate: mínimo 6.5. Faixas: 9.0-10 excepcional; 8.0-8.9 forte; 7.0-7.9 relevante; 6.0-6.9 útil para segmento específico.
- `confidenceScore`: 0 a 10. Gate: mínimo 7.
- Não invente nomes, versões, datas, valores ou números.

## Validação no servidor

A Lambda valida o payload com Zod (schema `postDraftSchema`) e aplica os gates editoriais. Respostas possíveis:

- `201`: sinal publicado (retorna `ok`, `slug`, `operation` = `created` | `updated`, `publishedAt`, `updatedAt`).
- `400`: JSON malformado.
- `401`: token inválido.
- `404`: sinal não encontrado (em `getPost` e `deletePost`).
- `422`: payload inválido ou gate não atendido (retorna a lista de issues; corrija e tente uma vez).

## Endpoints

- GET `/` (operationId `listRecentPosts`): lista os sinais recentes. Filtros opcionais: `since` (ISO 8601), `topic`, `signalType`, `limit` (padrão 30, máximo 100).
- GET `/posts/{slug}` (operationId `getPost`): retorna o sinal completo.
- POST `/` (operationId `publishPost`): publica ou atualiza um sinal.
- DELETE `/posts/{slug}` (operationId `deletePost`): exclui um sinal.
