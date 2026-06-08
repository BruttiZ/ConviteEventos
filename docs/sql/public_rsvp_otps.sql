-- Tabela para RSVP publico sem login.
-- O codigo nunca deve ser salvo em texto puro: a aplicacao salva apenas code_hash.

create table if not exists public.public_rsvp_otps (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    email text not null,
    code_hash text not null,
    expires_at timestamptz not null,
    consumed_at timestamptz null,
    attempts smallint not null default 0,
    ip_address inet null,
    user_agent text null,
    metadata jsonb null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists public_rsvp_otps_event_email_consumed_idx
    on public.public_rsvp_otps (event_id, email, consumed_at);

create index if not exists public_rsvp_otps_expires_at_idx
    on public.public_rsvp_otps (expires_at);

alter table public.public_rsvp_otps enable row level security;

-- Nao crie policy anon/authenticated para esta tabela.
-- O OTP deve ser criado e validado por uma API confiavel.
-- Se voce usar PostgREST/Edge Functions no Supabase, use service role apenas no servidor.
