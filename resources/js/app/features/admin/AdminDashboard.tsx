import { motion } from 'framer-motion';
import { BarChart3, CalendarPlus, Download, ImagePlus, MailCheck, QrCode, Search, Settings2, UsersRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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

const navigation = [
    { label: 'Overview', icon: BarChart3 },
    { label: 'Eventos', icon: CalendarPlus },
    { label: 'Convidados', icon: UsersRound },
    { label: 'Templates', icon: ImagePlus },
    { label: 'Check-in', icon: QrCode },
];

export function AdminDashboard() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
            <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
                <aside className="border-b border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-950 lg:border-b-0 lg:border-r">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold">Invitely</p>
                            <p className="text-xs text-slate-500">Admin Console</p>
                        </div>
                        <Button size="icon" variant="ghost" aria-label="Configuracoes">
                            <Settings2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <nav className="mt-8 grid gap-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            return (
                            <Button key={item.label} variant={item.label === 'Overview' ? 'secondary' : 'ghost'} className="justify-start">
                                <Icon className="h-4 w-4" /> {item.label}
                            </Button>
                            );
                        })}
                    </nav>
                </aside>

                <section className="px-5 py-6 lg:px-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <Badge>Multi-tenant SaaS</Badge>
                            <h1 className="mt-3 text-3xl font-bold tracking-normal">Painel operacional</h1>
                            <p className="mt-1 text-sm text-slate-500">Eventos, RSVP, analytics e check-in em uma experiencia unica.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary"><Download className="h-4 w-4" /> CSV</Button>
                            <Button><CalendarPlus className="h-4 w-4" /> Novo evento</Button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                        {stats.map((item, index) => (
                            <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
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

                    <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_360px]">
                        <Card className="dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <CardTitle>Eventos recentes</CardTitle>
                                    <div className="relative w-full md:w-72">
                                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input className="pl-9" placeholder="Buscar evento" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-100 text-xs uppercase text-slate-500 dark:bg-slate-800">
                                            <tr>
                                                <th className="px-4 py-3">Evento</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Convidados</th>
                                                <th className="px-4 py-3">RSVP</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {events.map((event) => (
                                                <tr key={event.name} className="border-t border-slate-200 dark:border-slate-800">
                                                    <td className="px-4 py-4 font-medium">{event.name}</td>
                                                    <td className="px-4 py-4"><Badge>{event.status}</Badge></td>
                                                    <td className="px-4 py-4">{event.guests}</td>
                                                    <td className="px-4 py-4">{event.rsvp}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader><CardTitle>Qualidade do evento</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    {['SEO configurado', 'Galeria completa', 'Rate limit ativo', 'Fila de email pronta'].map((item) => (
                                        <div key={item} className="flex items-center justify-between border-b border-slate-200 pb-3 text-sm dark:border-slate-800">
                                            <span>{item}</span>
                                            <Badge className="border-emerald-200 text-emerald-600 dark:border-emerald-900">OK</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </main>
    );
}
