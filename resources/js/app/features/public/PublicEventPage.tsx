import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Loader2,
    MapPin,
    Minus,
    Music2,
    Plus,
    Share2,
    Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { ReactNode } from 'react';
import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getStoredSession } from '../../auth/session';
import { PublicEvent } from './types';

type RsvpStatus = 'accepted' | 'declined';
type CountdownItem = [label: string, value: number];

const demoEvent: PublicEvent = {
    id: 'demo',
    name: 'Invitely Launch Night',
    slug: 'invitely-launch-night',
    status: 'published',
    starts_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: null,
    timezone: 'America/Sao_Paulo',
    venue: {
        name: 'Atelier Vista',
        address: 'Av. Paulista, 1000 - São Paulo, SP',
        latitude: null,
        longitude: null,
    },
    spotify_playlist_url: 'https://open.spotify.com/playlist/37i9dQZF1DX4dyzvuaRJ0n',
    hero: {
        eyebrow: 'Convite digital',
        title: 'Invitely Launch Night',
        subtitle: 'Uma experiência elegante para confirmar presença e acompanhar cada detalhe.',
        image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=80',
    },
    content: {
        hosts: ['Equipe Invitely'],
        schedule: [
            { time: '19:00', title: 'Recepção' },
            { time: '20:30', title: 'Cerimônia' },
            { time: '21:30', title: 'Celebração' },
        ],
        dress_code: 'Smart casual',
        note: 'Use seu QR Code na entrada para check-in rápido.',
    },
    theme: { mode: 'dark', primary: '#8B5CF6', accent: '#22D3EE' },
    gallery: [
        {
            url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80',
            alt: 'Mesas do evento',
        },
        {
            url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80',
            alt: 'Luzes da celebração',
        },
        {
            url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
            alt: 'Espaço premium',
        },
    ],
    metrics: { accepted: 42, declined: 3, invited: 120 },
};

function useCountdown(date: string): CountdownItem[] {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(Date.now());
        }, 60_000);

        return () => {
            window.clearInterval(timer);
        };
    }, []);

    return useMemo(() => {
        const diff = Math.max(0, new Date(date).getTime() - now);

        return [
            ['Dias', Math.floor(diff / 86_400_000)],
            ['Horas', Math.floor((diff / 3_600_000) % 24)],
            ['Min', Math.floor((diff / 60_000) % 60)],
        ];
    }, [date, now]);
}

export function PublicEventPage() {
    const { slug = 'invitely-launch-night' } = useParams();
    const session = getStoredSession();
    const [notice, setNotice] = useState('Convite carregado. Confirme presença, compartilhe ou teste o QR Code.');
    const [form, setForm] = useState({
        invite_token: 'demo-invite-token',
        name: 'João da Silva',
        email: 'joao@email.com',
        companions: 2,
        message: '',
    });

    const eventQuery = useQuery({
        queryKey: ['public-event', slug],
        queryFn: async () => {
            const response = await fetch(`/api/v1/events/${slug}`);
            if (!response.ok) {
                return demoEvent;
            }
            const payload = (await response.json()) as { data: PublicEvent };
            return payload.data;
        },
    });

    const event = eventQuery.data ?? demoEvent;
    const countdown = useCountdown(event.starts_at);
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(event.starts_at));
    const formattedTime = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(event.starts_at));

    const rsvp = useMutation({
        mutationFn: async (status: RsvpStatus) => {
            const response = await fetch(`/api/v1/events/${event.slug}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    invite_token: form.invite_token,
                    companions: form.companions,
                    message: `${form.name} <${form.email}> - ${form.message}`,
                    status,
                }),
            });

            if (!response.ok) {
                throw new Error('Não foi possível confirmar agora.');
            }

            return (await response.json()) as unknown;
        },
        onSuccess: () => {
            setNotice('Resposta registrada com sucesso. Seu QR Code está pronto para o check-in.');
        },
    });

    function submit(eventSubmit: SyntheticEvent<HTMLFormElement>) {
        eventSubmit.preventDefault();
        rsvp.mutate('accepted');
    }

    function updateCompanions(direction: 1 | -1) {
        setForm((current) => ({
            ...current,
            companions: Math.max(0, current.companions + direction),
        }));
    }

    function share() {
        if (typeof navigator.share === 'function') {
            void navigator.share({ title: event.name, url: window.location.href });
            setNotice('Compartilhamento aberto pelo navegador.');

            return;
        }

        void navigator.clipboard.writeText(window.location.href);
        setNotice('Link do convite copiado para a área de transferência.');
    }

    return (
        <main className="min-h-screen overflow-x-hidden bg-[#060B1A] pb-24 text-white">
            <section className="relative min-h-screen overflow-x-hidden">
                <img src={event.hero.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,11,26,0.96),rgba(6,11,26,0.82)_45%,rgba(6,11,26,0.72)),linear-gradient(180deg,rgba(6,11,26,0.12),#060B1A)]" />
                <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-[#8B5CF6]/20 blur-3xl" />

                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold">
                        <Sparkles className="h-5 w-5 text-[#A78BFA]" />
                        Invitely
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={share}
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#263247] bg-[#121827]/80 backdrop-blur transition hover:scale-[1.03]"
                            aria-label="Compartilhar"
                        >
                            <Share2 className="h-4 w-4" />
                        </button>
                        <Link
                            to={session ? '/admin' : '/login'}
                            className="hidden h-11 items-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-4 text-sm font-bold transition hover:scale-[1.03] sm:inline-flex"
                        >
                            {session ? 'Painel' : 'Entrar'}
                        </Link>
                    </div>
                </header>

                <div className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] w-full max-w-7xl gap-8 px-4 pb-10 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-end lg:px-8">
                    <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full min-w-0 max-w-[calc(100vw-2rem)] sm:max-w-none"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-[#E2E8F0] backdrop-blur">
                            <Sparkles className="h-3.5 w-3.5 text-[#22D3EE]" />
                            {event.hero.eyebrow}
                        </span>
                        <h1 className="mt-5 max-w-full break-words text-3xl font-extrabold leading-tight tracking-normal min-[360px]:text-4xl sm:max-w-4xl sm:text-6xl lg:text-7xl">
                            {event.hero.title ?? event.name}
                        </h1>
                        <p className="mt-5 max-w-full text-base leading-8 text-[#CBD5E1] sm:max-w-2xl sm:text-lg">
                            {event.hero.subtitle}
                        </p>

                        <div className="mt-7 grid min-w-0 gap-3 text-sm text-[#E2E8F0] sm:grid-cols-3">
                            <InfoPill icon={CalendarDays} label={formattedDate} />
                            <InfoPill icon={Clock3} label={formattedTime} />
                            <InfoPill icon={MapPin} label={event.venue.name ?? 'Local a definir'} />
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <a
                                href="#confirmar"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-5 text-sm font-bold transition hover:scale-[1.03]"
                            >
                                Confirmar presença <ArrowRight className="h-4 w-4" />
                            </a>
                            <a
                                href="#detalhes"
                                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#263247] bg-[#121827]/80 px-5 text-sm font-bold backdrop-blur transition hover:scale-[1.03]"
                            >
                                Ver detalhes
                            </a>
                        </div>

                        <div className="mt-8 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
                            {countdown.map(([label, value]) => (
                                <div
                                    key={label}
                                    className="min-w-0 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur sm:p-4"
                                >
                                    <p className="text-2xl font-extrabold sm:text-3xl">{value}</p>
                                    <p className="mt-1 text-xs text-[#CBD5E1]">{label}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.form
                        id="confirmar"
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        onSubmit={(eventSubmit) => {
                            submit(eventSubmit);
                        }}
                        className="min-w-0 rounded-3xl border border-[#263247] bg-[#0B0F1A]/88 p-5 shadow-2xl backdrop-blur-xl"
                    >
                        <div className="mb-5">
                            <h2 className="text-xl font-bold">Confirmar presença</h2>
                            <p className="mt-2 text-sm leading-6 text-[#94A3B8]">{notice}</p>
                        </div>
                        <div className="grid gap-3">
                            <InviteInput
                                label="Nome completo"
                                value={form.name}
                                onChange={(value) => {
                                    setForm({ ...form, name: value });
                                }}
                            />
                            <InviteInput
                                label="E-mail"
                                type="email"
                                value={form.email}
                                onChange={(value) => {
                                    setForm({ ...form, email: value });
                                }}
                            />
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-[#CBD5E1]">Acompanhantes</label>
                                <div className="grid grid-cols-[44px_1fr_44px] overflow-hidden rounded-xl border border-[#263247] bg-[#060B1A]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateCompanions(-1);
                                        }}
                                        className="flex h-12 items-center justify-center border-r border-[#263247] transition hover:bg-[#121827]"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <div className="flex h-12 items-center justify-center font-bold">
                                        {form.companions}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateCompanions(1);
                                        }}
                                        className="flex h-12 items-center justify-center border-l border-[#263247] transition hover:bg-[#121827]"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <InviteInput
                                label="Mensagem opcional"
                                value={form.message}
                                onChange={(value) => {
                                    setForm({ ...form, message: value });
                                }}
                            />
                            <button
                                type="submit"
                                disabled={rsvp.isPending}
                                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] text-sm font-bold transition hover:scale-[1.03] disabled:opacity-60"
                            >
                                {rsvp.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                )}
                                Confirmar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    rsvp.mutate('declined');
                                }}
                                disabled={rsvp.isPending}
                                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#263247] text-sm font-bold transition hover:scale-[1.03]"
                            >
                                Recusar
                            </button>
                        </div>
                        {rsvp.isError ? (
                            <p className="mt-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-sm text-red-100">
                                {rsvp.error.message}
                            </p>
                        ) : null}
                    </motion.form>
                </div>
            </section>

            <section
                id="detalhes"
                className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8"
            >
                <Panel title="Programação">
                    <div className="grid gap-3">
                        {event.content.schedule?.map((item) => (
                            <div
                                key={`${item.time}-${item.title}`}
                                className="flex items-center justify-between rounded-2xl border border-[#263247] bg-[#121827] p-4"
                            >
                                <span className="font-semibold">{item.title}</span>
                                <span className="text-sm text-[#22D3EE]">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </Panel>
                <div className="grid gap-3 sm:grid-cols-3">
                    {event.gallery.map((image) => (
                        <motion.img
                            key={image.url}
                            src={image.url}
                            alt={image.alt}
                            whileHover={{ y: -6 }}
                            className="aspect-[4/5] rounded-3xl border border-[#263247] object-cover"
                        />
                    ))}
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-12 sm:px-6 lg:grid-cols-3 lg:px-8">
                <Panel title="Check-in QR">
                    <div className="flex items-center gap-5">
                        <div className="rounded-2xl bg-white p-3">
                            <QRCodeSVG value={`${window.location.origin}/check-in/${form.invite_token}`} size={104} />
                        </div>
                        <p className="text-sm leading-6 text-[#94A3B8]">
                            Token seguro para validação rápida na entrada do evento.
                        </p>
                    </div>
                </Panel>
                <Panel title="Local">
                    <p className="font-semibold">{event.venue.name}</p>
                    <p className="mt-2 text-sm leading-6 text-[#94A3B8]">{event.venue.address}</p>
                    <div className="mt-4 h-28 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#8B5CF6]" />
                </Panel>
                <Panel title="Playlist">
                    <a
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#22D3EE]"
                        href={event.spotify_playlist_url ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Music2 className="h-4 w-4" /> Abrir no Spotify
                    </a>
                    <p className="mt-3 text-sm leading-6 text-[#94A3B8]">{event.content.note}</p>
                </Panel>
            </section>

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#263247] bg-[#0B0F1A]/95 px-4 py-3 backdrop-blur md:hidden">
                <div className="grid grid-cols-[1fr_52px] gap-3">
                    <a
                        href="#confirmar"
                        className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] text-sm font-bold"
                    >
                        Confirmar presença
                    </a>
                    <button
                        type="button"
                        onClick={share}
                        className="flex h-12 items-center justify-center rounded-xl border border-[#263247] bg-[#121827]"
                        aria-label="Compartilhar convite"
                    >
                        <Share2 className="h-4 w-4" />
                    </button>
                </div>
            </nav>
        </main>
    );
}

function InfoPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
    return (
        <span className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 backdrop-blur">
            <Icon className="h-4 w-4 shrink-0 text-[#22D3EE]" />
            <span className="min-w-0 truncate">{label}</span>
        </span>
    );
}

function InviteInput({
    label,
    value,
    onChange,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'email';
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

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-3xl border border-[#263247] bg-[#121827] p-5 shadow-xl">
            <h2 className="mb-5 text-lg font-bold">{title}</h2>
            {children}
        </section>
    );
}
