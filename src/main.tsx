import { ViteReactSSG } from 'vite-react-ssg'
import './index.css'
import { routes } from './routes'

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error ?? event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

export const createRoot = ViteReactSSG({ routes })
