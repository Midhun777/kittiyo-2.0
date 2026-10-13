import { Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import SendPage from './components/SendPage';
import CodePage from './components/CodePage';
import ReceivePage from './components/ReceivePage';
import ContentPage from './components/ContentPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <main className="flex-1 flex items-start justify-center px-4 pt-8 pb-16 sm:pt-16">
        <div className="w-full max-w-md">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/send" element={<SendPage />} />
            <Route path="/code" element={<CodePage />} />
            <Route path="/receive" element={<ReceivePage />} />
            <Route path="/content" element={<ContentPage />} />
          </Routes>
        </div>
      </main>
      <footer className="text-center py-6 text-xs text-charcoal-light/50 tracking-wide">
        LabDrop · v1.0
      </footer>
    </div>
  );
}
