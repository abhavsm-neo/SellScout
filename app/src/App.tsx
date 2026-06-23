import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/hooks/useToast';
import ToastContainer from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Home from '@/pages/Home';
import Playbooks from '@/pages/Playbooks';
import Campaigns from '@/pages/Campaigns';
import Analytics from '@/pages/Analytics';
import Pricing from '@/pages/Pricing';
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/playbooks" element={<Playbooks />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
      <ToastContainer />
    </ToastProvider>
  );
}
