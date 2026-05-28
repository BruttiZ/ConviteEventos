# Política de segurança

## Versões suportadas

O projeto ainda está em fase inicial. Correções de segurança serão aplicadas na branch `main` até a primeira versão estável.

| Versão           | Suporte |
| ---------------- | ------- |
| `main`           | Sim     |
| Releases antigas | Não     |

## Como reportar vulnerabilidades

Não abra uma issue pública para vulnerabilidades.

Envie um relatório privado ao mantenedor com:

- Descrição do problema.
- Passos para reproduzir.
- Impacto esperado.
- Arquivos, rotas ou endpoints afetados.
- Sugestão de correção, se houver.

## Escopo

Áreas relevantes:

- Autenticação e autorização.
- Isolamento multi-tenant.
- Uploads e storage S3/MinIO.
- Rate limiting.
- CSRF e headers de segurança.
- Validação e sanitização de entrada.
- Exposição de dados pessoais de convidados.

## Boas práticas do projeto

- Nunca commitar `.env` ou segredos.
- Usar Form Requests para validação.
- Usar Policies para acesso a recursos privados.
- Evitar logs com dados sensíveis.
- Manter dependências atualizadas.
- Rodar testes e análise estática antes de abrir pull requests.
