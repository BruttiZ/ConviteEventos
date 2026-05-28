import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Loader2, ShieldCheck, Sparkles, TicketCheck } from 'lucide-react';
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
        description: 'Visualiza convite, confirma presenca e usa QR Code.',
        email: 'guest@invitely.dev',
        icon: TicketCheck,
    },
    {
        role: 'platform_admin',
        title: 'Admin Invitely',
        description: 'Enxerga operacao, tenants, saude e governanca.',
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

                throw new Error(payload?.message ?? 'Nao foi possivel autenticar.');
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
        <main className="min-h-screen bg-slate-950 text-white">
            <section className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
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
                            Entre como cada perfil e navegue pela experiencia real do produto.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                            Use os atalhos abaixo para brincar com permissoes diferentes: quem organiza a festa, quem
                            foi convidado e quem administra a plataforma.
                        </p>
                    </motion.div>

                    <div className="grid gap-3 md:grid-cols-3">
                        {demoAccounts.map((account) => {
                            const Icon = account.icon;
                            const isSelected = account.role === role;

                            return (
                                <button
                                    key={account.role}
                                    type="button"
                                    onClick={() => {
                                        chooseDemo(account.role, account.email);
                                    }}
                                    className={
                                        isSelected
                                            ? 'rounded-lg border border-sky-300 bg-sky-400/15 p-4 text-left shadow-[0_0_0_1px_rgba(125,211,252,0.35)] transition'
                                            : 'rounded-lg border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10'
                                    }
                                >
                                    <Icon className="h-5 w-5 text-sky-300" />
                                    <div className="mt-3 font-semibold">{account.title}</div>
                                    <p className="mt-1 text-sm leading-6 text-slate-300">{account.description}</p>
                                </button>
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
                                {mode === 'login' ? 'Acessar conta' : 'Criar conta demo'}
                            </CardTitle>
                            <p className="text-sm text-slate-500">
                                Perfil selecionado: <strong>{roleLabel(role)}</strong>
                            </p>
                        </CardHeader>
                        <CardContent>
                            <form className="grid gap-3" onSubmit={submit}>
                                {mode === 'register' && (
                                    <Input
                                        className="bg-white text-slate-950 dark:bg-white dark:text-slate-950"
                                        value={form.name}
                                        onChange={(event) => {
                                            setForm({ ...form, name: event.target.value });
                                        }}
                                        placeholder="Nome"
                                    />
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
                                    {mode === 'login' ? 'Entrar' : 'Criar e entrar'}
                                </Button>
                                {auth.isError && (
                                    <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                        {auth.error.message}
                                    </p>
                                )}
                            </form>

                            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                <div className="font-semibold text-slate-950">{selectedAccount?.title}</div>
                                <p className="mt-1">{selectedAccount?.description}</p>
                                <p className="mt-3">
                                    Senha demo: <strong>password</strong>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </main>
    );
}
