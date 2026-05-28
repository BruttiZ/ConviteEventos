import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Loader2,
    MapPin,
    Moon,
    Music2,
    QrCode,
    Send,
    Share2,
    Sparkles,
    Sun,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
        address: 'Av. Paulista, 1000 - Sao Paulo, SP',
        latitude: null,
        longitude: null,
    },
    spotify_playlist_url: 'https://open.spotify.com/playlist/37i9dQZF1DX4dyzvuaRJ0n',
    hero: {
        eyebrow: 'Convite digital',
        title: 'Invitely Launch Night',
        subtitle: 'Uma experiencia elegante para confirmar presenca e acompanhar cada detalhe.',
        image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=80',
    },
    content: {
        hosts: ['Equipe Invitely'],
        schedule: [
            { time: '19:00', title: 'Recepcao' },
            { time: '20:30', title: 'Cerimonia' },
            { time: '21:30', title: 'Celebracao' },
        ],
        dress_code: 'Smart casual',
        note: 'Use seu QR Code na entrada para check-in rapido.',
    },
    theme: { mode: 'dark', primary: '#0A84FF', accent: '#14B8A6' },
    gallery: [
        {
            url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80',
            alt: 'Event tables',
        },
        {
            url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80',
            alt: 'Celebration lights',
        },
        {
            url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
            alt: 'Premium venue',
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
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [form, setForm] = useState({ invite_token: 'demo-invite-token', companions: 0, message: '' });

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
    const isDark = theme === 'dark';
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(event.starts_at));

    const rsvp = useMutation({
        mutationFn: async (status: RsvpStatus) => {
            const response = await fetch(`/api/v1/events/${event.slug}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ ...form, status }),
            });

            if (!response.ok) {
                throw new Error('Nao foi possivel confirmar agora.');
            }

            const payload: unknown = await response.json();

            return payload;
        },
    });

    function submit(status: RsvpStatus) {
        rsvp.mutate(status);
    }

    function share() {
        if (typeof navigator.share === 'function') {
            void navigator.share({ title: event.name, url: window.location.href });

            return;
        }

        void navigator.clipboard.writeText(window.location.href);
    }

    return (
        <main
            className={
                isDark
                    ? 'dark min-h-screen bg-slate-950 pb-20 text-white md:pb-0'
                    : 'min-h-screen bg-stone-50 pb-20 text-slate-950 md:pb-0'
            }
        >
            <section className="relative overflow-hidden">
                <img
                    src={event.hero.image_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="eager"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.78),rgba(2,6,23,0.7)_48%,rgba(2,6,23,0.92))]" />
                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/10 px-3 text-sm font-semibold tracking-normal text-white backdrop-blur">
                        Invitely
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setTheme(isDark ? 'light' : 'dark');
                            }}
                            aria-label="Alternar tema"
                        >
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                        <Button variant="secondary" size="icon" onClick={share} aria-label="Compartilhar">
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </header>

                <div className="relative z-10 mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl gap-8 px-4 pb-8 pt-8 sm:px-6 md:pb-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:px-8 lg:pt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="self-end"
                    >
                        <Badge className="border-white/20 bg-white/10 text-white">
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            {event.hero.eyebrow}
                        </Badge>
                        <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-normal text-white sm:text-5xl md:text-6xl lg:text-7xl">
                            {event.hero.title ?? event.name}
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
                            {event.hero.subtitle}
                        </p>
                        <div className="mt-6 grid gap-2 text-sm text-slate-200 sm:flex sm:flex-wrap sm:gap-3">
                            <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 backdrop-blur">
                                <CalendarDays className="h-4 w-4" />
                                {formattedDate}
                            </span>
                            <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 backdrop-blur">
                                <MapPin className="h-4 w-4" />
                                {event.venue.name}
                            </span>
                        </div>
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <a
                                href="#rsvp"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-sky-500 px-4 text-sm font-semibold text-white transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                            >
                                Confirmar presenca <ArrowRight className="h-4 w-4" />
                            </a>
                            <a
                                href="#details"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                            >
                                Ver detalhes
                            </a>
                        </div>
                    </motion.div>

                    <Card id="rsvp" className="border-white/15 bg-white/10 text-white backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>Confirme sua presenca</CardTitle>
                            <p className="text-sm text-slate-200">
                                Use o token do convite para registrar sua resposta em poucos segundos.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <form
                                className="grid gap-3"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                }}
                            >
                                <Input
                                    value={form.invite_token}
                                    onChange={(event) => {
                                        setForm({ ...form, invite_token: event.target.value });
                                    }}
                                    placeholder="Token do convite"
                                    aria-label="Token do convite"
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.companions}
                                    onChange={(event) => {
                                        setForm({ ...form, companions: Number(event.target.value) });
                                    }}
                                    placeholder="Acompanhantes"
                                    aria-label="Numero de acompanhantes"
                                />
                                <Input
                                    value={form.message}
                                    onChange={(event) => {
                                        setForm({ ...form, message: event.target.value });
                                    }}
                                    placeholder="Mensagem opcional"
                                    aria-label="Mensagem opcional"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            submit('accepted');
                                        }}
                                        disabled={rsvp.isPending}
                                    >
                                        {rsvp.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4" />
                                        )}
                                        Confirmar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            submit('declined');
                                        }}
                                        disabled={rsvp.isPending}
                                    >
                                        Recusar
                                    </Button>
                                </div>
                                {rsvp.isSuccess && (
                                    <p className="rounded-md border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
                                        RSVP registrado com sucesso. Seu QR Code fica disponivel para check-in.
                                    </p>
                                )}
                                {rsvp.isError && (
                                    <p className="rounded-md border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
                                        {rsvp.error.message}
                                    </p>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-3 px-4 py-8 sm:px-6 md:grid-cols-3 md:gap-5 md:py-10 lg:px-8">
                {countdown.map(([label, value]) => (
                    <Card key={label} className="dark:border-slate-800 dark:bg-slate-900">
                        <CardContent className="flex min-h-28 items-center justify-between pt-5 md:block">
                            <div className="text-4xl font-bold">{value}</div>
                            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section
                id="details"
                className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-10"
            >
                <div>
                    <Badge>
                        <Clock3 className="mr-2 h-3.5 w-3.5" /> Programacao
                    </Badge>
                    <div className="mt-5 grid gap-3">
                        {event.content.schedule?.map((item, index) => (
                            <motion.div
                                key={`${item.time}-${item.title}`}
                                initial={{ opacity: 0, y: 8 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ delay: index * 0.04 }}
                                className="flex min-h-14 items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                            >
                                <span className="font-semibold">{item.title}</span>
                                <span className="text-sm text-slate-500">{item.time}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    {event.gallery.map((image) => (
                        <img
                            key={image.url}
                            src={image.url}
                            alt={image.alt}
                            className="aspect-[4/5] rounded-lg object-cover"
                        />
                    ))}
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8 lg:py-10">
                <Card className="dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle>Check-in QR</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-5">
                        <QRCodeSVG value={`${window.location.origin}/check-in/${form.invite_token}`} size={112} />
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            <QrCode className="mb-2 h-5 w-5" />
                            Token criptografavel no backend para validacao na portaria.
                        </div>
                    </CardContent>
                </Card>
                <Card className="dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle>Local</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold">{event.venue.name}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{event.venue.address}</p>
                        <div
                            className="mt-4 h-32 rounded-lg bg-[linear-gradient(135deg,#0ea5e9,#14b8a6)]"
                            aria-label="Mapa decorativo do evento"
                        />
                    </CardContent>
                </Card>
                <Card className="dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle>Playlist</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a
                            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-500"
                            href={event.spotify_playlist_url ?? '#'}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Music2 className="h-4 w-4" /> Abrir no Spotify
                        </a>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{event.content.note}</p>
                    </CardContent>
                </Card>
            </section>

            <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <span>Open source SaaS-ready invitations.</span>
                <Button variant="ghost" size="sm">
                    <Send className="h-4 w-4" /> Exportar CSV
                </Button>
            </footer>

            <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-12px_40px_rgba(15,23,42,0.12)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95">
                <div className="grid grid-cols-[1fr_auto] gap-3">
                    <a
                        href="#rsvp"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-sky-500 px-4 text-sm font-semibold text-white"
                    >
                        Confirmar <CheckCircle2 className="h-4 w-4" />
                    </a>
                    <Button variant="secondary" size="icon" onClick={share} aria-label="Compartilhar convite">
                        <Share2 className="h-4 w-4" />
                    </Button>
                </div>
            </nav>
        </main>
    );
}
