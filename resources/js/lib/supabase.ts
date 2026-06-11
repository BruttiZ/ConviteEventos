import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
    const hasUrl = Boolean(import.meta.env.VITE_SUPABASE_URL);
    const hasKey = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);
    const isConfigured = hasUrl && hasKey;

    // Log for debugging
    if (!isConfigured) {
        console.warn(
            '⚠️ Supabase não configurado. URLs, VITE_SUPABASE_URL:',
            hasUrl,
            'VITE_SUPABASE_ANON_KEY:',
            hasKey,
        );
    }

    return isConfigured;
}

export function getSupabaseClient(): SupabaseClient {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar login e cadastro normal. ' +
                'Você ainda pode usar o Super User (admin@invitely.local) se configurar VITE_SUPER_USER_EMAIL e VITE_SUPER_USER_PASSWORD.',
        );
    }

    client ??= createClient(supabaseUrl, supabaseAnonKey);

    return client;
}
