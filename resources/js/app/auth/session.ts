export type UserRole = 'owner' | 'guest' | 'platform_admin';

export type AuthUser = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    tenant_id: string | null;
};

export type AuthSession = {
    token: string;
    token_type: 'Bearer';
    user: AuthUser;
};

const storageKey = 'invitely.session';

export function getStoredSession(): AuthSession | null {
    const rawSession = window.localStorage.getItem(storageKey);

    if (!rawSession) {
        return null;
    }

    try {
        return JSON.parse(rawSession) as AuthSession;
    } catch {
        window.localStorage.removeItem(storageKey);

        return null;
    }
}

export function storeSession(session: AuthSession): void {
    window.localStorage.setItem(storageKey, JSON.stringify(session));
}

export function clearSession(): void {
    window.localStorage.removeItem(storageKey);
}

export function roleLabel(role: UserRole): string {
    return {
        owner: 'Dono do evento',
        guest: 'Convidado',
        platform_admin: 'Admin da plataforma',
    }[role];
}
