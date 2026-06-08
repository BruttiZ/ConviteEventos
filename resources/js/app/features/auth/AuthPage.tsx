import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Eye,
    EyeOff,
    Loader2,
    Mail,
    ShieldCheck,
    Sparkles,
    TicketCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthSession, UserRole, storeSession } from '../../auth/session';
import { siteUrl } from '../../../lib/site';
import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase';
import { retryWithExponentialBackoff } from '../../../lib/retry';

type AuthMode = 'login' | 'register';
type PublicRole = Exclude<UserRole, 'platform_admin'>;

type AuthMutationResult =
    | {
          kind: 'authenticated';
          session: AuthSession;
      }
    | {
          kind: 'pending_confirmation';
          message: string;
      };

function formatErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
        return 'Muitas tentativas de cadastro. Aguarde alguns momentos e tente novamente. Estamos reintentando automaticamente...';
    }

    if (message.includes('user already exists')) {
        return 'Este e-mail já está cadastrado. Faça login em vez disso.';
    }

    if (message.includes('invalid email')) {
        return 'Formato de e-mail inválido.';
    }

    if (message.includes('weak password')) {
        return 'Senha muito fraca. Use letras, números e caracteres especiais.';
    }

    return error.message;
}

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
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [confirmationError, setConfirmationError] = useState<string | null>(() => getConfirmationErrorFromHash());
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        passwordConfirmation: '',
    });

    const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);
    const passwordsMatch = form.password.length > 0 && form.password === form.passwordConfirmation;
    const isRegisterValid =
        form.name.trim().length >= 2 && form.email.includes('@') && passwordStrength.isStrong && passwordsMatch;
    const canSubmit = mode === 'login' ? form.email.includes('@') && form.password.length >= 6 : isRegisterValid;

    useEffect(() => {
        if (confirmationError) {
            window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
        }
    }, [confirmationError]);

    const auth = useMutation({
        mutationFn: async (): Promise<AuthMutationResult> => {
            const supabase = getSupabaseClient();
            setStatusMessage(null);
            setConfirmationError(null);

            // Check for super user credentials
            const superUserEmail = import.meta.env.VITE_SUPER_USER_EMAIL;
            const superUserPassword = import.meta.env.VITE_SUPER_USER_PASSWORD;
            const isSuperUserAttempt =
                mode === 'login' && superUserEmail && form.email === superUserEmail && form.password === superUserPassword;

            if (isSuperUserAttempt) {
                // Return mock super user session
                return {
                    kind: 'authenticated',
                    session: toAuthSession(
                        'super-user-token-' + Date.now(),
                        'super-user-' + Date.now(),
                        'Admin Invitely',
                        form.email,
                        'owner',
                    ),
                };
            }

            if (mode === 'register') {
                if (!isRegisterValid) {
                    throw new Error('Preencha o cadastro com uma senha forte e confirme a senha corretamente.');
                }

                // Use retry with exponential backoff for signup
                const { data, error } = await retryWithExponentialBackoff(
                    () =>
                        supabase.auth.signUp({
                            email: form.email,
                            password: form.password,
                            options: {
                                // Don't set emailRedirectTo - we'll use OTP instead
                                data: {
                                    name: form.name.trim(),
                                    role,
                                },
                            },
                        }),
                    {
                        maxAttempts: 3,
                        baseDelayMs: 2000, // Start with 2 second delay for auth
                        maxDelayMs: 10000,
                    },
                );

                if (error) {
                    throw new Error(error.message);
                }

                // After signup, redirect to OTP verification
                if (data.user && !data.session) {
                    return {
                        kind: 'pending_confirmation',
                        message: 'Cadastro criado! Agora vamos enviar um código para confirmar seu e-mail.',
                    };
                }

                if (data.session && data.user) {
                    return {
                        kind: 'authenticated',
                        session: toAuthSession(data.session.access_token, data.user.id, form.name, form.email, role),
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
                session: toAuthSession(data.session.access_token, data.user.id, userName, form.email, userRole),
            };
        },
        onSuccess: (result) => {
            if (result.kind === 'pending_confirmation') {
                // Redirect to OTP verification page with email
                void navigate(`/verify?email=${encodeURIComponent(form.email)}`);
                return;
            }

            storeSession(result.session);
            void navigate(result.session.user.role === 'guest' ? '/events/invitely-launch-night' : '/admin');
        },
        onError: (error) => {
            // Error is already handled by formatErrorMessage in the component
            console.error('Auth error:', error);
        },
    });

    const resendConfirmation = useMutation({
        mutationFn: async () => {
            if (!form.email.includes('@')) {
                throw new Error('Informe o e-mail cadastrado para reenviar a confirmação.');
            }

            const supabase = getSupabaseClient();

            // Use retry for resend as well (email rate limits apply here too)
            const { error } = await retryWithExponentialBackoff(
                () =>
                    supabase.auth.resend({
                        type: 'signup',
                        email: form.email,
                        options: {
                            emailRedirectTo: siteUrl('/login'),
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

            return 'Se existir uma conta pendente para este e-mail, enviaremos um novo link de confirmação.';
        },
        onSuccess: (message) => {
            setStatusMessage(message);
            setConfirmationError(null);
        },
    });

    function submit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!canSubmit || !isSupabaseConfigured()) {
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
                                        setStatusMessage(null);
                                        setConfirmationError(null);
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
                            <FeedbackMessage
                                tone="warning"
                                message="Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar login e cadastro."
                            />
                        ) : null}

                        {confirmationError ? <FeedbackMessage tone="warning" message={confirmationError} /> : null}
                        {statusMessage ? <FeedbackMessage tone="success" message={statusMessage} /> : null}

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
                            <PasswordInput
                                label="Senha"
                                value={form.password}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                onChange={(value) => {
                                    setForm({ ...form, password: value });
                                }}
                            />
                            {mode === 'login' ? (
                                <div className="flex flex-col gap-2 rounded-2xl border border-[#263247] bg-[#0B0F1A] p-3 text-xs text-[#94A3B8] sm:flex-row sm:items-center sm:justify-between">
                                    <span>Não recebeu ou perdeu o e-mail de confirmação?</span>
                                    <button
                                        type="button"
                                        disabled={resendConfirmation.isPending || !isSupabaseConfigured()}
                                        onClick={() => {
                                            resendConfirmation.mutate();
                                        }}
                                        className="inline-flex h-9 items-center justify-center rounded-xl border border-[#263247] px-3 font-bold text-[#22D3EE] transition hover:border-[#22D3EE]/70 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {resendConfirmation.isPending ? 'Enviando...' : 'Reenviar confirmação'}
                                    </button>
                                </div>
                            ) : null}
                            {mode === 'register' ? (
                                <>
                                    <PasswordStrengthMeter strength={passwordStrength} />
                                    <PasswordInput
                                        label="Confirmar senha"
                                        value={form.passwordConfirmation}
                                        autoComplete="new-password"
                                        onChange={(value) => {
                                            setForm({ ...form, passwordConfirmation: value });
                                        }}
                                    />
                                    {form.passwordConfirmation.length > 0 ? (
                                        <p
                                            className={
                                                passwordsMatch
                                                    ? 'text-xs font-semibold text-[#22C55E]'
                                                    : 'text-xs font-semibold text-[#F59E0B]'
                                            }
                                        >
                                            {passwordsMatch
                                                ? 'As senhas conferem.'
                                                : 'Digite a mesma senha nos dois campos.'}
                                        </p>
                                    ) : null}
                                </>
                            ) : null}
                            <button
                                type="submit"
                                disabled={auth.isPending || !canSubmit || !isSupabaseConfigured()}
                                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] text-sm font-bold transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {auth.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="h-4 w-4" />
                                )}
                                {mode === 'login' ? 'Entrar' : 'Cadastrar'}
                            </button>
                            {auth.isError ? (
                                <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-sm text-red-100">
                                    {formatErrorMessage(auth.error)}
                                </p>
                            ) : null}
                            {resendConfirmation.isError ? (
                                <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-sm text-red-100">
                                    {formatErrorMessage(resendConfirmation.error)}
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

function getConfirmationErrorFromHash(): string | null {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const errorCode = params.get('error_code');
    const errorDescription = params.get('error_description');

    if (!errorCode) {
        return null;
    }

    return errorCode === 'otp_expired'
        ? 'O link de confirmação expirou ou já foi usado. Faça login se a conta já foi confirmada, ou gere um novo cadastro para receber outro e-mail.'
        : (errorDescription ?? 'Não foi possível confirmar o e-mail. Verifique a configuração de URL do Supabase.');
}

function getPasswordStrength(password: string) {
    const checks = [
        { label: 'Letra minúscula', passed: /[a-z]/.test(password) },
        { label: 'Letra maiúscula', passed: /[A-Z]/.test(password) },
        { label: 'Número', passed: /\d/.test(password) },
        { label: 'Caractere especial', passed: /[^A-Za-z0-9]/.test(password) },
        { label: 'Mínimo de 8 caracteres', passed: password.length >= 8 },
    ];
    const score = checks.filter((check) => check.passed).length;

    return {
        checks,
        score,
        percentage: (score / checks.length) * 100,
        isStrong: score === checks.length,
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
        return 'Senha média';
    }

    if (score === 4) {
        return 'Quase forte';
    }

    return 'Senha forte';
}

function FeedbackMessage({ message, tone }: { message: string; tone: 'success' | 'warning' }) {
    const isSuccess = tone === 'success';

    return (
        <div
            className={
                isSuccess
                    ? 'mt-5 rounded-2xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-4 text-sm leading-6 text-[#BBF7D0]'
                    : 'mt-5 rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-sm leading-6 text-[#FDE68A]'
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

function PasswordStrengthMeter({ strength }: { strength: ReturnType<typeof getPasswordStrength> }) {
    const color = getStrengthColor(strength.score);

    return (
        <div className="rounded-2xl border border-[#263247] bg-[#0B0F1A] p-3">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                <span className="text-[#CBD5E1]">Segurança da senha</span>
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
    type?: 'text' | 'email';
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

function PasswordInput({
    label,
    value,
    onChange,
    autoComplete,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    autoComplete?: string;
}) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#CBD5E1]">{label}</span>
            <span className="relative block">
                <input
                    type={isVisible ? 'text' : 'password'}
                    value={value}
                    autoComplete={autoComplete}
                    onChange={(event) => {
                        onChange(event.target.value);
                    }}
                    className="h-12 w-full rounded-xl border border-[#263247] bg-[#060B1A] px-4 pr-12 text-sm text-white outline-none transition placeholder:text-[#64748B] focus:border-[#22D3EE] focus:ring-2 focus:ring-[#8B5CF6]/30"
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
        </label>
    );
}
