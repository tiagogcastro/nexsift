# NexSift Roadmap

## Milestone 1: product surface (done)

1. project foundation
2. design system
3. localized landing (pt-BR default without prefix)
4. blog archive
5. article layout
6. topic pages
7. S3 content provider
8. SEO, RSS and structured data
9. PostHog integration (Cloud)
10. local MiniStack flow

Goal: validate product, design and content at zero additional infrastructure cost.

## Milestone 2: local cloud parity (done)

1. MiniStack with persistent S3 and Lambda execution
2. Terraform local apply
3. web reading from local S3
4. publication Lambda invocation via the direct publish command

Goal: exercise the AWS-shaped flow without using a real AWS account.

## Milestone 3: assisted publishing

1. provision AWS S3 and publication Lambda
2. configure Function URL
3. configure secure publication token
4. create NexSift Editor GPT
5. add GPT Action from `docs/openapi.yaml`
6. publish approved posts from ChatGPT

Goal: use the existing ChatGPT subscription for editorial work while keeping publication infrastructure ready for automation.

## Milestone 4: autonomous editorial pipeline

1. source registry
2. feed ingestion
3. deterministic filtering and deduplication
4. OpenAI API integration
5. ranking
6. writing
7. review
8. EventBridge Scheduler
9. draft and run history
10. guarded auto-publish

Goal: automate only after the product and editorial process are proven.
