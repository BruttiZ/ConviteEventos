# Changelog

## Proxima versao

- Redesenha a landing page como uma experiencia SaaS premium em dark mode.
- Redesenha o dashboard com sidebar desktop, navegacao mobile, metricas, grafico de linha, distribuicao de RSVP e cards de eventos.
- Redesenha o convite publico com palco visual, RSVP reativo, etapas, feedback de confirmacao e QR Code.
- Atualiza login/cadastro para a nova identidade visual.
- Atualiza README e documentacao frontend com a nova direcao visual.
- Adiciona build estatico para Vercel sem quebrar o fluxo Laravel/Docker.
- Substitui as contas hardcoded da tela de login por cadastro e autenticacao reais via Supabase Auth.
- Melhora o cadastro com confirmacao de senha, medidor de senha forte, botoes para visualizar senha e redirect correto de confirmacao por e-mail no Supabase.

Todas as mudancas relevantes deste projeto serao documentadas neste arquivo.

O formato segue a ideia do Keep a Changelog e o versionamento seguira SemVer quando o projeto comecar a publicar releases.

## [Nao lancado]

### Adicionado

- Documentacao bilingue inicial.
- Ambiente Docker com Laravel, Nginx, PostgreSQL, Redis, Mailpit e MinIO.
- Pagina publica de evento demo com RSVP.
- Painel administrativo inicial.
- Pipeline CI com testes, analise estatica e build frontend.

### Melhorado

- Onboarding Docker validado localmente.
- Comandos de analise PHPStan com limite de memoria explicito.
- Diretorio `tests/Unit` preservado para execucao consistente no CI.
- Experiencia mobile da landing publica com CTA fixo, RSVP mais claro e secoes responsivas.
