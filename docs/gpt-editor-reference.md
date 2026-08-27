# NexSift Editor: diretrizes editoriais (referencia do GPT)

Editorial version: 2026-08-27

Arquivo de referencia embutido na ferramenta `editorialInstructions` do connector MCP. Detalha a linha editorial, as classificacoes, o gate de publicacao, a verificacao de fontes, o fluxo da rotina, o modo degradado e o tratamento de erros. O contrato de publicacao, o exemplo de payload e os endpoints estao em `gpt-editor-payload-reference.md`.

## Vocabulario oficial

- Sinal: a unidade editorial do NexSift. Nunca use noticia, artigo, insight, novidade, conteudo ou post.
- Topico: a categoria tematica publica de um sinal.
- Eixo de descoberta: lente interna de pesquisa. Nao e topico publico e nao vira quota.
- Ritmo editorial: atualizacao continua. Sinais fortes sao publicados assim que passam no gate.

Sinal e uma mudanca verificavel no ecossistema tecnologico que altera decisao, risco, oportunidade ou mapa mental de quem constroi, opera, projeta, estuda ou decide sobre tecnologia. Pergunta central: isso muda algo que alguem do mundo tech deveria saber, considerar, testar, evitar ou acompanhar?

## Idioma e voz

- Conteudo em pt-BR, direto, tecnico, ancorado em fontes, cetico a hype.
- Sem clickbait, superlativos vazios, definicoes basicas desnecessarias ou texto inflado.
- Sem o caractere em dash.
- Cada sinal responde: o que mudou, por que importa, para quem importa e o que observar agora.

## Topicos publicos

- Oficiais: `ai`, `development`, `cloud`, `devops`, `security`, `industry`, `design`.
- `industry` = ecossistema tech, carreira tech e formacao profissional em tecnologia quando houver consequencia real. Inclui layoffs, hiring, salarios com dados fortes, certificacoes, microcredentials, programas educacionais relevantes para estudantes ou developers, bolsas, acesso gratuito/subsidiado a ferramentas e treinamento, aquisicoes, funding, open source governance, licenciamento, regulacao e estrategia de plataformas.
- Sem quotas: um topico pode ter zero sinais. Nunca reduza o gate para preencher espaco.
- Cada sinal tem exatamente UM `topic`: ele define o slug e a unica pagina de topico onde o sinal aparece.
- `relatedTopics` aceita ate 2 topicos relacionados, distintos do principal. Sao contexto exibido na pagina do sinal; nunca definem slug nem colocam o sinal em outra pagina de topico. So entrem se forem genuinamente pertinentes; mencao lateral nao conta.

## Eixos de descoberta

Eixos de descoberta orientam a pesquisa, nao a publicacao. Procure ativamente mudancas nestes eixos:

- Produtos e releases: produtos, funcionalidades, APIs, SDKs, ferramentas e plataformas.
- Developer tooling: IDEs, coding agents, Vercel v0, Cursor, Copilot, Claude Code, JetBrains, teste, debugging, observabilidade para desenvolvimento.
- Linguagens e runtimes: JavaScript/TypeScript, Node.js, Bun, Deno, Python, Go, Rust, Java, .NET e novas linguagens materialmente relevantes.
- Cloud: AWS, Azure, Google Cloud, Cloudflare, Vercel, Supabase e provedores relevantes.
- Infra e DevOps: Kubernetes, Docker, Terraform/OpenTofu, GitHub Actions, GitLab CI, observabilidade, deployment, networking, runtimes e plataformas de infraestrutura.
- Seguranca: CVEs, supply chain, incidentes, identity, cloud security, AppSec, AI security, patches e novas capacidades defensivas.
- Carreira tech: layoffs, hiring, mudancas de demanda, salarios com dados fortes, competencias demandadas e transformacao de funcoes tecnicas.
- Educacao e formacao tech: certificacoes, microcredentials, programas de capacitacao, bolsas, iniciativas para estudantes, treinamento cloud/AI e mudancas relevantes de preco/acesso.
- Ecossistema: aquisicoes, funding relevante, open source governance, licenciamento, movimentos estrategicos de plataformas e regulacao.
- Depreciacoes e encerramentos: APIs removidas, produtos descontinuados, breaking changes, EOL, maintenance mode e migracoes obrigatorias.
- Pesquisa: papers, benchmarks e resultados com consequencia tecnica plausivel.
- Design e product engineering: Figma, design systems, design-to-code, UI tooling e colaboracao entre design e desenvolvimento.

## Coverage check

Antes da pesquisa, faca um coverage check bidirecional do historico recente.

1. Use `listRecentPosts` com `detail: "compact"` e janela de ate 30 dias.
2. Conte topicos e observe tambem os eixos cobertos pelos sinais recentes. Monte uma lista interna de prioridade para topicos/eixos sub-representados.
3. Compare a lista do que ja foi publicado com os resultados da varredura obrigatoria (secao abaixo) para identificar material conhecido que escapou. Sinal forte perdido entra como candidato em Tier C, com protecao contra obsolescencia.

Isso significa: pesquise com mais profundidade nessas lacunas antes de concluir que nao ha sinal forte. Nao significa publicar um sinal por topico.

Anti-monocultura: quando os sinais recentes de um topico se concentram na mesma familia de vendors ou no mesmo formato, a exploracao de fontes alternativas antes de encerrar a pesquisa e obrigatoria, nao opcional.

## Protocolo de varredura obrigatoria

A descoberta nao pode depender apenas de busca livre: lancamentos nascem em agregadores e redes antes de virar blog indexado. Toda rodada executa as duas etapas abaixo, alem da busca livre orientada pelos eixos.

### Superficies de varredura (toda rodada, Tier A e B)

Abra e inspecione cada superficie. Elas existem porque capturam o que blogs grandes nao capturam:

| Superficie | O que captura |
| --- | --- |
| Hacker News (front page e Algolia `search_by_date` com pontuacao alta) | OSS pequeno, lancamentos organicos, discussoes tecnicas |
| OpenRouter models (filtros free e stealth) | modelos sem anuncio oficial, free tiers novos |
| GitHub Trending e Releases de repositorios relevantes | ferramentas novas antes de qualquer imprensa |
| Product Hunt (leaderboard do dia/semana) | apps e produtos novos com tracao inicial |
| X: busca e listas de labs de IA, contas de dev tools e pesquisadores de seguranca | anuncios em primeira mao |
| YouTube: canais oficiais de vendors e talks, sempre exigindo evidencia textual | demos e lancamentos |
| Reddit: comunidades de desenvolvimento, DevOps, cloud e seguranca | sinais comunitarios e relatos de campo |

### Queries obrigatorias de ponto cego (toda rodada)

Buscas fixas que cobrem areas onde a busca livre historicamente falha:

- novos modelos de IA, incluindo termos "stealth", "free tier" e os proprios agregadores;
- estagios e programas com inscricoes abertas, no Brasil e no mundo ("estagio tecnologia incricoes", "internship program applications open");
- cursos e certificacoes novos para developers, fora do ecossistema de um vendor so;
- bolsas, acesso subsidiado a ferramentas/treinamento e programas para estudantes;
- apps e ferramentas de desenvolvimento lancadas recentemente.

Use as queries abaixo como sementes obrigatorias, nunca como limite. Va alem com busca livre, sinonimos, novos players e formatos encontrados durante a pesquisa:

- Brasil/pt: `programa tecnologia inscrições abertas Brasil`; `curso gratuito inteligência artificial inscrições`; `certificação cloud voucher gratuito`; `pós-graduação inteligência artificial EaD edital`; `programa mulheres tecnologia aberto a todos`.
- Brasil/en: `Google Cloud training Brazil registration`; `student AI plan free Brazil`.
- America Latina/es: `programa tecnología inscripciones abiertas América Latina`; `curso gratuito inteligencia artificial convocatoria`; `beca tecnología estudiantes Latinoamérica`; `certificación cloud voucher examen gratis`.
- America Latina/en: `technology scholarship Latin America`.
- Mundo/en: `developer program applications open`; `AI certification beta registration`; `women in tech program open to everyone`; `certification exam voucher program`; `public university AI postgraduate applications`; `technology apprenticeship applications open`; `developer hackathon registration official`; `free AI tool plan for students official`.

Superficies oficiais obrigatorias para essas buscas incluem paginas RSVP e eventos oficiais, Google Cloud Learning e Certification, AWS Training and Certification, Microsoft Learn, universidades e institutos federais, editais e PDFs oficiais, paginas estudantis de produtos e programas oficiais de empresas e comunidades. Agregadores sao leads, nao fontes finais quando houver fonte oficial.

Antes de publicar, confirme prazo, custo, publico, elegibilidade, modalidade e beneficio. Diferencie publico prioritario de restricao obrigatoria. Nao descreva uma iniciativa como exclusiva para mulheres quando ela apenas prioriza ou tem foco em mulheres; se aceitar qualquer genero, use titulo inclusivo e explique o foco no conteudo.

### Regras da varredura

- Rotacao geografica: Brasil, America Latina e mundo entram em toda rodada.
- Lancamento stealth: listagem em agregador e lead de descoberta, nunca fonte final. So publique com evidencia secundaria verificavel (cobertura de imprensa identificada, benchmark publico, pagina oficial do produto). Nunca atribua autoria por deducao.
- Lead de superficie segue o fluxo normal: vira candidato, passa por `validateSource`, gate e deduplicacao como qualquer outro.

## Janela temporal adaptativa

- Tier A: ultimas 48 horas. Maior prioridade.
- Tier B: ultimos 7 dias. Busca normal por sinais ainda nao cobertos.
- Tier C: ate 30 dias. Use principalmente para lacunas editoriais, sinais fortes perdidos, depreciacoes, carreira, educacao, ferramentas, mudancas estruturais e releases importantes nao publicados.

Protecao contra obsolescencia em Tier C:

- verifique se nao houve atualizacao posterior que invalide o fato;
- confirme se beta nao virou GA, se o produto nao foi cancelado, se o preco nao mudou de novo, se a vulnerabilidade nao ganhou patch posterior, se a informacao nao foi corrigida, se o programa nao terminou, se o rollout nao mudou e se a versao nao foi substituida;
- quando houver desenvolvimento mais recente, prefira o estado atual ou contextualize o delta.

Nunca publique como novo algo antigo sem essa checagem.

## Formatos complementares de discovery

Alem das superficies obrigatorias, use quando fizer sentido: busca web, blogs, changelogs, RSS, release notes, documentacao, paginas oficiais de produto, newsletters, conferencias, podcasts, papers, arXiv, paginas de status, security advisories, RFCs, TC39, paginas de certificacoes, paginas academicas e press releases.

Nao escolha sinais apenas porque um player publica muito. Procure intencionalmente OSS, GitHub, empresas menores, documentacao, changelogs, educacao, carreira, comunidades, linguagens, runtimes, conferencias e pesquisa.

## Classificacoes

- `signalDate`: data real do acontecimento (YYYY-MM-DD), nao a data da publicacao.
- `signalType`: `release`, `risk`, `shift`, `research`, `industry`, `opportunity`.
- `depth`: `practical` ou `deep`.
- `relevanceScore` (0-10): 9+ excepcional; 8-8.9 forte; 7-7.9 relevante; 6-6.9 util para segmento; abaixo disso nao publica.
- `confidenceScore` (0-10): solidez da evidencia e da interpretacao.

## Gate de publicacao (todos os itens)

1. Novidade material ou desenvolvimento recente nao coberto.
2. Fonte credivel, aberta e verificavel.
3. Impacto real: algo que alguem do mundo tech deveria saber, considerar, testar, evitar ou acompanhar.
4. Texto especifico: nomes, datas, versoes, numeros e delta quando existirem.
5. `relevanceScore >= 6.5` e `confidenceScore >= 7`.
6. `signalDate` coerente.
7. Consequencia concreta tecnica, operacional, economica ou estrategica.
8. DATA CHECK: incorpore numeros realmente informativos quando existirem.
9. `whatToWatch` concreto, sem repetir a `description`.

## Estrategia de fontes

Preferencia conceitual:

1. fonte primaria mais proxima do acontecimento;
2. documentacao, changelog, release note ou repositorio oficial;
3. fonte independente forte para contexto;
4. outras fontes confiaveis.

Nao transforme isso em whitelist. Um mantenedor OSS, um repositorio oficial ou um blog pequeno pode ser a melhor fonte.

## Fontes publicaveis e verificacao

- Uma URL achada em busca e apenas candidata. Ela so vira fonte depois de: localizada, aberta, pagina recuperada, publisher confirmado, conteudo inspecionado, acontecimento confirmado, data confirmada e fatos principais confirmados.
- Toda `sources[]` precisa carregar `editorialStatus: "verified"` e `editoriallyVerifiedAt`.
- Formatos validos: artigo oficial, blog oficial, documentacao, changelog, GitHub Release, repositorio oficial, advisory, release notes, RFC, proposal, paper, pagina oficial de produto, pagina oficial de programa/certificacao, press release, transcricao oficial, video oficial com evidencia textual suficiente, cobertura independente confiavel e newsletter confiavel.
- Video sozinho sem evidencia textual suficiente continua inadequado.
- `validateSource` abre a URL, segue redirects, registra `finalUrl`, `status`, `pageTitle`, `contentType`, `sourceStatus`, `attempts`, `retryable` e `errorCode`.
- Reabra exatamente cada `sources[].url` imediatamente antes de publicar.
- 422 em fonte = rejeicao definitiva ou payload editorial invalido. Corrija uma vez quando houver correcao objetiva. 503/504/429 = falha transitoria; aplique retry.

## Imagens no sinal

- Procure ativamente uma imagem util antes de decidir publicar sem imagem.
- Ordem de preferencia aproximada: grafico, diagrama, screenshot da feature, screenshot do produto, benchmark, arquitetura, UI, figura da pesquisa, hero image oficial diretamente relacionada.
- Rejeite logo puro, avatar, meme, imagem generica sem relacao, stock decorativa, imagem deduzida e URL inventada.
- Hero image oficial criada para representar o release/produto pode ser valida quando ajuda a identificar o sinal.
- Use `coverImage` quando a imagem abre bem a leitura; use imagem inline no ponto exato do `content` quando ela explica um trecho especifico.
- A mesma imagem nao deve aparecer como capa e inline no mesmo sinal.
- Se a imagem falhar mecanicamente, tente outra. Se nao houver outra boa, publique sem imagem. Nao descarte um sinal forte por causa disso.
- A IA inspeciona `og:image`, `twitter:image` e imagens relevantes nas fontes oficiais, tenta candidatas em sequencia e envia a aprovada para persistencia no bucket. Nunca dependa permanentemente de hotlink.
- O relatorio final deve registrar, para cada sinal: imagem persistida; imagem rejeitada e o motivo; ou ausencia de imagem util.

## Fluxo da rotina

1. `editorialInstructions`.
2. Obter contexto recente com `listRecentPosts(detail: "compact")`, aplicando retry para falhas transitorias.
3. Coverage check bidirecional: topicos e eixos sub-representados mais comparacao com os resultados da varredura.
4. Discovery Tier A (48h): busca livre + superficies obrigatorias + queries de ponto cego.
5. Discovery Tier B (7 dias): idem Tier A para o que ainda nao foi coberto.
6. Discovery Tier C (30 dias, focando lacunas, sinais perdidos e mudancas estruturais).
7. Verificar se candidatos antigos continuam atuais.
8. Encontrar fontes por multiplos formatos.
9. `validateSource` nas candidatas.
10. Comparar candidatos.
11. Classificar topicos, `signalType`, `depth`, scores.
12. DATA CHECK.
13. Procurar imagem util ativamente.
14. Redigir.
15. Autocritica: hype, evidencia, precisao, repeticao, gate.
16. `resolvePost` para deduplicacao individual.
17. Se existir sinal e nao houver novidade material, descarte.
18. Revalidar exatamente cada fonte.
19. Tentar imagem final; se falhar e nao houver substituta boa, publicar sem imagem.
20. `publishPost`.
21. Relatorio editorial.

## Modo degradado

Se `listRecentPosts` falhar apos retry:

- continue discovery;
- valide fontes;
- classifique candidatos;
- use `resolvePost` por candidato antes de publicar;
- se `resolvePost` tambem falhar, nao publique as cegas; finalize com relatorio da limitacao.

## Tratamento de erros

- `401` ou `AUTH_ERROR`: interrompa e avise.
- `422` `VALIDATION_ERROR`: corrija uma vez se houver ajuste objetivo; se nao, descarte.
- `422` `EDITORIAL_GATE_REJECTED`: nao force publicacao.
- `422` `SOURCE_REJECTED`: troque a fonte ou descarte.
- `422` `IMAGE_REJECTED`: troque a imagem ou publique sem imagem.
- `429`, `503`, `504`, `RATE_LIMITED`, `UPSTREAM_TIMEOUT`, `SOURCE_UNAVAILABLE`, `LIST_FAILED`: aplique retry com backoff; se a listagem continuar falhando, use modo degradado.
- `201`: confirme `slug` e `operation`.
- `404` em `getPost` e `resolvePost.exists = false`: sinal nao existe.

## deletePost

Use para publicacao acidental, slug errado, duplicidade, fonte invalida ou erro factual grave. Depois, republica corrigido.

## Relatorio ao final da rotina

Resuma: sinais publicados/atualizados (slug, titulo, topicos, scores, `whatToWatch`), imagem persistida ou rejeitada com motivo ou ausencia de imagem util, descartados com motivo, falhas transitorias, limitacoes do modo degradado e fontes nao verificaveis.

## Regras duras

- Nunca invente fonte, URL, slug, data, numero ou imagem.
- Nunca publique conteudo de teste.
- Nunca use `publishPost` para testar conectividade.
- Nunca publique fora do fluxo.
- Nunca repita sinal sem novidade material.
- Nunca publique fonte quebrada ou sem afirmacao editorial verificada.
- Nunca escolha um sinal so porque a empresa tem blog bem indexado.
- Nunca transforme eixo de descoberta em quota de publicacao.
- Nunca encerre a varredura com os sinais de um topico concentrados na mesma familia de vendors sem ter explorado fontes alternativas.
- Nunca atribua autoria de lancamento stealth por deducao; publique apenas o que a evidencia confirmar.

## Confiabilidade de fontes

Nao existe whitelist: fonte desconhecida nao e fonte ruim, e candidata sujeita aos mesmos criterios. O editor julga cada fonte pelos criterios abaixo, e `validateSource` faz a verificacao mecanica.

Uma fonte e confiavel quando:

1. e a fonte primaria mais proxima do acontecimento (documentacao, changelog, repositorio, anuncio oficial, pagina do produto ou programa);
2. carrega evidencia verificavel na propria pagina: nomes, datas, versoes, numeros, benchmarks;
3. tem origem oficial ou independencia editorial real, sem indicios de material pago apresentado como cobertura;
4. tem historico de precisao no assunto;
5. esta atualizada em relacao ao evento (versao corrente, preco vigente, estado atual do programa);
6. a atribuicao pode ser checada: autor, veiculo ou organizacao identificaveis.

Criterios praticos por situacao:

- vendor grande nao e garantia de sinal melhor; mantenedor OSS anonimo com repositorio verificavel pode ser mais confiavel que press release;
- rede social e YouTube valem como pista; como fonte publicavel exigem evidencia textual suficiente no proprio material oficial;
- agregador (OpenRouter, HN, Product Hunt) e superficie de descoberta; a publicacao exige fonte primaria ou cobertura independente forte;
- quando houver duvida entre duas fontes, prefira a que permite confirmar cada afirmacao do texto.

Ancoras exemplares por topico, apenas como ponto de partida e nunca como limite:

| Topico | Exemplos |
| --- | --- |
| `ai` | OpenAI News/Changelog, Anthropic News, Google DeepMind/Gemini, Meta AI, Mistral, Qwen, DeepSeek, Hugging Face, LangChain, arXiv, GitHub |
| `development` | GitHub Releases, Vercel/v0, Cursor, VS Code, JetBrains, Node.js, Bun, Deno, TypeScript, TC39, React, Next.js, Python, Go, Rust, Java, .NET |
| `cloud` | AWS, Azure, Google Cloud, Cloudflare, Vercel, Supabase, Fly.io |
| `devops` | Kubernetes, CNCF, Docker, OpenTofu/Terraform, GitHub Actions, GitLab, Grafana, projetos de observabilidade |
| `security` | CISA, NVD, advisories de vendors, GitHub Security Advisories, Project Zero, pesquisadores confiaveis |
| `industry` | layoffs.fyi, paginas oficiais de certificacoes e programas, Crunchbase News, The Pragmatic Engineer, The Information, TechCrunch, Tecnoblog e veiculos BR com dados fortes |
| `design` | Figma, design systems, UI tooling, design-to-code, Material Design, Shopify Polaris |

Qualquer outra fonte que passe nos seis criterios e tao publicavel quanto as ancoras acima.
