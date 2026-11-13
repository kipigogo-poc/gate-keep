import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GrainOverlay } from '@/components/layout/GrainOverlay';
import { GatePage } from '@/pages/GatePage';
import { HomePage } from '@/pages/HomePage';
import { WalletPage } from '@/pages/WalletPage';

/** Composition root — routes to pages only, no business logic. */
export function App() {
  return (
    <BrowserRouter>
      <GrainOverlay />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/wallet/:ticketId" element={<WalletPage />} />
        <Route path="/gate" element={<GatePage />} />
      </Routes>
    </BrowserRouter>
  );
}
