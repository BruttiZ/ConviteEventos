import { motion } from 'framer-motion';
import {
    Activity,
    BarChart3,
    CalendarPlus,
    CheckCircle2,
    ClipboardCheck,
    Crown,
    Download,
    Gift,
    HeartHandshake,
    ImagePlus,
    LifeBuoy,
    LogOut,
    MailCheck,
    MapPin,
    Megaphone,
    QrCode,
    Search,
    Send,
    Settings2,
    ShieldCheck,
    Sparkles,
    TicketCheck,
    UsersRound,
    Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthUser, clearSession, getStoredSession, roleLabel, UserRole } from '../../auth/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type DashboardView =
    | 'overview'
    | 'events'
    | 'guests'
    | 'templates'
    | 'checkin'
    | 'platform'
    | 'tenants'
    | 'support'
    | 'rsvp'
    | 'gifts';

type NavigationItem = {
    label: string;
    view: DashboardView;
    icon: LucideIcon;
};

type ActionItem = {
    label: string;
    icon: LucideIcon;
    message: string;
    variant?: 'default' | 'secondary';
};

const destinations: Record<UserRole, string> = {
    owner: '/organizador',
    guest: '/convidado',
    platform_admin: '/admin',
};

const profileCopy: Record<
    UserRole,
    {
        eyebrow: string;
        title: string;
        description: string;
        badge: string;
    }
> = {
    platform_admin: {
        eyebrow: 'Operacao do software',
        title: 'Painel do admin da plataforma',
        description: 'Monitore clientes, saude do sistema, suporte e configuracoes globais.',
        badge: 'Permissao maxima',
    },
    owner: {
        eyebrow: 'Festa em producao',
        title: 'Painel de quem esta fazendo a festa',
        description: 'Monte o convite, acompanhe convidados, envie lembretes e controle a entrada.',
        badge: 'Organizador',
    },
    guest: {
        eyebrow: 'Meu convite',
        title: 'Area de quem vai a festa',
        description: 'Confirme presenca, veja detalhes do evento, salve QR Code e acompanhe recados.',
        badge: 'Convidado',
    },
};

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

const tenants = [
    { name: 'Invitely Demo', plan: 'community', events: '12', status: 'Saudavel' },
    { name: 'Aurora Studio', plan: 'pro', events: '28', status: 'Saudavel' },
    { name: 'Mira Eventos', plan: 'business', events: '104', status: 'Atencao' },
];

function navigationFor(user: AuthUser): NavigationItem[] {
    if (user.role === 'platform_admin') {
        return [
            { label: 'Software', view: 'overview', icon: Activity },
            { label: 'Clientes', view: 'tenants', icon: Crown },
            { label: 'Eventos', view: 'events', icon: CalendarPlus },
            { label: 'Suporte', view: 'support', icon: LifeBuoy },
            { label: 'Governanca', view: 'platform', icon: ShieldCheck },
        ];
    }

    if (user.role === 'guest') {
        return [
            { label: 'Convite', view: 'overview', icon: TicketCheck },
            { label: 'RSVP', view: 'rsvp', icon: HeartHandshake },
            { label: 'QR Code', view: 'checkin', icon: QrCode },
            { label: 'Presentes', view: 'gifts', icon: Gift },
        ];
    }

    return [
        { label: 'Resumo', view: 'overview', icon: BarChart3 },
        { label: 'Eventos', view: 'events', icon: CalendarPlus },
        { label: 'Convidados', view: 'guests', icon: UsersRound },
        { label: 'Temas', view: 'templates', icon: ImagePlus },
        { label: 'Check-in', view: 'checkin', icon: QrCode },
    ];
}

function actionsFor(user: AuthUser): ActionItem[] {
    if (user.role === 'platform_admin') {
        return [
            { label: 'Revisar saude', icon: Activity, message: 'Fila, banco e storage revisados em modo demo.' },
            { label: 'Abrir suporte', icon: LifeBuoy, message: 'Central de suporte aberta para triagem.' },
            { label: 'Exportar tenants', icon: Download, message: 'Relatorio de tenants exportado em modo demo.', variant: 'secondary' },
        ];
    }

    if (user.role === 'guest') {
        return [
            { label: 'Confirmar presenca', icon: CheckCircle2, message: 'Presenca confirmada. QR Code liberado.' },
            { label: 'Ver mapa', icon: MapPin, message: 'Mapa do Atelier Vista aberto em modo demo.', variant: 'secondary' },
            { label: 'Enviar recado', icon: Send, message: 'Recado enviado para os anfitrioes.' },
        ];
    }

    return [
        { label: 'Criar evento', icon: CalendarPlus, message: 'Novo evento criado como rascunho.' },
        { label: 'Enviar lembrete', icon: Megaphone, message: 'Lembrete enviado para convidados pendentes.' },
        { label: 'Exportar lista', icon: Download, message: 'Lista de convidados exportada em modo demo.', variant: 'secondary' },
    ];
}

function expectedRoleForPath(pathname: string): UserRole | null {
    if (pathname.startsWith('/admin')) {
        return 'platform_admin';
    }

    if (pathname.startsWith('/organizador')) {
        return 'owner';
    }

    if (pathname.startsWith('/convidado')) {
        return 'guest';
    }

    return null;
}

export function AdminDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const session = getStoredSession();
    const [view, setView] = useState<DashboardView>('overview');
    const [query, setQuery] = useState('');
    const [notice, setNotice] = useState('Ambiente demo pronto para clicar e explorar.');

    const user = session?.user;
    const expectedRole = expectedRoleForPath(location.pathname);
    const navigation = useMemo(() => (user ? navigationFor(user) : []), [user]);
    const actions = useMemo(() => (user ? actionsFor(user) : []), [user]);
    const filteredEvents = events.filter((event) => event.name.toLowerCase().includes(query.toLowerCase()));

    if (!session || !user) {
        return <Navigate to="/login" replace />;
    }

    if (expectedRole && expectedRole !== user.role) {
        return <Navigate to={destinations[user.role]} replace />;
    }

    function action(message: string) {
        setNotice(message);
    }

    function logout() {
        clearSession();
        void navigate('/login');
    }

    const copy = profileCopy[user.role];

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
            <div className="grid min-h-screen lg:grid-cols-[268px_1fr]">
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
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <Badge>{copy.badge}</Badge>
                            <p className="mt-4 text-sm font-semibold uppercase text-slate-500">{copy.eyebrow}</p>
                            <h1 className="mt-2 text-3xl font-bold tracking-normal">{copy.title}</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{copy.description}</p>
                            <p className="mt-2 text-sm text-slate-500">
                                Logado como {user.name} ({user.email})
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {actions.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <Button
                                        key={item.label}
                                        variant={item.variant ?? 'default'}
                                        onClick={() => {
                                            action(item.message);
                                        }}
                                    >
                                        <Icon className="h-4 w-4" /> {item.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100">
                        {notice}
                    </div>

                    {view === 'overview' && <Overview role={user.role} />}
                    {view === 'events' && (
                        <EventsPanel query={query} setQuery={setQuery} rows={filteredEvents} role={user.role} />
                    )}
                    {view === 'guests' && <GuestsPanel action={action} />}
                    {view === 'templates' && <TemplatesPanel action={action} />}
                    {view === 'checkin' && <CheckInPanel role={user.role} action={action} />}
                    {view === 'platform' && <PlatformPanel />}
                    {view === 'tenants' && <TenantsPanel />}
                    {view === 'support' && <SupportPanel action={action} />}
                    {view === 'rsvp' && <RsvpPanel action={action} />}
                    {view === 'gifts' && <GiftsPanel action={action} />}
                </section>
            </div>
        </main>
    );
}

function Overview({ role }: { role: UserRole }) {
    const stats =
        role === 'platform_admin'
            ? [
                  { label: 'Tenants ativos', value: '42', icon: Crown },
                  { label: 'Eventos publicados', value: '318', icon: CalendarPlus },
                  { label: 'Emails na fila', value: '12', icon: MailCheck },
                  { label: 'SLA suporte', value: '98%', icon: Activity },
              ]
            : role === 'guest'
              ? [
                    { label: 'Status RSVP', value: 'Sim', icon: CheckCircle2 },
                    { label: 'Acompanhantes', value: '2', icon: UsersRound },
                    { label: 'Entrada', value: 'QR', icon: QrCode },
                    { label: 'Recados', value: '3', icon: MailCheck },
                ]
              : [
                    { label: 'Eventos ativos', value: '12', icon: CalendarPlus },
                    { label: 'Convidados', value: '4.820', icon: UsersRound },
                    { label: 'RSVP aceitos', value: '78%', icon: MailCheck },
                    { label: 'Check-ins', value: '1.294', icon: QrCode },
                ];

    const checklist =
        role === 'platform_admin'
            ? ['Backups em dia', 'Webhooks saudaveis', 'Fila processando', 'Planos sincronizados']
            : role === 'guest'
              ? ['Presenca confirmada', 'QR Code liberado', 'Endereco salvo', 'Recado recebido']
              : ['Convite publicado', 'Galeria completa', 'Lembretes ativos', 'Portaria configurada'];

    return (
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

            <Card className="mt-6 dark:border-slate-800 dark:bg-slate-900">
                <CardHeader>
                    <CardTitle>{role === 'guest' ? 'Minha jornada' : 'Checklist inteligente'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        {checklist.map((item) => (
                            <div key={item} className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
                                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-500" />
                                {item}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

function EventsPanel({
    query,
    setQuery,
    rows,
    role,
}: {
    query: string;
    setQuery: (value: string) => void;
    rows: typeof events;
    role: UserRole;
}) {
    return (
        <Card className="mt-6 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <CardTitle>{role === 'platform_admin' ? 'Eventos da plataforma' : 'Eventos recentes'}</CardTitle>
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
                    rows={rows.map((event) => [event.name, event.status, String(event.guests), `${String(event.rsvp)}%`])}
                />
            </CardContent>
        </Card>
    );
}

function GuestsPanel({ action }: { action: (message: string) => void }) {
    return (
        <Card className="mt-6 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Convidados</CardTitle>
                    <Button
                        onClick={() => {
                            action('Convite enviado para novo convidado.');
                        }}
                    >
                        <Send className="h-4 w-4" /> Convidar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <DataTable headers={['Nome', 'Email', 'Status']} rows={guests.map((guest) => [guest.name, guest.email, guest.status])} />
            </CardContent>
        </Card>
    );
}

function TemplatesPanel({ action }: { action: (message: string) => void }) {
    return (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
                ['Linear Premium', 'Classico escuro com RSVP elegante'],
                ['Apple Minimal', 'Claro, limpo e direto ao ponto'],
                ['Vercel Launch', 'Visual moderno para evento tech'],
            ].map(([template, description]) => (
                <Card key={template} className="dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle>{template}</CardTitle>
                        <p className="text-sm text-slate-500">{description}</p>
                    </CardHeader>
                    <CardContent>
                        <div className="h-28 rounded-lg bg-[linear-gradient(135deg,#0ea5e9,#14b8a6)]" />
                        <Button
                            className="mt-4 w-full"
                            onClick={() => {
                                action(`${template} aplicado ao evento demo.`);
                            }}
                        >
                            <Wand2 className="h-4 w-4" /> Aplicar tema
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function CheckInPanel({ role, action }: { role: UserRole; action: (message: string) => void }) {
    return (
        <Card className="mt-6 max-w-xl dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
                <CardTitle>{role === 'guest' ? 'Meu QR Code' : 'Check-in QR'}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid aspect-square max-w-48 place-items-center rounded-lg border border-slate-200 bg-white text-slate-950 dark:border-slate-800">
                    <QrCode className="h-24 w-24" />
                </div>
                <Input placeholder="Cole ou digite o token do convidado" defaultValue="demo-invite-token" />
                <Button
                    onClick={() => {
                        action(role === 'guest' ? 'QR Code salvo no celular em modo demo.' : 'Check-in validado para demo-invite-token.');
                    }}
                >
                    <QrCode className="h-4 w-4" /> {role === 'guest' ? 'Salvar QR Code' : 'Validar entrada'}
                </Button>
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                    <CheckCircle2 className="mr-2 inline h-4 w-4" />
                    QR Code pronto para simular a portaria.
                </p>
            </CardContent>
        </Card>
    );
}

function PlatformPanel() {
    return (
        <Card className="mt-6 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
                <CardTitle>Governanca da plataforma</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable
                    headers={['Area', 'Controle', 'Status']}
                    rows={[
                        ['Autenticacao', 'Tokens Sanctum por habilidade', 'Ativo'],
                        ['Tenancy', 'Tenant opcional por request', 'Ativo'],
                        ['Auditoria', 'Eventos criticos em fila', 'Demo'],
                    ]}
                />
            </CardContent>
        </Card>
    );
}

function TenantsPanel() {
    return (
        <Card className="mt-6 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
                <CardTitle>Clientes e planos</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable headers={['Tenant', 'Plano', 'Eventos', 'Status']} rows={tenants.map((tenant) => [tenant.name, tenant.plan, tenant.events, tenant.status])} />
            </CardContent>
        </Card>
    );
}

function SupportPanel({ action }: { action: (message: string) => void }) {
    return (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
            {['Novo chamado', 'Bug reportado', 'Upgrade de plano'].map((ticket, index) => (
                <Card key={ticket} className="dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle>{ticket}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-500">Prioridade {index === 0 ? 'alta' : 'normal'} aguardando triagem.</p>
                        <Button
                            className="mt-4"
                            onClick={() => {
                                action(`${ticket} atribuido para atendimento.`);
                            }}
                        >
                            <ClipboardCheck className="h-4 w-4" /> Atender
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function RsvpPanel({ action }: { action: (message: string) => void }) {
    return (
        <Card className="mt-6 max-w-2xl dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
                <CardTitle>Confirmacao de presenca</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    {['Vou sim', 'Talvez', 'Nao posso ir'].map((answer) => (
                        <Button
                            key={answer}
                            variant={answer === 'Vou sim' ? 'default' : 'secondary'}
                            onClick={() => {
                                action(`RSVP atualizado: ${answer}.`);
                            }}
                        >
                            {answer}
                        </Button>
                    ))}
                </div>
                <Input defaultValue="Vou com mais 2 pessoas" />
            </CardContent>
        </Card>
    );
}

function GiftsPanel({ action }: { action: (message: string) => void }) {
    return (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
            {['Pix dos anfitrioes', 'Lista online', 'Mensagem carinhosa'].map((gift) => (
                <Card key={gift} className="dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle>{gift}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-500">Opcao demo para deixar a experiencia do convidado completa.</p>
                        <Button
                            className="mt-4"
                            onClick={() => {
                                action(`${gift} aberto em modo demo.`);
                            }}
                        >
                            <Gift className="h-4 w-4" /> Abrir
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
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
                                    {index === row.length - 1 ? <Badge>{cell}</Badge> : cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
