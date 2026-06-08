import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Eye,
    EyeOff,
    Loader2,
    PartyPopper,
    QrCode,
    ShieldCheck,
    Sparkles,
    TicketCheck,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SyntheticEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthSession, UserRole, roleLabel, storeSession } from '../../auth/session';
import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase';
import { retryWithExponentialBackoff } from '../../../lib/retry';

type AuthMode = 'login' | 'register';

type AuthMutationResult =
    | {
          kind: 'authenticated';
          session: AuthSession;
      }
    | {
          kind: 'pending_confirmation';
          message: string;
      };

const roleOptions: {
    role: UserRole;
    title: string;
    shortTitle: string;
    description: string;
    registerHint: string;
    email: string;
    defaultName: string;
    gradient: string;
    icon: LucideIcon;
}[] = [
    {
        role: 'platform_admin',
        title: 'Admin Invitely',
        shortTitle: 'Admin',
        description: 'Cuida do software, tenants, saude operacional, suporte e governanca.',
        registerHint: 'Perfil interno para operar a plataforma e monitorar clientes.',
        email: 'admin@invitely.dev',
        defaultName: 'Invitely Admin',
        gradient: 'from-[#A78BFA] to-[#0EA5E9]',
        icon: ShieldCheck,
    },
    {
        role: 'owner',
        title: 'Organizador da festa',
        shortTitle: 'Organizador',
        description: 'Cria eventos, gerencia convidados, escolhe temas e acompanha RSVP.',
        registerHint: 'Ideal para cerimonialistas, anfitrioes e empresas que vendem eventos.',
        email: 'host@invitely.dev',
        defaultName: 'Marina Host',
        gradient: 'from-[#8B5CF6] to-[#22D3EE]',
        icon: CalendarDays,
    },
    {
        role: 'guest',
        title: 'Convidado',
        shortTitle: 'Convidado',
        description: 'Ve o convite, confirma presenca, salva QR Code e acompanha detalhes.',
        registerHint: 'Perfeito para simular a experiencia de quem recebeu o convite.',
        email: 'guest@invitely.dev',
        defaultName: 'Lucas Convidado',
        gradient: 'from-[#22C55E] to-[#22D3EE]',
        icon: TicketCheck,
    },
];

const previewMetrics = [
    { label: 'Eventos', value: '24', icon: CalendarDays },
    { label: 'Convidados', value: '1.204', icon: UsersRound },
    { label: 'RSVP', value: '76%', icon: BarChart3 },
    { label: 'Check-ins', value: '846', icon: QrCode },
];

function destinationFor(role: UserRole): string {
    return {
        owner: '/organizador',
        guest: '/convidado',
        platform_admin: '/admin',
    }[role];
}

function demoSessionFor(role: UserRole, name: string, email: string): AuthSession {
    return {
        token: `demo-${role}-${Date.now().toString()}`,
        token_type: 'Bearer',
        user: {
            id: `demo-${role}`,
            name,
            email,
            role,
            tenant_id: role === 'platform_admin' ? null : 'demo',
        },
    };
}

function normalizeRole(role: unknown): UserRole {
    return role === 'guest' || role === 'platform_admin' || role === 'owner' ? role : 'owner';
}

function formatErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
        return 'Muitas tentativas. Aguarde alguns momentos e tente novamente.';
    }

    if (message.includes('user already exists')) {
        return 'Este e-mail ja esta cadastrado. Faca login em vez disso.';
    }

    if (message.includes('invalid email')) {
        return 'Formato de e-mail invalido.';
    }

    if (message.includes('weak password')) {
        return 'Senha muito fraca. Use letras, numeros e caracteres especiais.';
    }

    return error.message;
}

export function AuthPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<AuthMode>('login');
    const [role, setRole] = useState<UserRole>('owner');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: 'Marina Host',
        email: 'host@invitely.dev',
        password: 'password',
        passwordConfirmation: 'password',
        partyName: 'Invitely Launch Night',
    });

    const selectedAccount = useMemo(() => roleOptions.find((account) => account.role === role), [role]);
    const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);
    const passwordsMatch = form.password.length > 0 && form.password === form.passwordConfirmation;
    const isRegisterValid =
        form.name.trim().length >= 2 && form.email.includes('@') && form.password.length >= 6 && passwordsMatch;
    const canSubmit = mode === 'login' ? form.email.includes('@') && form.password.length >= 6 : isRegisterValid;

    const auth = useMutation({
        mutationFn: async (): Promise<AuthMutationResult> => {
            setStatusMessage(null);

            const demoAccount = roleOptions.find((account) => account.email === form.email.trim());
            const superUserEmail = import.meta.env.VITE_SUPER_USER_EMAIL;
            const superUserPassword = import.meta.env.VITE_SUPER_USER_PASSWORD;
            const isSuperUserAttempt =
                mode === 'login' &&
                superUserEmail &&
                form.email.trim() === superUserEmail.trim() &&
                form.password === superUserPassword;

            if (mode === 'login' && form.password === 'password' && demoAccount) {
                return {
                    kind: 'authenticated',
                    session: demoSessionFor(demoAccount.role, demoAccount.defaultName, demoAccount.email),
                };
            }

            if (isSuperUserAttempt) {
                return {
                    kind: 'authenticated',
                    session: demoSessionFor('platform_admin', 'Admin Invitely', form.email.trim()),
                };
            }

            if (!isSupabaseConfigured()) {
                if (mode === 'register') {
                    return {
                        kind: 'authenticated',
                        session: demoSessionFor(role, form.name.trim(), form.email.trim()),
                    };
                }

                throw new Error('Supabase nao esta configurado. Use as contas demo com senha password.');
            }

            const supabase = getSupabaseClient();

            if (mode === 'register') {
                if (!isRegisterValid) {
                    throw new Error('Preencha o cadastro e confirme a senha corretamente.');
                }

                const { data, error } = await retryWithExponentialBackoff(
                    () =>
                        supabase.auth.signUp({
                            email: form.email,
                            password: form.password,
                            options: {
                                data: {
                                    name: form.name.trim(),
                                    role,
                                    party_name: form.partyName.trim(),
                                },
                            },
                        }),
                    {
                        maxAttempts: 3,
                        baseDelayMs: 2000,
                        maxDelayMs: 10000,
                    },
                );

                if (error) {
                    throw new Error(error.message);
                }

                if (data.user && !data.session) {
                    return {
                        kind: 'pending_confirmation',
                        message: 'Cadastro criado. Confirme seu e-mail para entrar.',
                    };
                }

                if (data.session && data.user) {
                    return {
                        kind: 'authenticated',
                        session: demoSessionFor(role, form.name.trim(), form.email.trim()),
                    };
                }

                throw new Error('Erro ao criar conta. Tente novamente.');
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

            return {
                kind: 'authenticated',
                session: {
                    token: data.session.access_token,
                    token_type: 'Bearer',
                    user: {
                        id: data.user.id,
                        name: userName,
                        email: form.email,
                        role: userRole,
                        tenant_id: null,
                    },
                },
            };
        },
        onSuccess: (payload) => {
            if (payload.kind === 'pending_confirmation') {
                setStatusMessage(payload.message);

                return;
            }

            storeSession(payload.session);
            void navigate(destinationFor(payload.session.user.role));
        },
    });

    function chooseDemo(account: (typeof roleOptions)[number]) {
        setMode('login');
        setRole(account.role);
        setStatusMessage(null);
        setForm((current) => ({
            ...current,
            name: account.defaultName,
            email: account.email,
            password: 'password',
            passwordConfirmation: 'password',
        }));
    }

    function chooseRegister(account: (typeof roleOptions)[number]) {
        setMode('register');
        setRole(account.role);
        setStatusMessage(null);
        setForm((current) => ({
            ...current,
            name: account.defaultName,
            email: account.email.replace('@invitely.dev', `+novo-${Date.now().toString().slice(-4)}@invitely.dev`),
            password: 'password',
            passwordConfirmation: 'password',
        }));
    }

    function submit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        auth.mutate();
    }

    return (
        <main className="min-h-screen overflow-hidden bg-[#060B1A] text-white">
            <section className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="absolute left-1/2 top-0 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
                <div className="absolute bottom-12 right-0 h-72 w-[34rem] rounded-full bg-[#22D3EE]/10 blur-3xl" />
                <div className="absolute left-0 top-64 h-72 w-72 rounded-full bg-[#0EA5E9]/10 blur-3xl" />

                <header className="relative z-10 flex items-center justify-between rounded-2xl border border-[#263247]/70 bg-[#0B0F1A]/70 px-4 py-3 backdrop-blur-xl">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold">
                        <Sparkles className="h-5 w-5 text-[#8B5CF6]" />
                        Invitely
                    </Link>
                    <nav className="hidden items-center gap-7 text-sm text-[#94A3B8] md:flex">
                        <Link to="/#beneficios" className="transition hover:text-white">
                            Recursos
                        </Link>
                        <button className="inline-flex items-center gap-1 transition hover:text-white">
                            Solucoes <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <Link to="/#precos" className="transition hover:text-white">
                            Precos
                        </Link>
                        <Link to="/#blog" className="transition hover:text-white">
                            Blog
                        </Link>
                    </nav>
                    <div className="flex items-center gap-2">
                        <Link
                            to="/events/invitely-launch-night"
                            className="hidden text-sm text-[#94A3B8] transition hover:text-white sm:block"
                        >
                            Ver convite
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setMode('register');
                            }}
                            className="inline-flex h-10 items-center rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-4 text-sm font-semibold transition hover:scale-[1.03]"
                        >
                            Criar conta
                        </button>
                    </div>
                </header>

                <div className="relative z-10 grid min-h-[calc(100vh-6rem)] gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:py-16">
                    <div className="min-w-0">
                        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#263247] bg-[#121827]/80 px-3 py-1 text-xs text-[#CBD5E1]">
                                <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />
                                Login multi-perfil
                            </span>
                            <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                                Entre como <span className="text-[#A78BFA]">admin</span>, organizador ou convidado.
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-8 text-[#CBD5E1] sm:text-lg">
                                Uma experiencia elegante para testar permissoes diferentes, navegar por dashboards
                                separados e sentir o produto funcionando mesmo em modo demo.
                            </p>
                            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedAccount) {
                                            chooseDemo(selectedAccount);
                                        }
                                    }}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-5 text-sm font-bold transition hover:scale-[1.03]"
                                >
                                    Usar perfil selecionado <ArrowRight className="h-4 w-4" />
                                </button>
                                <Link
                                    to="/"
                                    className="inline-flex h-12 items-center justify-center rounded-lg border border-[#263247] bg-[#121827]/70 px-5 text-sm font-bold transition hover:scale-[1.03] hover:border-[#22D3EE]/60"
                                >
                                    Ver landing
                                </Link>
                            </div>
                        </motion.div>

                        <div className="mt-9 grid gap-4 md:grid-cols-3">
                            {roleOptions.map((account, index) => {
                                const Icon = account.icon;
                                const isSelected = account.role === role;

                                return (
                                    <motion.article
                                        key={account.role}
                                        initial={false}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ y: -6 }}
                                        className={
                                            isSelected
                                                ? 'rounded-2xl border border-[#22D3EE]/70 bg-[#0EA5E9]/15 p-5 shadow-[0_0_0_1px_rgba(34,211,238,0.22),0_24px_70px_rgba(14,165,233,0.18)]'
                                                : 'rounded-2xl border border-[#263247] bg-[#121827]/80 p-5 shadow-xl backdrop-blur'
                                        }
                                    >
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${account.gradient} text-white shadow-lg`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h2 className="mt-5 text-lg font-bold">{account.title}</h2>
                                        <p className="mt-3 min-h-24 text-sm leading-7 text-[#CBD5E1]">
                                            {account.description}
                                        </p>
                                        <div className="mt-5 grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    chooseDemo(account);
                                                }}
                                                className={
                                                    isSelected && mode === 'login'
                                                        ? 'h-10 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] text-sm font-bold text-white'
                                                        : 'h-10 rounded-lg border border-[#263247] bg-[#0B0F1A] text-sm font-bold text-white transition hover:border-[#22D3EE]/60'
                                                }
                                            >
                                                Login
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    chooseRegister(account);
                                                }}
                                                className={
                                                    isSelected && mode === 'register'
                                                        ? 'h-10 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] text-sm font-bold text-white'
                                                        : 'h-10 rounded-lg text-sm font-bold text-[#CBD5E1] transition hover:bg-[#1A1F2E] hover:text-white'
                                                }
                                            >
                                                Cadastro
                                            </button>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>
                    </div>

                    <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.45 }}
                        className="relative"
                    >
                        <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#8B5CF6]/20 via-[#22D3EE]/10 to-transparent blur-2xl" />
                        <div className="relative overflow-hidden rounded-2xl border border-[#263247] bg-[#0B0F1A]/90 p-5 shadow-2xl backdrop-blur-xl">
                            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#8B5CF6]/20 blur-2xl" />
                            <div className="relative">
                                <div className="flex rounded-xl bg-[#060B1A] p-1">
                                    {(['login', 'register'] as const).map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => {
                                                setMode(item);
                                            }}
                                            className={
                                                mode === item
                                                    ? 'h-11 flex-1 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] text-sm font-bold text-white shadow-lg'
                                                    : 'h-11 flex-1 rounded-lg text-sm font-semibold text-[#94A3B8] transition hover:text-white'
                                            }
                                        >
                                            {item === 'login' ? 'Login' : 'Cadastro'}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-6">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#22D3EE]">
                                        {roleLabel(role)}
                                    </p>
                                    <h2 className="mt-2 text-2xl font-extrabold">
                                        {mode === 'login'
                                            ? `Entrar como ${selectedAccount?.shortTitle}`
                                            : `Cadastrar ${selectedAccount?.shortTitle}`}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                                        {mode === 'login'
                                            ? 'Use uma conta demo ou suas credenciais reais.'
                                            : 'Crie uma conta demo clicavel para explorar o produto.'}
                                    </p>
                                </div>

                                <form className="mt-6 grid gap-3" onSubmit={submit}>
                                    {mode === 'register' && (
                                        <>
                                            <InputField
                                                value={form.name}
                                                onChange={(value) => {
                                                    setForm({ ...form, name: value });
                                                }}
                                                placeholder="Nome"
                                            />
                                            {role === 'owner' && (
                                                <InputField
                                                    value={form.partyName}
                                                    onChange={(value) => {
                                                        setForm({ ...form, partyName: value });
                                                    }}
                                                    placeholder="Nome da festa"
                                                />
                                            )}
                                            {role === 'platform_admin' && <ReadonlyField value="Operacao da plataforma" />}
                                            {role === 'guest' && <ReadonlyField value="demo-invite-token" />}
                                        </>
                                    )}

                                    <InputField
                                        type="email"
                                        value={form.email}
                                        onChange={(value) => {
                                            setForm({ ...form, email: value });
                                        }}
                                        placeholder="email@exemplo.com"
                                    />
                                    <PasswordField
                                        value={form.password}
                                        onChange={(value) => {
                                            setForm({ ...form, password: value });
                                        }}
                                    />

                                    {mode === 'register' && (
                                        <>
                                            <PasswordField
                                                value={form.passwordConfirmation}
                                                onChange={(value) => {
                                                    setForm({ ...form, passwordConfirmation: value });
                                                }}
                                                placeholder="Confirmar senha"
                                            />
                                            <PasswordStrengthMeter strength={passwordStrength} />
                                            {!passwordsMatch && form.passwordConfirmation.length > 0 && (
                                                <FeedbackMessage message="As senhas ainda nao conferem." tone="warning" />
                                            )}
                                        </>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={!canSubmit || auth.isPending}
                                        className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-4 text-sm font-bold text-white shadow-lg shadow-[#0EA5E9]/20 transition hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        {auth.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ArrowRight className="h-4 w-4" />
                                        )}
                                        {mode === 'login' ? 'Entrar na area' : 'Criar e abrir area'}
                                    </button>

                                    {auth.isError && (
                                        <FeedbackMessage message={formatErrorMessage(auth.error)} tone="warning" />
                                    )}
                                    {statusMessage && <FeedbackMessage message={statusMessage} tone="success" />}
                                </form>

                                <div className="mt-5 grid gap-3 rounded-2xl border border-[#263247] bg-[#121827] p-4 text-sm text-[#CBD5E1]">
                                    <div>
                                        <div className="font-semibold text-white">{selectedAccount?.title}</div>
                                        <p className="mt-1 leading-6 text-[#94A3B8]">{selectedAccount?.registerHint}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                                        Senha demo: <strong className="text-white">password</strong>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {role === 'owner' && <PartyPopper className="h-4 w-4 text-[#22D3EE]" />}
                                        {role === 'guest' && <TicketCheck className="h-4 w-4 text-[#22C55E]" />}
                                        {role === 'platform_admin' && <Building2 className="h-4 w-4 text-[#A78BFA]" />}
                                        Redireciona para <strong className="text-white">{destinationFor(role)}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <section className="relative z-10 grid gap-4 pb-12 md:grid-cols-[0.9fr_1.1fr]">
                    <PreviewCard role={role} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        {['Permissoes separadas', 'Fluxo demo clicavel'].map((item, index) => (
                            <motion.article
                                key={item}
                                whileHover={{ y: -5 }}
                                className="rounded-2xl border border-[#263247] bg-[#121827]/80 p-5 shadow-xl backdrop-blur"
                            >
                                <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
                                <h3 className="mt-4 font-bold">{item}</h3>
                                <p className="mt-2 text-sm leading-7 text-[#CBD5E1]">
                                    {index === 0
                                        ? 'Admin, organizador e convidado entram em areas diferentes.'
                                        : 'Botoes respondem, sessoes persistem e a navegacao se comporta como produto.'}
                                </p>
                            </motion.article>
                        ))}
                    </div>
                </section>
            </section>
        </main>
    );
}

function PreviewCard({ role }: { role: UserRole }) {
    const labels = {
        owner: ['Overview', 'Eventos', 'Convidados', 'Templates', 'Check-in'],
        guest: ['Convite', 'RSVP', 'QR Code', 'Presentes', 'Ajustes'],
        platform_admin: ['Software', 'Clientes', 'Eventos', 'Suporte', 'Governanca'],
    }[role];

    const title = {
        owner: 'Resumo dos seus eventos.',
        guest: 'Seu convite em um so lugar.',
        platform_admin: 'Saude da plataforma.',
    }[role];

    return (
        <motion.article
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-[#263247] bg-[#0B0F1A]/85 p-4 shadow-2xl backdrop-blur-xl"
        >
            <div className="grid gap-4 lg:grid-cols-[170px_1fr]">
                <aside className="hidden rounded-xl border border-[#263247] bg-[#060B1A]/70 p-3 lg:block">
                    <div className="mb-5 flex items-center gap-2 text-xs font-bold">
                        <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
                        Invitely
                    </div>
                    {labels.map((item, index) => (
                        <div
                            key={item}
                            className={
                                index === 0
                                    ? 'mb-1 rounded-lg bg-[#8B5CF6]/25 px-3 py-2 text-xs text-white'
                                    : 'mb-1 rounded-lg px-3 py-2 text-xs text-[#94A3B8]'
                            }
                        >
                            {item}
                        </div>
                    ))}
                </aside>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[#94A3B8]">Preview da area</p>
                            <h2 className="text-lg font-bold">{title}</h2>
                        </div>
                        <span className="rounded-lg bg-[#8B5CF6] px-3 py-2 text-xs font-bold">Demo</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {previewMetrics.map((metric) => (
                            <div key={metric.label} className="rounded-xl border border-[#263247] bg-[#121827] p-3">
                                <metric.icon className="h-4 w-4 text-[#22D3EE]" />
                                <div className="mt-3 text-2xl font-bold">{metric.value}</div>
                                <div className="text-xs text-[#94A3B8]">{metric.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-xl border border-[#263247] bg-[#121827] p-4">
                        <div className="mb-4 flex items-center justify-between text-sm">
                            <span>Atividade dos ultimos 7 dias</span>
                            <span className="rounded-lg bg-[#1A1F2E] px-2 py-1 text-xs text-[#CBD5E1]">312 hoje</span>
                        </div>
                        <MiniLineChart />
                    </div>
                </div>
            </div>
        </motion.article>
    );
}

function MiniLineChart() {
    const points = '0,72 72,48 144,60 216,24 288,44 360,32 432,22';

    return (
        <svg viewBox="0 0 432 96" className="h-28 w-full overflow-visible">
            <defs>
                <linearGradient id="authLine" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#22D3EE" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
                <linearGradient id="authArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline points={`${points} 432,96 0,96`} fill="url(#authArea)" opacity="0.8" />
            <motion.polyline
                points={points}
                fill="none"
                stroke="url(#authLine)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            {[
                [0, 72],
                [72, 48],
                [144, 60],
                [216, 24],
                [288, 44],
                [360, 32],
                [432, 22],
            ].map(([x, y]) => (
                <circle key={`${String(x)}-${String(y)}`} cx={x} cy={y} r="4" fill="#22D3EE" />
            ))}
        </svg>
    );
}

function InputField({
    value,
    onChange,
    placeholder,
    type = 'text',
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: 'text' | 'email';
}) {
    return (
        <input
            className="h-12 rounded-xl border border-[#263247] bg-[#060B1A] px-4 text-sm text-white outline-none transition placeholder:text-[#64748B] focus:border-[#22D3EE] focus:ring-2 focus:ring-[#8B5CF6]/30"
            type={type}
            value={value}
            onChange={(event) => {
                onChange(event.target.value);
            }}
            placeholder={placeholder}
        />
    );
}

function ReadonlyField({ value }: { value: string }) {
    return (
        <input
            className="h-12 rounded-xl border border-[#263247] bg-[#121827] px-4 text-sm text-[#94A3B8]"
            value={value}
            readOnly
        />
    );
}

function PasswordField({
    value,
    onChange,
    placeholder = 'Senha',
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <span className="relative block">
            <input
                className="h-12 w-full rounded-xl border border-[#263247] bg-[#060B1A] px-4 pr-12 text-sm text-white outline-none transition placeholder:text-[#64748B] focus:border-[#22D3EE] focus:ring-2 focus:ring-[#8B5CF6]/30"
                type={isVisible ? 'text' : 'password'}
                value={value}
                onChange={(event) => {
                    onChange(event.target.value);
                }}
                placeholder={placeholder}
            />
            <button
                type="button"
                onClick={() => {
                    setIsVisible((current) => !current);
                }}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#94A3B8] transition hover:bg-[#1A1F2E] hover:text-white"
                aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
            >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </span>
    );
}

function getPasswordStrength(password: string) {
    const checks = [
        { label: 'Letra minuscula', passed: /[a-z]/.test(password) },
        { label: 'Letra maiuscula', passed: /[A-Z]/.test(password) },
        { label: 'Numero', passed: /\d/.test(password) },
        { label: 'Caractere especial', passed: /[^A-Za-z0-9]/.test(password) },
        { label: 'Minimo de 8 caracteres', passed: password.length >= 8 },
    ];
    const score = checks.filter((check) => check.passed).length;

    return {
        checks,
        score,
        percentage: (score / checks.length) * 100,
    };
}

function getStrengthColor(score: number): string {
    if (score <= 1) {
        return '#EF4444';
    }

    if (score <= 3) {
        return '#F59E0B';
    }

    if (score === 4) {
        return '#22D3EE';
    }

    return '#22C55E';
}

function getStrengthLabel(score: number): string {
    if (score <= 1) {
        return 'Senha fraca';
    }

    if (score <= 3) {
        return 'Senha media';
    }

    if (score === 4) {
        return 'Quase forte';
    }

    return 'Senha forte';
}

function PasswordStrengthMeter({ strength }: { strength: ReturnType<typeof getPasswordStrength> }) {
    const color = getStrengthColor(strength.score);

    return (
        <div className="rounded-xl border border-[#263247] bg-[#060B1A] p-3">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                <span className="text-[#94A3B8]">Seguranca da senha</span>
                <span style={{ color }}>{getStrengthLabel(strength.score)}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1A1F2E]">
                <motion.div
                    className="h-full rounded-full"
                    style={{
                        width: `${strength.percentage.toFixed(0)}%`,
                        background: color,
                    }}
                    transition={{ duration: 0.25 }}
                />
            </div>
            <div className="mt-3 grid gap-2 text-xs text-[#94A3B8] sm:grid-cols-2">
                {strength.checks.map((check) => (
                    <div
                        key={check.label}
                        className={check.passed ? 'flex items-center gap-2 text-[#BBF7D0]' : 'flex items-center gap-2'}
                    >
                        <CheckCircle2
                            className={check.passed ? 'h-3.5 w-3.5 text-[#22C55E]' : 'h-3.5 w-3.5 text-[#475569]'}
                        />
                        {check.label}
                    </div>
                ))}
            </div>
        </div>
    );
}

function FeedbackMessage({ message, tone }: { message: string; tone: 'success' | 'warning' }) {
    const isSuccess = tone === 'success';

    return (
        <div
            className={
                isSuccess
                    ? 'rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 px-3 py-2 text-sm text-[#BBF7D0]'
                    : 'rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-2 text-sm text-[#FDE68A]'
            }
        >
            <div className="flex gap-2">
                {isSuccess ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{message}</span>
            </div>
        </div>
    );
}
