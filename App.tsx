
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import ReportForm from './components/ReportForm';
import DataDashboard from './components/DataDashboard';
import MapOverview from './components/MapOverview';
import { Report } from './types';

const App: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('village_reports');
    if (saved) {
      setReports(JSON.parse(saved));
    }
  }, []);

  const handleAddReport = (report: Report) => {
    const updated = [report, ...reports];
    setReports(updated);
    localStorage.setItem('village_reports', JSON.stringify(updated));
  };

  const handleDeleteReport = (id: string) => {
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    localStorage.setItem('village_reports', JSON.stringify(updated));
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-rose-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-rose-800 hidden sm:block">رصد الميدان</span>
            </Link>
            
            <div className="flex gap-2 sm:gap-4 overflow-x-auto py-2">
              <Link to="/" className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-slate-600 hover:bg-slate-100 font-medium transition-colors text-sm whitespace-nowrap">
                إرسال بلاغ
              </Link>
              <Link to="/map" className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold transition-all text-sm whitespace-nowrap">
                خريطة المناطق
              </Link>
              <Link to="/dashboard" className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 font-medium transition-all shadow-md text-sm whitespace-nowrap">
                لوحة المعطيات
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<ReportForm onAddReport={handleAddReport} />} />
            <Route path="/dashboard" element={<DataDashboard reports={reports} onDelete={handleDeleteReport} />} />
            <Route path="/map" element={<MapOverview />} />
          </Routes>
        </main>

        <footer className="bg-slate-100 border-t border-slate-200 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} نظام رصد الدواوير المتضررة - مبادرة إنسانية</p>
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
