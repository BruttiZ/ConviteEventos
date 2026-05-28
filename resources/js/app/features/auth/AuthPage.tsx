import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    Loader2,
    PartyPopper,
    ShieldCheck,
    Sparkles,
    TicketCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SyntheticEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AuthSession, UserRole, roleLabel, storeSession } from '../../auth/session';

type AuthMode = 'login' | 'register';

type AuthResponse = {
    data: AuthSession;
};

const demoAccounts: {
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
    {
        role: 'platform_admin',
        title: 'Admin Invitely',
        shortTitle: 'Admin',
        description: 'Cuida da plataforma, tenants, saude operacional e governanca.',
        registerHint: 'Perfil interno para operar o software e monitorar clientes.',
        email: 'admin@invitely.dev',
        defaultName: 'Invitely Admin',
        accent: 'border-violet-300 bg-violet-400/15 text-violet-100',
        icon: ShieldCheck,
    },
];

function destinationFor(role: UserRole): string {
    return {
        owner: '/organizador',
        guest: '/convidado',
        platform_admin: '/admin',
    }[role];
}

export function AuthPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<AuthMode>('login');
    const [role, setRole] = useState<UserRole>('owner');
    const [form, setForm] = useState({
        name: 'Marina Host',
        email: 'host@invitely.dev',
        password: 'password',
        partyName: 'Invitely Launch Night',
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

                throw new Error(payload?.message ?? 'Nao foi possivel autenticar.');
            }

            return (await response.json()) as AuthResponse;
        },
        onSuccess: (payload) => {
            storeSession(payload.data);
            void navigate(destinationFor(payload.data.user.role));
        },
    });

    function chooseDemo(account: (typeof demoAccounts)[number]) {
        setMode('login');
        setRole(account.role);
        setForm((current) => ({
            ...current,
            name: account.defaultName,
            email: account.email,
            password: 'password',
        }));
    }

    function chooseRegister(account: (typeof demoAccounts)[number]) {
        setMode('register');
        setRole(account.role);
        setForm((current) => ({
            ...current,
            name: account.defaultName,
            email: account.email.replace('@invitely.dev', `+novo-${Date.now().toString().slice(-4)}@invitely.dev`),
            password: 'password',
        }));
    }

    function submit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
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
                        <Button asChild variant="ghost">
                            <Link to="/events/invitely-launch-night">Ver convite</Link>
                        </Button>
                    </header>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="max-w-3xl py-12"
                    >
                        <Badge className="border-white/15 bg-white/10 text-white">
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            Demo interativa
                        </Badge>
                        <h1 className="mt-5 text-4xl font-bold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                            Login e cadastro por permissao, com uma area diferente para cada pessoa.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                            Escolha se voce esta operando o software, criando uma festa ou entrando como convidado. A
                            demo responde aos cliques e mostra o que cada perfil deveria enxergar.
                        </p>
                    </motion.div>

                    <div className="grid gap-3 md:grid-cols-3">
                        {demoAccounts.map((account) => {
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
                                    <p className="mt-1 min-h-24 text-sm leading-6 text-slate-300">{account.description}</p>
                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={isSelected && mode === 'login' ? 'default' : 'secondary'}
                                            onClick={() => {
                                                chooseDemo(account);
                                            }}
                                        >
                                            Login
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={isSelected && mode === 'register' ? 'default' : 'ghost'}
                                            className="text-white hover:bg-white/10"
                                            onClick={() => {
                                                chooseRegister(account);
                                            }}
                                        >
                                            Cadastro
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center">
                    <Card className="w-full border-white/10 bg-white text-slate-950 shadow-2xl dark:bg-white dark:text-slate-950">
                        <CardHeader>
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
                            <CardTitle className="pt-3">
                                {mode === 'login'
                                    ? `Entrar como ${selectedAccount?.shortTitle}`
                                    : `Cadastrar ${selectedAccount?.shortTitle}`}
                            </CardTitle>
                            <p className="text-sm text-slate-500">
                                Perfil selecionado: <strong>{roleLabel(role)}</strong>
                            </p>
                        </CardHeader>
                        <CardContent>
                            <form className="grid gap-3" onSubmit={submit}>
                                {mode === 'register' && (
                                    <>
                                        <Input
                                            className="bg-white text-slate-950 dark:bg-white dark:text-slate-950"
                                            value={form.name}
                                            onChange={(event) => {
                                                setForm({ ...form, name: event.target.value });
                                            }}
                                            placeholder="Nome"
                                        />
                                        {role === 'owner' && (
                                            <Input
                                                className="bg-white text-slate-950 dark:bg-white dark:text-slate-950"
                                                value={form.partyName}
                                                onChange={(event) => {
                                                    setForm({ ...form, partyName: event.target.value });
                                                }}
                                                placeholder="Nome da festa"
                                            />
                                        )}
                                        {role === 'platform_admin' && (
                                            <Input
                                                className="bg-white text-slate-950 dark:bg-white dark:text-slate-950"
                                                value="Operacao da plataforma"
                                                readOnly
                                            />
                                        )}
                                        {role === 'guest' && (
                                            <Input
                                                className="bg-white text-slate-950 dark:bg-white dark:text-slate-950"
                                                value="demo-invite-token"
                                                readOnly
                                            />
                                        )}
                                    </>
                                )}
                                <Input
                                    className="bg-white text-slate-950 dark:bg-white dark:text-slate-950"
                                    type="email"
                                    value={form.email}
                                    onChange={(event) => {
                                        setForm({ ...form, email: event.target.value });
                                    }}
                                    placeholder="email@exemplo.com"
                                />
                                <Input
                                    className="bg-white text-slate-950 dark:bg-white dark:text-slate-950"
                                    type="password"
                                    value={form.password}
                                    onChange={(event) => {
                                        setForm({ ...form, password: event.target.value });
                                    }}
                                    placeholder="Senha"
                                />
                                <Button type="submit" disabled={auth.isPending}>
                                    {auth.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <ArrowRight className="h-4 w-4" />
                                    )}
                                    {mode === 'login' ? 'Entrar na area' : 'Criar e abrir area'}
                                </Button>
                                {auth.isError && (
                                    <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                        {auth.error.message}
                                    </p>
                                )}
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
                        </CardContent>
                    </Card>
                </div>
            </section>
        </main>
    );
}
