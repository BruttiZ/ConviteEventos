# Changelog

## Próxima versão

- Redesenha a landing page como uma experiência SaaS premium em dark mode.
- Redesenha o dashboard com sidebar desktop, navegação mobile, métricas, gráfico de linha, distribuição de RSVP e cards de eventos.
- Redesenha o convite público com palco visual, RSVP reativo, etapas, feedback de confirmação e QR Code.
- Atualiza login/cadastro para a nova identidade visual.
- Atualiza README e documentação frontend com a nova direção visual.
- Adiciona build estático para Vercel sem quebrar o fluxo Laravel/Docker.
- Substitui as contas hardcoded da tela de login por cadastro e autenticação reais via Supabase Auth.

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue a ideia do Keep a Changelog e o versionamento seguirá SemVer quando o projeto começar a publicar releases.

## [Não lançado]

### Adicionado

- Documentação bilíngue inicial.
- Ambiente Docker com Laravel, Nginx, PostgreSQL, Redis, Mailpit e MinIO.
- Página pública de evento demo com RSVP.
- Painel administrativo inicial.
- Pipeline CI com testes, análise estática e build frontend.

### Melhorado

- Onboarding Docker validado localmente.
- Comandos de análise PHPStan com limite de memória explícito.
- Diretório `tests/Unit` preservado para execução consistente no CI.
- Experiência mobile da landing pública com CTA fixo, RSVP mais claro e seções responsivas.
