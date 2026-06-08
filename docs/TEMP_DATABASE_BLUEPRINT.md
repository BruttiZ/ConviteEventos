# TEMP - Blueprint de banco perfeito para o Invitely

Este documento é temporário e serve como guia de arquitetura de dados para o Invitely. A ideia é deixar claro como o banco deve ser estruturado para o app funcionar como uma plataforma SaaS multi-tenant profissional de eventos, convites digitais, RSVP e check-in por QR Code.

## Objetivo do banco

O banco precisa suportar:

- múltiplos tenants;
- múltiplos usuários por tenant;
- papéis diferentes: dono do evento, convidado e admin da plataforma;
- múltiplos eventos por tenant;
- templates e temas customizáveis;
- convidados por evento;
- RSVP por convidado;
- check-in por QR Code;
- auditoria;
- tokens de autenticação Sanctum;
- filas, cache e sessões.

## Regra principal de multi-tenancy

O `tenant_id` é o limite de isolamento dos dados.

Toda entidade operacional criada por um cliente deve pertencer a um tenant:

- eventos;
- templates privados;
- usuários donos/operadores;
- auditoria;
- futuras integrações;
- futuras configurações de cobrança.

Usuários com papel `platform_admin` podem ter `tenant_id = null`, porque administram a plataforma inteira.

## Tabelas essenciais atuais

### `tenants`

Representa uma organização/cliente dentro do SaaS.

Campos importantes:

- `id`: UUID.
- `name`: nome da organização.
- `slug`: identificador público e único.
- `domain`: domínio customizado opcional.
- `plan`: plano do tenant.
- `settings`: JSON com idioma, timezone, feature flags e preferências.

Índices esperados:

- `slug` único.
- `domain` único e nullable.

Registro demo obrigatório:

- `slug`: `demo`
- `name`: `Invitely Demo`
- `plan`: `community`

### `users`

Representa usuários autenticados.

Papéis atuais:

- `owner`: dono/organizador do evento.
- `guest`: convidado autenticado.
- `platform_admin`: administrador global da plataforma.

Campos importantes:

- `tenant_id`: nullable para admins globais.
- `name`
- `email`: único.
- `password`: hash.
- `role`

No portfolio publicado, os usuários são criados pelo Supabase Auth. O metadata do usuário deve conter:

```json
{
    "name": "Nome do usuário",
    "role": "owner"
}
```

Papéis públicos permitidos no cadastro:

- `owner`
- `guest`

O papel `platform_admin` deve ser atribuído manualmente por operação administrativa, nunca pelo formulário público.

### `event_templates`

Representa modelos reutilizáveis de evento.

Campos importantes:

- `tenant_id`: nullable para templates públicos/globais.
- `name`
- `slug`
- `category`
- `tokens`: JSON com design tokens.
- `schema`: JSON com capacidades do template.
- `is_public`: se pode ser usado por outros tenants.

Regra:

- `tenant_id + slug` deve ser único.

### `events`

Representa o evento principal.

Campos importantes:

- `tenant_id`: obrigatório.
- `template_id`: opcional.
- `name`
- `slug`
- `status`: `draft`, `published`, `closed`.
- `timezone`
- `starts_at`
- `ends_at`
- `venue_name`
- `address`
- `latitude`
- `longitude`
- `spotify_playlist_url`
- `hero`: JSON com título, subtítulo, imagem e eyebrow.
- `content`: JSON com agenda, hosts, dress code e notas.
- `theme`: JSON com modo, cor primária e cor de destaque.
- `gallery`: JSON com imagens.
- `seo`: JSON com título e descrição.
- `capacity`
- soft delete.

Índices esperados:

- `tenant_id + slug` único.
- `tenant_id + status + starts_at`.

Evento demo obrigatório:

- `slug`: `invitely-launch-night`
- `status`: `published`
- `venue_name`: `Atelier Vista`
- `invite_token` demo em pelo menos um convidado: `demo-invite-token`

### `guests`

Representa convidados vinculados a um evento.

Campos importantes:

- `event_id`: obrigatório.
- `name`
- `email`
- `phone`
- `status`: `invited`, `accepted`, `declined`, `checked_in`.
- `party_size`
- `max_companions`
- `invite_token`: único.
- `invited_at`
- `last_seen_at`
- `metadata`

Índices esperados:

- `event_id + status`.
- `event_id + email` único.
- `invite_token` único.

Regra importante:

O RSVP público não deve depender de login. Ele deve depender do `invite_token`.

### `rsvps`

Representa a resposta do convidado.

Campos importantes:

- `event_id`
- `guest_id`
- `status`: `accepted` ou `declined`.
- `companions`
- `message`
- `source`: `public`, `admin`, `import`.
- `answers`: JSON para perguntas customizadas.

Índices esperados:

- `event_id + guest_id` único.
- `event_id + status`.

Regra:

Cada convidado deve ter no máximo um RSVP por evento. Atualizações devem sobrescrever o RSVP anterior, não criar duplicidade.

### `check_ins`

Representa entrada/check-in no evento.

Campos importantes:

- `event_id`
- `guest_id`
- `checked_in_by`: usuário que realizou o check-in, nullable.
- `checked_in_at`
- `method`: `qr_code`, `manual`, `import`.
- `metadata`

Índice esperado:

- `event_id + guest_id` único.

Regra:

Um convidado deve ter no máximo um check-in por evento.

### `audit_logs`

Representa trilha de auditoria.

Campos importantes:

- `tenant_id`
- `actor_id`
- `action`
- `subject_type`
- `subject_id`
- `properties`
- `ip_address`
- `user_agent`

Índice esperado:

- `tenant_id + action`.

## Tabelas de infraestrutura

### `personal_access_tokens`

Usada pelo Laravel Sanctum para tokens de API.

Precisa existir para:

- login;
- sessão SPA via token Bearer;
- autenticação no dashboard.

### `jobs`, `job_batches`, `failed_jobs`

Usadas para filas.

Devem suportar:

- envio de e-mails;
- notificações;
- jobs de importação/exportação;
- processamento futuro de imagens.

### `cache`, `cache_locks`

Usadas quando cache via banco está habilitado.

No Docker atual, Redis também existe e deve ser preferido para cache/filas em produção.

### `sessions`

Usada pelo Laravel para sessão web quando necessário.

Mesmo com Sanctum token-based, a tabela pode continuar disponível para compatibilidade.

## Relacionamentos ideais

```text
Tenant 1 --- N User
Tenant 1 --- N Event
Tenant 1 --- N EventTemplate
Tenant 1 --- N AuditLog

EventTemplate 1 --- N Event
Event 1 --- N Guest
Event 1 --- N Rsvp
Event 1 --- N CheckIn

Guest 1 --- 1 Rsvp por evento
Guest 1 --- 1 CheckIn por evento

User 1 --- N CheckIn como checked_in_by
User 1 --- N AuditLog como actor
```

## Dados mínimos para o app de portfolio

Para o app funcionar como portfolio com dados de produto, o ambiente precisa ter pelo menos:

- 1 tenant de exemplo;
- usuários reais criados no Supabase Auth;
- 1 template de exemplo;
- 1 evento publicado;
- convidados de exemplo ou convidados reais importados;
- 1 convidado com token de convite válido;
- migrations completas;
- tabela `personal_access_tokens`.

## Comandos para recuperar dados locais

Se os dados locais do Laravel sumirem, rode:

Use:

```bash
docker compose exec app php artisan db:seed --force
docker compose exec app php artisan cache:clear
```

Para testar autenticação no portfolio, use o formulário real em `/login` com Supabase Auth configurado:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

## Reset completo de banco local

Use apenas quando puder apagar dados locais:

```bash
docker compose exec app php artisan migrate:fresh --seed
docker compose exec app php artisan cache:clear
```

## Melhorias futuras recomendadas

- Trocar campos `role` e `status` string por enums nativos ou casts fortes.
- Criar tabela `memberships` para usuários que participam de múltiplos tenants.
- Criar tabela `event_assets` para imagens e arquivos em vez de depender só de JSON.
- Criar tabela `event_questions` para formulários RSVP customizáveis.
- Criar tabela `event_theme_versions` para versionar personalizações visuais.
- Criar tabela `invitations` separada de `guests` se houver múltiplos convites por convidado.
- Criar tabela `webhooks` e `integrations` para SaaS real.
- Criar tabela `billing_subscriptions` para monetização.
- Criar índices parciais para eventos publicados e próximos eventos.
- Adicionar constraints de status quando o PostgreSQL for a fonte definitiva das regras.

## Critério de banco saudável

Um banco local saudável deve retornar linhas em:

```bash
docker compose exec app php artisan db:show --counts
```

Valores mínimos esperados para dados locais:

- `tenants`: 1+
- `users`: opcional quando a autenticação principal estiver no Supabase
- `events`: 1+
- `guests`: 30+
- `event_templates`: 1+

Se `users = 0`, o login Supabase ainda pode funcionar, desde que as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estejam configuradas.
