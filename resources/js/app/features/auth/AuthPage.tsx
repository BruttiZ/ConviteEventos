import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    Eye,
    EyeOff,
    Loader2,
    PartyPopper,
    ShieldCheck,
    Sparkles,
    TicketCheck,
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
    accent: string;
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
        accent: 'border-violet-300 bg-violet-400/15 text-violet-100',
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
        accent: 'border-sky-300 bg-sky-400/15 text-sky-100',
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
        accent: 'border-emerald-300 bg-emerald-400/15 text-emerald-100',
        icon: TicketCheck,
    },
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
        <main className="min-h-screen bg-slate-950 text-white">
            <section className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8">
                <div className="flex flex-col justify-between py-4">
                    <header className="flex items-center justify-between">
                        <Link
                            to="/"
                            className="inline-flex h-10 items-center rounded-full bg-white/10 px-4 text-sm font-bold"
                        >
                            Invitely
                        </Link>
                        <Link
                            to="/events/invitely-launch-night"
                            className="inline-flex h-10 items-center rounded-md border border-white/10 px-4 text-sm font-semibold transition hover:bg-white/10"
                        >
                            Ver convite
                        </Link>
                    </header>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="max-w-3xl py-12"
                    >
                        <BadgeLine />
                        <h1 className="mt-5 text-4xl font-bold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                            Login e cadastro por permissao, com uma area diferente para cada pessoa.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                            Escolha se voce esta operando o software, criando uma festa ou entrando como convidado. A
                            demo responde aos cliques e mostra o que cada perfil deveria enxergar.
                        </p>
                    </motion.div>

                    <div className="grid gap-3 md:grid-cols-3">
                        {roleOptions.map((account) => {
                            const Icon = account.icon;
                            const isSelected = account.role === role;

                            return (
                                <div
                                    key={account.role}
                                    className={
                                        isSelected
                                            ? `rounded-lg border p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.25)] transition ${account.accent}`
                                            : 'rounded-lg border border-white/10 bg-white/5 p-4 transition hover:bg-white/10'
                                    }
                                >
                                    <Icon className="h-5 w-5" />
                                    <div className="mt-3 font-semibold">{account.title}</div>
                                    <p className="mt-1 min-h-24 text-sm leading-6 text-slate-300">
                                        {account.description}
                                    </p>
                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                chooseDemo(account);
                                            }}
                                            className={
                                                isSelected && mode === 'login'
                                                    ? 'h-9 rounded-md bg-sky-500 text-sm font-semibold text-white'
                                                    : 'h-9 rounded-md border border-white/10 bg-white text-sm font-semibold text-slate-950'
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
                                                    ? 'h-9 rounded-md bg-sky-500 text-sm font-semibold text-white'
                                                    : 'h-9 rounded-md text-sm font-semibold text-white hover:bg-white/10'
                                            }
                                        >
                                            Cadastro
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center">
                    <div className="w-full rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-2xl">
                        <div className="flex rounded-md bg-slate-100 p-1">
                            {(['login', 'register'] as const).map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => {
                                        setMode(item);
                                    }}
                                    className={
                                        mode === item
                                            ? 'h-9 flex-1 rounded bg-white text-sm font-semibold shadow-sm'
                                            : 'h-9 flex-1 rounded text-sm font-semibold text-slate-500'
                                    }
                                >
                                    {item === 'login' ? 'Login' : 'Cadastro'}
                                </button>
                            ))}
                        </div>

                        <div className="mt-5">
                            <h2 className="text-lg font-bold">
                                {mode === 'login'
                                    ? `Entrar como ${selectedAccount?.shortTitle}`
                                    : `Cadastrar ${selectedAccount?.shortTitle}`}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Perfil selecionado: <strong>{roleLabel(role)}</strong>
                            </p>
                        </div>

                        <form className="mt-5 grid gap-3" onSubmit={submit}>
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
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-sky-500 px-4 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:pointer-events-none disabled:opacity-50"
                            >
                                {auth.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="h-4 w-4" />
                                )}
                                {mode === 'login' ? 'Entrar na area' : 'Criar e abrir area'}
                            </button>

                            {auth.isError && <FeedbackMessage message={formatErrorMessage(auth.error)} tone="warning" />}
                            {statusMessage && <FeedbackMessage message={statusMessage} tone="success" />}
                        </form>

                        <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            <div>
                                <div className="font-semibold text-slate-950">{selectedAccount?.title}</div>
                                <p className="mt-1">{selectedAccount?.registerHint}</p>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                Senha demo: <strong>password</strong>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                {role === 'owner' && <PartyPopper className="h-4 w-4 text-sky-500" />}
                                {role === 'guest' && <TicketCheck className="h-4 w-4 text-emerald-500" />}
                                {role === 'platform_admin' && <Building2 className="h-4 w-4 text-violet-500" />}
                                Redireciona para <strong>{destinationFor(role)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

function BadgeLine() {
    return (
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Demo interativa
        </span>
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
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
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
            className="h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
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
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
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
                className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-slate-500 hover:bg-slate-100"
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
        return '#ef4444';
    }

    if (score <= 3) {
        return '#f59e0b';
    }

    if (score === 4) {
        return '#0ea5e9';
    }

    return '#22c55e';
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
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                <span className="text-slate-500">Seguranca da senha</span>
                <span style={{ color }}>{getStrengthLabel(strength.score)}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <motion.div
                    className="h-full rounded-full"
                    style={{
                        width: `${strength.percentage.toFixed(0)}%`,
                        background: color,
                    }}
                    transition={{ duration: 0.25 }}
                />
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                {strength.checks.map((check) => (
                    <div key={check.label} className={check.passed ? 'flex items-center gap-2 text-emerald-700' : 'flex items-center gap-2'}>
                        <CheckCircle2 className={check.passed ? 'h-3.5 w-3.5 text-emerald-500' : 'h-3.5 w-3.5 text-slate-300'} />
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
                    ? 'rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'
                    : 'rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800'
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
