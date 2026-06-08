import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Loader2, Mail, ShieldCheck, Sparkles, TicketCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SyntheticEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthSession, UserRole, roleLabel, storeSession } from '../../auth/session';

type AuthMode = 'login' | 'register';

type AuthResponse = {
    data: AuthSession;
};

const demoAccounts: {
    role: UserRole;
    title: string;
    description: string;
    email: string;
    icon: LucideIcon;
}[] = [
    {
        role: 'owner',
        title: 'Dono da festa',
        description: 'Cria eventos, convidados, temas e acompanha RSVP.',
        email: 'host@invitely.dev',
        icon: CalendarDays,
    },
    {
        role: 'guest',
        title: 'Convidado',
        description: 'Visualiza convite, confirma presença e usa QR Code.',
        email: 'guest@invitely.dev',
        icon: TicketCheck,
    },
    {
        role: 'platform_admin',
        title: 'Admin Invitely',
        description: 'Enxerga operação, tenants, saúde e governança.',
        email: 'admin@invitely.dev',
        icon: ShieldCheck,
    },
];

export function AuthPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<AuthMode>('login');
    const [role, setRole] = useState<UserRole>('owner');
    const [form, setForm] = useState({
        name: 'Novo produtor',
        email: 'host@invitely.dev',
        password: 'password',
    });

    const selectedAccount = useMemo(() => demoAccounts.find((account) => account.role === role), [role]);

    const auth = useMutation({
        mutationFn: async () => {
            const endpoint = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    role,
                    device_name: 'invitely-web',
                }),
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as { message?: string } | null;

                throw new Error(payload?.message ?? 'Não foi possível autenticar.');
            }

            return (await response.json()) as AuthResponse;
        },
        onSuccess: (payload) => {
            storeSession(payload.data);
            void navigate(payload.data.user.role === 'guest' ? '/events/invitely-launch-night' : '/admin');
        },
    });

    function chooseDemo(accountRole: UserRole, email: string) {
        setMode('login');
        setRole(accountRole);
        setForm((current) => ({ ...current, email, password: 'password' }));
    }

    function submit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
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
                            <Sparkles className="h-3.5 w-3.5 text-[#22D3EE]" />
                            Demo interativa
                        </span>
                        <h1 className="mt-6 max-w-full break-words text-2xl font-extrabold leading-tight tracking-normal min-[360px]:text-3xl sm:text-5xl lg:text-6xl">
                            Entre como cada perfil e navegue pela experiência real do produto.
                        </h1>
                        <p className="mt-5 max-w-full text-base leading-8 text-[#CBD5E1] sm:max-w-2xl">
                            Use os atalhos abaixo para brincar com permissões diferentes: quem organiza a festa, quem
                            foi convidado e quem administra a plataforma.
                        </p>
                    </motion.div>

                    <div className="hidden min-w-0 gap-3 sm:grid md:grid-cols-3">
                        {demoAccounts.map((account) => {
                            const Icon = account.icon;
                            const isSelected = account.role === role;

                            return (
                                <motion.button
                                    key={account.role}
                                    type="button"
                                    whileHover={{ y: -4 }}
                                    onClick={() => {
                                        chooseDemo(account.role, account.email);
                                    }}
                                    className={
                                        isSelected
                                            ? 'min-w-0 rounded-2xl border border-[#22D3EE] bg-[#0EA5E9]/15 p-4 text-left shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
                                            : 'min-w-0 rounded-2xl border border-[#263247] bg-[#121827]/80 p-4 text-left transition hover:border-[#8B5CF6]/60'
                                    }
                                >
                                    <Icon className="h-5 w-5 text-[#22D3EE]" />
                                    <div className="mt-3 font-bold">{account.title}</div>
                                    <p className="mt-2 text-sm leading-6 text-[#CBD5E1]">{account.description}</p>
                                </motion.button>
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
                                {mode === 'login' ? 'Acessar conta' : 'Criar conta demo'}
                            </h2>
                            <p className="mt-2 text-sm text-[#94A3B8]">
                                Perfil selecionado: <strong className="text-[#CBD5E1]">{roleLabel(role)}</strong>
                            </p>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-2 sm:hidden">
                            {demoAccounts.map((account) => {
                                const Icon = account.icon;

                                return (
                                    <button
                                        key={account.role}
                                        type="button"
                                        onClick={() => {
                                            chooseDemo(account.role, account.email);
                                        }}
                                        className={
                                            account.role === role
                                                ? 'grid min-h-20 place-items-center rounded-xl border border-[#22D3EE] bg-[#0EA5E9]/15 px-2 text-center text-[11px] font-bold text-white'
                                                : 'grid min-h-20 place-items-center rounded-xl border border-[#263247] bg-[#0B0F1A] px-2 text-center text-[11px] font-bold text-[#CBD5E1]'
                                        }
                                    >
                                        <Icon className="h-4 w-4 text-[#22D3EE]" />
                                        {account.role === 'owner'
                                            ? 'Dono'
                                            : account.role === 'guest'
                                              ? 'Convidado'
                                              : 'Admin'}
                                    </button>
                                );
                            })}
                        </div>

                        <form className="mt-5 grid gap-3" onSubmit={submit}>
                            {mode === 'register' ? (
                                <AuthInput
                                    label="Nome"
                                    value={form.name}
                                    onChange={(value) => {
                                        setForm({ ...form, name: value });
                                    }}
                                />
                            ) : null}
                            <AuthInput
                                label="E-mail"
                                type="email"
                                value={form.email}
                                onChange={(value) => {
                                    setForm({ ...form, email: value });
                                }}
                            />
                            <AuthInput
                                label="Senha"
                                type="password"
                                value={form.password}
                                onChange={(value) => {
                                    setForm({ ...form, password: value });
                                }}
                            />
                            <button
                                type="submit"
                                disabled={auth.isPending}
                                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] text-sm font-bold transition hover:scale-[1.03] disabled:opacity-60"
                            >
                                {auth.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="h-4 w-4" />
                                )}
                                {mode === 'login' ? 'Entrar' : 'Criar e entrar'}
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
                                {selectedAccount?.title}
                            </div>
                            <p className="mt-2 leading-6 text-[#CBD5E1]">{selectedAccount?.description}</p>
                            <p className="mt-3 text-[#94A3B8]">
                                Senha demo: <strong className="text-white">password</strong>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}

function AuthInput({
    label,
    value,
    onChange,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'email' | 'password';
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#CBD5E1]">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => {
                    onChange(event.target.value);
                }}
                className="h-12 w-full rounded-xl border border-[#263247] bg-[#060B1A] px-4 text-sm text-white outline-none transition placeholder:text-[#64748B] focus:border-[#22D3EE] focus:ring-2 focus:ring-[#8B5CF6]/30"
            />
        </label>
    );
}
