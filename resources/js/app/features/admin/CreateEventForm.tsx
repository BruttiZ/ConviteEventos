import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Calendar, Clock, Loader2, MapPin } from 'lucide-react';
import { SyntheticEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../../lib/api';
import { getStoredSession } from '../../auth/session';

interface CreateEventFormProps {
    onCancel?: () => void;
}

export function CreateEventForm({ onCancel }: CreateEventFormProps) {
    const navigate = useNavigate();
    const session = getStoredSession();
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        slug: '',
        startsAt: '',
        endsAt: '',
        timezone: 'America/Sao_Paulo',
        venueName: '',
        address: '',
        spotifyPlaylistUrl: '',
        capacity: '',
    });

    // Auto-generate slug from name
    useEffect(() => {
        if (form.name) {
            const generatedSlug = form.name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');

            setForm((prev) => ({ ...prev, slug: generatedSlug }));
        }
    }, [form.name]);

    const createEvent = useMutation({
        mutationFn: async () => {
            setError(null);

            if (!form.name.trim()) {
                throw new Error('Nome do evento é obrigatório.');
            }
            if (!form.startsAt) {
                throw new Error('Data de início é obrigatória.');
            }
            if (!form.slug.trim()) {
                throw new Error('URL do evento é obrigatória.');
            }

            const payload = {
                name: form.name.trim(),
                slug: form.slug.toLowerCase().trim(),
                starts_at: form.startsAt,
                ends_at: form.endsAt || null,
                timezone: form.timezone,
                venue_name: form.venueName.trim() || null,
                address: form.address.trim() || null,
                spotify_playlist_url: form.spotifyPlaylistUrl.trim() || null,
                capacity: form.capacity ? parseInt(form.capacity, 10) : null,
                hero: {
                    title: `Bem-vindo a ${form.name}`,
                    subtitle: 'Um evento incrível',
                    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
                },
                content: {
                    description: 'Descrição do evento',
                    highlights: [],
                },
                theme: {
                    primaryColor: '#8B5CF6',
                    accentColor: '#0EA5E9',
                },
                gallery: [],
                seo: {
                    title: form.name,
                    description: 'Um evento incrívelno Invitely',
                },
            };

            const response = await fetch(apiUrl('/api/v1/admin/events'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || errorData.error || 'Erro ao criar evento.';
                throw new Error(errorMessage);
            }

            return response.json();
        },
        onSuccess: (data) => {
            navigate(`/admin/events/${data.data.id}`);
        },
        onError: (error: Error) => {
            setError(error.message);
        },
    });

    function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        void createEvent.mutate();
    }

    return (
        <motion.div initial={false} animate={{ opacity: 1 }} className="max-w-2xl">
            <div className="mb-6 flex items-center gap-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#263247] bg-[#121827] text-[#CBD5E1] transition hover:bg-[#1A1F2E] hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                )}
                <div>
                    <h2 className="text-2xl font-bold">Novo Evento</h2>
                    <p className="mt-1 text-sm text-[#94A3B8]">Crie um novo evento e comece a convidar.</p>
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 flex items-start gap-3 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#FCA5A5]"
                >
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div>{error}</div>
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[#263247] bg-[#121827] p-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-white">Informações Básicas</h3>

                    <div>
                        <label className="block text-sm font-medium text-[#CBD5E1]">Nome do Evento *</label>
                        <input
                            type="text"
                            placeholder="Ex: Lançamento do Invitely"
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="mt-2 h-11 w-full rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-white outline-none transition focus:border-[#22D3EE]"
                            disabled={createEvent.isPending}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#CBD5E1]">URL do Evento *</label>
                        <input
                            type="text"
                            placeholder="lancamento-invitely"
                            value={form.slug}
                            onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                            className="mt-2 h-11 w-full rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-white outline-none transition focus:border-[#22D3EE]"
                            disabled={createEvent.isPending}
                        />
                        <p className="mt-1 text-xs text-[#94A3B8]">Gerado automaticamente a partir do nome.</p>
                    </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-white">Data & Horário</h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-[#CBD5E1]">
                                <Calendar className="h-4 w-4" />
                                Data de Início *
                            </label>
                            <input
                                type="datetime-local"
                                value={form.startsAt}
                                onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                                className="mt-2 h-11 w-full rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-white outline-none transition focus:border-[#22D3EE]"
                                disabled={createEvent.isPending}
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-[#CBD5E1]">
                                <Clock className="h-4 w-4" />
                                Data de Término
                            </label>
                            <input
                                type="datetime-local"
                                value={form.endsAt}
                                onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                                className="mt-2 h-11 w-full rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-white outline-none transition focus:border-[#22D3EE]"
                                disabled={createEvent.isPending}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#CBD5E1]">Fuso Horário</label>
                        <select
                            value={form.timezone}
                            onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                            className="mt-2 h-11 w-full rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-white outline-none transition focus:border-[#22D3EE]"
                            disabled={createEvent.isPending}
                        >
                            <option value="America/Sao_Paulo">América/São Paulo (BRT)</option>
                            <option value="America/New_York">América/Nova York (EST)</option>
                            <option value="Europe/London">Europa/Londres (GMT)</option>
                            <option value="Australia/Sydney">Austrália/Sydney (AEDT)</option>
                        </select>
                    </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-white">Localização</h3>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[#CBD5E1]">
                            <MapPin className="h-4 w-4" />
                            Nome do Local
                        </label>
                        <input
                            type="text"
                            placeholder="Ex: Atelier Vista"
                            value={form.venueName}
                            onChange={(e) => setForm((prev) => ({ ...prev, venueName: e.target.value }))}
                            className="mt-2 h-11 w-full rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-white outline-none transition focus:border-[#22D3EE]"
                            disabled={createEvent.isPending}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#CBD5E1]">Endereço</label>
                        <input
                            type="text"
                            placeholder="Ex: Av. Paulista, 1000, São Paulo - SP"
                            value={form.address}
                            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                            className="mt-2 h-11 w-full rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-white outline-none transition focus:border-[#22D3EE]"
                            disabled={createEvent.isPending}
                        />
                    </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-white">Informações Adicionais</h3>

                    <div>
                        <label className="block text-sm font-medium text-[#CBD5E1]">URL da Playlist (Spotify)</label>
                        <input
                            type="url"
                            placeholder="https://open.spotify.com/playlist/..."
                            value={form.spotifyPlaylistUrl}
                            onChange={(e) => setForm((prev) => ({ ...prev, spotifyPlaylistUrl: e.target.value }))}
                            className="mt-2 h-11 w-full rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-white outline-none transition focus:border-[#22D3EE]"
                            disabled={createEvent.isPending}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#CBD5E1]">Capacidade Máxima</label>
                        <input
                            type="number"
                            placeholder="500"
                            value={form.capacity}
                            onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
                            min="1"
                            max="100000"
                            className="mt-2 h-11 w-full rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-white outline-none transition focus:border-[#22D3EE]"
                            disabled={createEvent.isPending}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t border-[#263247] pt-6">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#263247] bg-[#0B0F1A] px-6 text-sm font-semibold text-[#CBD5E1] transition hover:scale-[1.03] disabled:opacity-50"
                            disabled={createEvent.isPending}
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.03] disabled:opacity-50"
                        disabled={createEvent.isPending}
                    >
                        {createEvent.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Criando...
                            </>
                        ) : (
                            'Criar Evento'
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
