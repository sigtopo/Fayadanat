
import React, { useState, useEffect } from 'react';
import { Report, DamageLevel } from '../types';
import { Link } from 'react-router-dom';

interface Props {
  reports: Report[];
  onDelete: (id: string) => void;
}

const DataDashboard: React.FC<Props> = ({ reports: localReports, onDelete }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const SPREADSHEET_ID = '1OYnXOT8V9cV37HCsBeQ_o_ICMf4euKJ-0MgboQZbB30';
  const JSON_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

  useEffect(() => {
    fetchRemoteData();
  }, []);

  const fetchRemoteData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(JSON_URL);
      const text = await response.text();
      const jsonStr = text.substring(47).slice(0, -2);
      const data = JSON.parse(jsonStr);
      
      const rows = data.table.rows;
      // ملاحظة: الترتيب في الإكسيل قد يتغير بناءً على الحقول الجديدة، نفترض الترتيب التالي:
      // 0:Timestamp, 1:Village, 2:Province, 3:Commune, 4:DamageType, 5:Urgency, 6:Needs, 7:Phone, 8:MapsLink, 9:Lat, 10:Lng
      const fetchedReports: Report[] = rows.map((row: any, index: number) => {
        const c = row.c;
        return {
          id: `remote-${index}`,
          timestamp: c[0]?.v || '',
          villageName: c[1]?.v || 'بدون اسم',
          province: c[2]?.v || '-',
          commune: c[3]?.v || '-',
          damageType: c[4]?.v || '-',
          damageLevel: mapNumericToLevel(c[5]?.v),
          needs: c[6]?.v || '-',
          contactNumber: c[7]?.v?.toString() || '-',
          mapsLink: c[8]?.v || '',
          latitude: c[9]?.v || null,
          longitude: c[10]?.v || null,
        };
      }).reverse();

      setReports(fetchedReports);
    } catch (err) {
      console.error("خطأ في جلب البيانات:", err);
      setError("فشل جلب المعطيات من الرابط المركزي.");
      setReports(localReports);
    } finally {
      setIsLoading(false);
    }
  };

  const mapNumericToLevel = (val: any): DamageLevel => {
    const s = String(val);
    if (s.includes('1')) return DamageLevel.LOW;
    if (s.includes('3')) return DamageLevel.HIGH;
    if (s.includes('4')) return DamageLevel.CRITICAL;
    return DamageLevel.MEDIUM;
  };

  const getLevelBadge = (level: DamageLevel) => {
    const base = "px-2 py-1 rounded-full text-[10px] font-bold inline-block whitespace-nowrap ";
    switch (level) {
      case DamageLevel.CRITICAL: return base + "bg-red-100 text-red-800 border border-red-200";
      case DamageLevel.HIGH: return base + "bg-orange-100 text-orange-800 border border-orange-200";
      case DamageLevel.MEDIUM: return base + "bg-yellow-100 text-yellow-800 border border-yellow-200";
      default: return base + "bg-green-100 text-green-800 border border-green-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-end gap-3">
            سجل المعطيات الميدانية
            <span className="bg-rose-600 w-2 h-8 rounded-full"></span>
          </h1>
          <p className="text-slate-500 mt-1">تحديث مباشر من قاعدة البيانات المركزية</p>
        </div>
        
        <button
          onClick={fetchRemoteData}
          className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-all shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          تحديث السجل
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-32 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-rose-600 border-t-transparent mb-4"></div>
          <p className="text-slate-500 font-medium">جاري جلب المعطيات...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-medium text-slate-600">لا توجد معطيات مسجلة حالياً</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-900 text-white text-xs">
                <tr>
                  <th className="px-4 py-5 font-bold text-center border-l border-slate-800 w-16">الخريطة</th>
                  <th className="px-4 py-5 font-bold">الدوار</th>
                  <th className="px-4 py-5 font-bold">الإقليم</th>
                  <th className="px-4 py-5 font-bold">الجماعة</th>
                  <th className="px-4 py-5 font-bold">نوع الضرر</th>
                  <th className="px-4 py-5 font-bold text-center">الاستعجال</th>
                  <th className="px-4 py-5 font-bold">الاحتياجات</th>
                  <th className="px-4 py-5 font-bold">الهاتف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-4 py-4 text-center border-l border-slate-50">
                      {report.mapsLink ? (
                        <a href={report.mapsLink} target="_blank" rel="noopener noreferrer" className="hover:scale-110 inline-block transition-transform">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg" className="w-5 h-5 mx-auto" alt="Maps" />
                        </a>
                      ) : <span className="text-[10px] text-slate-300">N/A</span>}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-900">{report.villageName}</td>
                    <td className="px-4 py-4 text-slate-700">{report.province}</td>
                    <td className="px-4 py-4 text-slate-600">{report.commune}</td>
                    <td className="px-4 py-4 text-slate-600 truncate max-w-[120px]">{report.damageType}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={getLevelBadge(report.damageLevel)}>
                        {report.damageLevel === DamageLevel.LOW ? '1 - منخفض' :
                         report.damageLevel === DamageLevel.MEDIUM ? '2 - متوسط' :
                         report.damageLevel === DamageLevel.HIGH ? '3 - مرتفع' : '4 - حرج جداً'}
                      </span>
                    </td>
                    <td className="px-4 py-4 max-w-[150px] truncate text-xs" title={report.needs}>{report.needs}</td>
                    <td className="px-4 py-4 font-bold text-indigo-600 whitespace-nowrap" dir="ltr">{report.contactNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataDashboard;
