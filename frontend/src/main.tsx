import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client.ts';
import { useThemeStore } from '@/store/theme-store.ts';
import App from './App.tsx';
import './index.css';

// Initialize theme from persisted state
const isDark = useThemeStore.getState().isDark;
document.documentElement.classList.toggle('dark', isDark);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
