
import React, { useState, useEffect } from 'react';
import { Report, DamageLevel } from '../types';

interface Props {
  reports: Report[];
  onDelete: (id: string) => void;
}

const DataDashboard: React.FC<Props> = ({ reports: localReports }) => {
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
      // الترتيب المفترض: 0:Timestamp, 1:Village, 2:Province, 3:Commune, 4:DamageType, 5:Urgency, 6:Needs, 7:Phone, 8:MapsLink, 9:Lat, 10:Lng, 11:Region
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
          region: c[11]?.v || '-', // حقل الجهة إذا تم إضافته للجدول
        };
      }).reverse();

      setReports(fetchedReports);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("فشل جلب المعطيات المركزية.");
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
    const base = "px-3 py-1.5 rounded-full text-[10px] font-black inline-block uppercase tracking-wider ";
    switch (level) {
      case DamageLevel.CRITICAL: return base + "bg-rose-600 text-white shadow-sm";
      case DamageLevel.HIGH: return base + "bg-orange-500 text-white shadow-sm";
      case DamageLevel.MEDIUM: return base + "bg-amber-400 text-slate-900 shadow-sm";
      default: return base + "bg-emerald-500 text-white shadow-sm";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="text-right">
          <div className="flex items-center justify-end gap-3 mb-2">
            <h1 className="text-4xl font-black text-slate-900">سجل الإغاثة الميداني</h1>
            <div className="w-3 h-10 bg-rose-600 rounded-full"></div>
          </div>
          <p className="text-slate-500 font-medium">مراقبة حية للوضعية في الدواوير المتضررة</p>
        </div>
        
        <button
          onClick={fetchRemoteData}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold transition-all hover:bg-slate-800 shadow-xl"
        >
          {isLoading ? 'جاري التحديث...' : 'تحديث المعطيات'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-3xl shadow-sm border border-slate-100">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-600 border-t-transparent mb-6"></div>
          <p className="text-slate-400 font-bold text-lg">جاري تحميل البيانات الحية...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-6 py-6 font-black text-xs uppercase tracking-widest text-center border-l border-slate-800">الخريطة</th>
                  <th className="px-6 py-6 font-black text-xs uppercase tracking-widest">الدوار</th>
                  <th className="px-6 py-6 font-black text-xs uppercase tracking-widest">الإقليم</th>
                  <th className="px-6 py-6 font-black text-xs uppercase tracking-widest">الجماعة</th>
                  <th className="px-6 py-6 font-black text-xs uppercase tracking-widest">الأضرار</th>
                  <th className="px-6 py-6 font-black text-xs uppercase tracking-widest text-center">الاستعجال</th>
                  <th className="px-6 py-6 font-black text-xs uppercase tracking-widest">الهاتف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-5 text-center border-l border-slate-50">
                      {report.mapsLink ? (
                        <a href={report.mapsLink} target="_blank" rel="noopener noreferrer" className="inline-block hover:scale-125 transition-transform duration-300">
                          <img src="https://www.gstatic.com/images/branding/product/1x/maps_64dp.png" className="w-6 h-6 mx-auto" alt="Maps" />
                        </a>
                      ) : <span className="text-slate-300">N/A</span>}
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-black text-slate-900">{report.villageName}</div>
                      <div className="text-[10px] text-rose-500 font-bold">{report.timestamp.split('T')[0]}</div>
                    </td>
                    <td className="px-6 py-5 text-slate-700 font-bold">{report.province}</td>
                    <td className="px-6 py-5 text-slate-600">{report.commune}</td>
                    <td className="px-6 py-5">
                       <p className="text-slate-600 font-medium truncate max-w-[200px]" title={report.damageType}>{report.damageType}</p>
                       <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]">الاحتياجات: {report.needs}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={getLevelBadge(report.damageLevel)}>
                        {report.damageLevel}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <a href={`tel:${report.contactNumber}`} className="font-mono font-black text-slate-900 hover:text-rose-600 transition-colors" dir="ltr">
                        {report.contactNumber}
                      </a>
                    </td>
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
