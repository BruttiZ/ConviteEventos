import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Loader2, Mail, ShieldCheck, Sparkles, TicketCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SyntheticEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthSession, UserRole, storeSession } from '../../auth/session';
import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase';

type AuthMode = 'login' | 'register';
type PublicRole = Exclude<UserRole, 'platform_admin'>;

const roleOptions: {
    role: PublicRole;
    title: string;
    description: string;
    icon: LucideIcon;
}[] = [
    {
        role: 'owner',
        title: 'Organizador',
        description: 'Crie eventos, convites digitais, convidados, RSVP e check-in.',
        icon: CalendarDays,
    },
    {
        role: 'guest',
        title: 'Convidado',
        description: 'Acesse convites, confirme presença e acompanhe seu QR Code.',
        icon: TicketCheck,
    },
];

export function AuthPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<AuthMode>('login');
    const [role, setRole] = useState<PublicRole>('owner');
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
    });

    const auth = useMutation({
        mutationFn: async () => {
            const supabase = getSupabaseClient();

            if (mode === 'register') {
                const { data, error } = await supabase.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: {
                        data: {
                            name: form.name,
                            role,
                        },
                    },
                });

                if (error) {
                    throw new Error(error.message);
                }

                if (!data.session || !data.user) {
                    throw new Error('Cadastro criado. Confirme seu e-mail antes de acessar.');
                }

                return toAuthSession(data.session.access_token, data.user.id, form.name, form.email, role);
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password,
            });

            if (error) {
                throw new Error(error.message);
            }

            const metadata = data.user.user_metadata;
            const userRole = normalizeRole(metadata.role);
            const userName =
                typeof metadata.name === 'string' && metadata.name.trim().length > 0 ? metadata.name : form.email;

            return toAuthSession(data.session.access_token, data.user.id, userName, form.email, userRole);
        },
        onSuccess: (session) => {
            storeSession(session);
            void navigate(session.user.role === 'guest' ? '/events/invitely-launch-night' : '/admin');
        },
    });

    const canSubmit =
        form.email.includes('@') && form.password.length >= 6 && (mode === 'login' || form.name.trim().length >= 2);

    function submit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!canSubmit) {
            return;
        }

        auth.mutate();
    }

    return (
        <main className="min-h-screen overflow-x-hidden bg-[#060B1A] text-white">
            <section className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-5 sm:px-6 lg:min-h-screen lg:grid-cols-[minmax(0,1fr)_440px] lg:px-8">
                <div className="absolute left-16 top-10 h-72 w-72 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
                <div className="absolute bottom-10 right-16 h-72 w-72 rounded-full bg-[#22D3EE]/10 blur-3xl" />

                <div className="relative z-10 flex min-w-0 flex-col gap-8 py-4 lg:justify-between">
                    <header className="flex min-w-0 items-center justify-between gap-3">
                        <Link to="/" className="inline-flex min-w-0 items-center gap-2 text-sm font-bold">
                            <Sparkles className="h-5 w-5 text-[#A78BFA]" />
                            Invitely
                        </Link>
                        <Link
                            to="/events/invitely-launch-night"
                            className="hidden shrink-0 rounded-xl border border-[#263247] bg-[#121827]/80 px-3 py-2 text-xs font-semibold transition hover:scale-[1.03] min-[420px]:inline-flex sm:px-4 sm:text-sm"
                        >
                            Ver convite
                        </Link>
                    </header>

                    <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="w-full max-w-[calc(100vw-2rem)] py-4 sm:max-w-3xl sm:py-8 lg:py-14"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#263247] bg-[#121827]/80 px-3 py-1 text-xs text-[#CBD5E1]">
                            <ShieldCheck className="h-3.5 w-3.5 text-[#22D3EE]" />
                            Autenticação real com Supabase
                        </span>
                        <h1 className="mt-6 max-w-full break-words text-2xl font-extrabold leading-tight tracking-normal min-[360px]:text-3xl sm:text-5xl lg:text-6xl">
                            Crie sua conta e gerencie eventos com uma experiência SaaS completa.
                        </h1>
                        <p className="mt-5 max-w-full text-base leading-8 text-[#CBD5E1] sm:max-w-2xl">
                            O Invitely usa cadastro e login reais, sessões persistentes e perfis de acesso para
                            demonstrar um fluxo profissional de produto em produção.
                        </p>
                    </motion.div>

                    <div className="hidden min-w-0 gap-3 sm:grid md:grid-cols-2">
                        {roleOptions.map((option) => {
                            const Icon = option.icon;

                            return (
                                <motion.div
                                    key={option.role}
                                    whileHover={{ y: -4 }}
                                    className="min-w-0 rounded-2xl border border-[#263247] bg-[#121827]/80 p-4"
                                >
                                    <Icon className="h-5 w-5 text-[#22D3EE]" />
                                    <div className="mt-3 font-bold">{option.title}</div>
                                    <p className="mt-2 text-sm leading-6 text-[#CBD5E1]">{option.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div className="relative z-10 flex min-w-0 items-start pb-6 lg:items-center lg:pb-0">
                    <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.45 }}
                        className="w-full rounded-3xl border border-[#263247] bg-[#121827]/90 p-5 shadow-2xl backdrop-blur-xl"
                    >
                        <div className="grid grid-cols-2 rounded-xl bg-[#0B0F1A] p-1">
                            {(['login', 'register'] as const).map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => {
                                        setMode(item);
                                        auth.reset();
                                    }}
                                    className={
                                        mode === item
                                            ? 'h-11 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] text-sm font-bold text-white'
                                            : 'h-11 rounded-lg text-sm font-bold text-[#94A3B8]'
                                    }
                                >
                                    {item === 'login' ? 'Login' : 'Cadastro'}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6">
                            <h2 className="text-xl font-bold">
                                {mode === 'login' ? 'Acessar sua conta' : 'Criar sua conta'}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                                {mode === 'login'
                                    ? 'Entre com o e-mail e senha cadastrados no Supabase.'
                                    : 'Escolha o perfil inicial da conta. Administradores da plataforma devem ser promovidos manualmente.'}
                            </p>
                        </div>

                        {!isSupabaseConfigured() ? (
                            <div className="mt-5 rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-sm leading-6 text-[#FDE68A]">
                                Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para habilitar login e
                                cadastro.
                            </div>
                        ) : null}

                        {mode === 'register' ? (
                            <div className="mt-5 grid grid-cols-2 gap-2">
                                {roleOptions.map((option) => {
                                    const Icon = option.icon;

                                    return (
                                        <button
                                            key={option.role}
                                            type="button"
                                            onClick={() => {
                                                setRole(option.role);
                                            }}
                                            className={
                                                option.role === role
                                                    ? 'grid min-h-20 place-items-center rounded-xl border border-[#22D3EE] bg-[#0EA5E9]/15 px-2 text-center text-xs font-bold text-white'
                                                    : 'grid min-h-20 place-items-center rounded-xl border border-[#263247] bg-[#0B0F1A] px-2 text-center text-xs font-bold text-[#CBD5E1]'
                                            }
                                        >
                                            <Icon className="h-4 w-4 text-[#22D3EE]" />
                                            {option.title}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}

                        <form className="mt-5 grid gap-3" onSubmit={submit}>
                            {mode === 'register' ? (
                                <AuthInput
                                    label="Nome"
                                    value={form.name}
                                    autoComplete="name"
                                    onChange={(value) => {
                                        setForm({ ...form, name: value });
                                    }}
                                />
                            ) : null}
                            <AuthInput
                                label="E-mail"
                                type="email"
                                value={form.email}
                                autoComplete="email"
                                onChange={(value) => {
                                    setForm({ ...form, email: value });
                                }}
                            />
                            <AuthInput
                                label="Senha"
                                type="password"
                                value={form.password}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                onChange={(value) => {
                                    setForm({ ...form, password: value });
                                }}
                            />
                            <button
                                type="submit"
                                disabled={auth.isPending || !canSubmit}
                                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] text-sm font-bold transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {auth.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="h-4 w-4" />
                                )}
                                {mode === 'login' ? 'Entrar' : 'Cadastrar e entrar'}
                            </button>
                            {auth.isError ? (
                                <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-sm text-red-100">
                                    {auth.error.message}
                                </p>
                            ) : null}
                        </form>

                        <div className="mt-5 rounded-2xl border border-[#263247] bg-[#0B0F1A] p-4 text-sm">
                            <div className="flex items-center gap-2 font-bold">
                                <Mail className="h-4 w-4 text-[#22D3EE]" />
                                Sessão protegida
                            </div>
                            <p className="mt-2 leading-6 text-[#CBD5E1]">
                                O token retornado pelo Supabase é salvo localmente para liberar o dashboard e preservar
                                a navegação entre páginas.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}

function normalizeRole(role: unknown): UserRole {
    return role === 'guest' || role === 'platform_admin' || role === 'owner' ? role : 'owner';
}

function toAuthSession(token: string, id: string, name: string, email: string, role: UserRole): AuthSession {
    return {
        token,
        token_type: 'Bearer',
        user: {
            id,
            name,
            email,
            role,
            tenant_id: null,
        },
    };
}

function AuthInput({
    label,
    value,
    onChange,
    type = 'text',
    autoComplete,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'email' | 'password';
    autoComplete?: string;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#CBD5E1]">{label}</span>
            <input
                type={type}
                value={value}
                autoComplete={autoComplete}
                onChange={(event) => {
                    onChange(event.target.value);
                }}
                className="h-12 w-full rounded-xl border border-[#263247] bg-[#060B1A] px-4 text-sm text-white outline-none transition placeholder:text-[#64748B] focus:border-[#22D3EE] focus:ring-2 focus:ring-[#8B5CF6]/30"
            />
        </label>
    );
}
