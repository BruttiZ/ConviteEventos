import './bootstrap';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminDashboard } from './app/features/admin/AdminDashboard';
import { PublicEventPage } from './app/features/public/PublicEventPage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 60_000,
        },
    },
});

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element not found.');
}

createRoot(rootElement).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<PublicEventPage />} />
                    <Route path="/events/:slug" element={<PublicEventPage />} />
                    <Route path="/admin/*" element={<AdminDashboard />} />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    </StrictMode>,
);
