/// <reference types="vite/client" />

/* eslint-disable @typescript-eslint/consistent-type-definitions */

interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_APP_NAME?: string;
    readonly VITE_DEMO_ADMIN_EMAIL?: string;
    readonly VITE_DEMO_ADMIN_NAME?: string;
    readonly VITE_DEMO_GUEST_EMAIL?: string;
    readonly VITE_DEMO_GUEST_NAME?: string;
    readonly VITE_DEMO_OWNER_EMAIL?: string;
    readonly VITE_DEMO_OWNER_NAME?: string;
    readonly VITE_SITE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPER_USER_EMAIL?: string;
    readonly VITE_SUPER_USER_PASSWORD?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
