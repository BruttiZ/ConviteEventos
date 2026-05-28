# Architecture Overview

Invitely follows a pragmatic Clean Architecture approach. Laravel remains the delivery framework, but core product workflows are modeled as application actions with explicit DTOs and repository contracts.

## Boundaries

- HTTP controllers translate requests into DTOs and return resources.
- Actions execute business rules and orchestration.
- Repositories hide persistence details.
- Eloquent models represent database-backed entities and relationships.
- Policies enforce tenant ownership and role checks.
- Middleware resolves optional tenant context from `X-Tenant` or host domain.

## Tenancy

The first implementation uses single-database tenancy with `tenant_id` foreign keys. This is the right starting point for an open source SaaS foundation because it keeps operations simple while preserving clear data ownership. The repository layer is intentionally thin so the project can later move selected tenants to database-per-tenant or schema-per-tenant without rewriting product use cases.

## Domain Model

- `Tenant`: account/workspace boundary.
- `User`: admin actor inside a tenant.
- `Event`: public landing page and RSVP aggregate root.
- `Guest`: invitee with private token and party rules.
- `Rsvp`: immutable-ish response history surface, currently upserted per guest.
- `CheckIn`: unique event attendance confirmation.
- `EventTemplate`: reusable visual/content template.
- `AuditLog`: future compliance and security trail.

## Performance

Public event reads are cacheable by slug. Mutating RSVP or event state invalidates the relevant public cache key. Redis is used for cache, sessions and queues in Docker.

## Security

Admin APIs are protected by Sanctum and policies. Public RSVP is token-based, rate-limited and validates companion limits server-side. Production deployments should add signed QR payloads, email verification, CORS tightening and observability.
