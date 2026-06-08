import { motion } from 'framer-motion';
import {
    BarChart3,
    Bell,
    CalendarDays,
    Download,
    ImagePlus,
    Layers3,
    Link2,
    LogOut,
    QrCode,
    Settings2,
    ShieldCheck,
    Sparkles,
    TicketCheck,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthUser, clearSession, getStoredSession } from '../../auth/session';
import { CreateEventForm } from './CreateEventForm';

type AdminView =
    | 'overview'
    | 'events'
    | 'guests'
    | 'templates'
    | 'checkin'
    | 'reports'
    | 'integrations'
    | 'settings'
    | 'platform';

type NavigationItem = {
    label: string;
    view: AdminView;
    icon: LucideIcon;
};

/**
 * Default metric templates
 * In production, these would come from your API
 * based on actual event and RSVP data
 */
function getDefaultMetrics() {
    return [
        { label: 'Eventos', value: '24', trend: '+18% este mês', icon: CalendarDays, color: '#22D3EE' },
        { label: 'Convidados', value: '1.204', trend: '+24% este mês', icon: UsersRound, color: '#8B5CF6' },
        { label: 'Taxa de RSVP', value: '76%', trend: '+8% este mês', icon: BarChart3, color: '#0EA5E9' },
        { label: 'Check-ins realizados', value: '846', trend: '+12% este mês', icon: QrCode, color: '#EF4444' },
    ];
}

/**
 * Default event cards
 * In production, these would come from your API
 * fetched based on the logged-in user's events
 */
function getDefaultEventCards() {
    return [
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
            place: 'Centro de Convenções',
            status: 'Encerrado',
            confirmed: 920,
            rsvp: 84,
            image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80',
        },
    ];
}

/**
 * Default activity log
 * In production, these would be real events from your database
 */
function getDefaultActivity() {
    return [
        'João Silva confirmou presença em Invitely Launch Night',
        'Maria Oliveira fez check-in em Invitely Launch Night',
        'Lucas Pereira recusou presença em Founders Dinner',
    ];
}

function navigationFor(user: AuthUser): NavigationItem[] {
    if (user.role === 'guest') {
        return [
            { label: 'Convite', view: 'overview', icon: TicketCheck },
            { label: 'Check-in', view: 'checkin', icon: QrCode },
            { label: 'Configurações', view: 'settings', icon: Settings2 },
        ];
    }

    const items: NavigationItem[] = [
        { label: 'Overview', view: 'overview', icon: BarChart3 },
        { label: 'Eventos', view: 'events', icon: CalendarDays },
        { label: 'Convidados', view: 'guests', icon: UsersRound },
        { label: 'Templates', view: 'templates', icon: ImagePlus },
        { label: 'Check-in', view: 'checkin', icon: QrCode },
        { label: 'Relatórios', view: 'reports', icon: Layers3 },
        { label: 'Integrações', view: 'integrations', icon: Link2 },
        { label: 'Configurações', view: 'settings', icon: Settings2 },
    ];

    if (user.role === 'platform_admin') {
        return [...items, { label: 'Plataforma', view: 'platform', icon: ShieldCheck }];
    }

    return items;
}

export function AdminDashboard() {
    const navigate = useNavigate();
    const session = getStoredSession();
    const user = session?.user;
    const [view, setView] = useState<AdminView>('overview');
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [toast, setToast] = useState('Dashboard carregado. Explore os módulos do produto.');
    const navigation = useMemo(() => (user ? navigationFor(user) : []), [user]);

    if (!session || !user) {
        return <Navigate to="/login" replace />;
    }

    function notify(message: string) {
        setToast(message);
    }

    function logout() {
        clearSession();
        void navigate('/login');
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
                            <p className="text-xs text-[#94A3B8]">Dono do evento</p>
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
                            <p className="text-sm font-semibold">{user.name || 'Usuário'}</p>
                            <p className="text-xs text-[#94A3B8]">{user.email}</p>
                        </div>
                    </div>
                </aside>

                <section className="px-4 py-5 sm:px-6 lg:px-8">
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-[#94A3B8]">Aqui está o resumo dos seus eventos.</p>
                            <h1 className="mt-1 text-2xl font-extrabold tracking-normal sm:text-3xl">
                                Bem-vindo{user.name?.toLowerCase().includes('maria') || user.name?.toLowerCase().includes('ana') ? 'a' : ''}, {user.name || 'Usuário'}!
                            </h1>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <ActionButton
                                variant="secondary"
                                onClick={() => {
                                    notify('Relatório preparado para exportação.');
                                }}
                            >
                                <Download className="h-4 w-4" />
                                Exportar
                            </ActionButton>
                            <ActionButton
                                onClick={() => {
                                    setIsCreatingEvent(true);
                                    setView('events');
                                    notify('Novo evento iniciado.');
                                }}
                            >
                                <CalendarDays className="h-4 w-4" />
                                Novo evento
                            </ActionButton>
                        </div>
                    </header>

                    <Toast message={toast} />

                    {view === 'overview' && <Overview onAction={notify} />}
                    {view === 'events' &&
                        (isCreatingEvent ? (
                            <CreateEventForm
                                onCancel={() => {
                                    setIsCreatingEvent(false);
                                    notify('Criação de evento cancelada.');
                                }}
                            />
                        ) : (
                            <EventsView onAction={notify} />
                        ))}
                    {view === 'guests' && <SimpleModule title="Convidados" icon={UsersRound} onAction={notify} />}
                    {view === 'templates' && <TemplatesView onAction={notify} />}
                    {view === 'checkin' && <CheckInView onAction={notify} />}
                    {view === 'reports' && <SimpleModule title="Relatórios" icon={Layers3} onAction={notify} />}
                    {view === 'integrations' && <SimpleModule title="Integrações" icon={Link2} onAction={notify} />}
                    {view === 'settings' && <SimpleModule title="Configurações" icon={Settings2} onAction={notify} />}
                    {view === 'platform' && <SimpleModule title="Plataforma" icon={ShieldCheck} onAction={notify} />}
                </section>
            </div>

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#263247] bg-[#0B0F1A]/95 px-3 py-3 backdrop-blur lg:hidden">
                <div className="grid grid-cols-5 gap-1">
                    {navigation.slice(0, 5).map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.view}
                                type="button"
                                onClick={() => {
                                    setView(item.view);
                                    notify(`${item.label} aberto.`);
                                }}
                                className={
                                    item.view === view
                                        ? 'grid justify-items-center gap-1 rounded-xl bg-[#8B5CF6]/25 px-2 py-2 text-xs text-white'
                                        : 'grid justify-items-center gap-1 rounded-xl px-2 py-2 text-xs text-[#94A3B8]'
                                }
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </main>
    );
}

function Overview({ onAction }: { onAction: (message: string) => void }) {
    const metrics = getDefaultMetrics();
    const eventCards = getDefaultEventCards();
    const activity = getDefaultActivity();

    return (
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric, index) => {
                    const Icon = metric.icon;

                    return (
                        <motion.article
                            key={metric.label}
                            initial={false}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -4 }}
                            className="rounded-2xl border border-[#263247] bg-[#121827] p-5 shadow-xl"
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-sm text-[#CBD5E1]">{metric.label}</p>
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1A1F2E]">
                                    <Icon className="h-5 w-5" style={{ color: metric.color }} />
                                </span>
                            </div>
                            <p className="mt-3 text-3xl font-extrabold">{metric.value}</p>
                            <p className="mt-2 text-xs text-[#22C55E]">{metric.trend}</p>
                        </motion.article>
                    );
                })}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                <Panel title="Confirmações nos últimos 7 dias">
                    <LineChart />
                </Panel>
                <Panel title="Eventos próximos" action="Ver todos">
                    <div className="grid gap-3">
                        {eventCards.map((event) => (
                            <button
                                key={event.title}
                                type="button"
                                onClick={() => {
                                    onAction(`${event.title} aberto.`);
                                }}
                                className="flex items-center gap-3 rounded-2xl border border-[#263247] bg-[#1A1F2E]/70 p-3 text-left transition hover:scale-[1.01] hover:border-[#22D3EE]/50"
                            >
                                <img src={event.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">{event.title}</p>
                                    <p className="mt-1 text-xs text-[#94A3B8]">{event.date}</p>
                                </div>
                                <span className="rounded-full bg-[#0EA5E9]/15 px-2 py-1 text-xs text-[#22D3EE]">
                                    {event.confirmed}
                                </span>
                            </button>
                        ))}
                    </div>
                </Panel>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <Panel title="Atividade recente">
                    <div className="grid gap-4">
                        {activity.map((item, index) => (
                            <div key={item} className="flex items-start gap-3">
                                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#22D3EE]" />
                                <div>
                                    <p className="text-sm text-[#E2E8F0]">{item}</p>
                                    <p className="mt-1 text-xs text-[#94A3B8]">há {String(index * 7 + 2)} min</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
                <Panel title="Distribuição de RSVP">
                    <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
                        <DonutChart />
                        <div className="grid gap-3 text-sm">
                            {[
                                ['Confirmados', '76% (918)', '#22D3EE'],
                                ['Pendentes', '18% (216)', '#8B5CF6'],
                                ['Recusados', '6% (72)', '#EF4444'],
                            ].map(([label, value, color]) => (
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
                </Panel>
            </div>
        </motion.div>
    );
}

function EventsView({ onAction }: { onAction: (message: string) => void }) {
    return (
        <motion.section
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
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
                            <MetricPill label="Confirmados" value={String(event.confirmed)} />
                            <MetricPill label="Taxa RSVP" value={`${String(event.rsvp)}%`} />
                        </div>
                        <ActionButton
                            className="mt-5 w-full"
                            onClick={() => {
                                onAction(`${event.title} selecionado.`);
                            }}
                        >
                            Gerenciar evento
                        </ActionButton>
                    </div>
                </motion.article>
            ))}
        </motion.section>
    );
}

function TemplatesView({ onAction }: { onAction: (message: string) => void }) {
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
                    <p className="mt-2 text-sm leading-6 text-[#94A3B8]">Visual premium para eventos memoráveis.</p>
                    <ActionButton
                        className="mt-4 w-full"
                        onClick={() => {
                            onAction(`${template} aplicado ao evento.`);
                        }}
                    >
                        Aplicar template
                    </ActionButton>
                </motion.article>
            ))}
        </section>
    );
}

function CheckInView({ onAction }: { onAction: (message: string) => void }) {
    return (
        <Panel title="Check-in por QR Code" className="mt-6 max-w-2xl">
            <div className="grid gap-4">
                <input
                    placeholder="Cole ou leia o token do convite"
                    className="h-14 rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-sm text-white outline-none transition focus:border-[#22D3EE]"
                />
                <ActionButton
                    onClick={() => {
                        onAction('Check-in validado com sucesso.');
                    }}
                >
                    <QrCode className="h-4 w-4" />
                    Validar entrada
                </ActionButton>
                <div className="rounded-2xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-4 text-sm text-[#BBF7D0]">
                    QR Code pronto para simular a portaria em tempo real.
                </div>
            </div>
        </Panel>
    );
}

function SimpleModule({
    title,
    icon: Icon,
    onAction,
}: {
    title: string;
    icon: LucideIcon;
    onAction: (message: string) => void;
}) {
    return (
        <Panel title={title} className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
                {['Experiência moderna', 'Automação pronta', 'Dados em tempo real'].map((item) => (
                    <motion.button
                        key={item}
                        type="button"
                        whileHover={{ y: -4 }}
                        onClick={() => {
                            onAction(`${item} aberto.`);
                        }}
                        className="rounded-2xl border border-[#263247] bg-[#1A1F2E] p-5 text-left"
                    >
                        <Icon className="h-5 w-5 text-[#22D3EE]" />
                        <h3 className="mt-4 font-bold">{item}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                            Módulo preparado para evoluir com dados reais do tenant.
                        </p>
                    </motion.button>
                ))}
            </div>
        </Panel>
    );
}

function Panel({
    title,
    action,
    children,
    className = '',
}: {
    title: string;
    action?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={`rounded-3xl border border-[#263247] bg-[#121827] p-5 shadow-xl ${className}`}>
            <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="font-bold">{title}</h2>
                {action ? <button className="text-xs font-semibold text-[#A78BFA]">{action}</button> : null}
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
        status === 'Publicado'
            ? 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#86EFAC]'
            : status === 'Rascunho'
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

function LineChart() {
    const points = '0,150 80,112 160,132 240,76 320,116 400,86 480,70';

    return (
        <div className="relative">
            <div className="absolute left-[62%] top-5 rounded-xl border border-[#263247] bg-[#0B0F1A] px-3 py-2 text-xs shadow-xl">
                <strong>312</strong>
                <br />
                Confirmações
            </div>
            <svg viewBox="0 0 480 190" className="h-64 w-full overflow-visible">
                <defs>
                    <linearGradient id="adminLine" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#22D3EE" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                    <linearGradient id="adminArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.42" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((line) => (
                    <line
                        key={String(line)}
                        x1="0"
                        x2="480"
                        y1={String(line * 45 + 30)}
                        y2={String(line * 45 + 30)}
                        stroke="#263247"
                        strokeDasharray="4 8"
                    />
                ))}
                <polyline points={`${points} 480,190 0,190`} fill="url(#adminArea)" />
                <motion.polyline
                    points={points}
                    fill="none"
                    stroke="url(#adminLine)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.1 }}
                />
                {points.split(' ').map((point) => {
                    const [x = '0', y = '0'] = point.split(',');

                    return <circle key={point} cx={x} cy={y} r="5" fill="#8B5CF6" stroke="#C4B5FD" strokeWidth="2" />;
                })}
            </svg>
        </div>
    );
}

function DonutChart() {
    return (
        <div className="mx-auto h-40 w-40 rounded-full bg-[conic-gradient(#22D3EE_0_76%,#8B5CF6_76%_94%,#EF4444_94%_100%)] p-8">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#121827] text-center">
                <div>
                    <p className="text-2xl font-extrabold">76%</p>
                    <p className="text-xs text-[#94A3B8]">RSVP</p>
                </div>
            </div>
        </div>
    );
}
