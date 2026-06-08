import { motion } from 'framer-motion';
import {
    Activity,
    BarChart3,
    Bell,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Crown,
    Download,
    Gift,
    HeartHandshake,
    ImagePlus,
    LifeBuoy,
    Link2,
    LogOut,
    MapPin,
    Megaphone,
    QrCode,
    Send,
    Settings2,
    ShieldCheck,
    Sparkles,
    TicketCheck,
    UsersRound,
    Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthUser, UserRole, clearSession, getStoredSession, roleLabel } from '../../auth/session';
import { CreateEventForm } from './CreateEventForm';

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
    | 'gifts'
    | 'integrations'
    | 'settings';

type NavigationItem = {
    label: string;
    view: DashboardView;
    icon: LucideIcon;
};

type ActionItem = {
    label: string;
    icon: LucideIcon;
    message: string;
    variant?: 'primary' | 'secondary';
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
        roleName: string;
    }
> = {
    platform_admin: {
        eyebrow: 'Operacao do software',
        title: 'Painel do admin da plataforma',
        description: 'Monitore clientes, saude do sistema, suporte, integracoes e configuracoes globais.',
        roleName: 'Admin da plataforma',
    },
    owner: {
        eyebrow: 'Festa em producao',
        title: 'Painel de quem esta fazendo a festa',
        description: 'Monte o convite, acompanhe convidados, envie lembretes e controle a entrada.',
        roleName: 'Organizador',
    },
    guest: {
        eyebrow: 'Meu convite',
        title: 'Area de quem vai a festa',
        description: 'Confirme presenca, veja detalhes do evento, salve QR Code e acompanhe recados.',
        roleName: 'Convidado',
    },
};

const eventCards = [
    {
        title: 'Invitely Launch Night',
        date: '23 jul 2026 - 19:00',
        place: 'Atelier Vista',
        status: 'Publicado',
        confirmed: 180,
        rsvp: 71,
        image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
    },
    {
        title: 'Founders Dinner',
        date: '05 ago 2026 - 20:00',
        place: 'Rascunho',
        status: 'Rascunho',
        confirmed: 64,
        rsvp: 42,
        image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80',
    },
    {
        title: 'Aurora Summit',
        date: '12 set 2026 - 08:00',
        place: 'Centro de Convencoes',
        status: 'Encerrado',
        confirmed: 920,
        rsvp: 84,
        image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80',
    },
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
            { label: 'Eventos', view: 'events', icon: CalendarDays },
            { label: 'Suporte', view: 'support', icon: LifeBuoy },
            { label: 'Integracoes', view: 'integrations', icon: Link2 },
            { label: 'Governanca', view: 'platform', icon: ShieldCheck },
        ];
    }

    if (user.role === 'guest') {
        return [
            { label: 'Convite', view: 'overview', icon: TicketCheck },
            { label: 'RSVP', view: 'rsvp', icon: HeartHandshake },
            { label: 'QR Code', view: 'checkin', icon: QrCode },
            { label: 'Presentes', view: 'gifts', icon: Gift },
            { label: 'Ajustes', view: 'settings', icon: Settings2 },
        ];
    }

    return [
        { label: 'Resumo', view: 'overview', icon: BarChart3 },
        { label: 'Eventos', view: 'events', icon: CalendarDays },
        { label: 'Convidados', view: 'guests', icon: UsersRound },
        { label: 'Templates', view: 'templates', icon: ImagePlus },
        { label: 'Check-in', view: 'checkin', icon: QrCode },
        { label: 'Ajustes', view: 'settings', icon: Settings2 },
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
        { label: 'Criar evento', icon: CalendarDays, message: 'Novo evento iniciado.' },
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
    const user = session?.user;
    const [view, setView] = useState<DashboardView>('overview');
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [toast, setToast] = useState('Dashboard carregado. Explore os modulos do produto.');

    const expectedRole = expectedRoleForPath(location.pathname);
    const navigation = useMemo(() => (user ? navigationFor(user) : []), [user]);
    const actions = useMemo(() => (user ? actionsFor(user) : []), [user]);

    if (!session || !user) {
        return <Navigate to="/login" replace />;
    }

    if (expectedRole && expectedRole !== user.role) {
        return <Navigate to={destinations[user.role]} replace />;
    }

    const copy = profileCopy[user.role];

    function notify(message: string) {
        setToast(message);
    }

    function logout() {
        clearSession();
        void navigate('/login');
    }

    function runAction(item: ActionItem) {
        if (user?.role === 'owner' && item.label === 'Criar evento') {
            setIsCreatingEvent(true);
            setView('events');
        }

        notify(item.message);
    }

    return (
        <main className="min-h-screen bg-[#060B1A] pb-24 text-white lg:pb-0">
            <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
                <aside className="hidden border-r border-[#263247] bg-[#0B0F1A]/95 p-5 lg:flex lg:flex-col">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/20">
                            <Sparkles className="h-5 w-5 text-[#A78BFA]" />
                        </div>
                        <div>
                            <p className="font-bold">Invitely</p>
                            <p className="text-xs text-[#94A3B8]">{roleLabel(user.role)}</p>
                        </div>
                    </div>

                    <nav className="mt-8 grid gap-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.view}
                                    type="button"
                                    onClick={() => {
                                        setView(item.view);
                                        setIsCreatingEvent(false);
                                        notify(`${item.label} aberto.`);
                                    }}
                                    className={
                                        item.view === view
                                            ? 'flex h-11 items-center gap-3 rounded-xl bg-[#8B5CF6]/25 px-3 text-sm font-semibold text-white'
                                            : 'flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-[#CBD5E1] transition hover:bg-[#121827] hover:text-white'
                                    }
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="mt-auto grid gap-2">
                        <Link
                            to="/events/invitely-launch-night"
                            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-[#CBD5E1] transition hover:bg-[#121827] hover:text-white"
                        >
                            <Sparkles className="h-4 w-4" />
                            Ver convite
                        </Link>
                        <button
                            type="button"
                            onClick={logout}
                            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-[#CBD5E1] transition hover:bg-[#121827] hover:text-white"
                        >
                            <LogOut className="h-4 w-4" />
                            Sair
                        </button>
                        <div className="mt-3 rounded-2xl border border-[#263247] bg-[#121827] p-3">
                            <p className="text-sm font-semibold">{user.name || 'Usuario'}</p>
                            <p className="text-xs text-[#94A3B8]">{user.email}</p>
                        </div>
                    </div>
                </aside>

                <section className="px-4 py-5 sm:px-6 lg:px-8">
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <span className="inline-flex rounded-full border border-[#263247] bg-[#121827] px-3 py-1 text-xs font-semibold text-[#CBD5E1]">
                                {copy.roleName}
                            </span>
                            <p className="mt-4 text-sm text-[#94A3B8]">{copy.eyebrow}</p>
                            <h1 className="mt-1 text-2xl font-extrabold tracking-normal sm:text-3xl">{copy.title}</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]">{copy.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {actions.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <ActionButton
                                        key={item.label}
                                        variant={item.variant ?? 'primary'}
                                        onClick={() => {
                                            runAction(item);
                                        }}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </ActionButton>
                                );
                            })}
                        </div>
                    </header>

                    <Toast message={toast} />

                    {isCreatingEvent ? (
                        <div className="mt-6">
                            <CreateEventForm
                                onCancel={() => {
                                    setIsCreatingEvent(false);
                                    notify('Criacao de evento cancelada.');
                                }}
                            />
                        </div>
                    ) : (
                        <DashboardContent role={user.role} view={view} notify={notify} />
                    )}
                </section>
            </div>
        </main>
    );
}

function DashboardContent({
    role,
    view,
    notify,
}: {
    role: UserRole;
    view: DashboardView;
    notify: (message: string) => void;
}) {
    if (view === 'overview') {
        return <Overview role={role} notify={notify} />;
    }

    if (view === 'events') {
        return <EventsView role={role} notify={notify} />;
    }

    if (view === 'guests') {
        return <DataPanel title="Convidados" headers={['Nome', 'Email', 'Status']} rows={guests.map((guest) => [guest.name, guest.email, guest.status])} />;
    }

    if (view === 'templates') {
        return <TemplatesView notify={notify} />;
    }

    if (view === 'checkin') {
        return <CheckInView role={role} notify={notify} />;
    }

    if (view === 'tenants') {
        return <DataPanel title="Clientes e planos" headers={['Tenant', 'Plano', 'Eventos', 'Status']} rows={tenants.map((tenant) => [tenant.name, tenant.plan, tenant.events, tenant.status])} />;
    }

    if (view === 'platform') {
        return (
            <DataPanel
                title="Governanca da plataforma"
                headers={['Area', 'Controle', 'Status']}
                rows={[
                    ['Autenticacao', 'Tokens por habilidade', 'Ativo'],
                    ['Tenancy', 'Tenant opcional por request', 'Ativo'],
                    ['Auditoria', 'Eventos criticos em fila', 'Demo'],
                ]}
            />
        );
    }

    if (view === 'support') {
        return <CardsModule title="Suporte" icon={LifeBuoy} notify={notify} items={['Novo chamado', 'Bug reportado', 'Upgrade de plano']} />;
    }

    if (view === 'rsvp') {
        return <RsvpView notify={notify} />;
    }

    if (view === 'gifts') {
        return <CardsModule title="Presentes" icon={Gift} notify={notify} items={['Pix dos anfitrioes', 'Lista online', 'Mensagem carinhosa']} />;
    }

    if (view === 'integrations') {
        return <CardsModule title="Integracoes" icon={Link2} notify={notify} items={['Supabase', 'Mailpit', 'MinIO']} />;
    }

    return <CardsModule title="Configuracoes" icon={Settings2} notify={notify} items={['Perfil', 'Notificacoes', 'Privacidade']} />;
}

function Overview({ role, notify }: { role: UserRole; notify: (message: string) => void }) {
    const metrics =
        role === 'platform_admin'
            ? [
                  { label: 'Tenants ativos', value: '42', trend: '+6 esta semana', icon: Crown, color: '#A78BFA' },
                  { label: 'Eventos publicados', value: '318', trend: '+18% este mes', icon: CalendarDays, color: '#22D3EE' },
                  { label: 'Fila de e-mail', value: '12', trend: 'processando', icon: Bell, color: '#F59E0B' },
                  { label: 'SLA suporte', value: '98%', trend: '+2 pontos', icon: Activity, color: '#22C55E' },
              ]
            : role === 'guest'
              ? [
                    { label: 'RSVP', value: 'Sim', trend: 'confirmado', icon: CheckCircle2, color: '#22C55E' },
                    { label: 'Acompanhantes', value: '2', trend: 'liberado', icon: UsersRound, color: '#22D3EE' },
                    { label: 'Entrada', value: 'QR', trend: 'pronto', icon: QrCode, color: '#A78BFA' },
                    { label: 'Recados', value: '3', trend: 'novos', icon: Bell, color: '#F59E0B' },
                ]
              : [
                    { label: 'Eventos', value: '24', trend: '+18% este mes', icon: CalendarDays, color: '#22D3EE' },
                    { label: 'Convidados', value: '1.204', trend: '+24% este mes', icon: UsersRound, color: '#8B5CF6' },
                    { label: 'Taxa de RSVP', value: '76%', trend: '+8% este mes', icon: BarChart3, color: '#0EA5E9' },
                    { label: 'Check-ins', value: '846', trend: '+12% este mes', icon: QrCode, color: '#EF4444' },
                ];

    return (
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => {
                    const Icon = metric.icon;

                    return (
                        <button
                            key={metric.label}
                            type="button"
                            onClick={() => {
                                notify(`${metric.label} aberto.`);
                            }}
                            className="rounded-2xl border border-[#263247] bg-[#121827] p-5 text-left shadow-xl transition hover:-translate-y-1"
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-sm text-[#CBD5E1]">{metric.label}</p>
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1A1F2E]">
                                    <Icon className="h-5 w-5" style={{ color: metric.color }} />
                                </span>
                            </div>
                            <p className="mt-3 text-3xl font-extrabold">{metric.value}</p>
                            <p className="mt-2 text-xs text-[#22C55E]">{metric.trend}</p>
                        </button>
                    );
                })}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <Panel title={role === 'guest' ? 'Detalhes da festa' : 'Atividade recente'}>
                    <ActivityList role={role} />
                </Panel>
                <Panel title={role === 'guest' ? 'Proximos passos' : 'Distribuicao de RSVP'}>
                    <DonutSummary role={role} />
                </Panel>
            </div>
        </motion.div>
    );
}

function EventsView({ role, notify }: { role: UserRole; notify: (message: string) => void }) {
    return (
        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {eventCards.map((event) => (
                <motion.article
                    key={event.title}
                    whileHover={{ y: -6 }}
                    className="overflow-hidden rounded-3xl border border-[#263247] bg-[#121827] shadow-xl"
                >
                    <img src={event.image} alt="" className="h-44 w-full object-cover" />
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold">{event.title}</h2>
                                <p className="mt-1 text-sm text-[#94A3B8]">{event.date}</p>
                            </div>
                            <StatusChip status={event.status} />
                        </div>
                        <p className="mt-3 text-sm text-[#CBD5E1]">{event.place}</p>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <MetricPill label={role === 'platform_admin' ? 'Tenant' : 'Confirmados'} value={role === 'platform_admin' ? 'Demo' : String(event.confirmed)} />
                            <MetricPill label="Taxa RSVP" value={`${String(event.rsvp)}%`} />
                        </div>
                        <ActionButton
                            className="mt-5 w-full"
                            onClick={() => {
                                notify(`${event.title} selecionado.`);
                            }}
                        >
                            Gerenciar evento
                        </ActionButton>
                    </div>
                </motion.article>
            ))}
        </section>
    );
}

function TemplatesView({ notify }: { notify: (message: string) => void }) {
    return (
        <section className="mt-6 grid gap-5 md:grid-cols-3">
            {['Linear Premium', 'Apple Events', 'Raycast Night'].map((template) => (
                <motion.article
                    key={template}
                    whileHover={{ y: -5 }}
                    className="rounded-3xl border border-[#263247] bg-[#121827] p-5"
                >
                    <div className="h-32 rounded-2xl bg-gradient-to-br from-[#8B5CF6] via-[#0EA5E9] to-[#22D3EE]" />
                    <h2 className="mt-4 text-lg font-bold">{template}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#94A3B8]">Visual premium para eventos memoraveis.</p>
                    <ActionButton
                        className="mt-4 w-full"
                        onClick={() => {
                            notify(`${template} aplicado ao evento.`);
                        }}
                    >
                        <Wand2 className="h-4 w-4" />
                        Aplicar template
                    </ActionButton>
                </motion.article>
            ))}
        </section>
    );
}

function CheckInView({ role, notify }: { role: UserRole; notify: (message: string) => void }) {
    return (
        <Panel title={role === 'guest' ? 'Meu QR Code' : 'Check-in por QR Code'} className="mt-6 max-w-2xl">
            <div className="grid gap-4">
                <div className="grid aspect-square max-w-48 place-items-center rounded-2xl border border-[#263247] bg-white text-[#060B1A]">
                    <QrCode className="h-24 w-24" />
                </div>
                <input
                    placeholder="Cole ou leia o token do convite"
                    defaultValue="demo-invite-token"
                    className="h-14 rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-sm text-white outline-none transition focus:border-[#22D3EE]"
                />
                <ActionButton
                    onClick={() => {
                        notify(role === 'guest' ? 'QR Code salvo no celular em modo demo.' : 'Check-in validado com sucesso.');
                    }}
                >
                    <QrCode className="h-4 w-4" />
                    {role === 'guest' ? 'Salvar QR Code' : 'Validar entrada'}
                </ActionButton>
                <div className="rounded-2xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-4 text-sm text-[#BBF7D0]">
                    QR Code pronto para simular a portaria em tempo real.
                </div>
            </div>
        </Panel>
    );
}

function RsvpView({ notify }: { notify: (message: string) => void }) {
    return (
        <Panel title="Confirmacao de presenca" className="mt-6 max-w-2xl">
            <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    {['Vou sim', 'Talvez', 'Nao posso ir'].map((answer) => (
                        <ActionButton
                            key={answer}
                            variant={answer === 'Vou sim' ? 'primary' : 'secondary'}
                            onClick={() => {
                                notify(`RSVP atualizado: ${answer}.`);
                            }}
                        >
                            {answer}
                        </ActionButton>
                    ))}
                </div>
                <input
                    defaultValue="Vou com mais 2 pessoas"
                    className="h-12 rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-sm text-white outline-none transition focus:border-[#22D3EE]"
                />
            </div>
        </Panel>
    );
}

function CardsModule({
    title,
    icon: Icon,
    items,
    notify,
}: {
    title: string;
    icon: LucideIcon;
    items: string[];
    notify: (message: string) => void;
}) {
    return (
        <Panel title={title} className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
                {items.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => {
                            notify(`${item} aberto em modo demo.`);
                        }}
                        className="rounded-2xl border border-[#263247] bg-[#1A1F2E] p-5 text-left transition hover:-translate-y-1"
                    >
                        <Icon className="h-5 w-5 text-[#22D3EE]" />
                        <h3 className="mt-4 font-bold">{item}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                            Modulo preparado para evoluir com dados reais do produto.
                        </p>
                    </button>
                ))}
            </div>
        </Panel>
    );
}

function DataPanel({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
    return (
        <Panel title={title} className="mt-6">
            <div className="overflow-hidden rounded-2xl border border-[#263247]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#1A1F2E] text-xs uppercase text-[#94A3B8]">
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
                            <tr key={row.join('-')} className="border-t border-[#263247]">
                                {row.map((cell, index) => (
                                    <td key={`${cell}-${String(index)}`} className="px-4 py-4">
                                        {index === row.length - 1 ? <StatusChip status={cell} /> : cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Panel>
    );
}

function ActivityList({ role }: { role: UserRole }) {
    const items =
        role === 'platform_admin'
            ? ['Tenant Aurora Studio atualizou plano', 'Fila de e-mail estabilizada', 'Novo chamado atribuido']
            : role === 'guest'
              ? ['Evento confirmado para 23 jul 2026', 'Dress code: smart casual', 'Endereco salvo: Atelier Vista']
              : ['Joao Silva confirmou presenca', 'Maria Oliveira fez check-in', 'Lucas Pereira recusou presenca'];

    return (
        <div className="grid gap-4">
            {items.map((item, index) => (
                <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#22D3EE]" />
                    <div>
                        <p className="text-sm text-[#E2E8F0]">{item}</p>
                        <p className="mt-1 text-xs text-[#94A3B8]">ha {String(index * 7 + 2)} min</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function DonutSummary({ role }: { role: UserRole }) {
    const labels =
        role === 'guest'
            ? [
                  ['Confirmado', 'Sim', '#22D3EE'],
                  ['Acompanhantes', '2', '#8B5CF6'],
                  ['Entrada', 'QR liberado', '#22C55E'],
              ]
            : [
                  ['Confirmados', '76% (918)', '#22D3EE'],
                  ['Pendentes', '18% (216)', '#8B5CF6'],
                  ['Recusados', '6% (72)', '#EF4444'],
              ];

    return (
        <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
            <div className="mx-auto h-40 w-40 rounded-full bg-[conic-gradient(#22D3EE_0_76%,#8B5CF6_76%_94%,#EF4444_94%_100%)] p-8">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#121827] text-center">
                    <div>
                        <p className="text-2xl font-extrabold">{role === 'guest' ? 'OK' : '76%'}</p>
                        <p className="text-xs text-[#94A3B8]">{role === 'guest' ? 'Convite' : 'RSVP'}</p>
                    </div>
                </div>
            </div>
            <div className="grid gap-3 text-sm">
                {labels.map(([label, value, color]) => (
                    <div key={label} className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 text-[#CBD5E1]">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                            {label}
                        </span>
                        <strong>{value}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Panel({
    title,
    children,
    className = '',
}: {
    title: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={`rounded-3xl border border-[#263247] bg-[#121827] p-5 shadow-xl ${className}`}>
            <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="font-bold">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function ActionButton({
    children,
    onClick,
    variant = 'primary',
    className = '',
}: {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                variant === 'primary'
                    ? `inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-4 text-sm font-bold text-white transition hover:scale-[1.03] ${className}`
                    : `inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#263247] bg-[#121827] px-4 text-sm font-bold text-white transition hover:scale-[1.03] ${className}`
            }
        >
            {children}
        </button>
    );
}

function Toast({ message }: { message: string }) {
    return (
        <motion.div
            key={message}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex items-center gap-3 rounded-2xl border border-[#263247] bg-[#121827]/90 px-4 py-3 text-sm text-[#CBD5E1]"
        >
            <Bell className="h-4 w-4 text-[#22D3EE]" />
            {message}
        </motion.div>
    );
}

function StatusChip({ status }: { status: string }) {
    const color =
        status === 'Publicado' || status === 'Confirmado' || status === 'Saudavel' || status === 'Ativo'
            ? 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#86EFAC]'
            : status === 'Rascunho' || status === 'Pendente' || status === 'Atencao' || status === 'Demo'
              ? 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#FCD34D]'
              : 'border-[#94A3B8]/30 bg-[#94A3B8]/10 text-[#CBD5E1]';

    return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${color}`}>{status}</span>;
}

function MetricPill({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[#263247] bg-[#0B0F1A] p-3">
            <p className="text-xs text-[#94A3B8]">{label}</p>
            <p className="mt-1 text-lg font-bold">{value}</p>
        </div>
    );
}
