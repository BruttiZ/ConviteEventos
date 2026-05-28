import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, Clock3, MapPin, Moon, Music2, QrCode, Send, Share2, Sun } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { FormEvent, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PublicEvent } from './types';

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
        { url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80', alt: 'Event tables' },
        { url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80', alt: 'Celebration lights' },
        { url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80', alt: 'Premium venue' },
    ],
    metrics: { accepted: 42, declined: 3, invited: 120 },
};

function useCountdown(date: string) {
    return useMemo(() => {
        const diff = Math.max(0, new Date(date).getTime() - Date.now());

        return [
            ['Dias', Math.floor(diff / 86_400_000)],
            ['Horas', Math.floor((diff / 3_600_000) % 24)],
            ['Min', Math.floor((diff / 60_000) % 60)],
        ];
    }, [date]);
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

    const rsvp = useMutation({
        mutationFn: async (status: 'accepted' | 'declined') => {
            const response = await fetch(`/api/v1/events/${event.slug}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ ...form, status }),
            });

            if (!response.ok) {
                throw new Error('Nao foi possivel confirmar agora.');
            }

            return response.json();
        },
    });

    function submit(status: 'accepted' | 'declined') {
        rsvp.mutate(status);
    }

    function share() {
        void navigator.share?.({ title: event.name, url: window.location.href });
    }

    return (
        <main className={isDark ? 'dark min-h-screen bg-slate-950 text-white' : 'min-h-screen bg-stone-50 text-slate-950'}>
            <section className="relative min-h-[92vh] overflow-hidden">
                <img src={event.hero.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-slate-950/70" />
                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
                    <div className="text-sm font-semibold tracking-normal">Invitely</div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Alternar tema">
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                        <Button variant="secondary" size="icon" onClick={share} aria-label="Compartilhar">
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </header>

                <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pt-24">
                    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <Badge className="border-white/20 bg-white/10 text-white">{event.hero.eyebrow}</Badge>
                        <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-tight tracking-normal text-white md:text-7xl">
                            {event.hero.title ?? event.name}
                        </h1>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">{event.hero.subtitle}</p>
                        <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-200">
                            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{new Date(event.starts_at).toLocaleDateString('pt-BR')}</span>
                            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{event.venue.name}</span>
                        </div>
                    </motion.div>

                    <Card className="border-white/15 bg-white/10 text-white backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>Confirme sua presenca</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="grid gap-3" onSubmit={(e: FormEvent) => e.preventDefault()}>
                                <Input value={form.invite_token} onChange={(e) => setForm({ ...form, invite_token: e.target.value })} placeholder="Token do convite" />
                                <Input type="number" min={0} value={form.companions} onChange={(e) => setForm({ ...form, companions: Number(e.target.value) })} placeholder="Acompanhantes" />
                                <Input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Mensagem opcional" />
                                <div className="grid grid-cols-2 gap-3">
                                    <Button type="button" onClick={() => submit('accepted')} disabled={rsvp.isPending}>
                                        <CheckCircle2 className="h-4 w-4" /> Confirmar
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => submit('declined')} disabled={rsvp.isPending}>
                                        Recusar
                                    </Button>
                                </div>
                                {rsvp.isSuccess && <p className="text-sm text-emerald-200">RSVP registrado com sucesso.</p>}
                                {rsvp.isError && <p className="text-sm text-rose-200">{rsvp.error.message}</p>}
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 md:grid-cols-3">
                {countdown.map(([label, value]) => (
                    <Card key={label} className="dark:border-slate-800 dark:bg-slate-900">
                        <CardContent className="pt-5">
                            <div className="text-4xl font-bold">{value}</div>
                            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                    <Badge><Clock3 className="mr-2 h-3.5 w-3.5" /> Programacao</Badge>
                    <div className="mt-5 grid gap-3">
                        {event.content.schedule?.map((item) => (
                            <div key={`${item.time}-${item.title}`} className="flex items-center justify-between border-b border-slate-200 py-3 dark:border-slate-800">
                                <span className="font-semibold">{item.title}</span>
                                <span className="text-sm text-slate-500">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    {event.gallery.map((image) => (
                        <img key={image.url} src={image.url} alt={image.alt} className="aspect-[4/5] rounded-lg object-cover" />
                    ))}
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 lg:grid-cols-3">
                <Card className="dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader><CardTitle>Check-in QR</CardTitle></CardHeader>
                    <CardContent className="flex items-center gap-5">
                        <QRCodeSVG value={`${window.location.origin}/check-in/${form.invite_token}`} size={112} />
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            <QrCode className="mb-2 h-5 w-5" />
                            Token criptografavel no backend para validacao na portaria.
                        </div>
                    </CardContent>
                </Card>
                <Card className="dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader><CardTitle>Local</CardTitle></CardHeader>
                    <CardContent>
                        <p className="font-semibold">{event.venue.name}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{event.venue.address}</p>
                        <div className="mt-4 h-32 rounded-lg bg-[linear-gradient(135deg,#0ea5e9,#14b8a6)]" aria-label="Mapa decorativo do evento" />
                    </CardContent>
                </Card>
                <Card className="dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader><CardTitle>Playlist</CardTitle></CardHeader>
                    <CardContent>
                        <a className="inline-flex items-center gap-2 text-sm font-semibold text-sky-500" href={event.spotify_playlist_url ?? '#'} target="_blank" rel="noreferrer">
                            <Music2 className="h-4 w-4" /> Abrir no Spotify
                        </a>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{event.content.note}</p>
                    </CardContent>
                </Card>
            </section>

            <footer className="mx-auto flex max-w-7xl items-center justify-between px-5 py-8 text-sm text-slate-500">
                <span>Open source SaaS-ready invitations.</span>
                <Button variant="ghost" size="sm"><Send className="h-4 w-4" /> Exportar CSV</Button>
            </footer>
        </main>
    );
}
