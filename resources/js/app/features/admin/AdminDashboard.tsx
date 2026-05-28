import { motion } from 'framer-motion';
import {
    BarChart3,
    CalendarPlus,
    CheckCircle2,
    Download,
    ImagePlus,
    LogOut,
    MailCheck,
    QrCode,
    Search,
    Settings2,
    ShieldCheck,
    Sparkles,
    TicketCheck,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthUser, clearSession, getStoredSession, roleLabel } from '../../auth/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type AdminView = 'overview' | 'events' | 'guests' | 'templates' | 'checkin' | 'platform';

const stats = [
    { label: 'Eventos ativos', value: '12', icon: CalendarPlus },
    { label: 'Convidados', value: '4.820', icon: UsersRound },
    { label: 'RSVP aceitos', value: '78%', icon: MailCheck },
    { label: 'Check-ins', value: '1.294', icon: QrCode },
];

const events = [
    { name: 'Invitely Launch Night', status: 'Publicado', guests: 180, rsvp: 71 },
    { name: 'Founders Dinner', status: 'Rascunho', guests: 64, rsvp: 42 },
    { name: 'Aurora Summit', status: 'Publicado', guests: 920, rsvp: 84 },
];

const guests = [
    { name: 'Lucas Convidado', email: 'guest@invitely.dev', status: 'Confirmado' },
    { name: 'Ana Ribeiro', email: 'ana@example.com', status: 'Pendente' },
    { name: 'Felipe Costa', email: 'felipe@example.com', status: 'Check-in feito' },
];

type NavigationItem = {
    label: string;
    view: AdminView;
    icon: LucideIcon;
};

function navigationFor(user: AuthUser): NavigationItem[] {
    if (user.role === 'guest') {
        return [
            { label: 'Meu convite', view: 'overview', icon: TicketCheck },
            { label: 'QR Code', view: 'checkin', icon: QrCode },
        ];
    }

    const base: NavigationItem[] = [
        { label: 'Overview', view: 'overview', icon: BarChart3 },
        { label: 'Eventos', view: 'events', icon: CalendarPlus },
        { label: 'Convidados', view: 'guests', icon: UsersRound },
        { label: 'Templates', view: 'templates', icon: ImagePlus },
        { label: 'Check-in', view: 'checkin', icon: QrCode },
    ];

    if (user.role === 'platform_admin') {
        return [...base, { label: 'Plataforma', view: 'platform', icon: ShieldCheck }];
    }

    return base;
}

export function AdminDashboard() {
    const navigate = useNavigate();
    const session = getStoredSession();
    const [view, setView] = useState<AdminView>('overview');
    const [query, setQuery] = useState('');
    const [notice, setNotice] = useState('Ambiente demo pronto para clicar e explorar.');

    const user = session?.user;
    const navigation = useMemo(() => (user ? navigationFor(user) : []), [user]);
    const filteredEvents = events.filter((event) => event.name.toLowerCase().includes(query.toLowerCase()));

    if (!session || !user) {
        return <Navigate to="/login" replace />;
    }

    function action(message: string) {
        setNotice(message);
    }

    function logout() {
        clearSession();
        void navigate('/login');
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
            <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
                <aside className="border-b border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-950 lg:border-b-0 lg:border-r">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold">Invitely</p>
                            <p className="text-xs text-slate-500">{roleLabel(user.role)}</p>
                        </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Configuracoes"
                            onClick={() => {
                                action('Preferencias abertas em modo demo.');
                            }}
                        >
                            <Settings2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <nav className="mt-8 grid gap-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Button
                                    key={item.label}
                                    type="button"
                                    variant={item.view === view ? 'secondary' : 'ghost'}
                                    className="justify-start"
                                    onClick={() => {
                                        setView(item.view);
                                        action(`${item.label} carregado.`);
                                    }}
                                >
                                    <Icon className="h-4 w-4" /> {item.label}
                                </Button>
                            );
                        })}
                    </nav>
                    <div className="mt-8 grid gap-2">
                        <Button asChild variant="secondary" className="justify-start">
                            <Link to="/events/invitely-launch-night">
                                <Sparkles className="h-4 w-4" /> Ver convite
                            </Link>
                        </Button>
                        <Button variant="ghost" className="justify-start" onClick={logout}>
                            <LogOut className="h-4 w-4" /> Sair
                        </Button>
                    </div>
                </aside>

                <section className="px-5 py-6 lg:px-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <Badge>Multi-tenant SaaS</Badge>
                            <h1 className="mt-3 text-3xl font-bold tracking-normal">
                                {user.role === 'guest' ? 'Area do convidado' : 'Painel operacional'}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Logado como {user.name} ({user.email})
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    action('CSV exportado em modo demo.');
                                }}
                            >
                                <Download className="h-4 w-4" /> CSV
                            </Button>
                            <Button
                                onClick={() => {
                                    action(
                                        user.role === 'guest'
                                            ? 'Presenca confirmada.'
                                            : 'Novo evento criado como rascunho.',
                                    );
                                }}
                            >
                                <CalendarPlus className="h-4 w-4" />{' '}
                                {user.role === 'guest' ? 'Confirmar' : 'Novo evento'}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100">
                        {notice}
                    </div>

                    {view === 'overview' && (
                        <>
                            <div className="mt-6 grid gap-4 md:grid-cols-4">
                                {stats.map((item, index) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card className="dark:border-slate-800 dark:bg-slate-900">
                                            <CardContent className="pt-5">
                                                <item.icon className="h-5 w-5 text-sky-500" />
                                                <div className="mt-4 text-3xl font-bold">{item.value}</div>
                                                <div className="mt-1 text-sm text-slate-500">{item.label}</div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                            <QualityPanel role={user.role} />
                        </>
                    )}

                    {view === 'events' && (
                        <Card className="mt-6 dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <CardTitle>Eventos recentes</CardTitle>
                                    <div className="relative w-full md:w-72">
                                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            className="pl-9"
                                            placeholder="Buscar evento"
                                            value={query}
                                            onChange={(event) => {
                                                setQuery(event.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    headers={['Evento', 'Status', 'Convidados', 'RSVP']}
                                    rows={filteredEvents.map((event) => [
                                        event.name,
                                        event.status,
                                        String(event.guests),
                                        `${String(event.rsvp)}%`,
                                    ])}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {view === 'guests' && (
                        <Card className="mt-6 dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle>Convidados</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    headers={['Nome', 'Email', 'Status']}
                                    rows={guests.map((guest) => [guest.name, guest.email, guest.status])}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {view === 'templates' && (
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {['Linear Premium', 'Apple Minimal', 'Vercel Launch'].map((template) => (
                                <Card key={template} className="dark:border-slate-800 dark:bg-slate-900">
                                    <CardHeader>
                                        <CardTitle>{template}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-28 rounded-lg bg-[linear-gradient(135deg,#0ea5e9,#14b8a6)]" />
                                        <Button
                                            className="mt-4 w-full"
                                            onClick={() => {
                                                action(`${template} aplicado ao evento demo.`);
                                            }}
                                        >
                                            Aplicar tema
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {view === 'checkin' && (
                        <Card className="mt-6 max-w-xl dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle>Check-in QR</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <Input
                                    placeholder="Cole ou digite o token do convidado"
                                    defaultValue="demo-invite-token"
                                />
                                <Button
                                    onClick={() => {
                                        action('Check-in validado para demo-invite-token.');
                                    }}
                                >
                                    <QrCode className="h-4 w-4" /> Validar entrada
                                </Button>
                                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                                    <CheckCircle2 className="mr-2 inline h-4 w-4" />
                                    QR Code pronto para simular a portaria.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {view === 'platform' && (
                        <Card className="mt-6 dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle>Operacao da plataforma</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    headers={['Tenant', 'Plano', 'Eventos', 'Status']}
                                    rows={[
                                        ['Invitely Demo', 'community', '12', 'Saudavel'],
                                        ['Aurora Studio', 'pro', '28', 'Saudavel'],
                                        ['Mira Eventos', 'business', '104', 'Atencao'],
                                    ]}
                                />
                            </CardContent>
                        </Card>
                    )}
                </section>
            </div>
        </main>
    );
}

function QualityPanel({ role }: { role: AuthUser['role'] }) {
    const items =
        role === 'guest'
            ? ['RSVP sincronizado', 'QR Code disponivel', 'Mapa carregado', 'Playlist pronta']
            : ['SEO configurado', 'Galeria completa', 'Rate limit ativo', 'Fila de email pronta'];

    return (
        <Card className="mt-6 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
                <CardTitle>{role === 'guest' ? 'Meu convite' : 'Qualidade do evento'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                    {items.map((item) => (
                        <div
                            key={item}
                            className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800"
                        >
                            <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-500" />
                            {item}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-slate-500 dark:bg-slate-800">
                    <tr>
                        {headers.map((header) => (
                            <th key={header} className="px-4 py-3">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.join('-')} className="border-t border-slate-200 dark:border-slate-800">
                            {row.map((cell, index) => (
                                <td key={`${cell}-${String(index)}`} className="px-4 py-4">
                                    {index === 1 ? <Badge>{cell}</Badge> : cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
