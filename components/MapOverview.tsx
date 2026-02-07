
import React, { useEffect, useRef, useState } from 'react';
import { Report, DamageLevel } from '../types';
import L from 'leaflet';

const MapOverview: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const SPREADSHEET_ID = '1OYnXOT8V9cV37HCsBeQ_o_ICMf4euKJ-0MgboQZbB30';
  const JSON_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([31.7917, -7.0926], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);
    }

    if (mapInstance.current && reports.length > 0) {
      // Clear existing markers if any
      mapInstance.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) mapInstance.current?.removeLayer(layer);
      });

      const bounds: L.LatLngExpression[] = [];

      reports.forEach(report => {
        if (report.latitude && report.longitude) {
          const lat = Number(report.latitude);
          const lng = Number(report.longitude);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.push([lat, lng]);
            
            const urgencyText = 
              report.damageLevel === DamageLevel.LOW ? '1 - منخفض' :
              report.damageLevel === DamageLevel.MEDIUM ? '2 - متوسط' :
              report.damageLevel === DamageLevel.HIGH ? '3 - مرتفع' : '4 - حرج جداً';

            // Fix: Replaced 'region' with 'province' as it is the correct property name in the Report interface
            const popupContent = `
              <div style="font-family: 'Tajawal', sans-serif;">
                <h3 style="margin: 0 0 8px 0; color: #e11d48; font-weight: bold; font-size: 16px;">${report.villageName}</h3>
                <p style="margin: 4px 0;"><strong>الإقليم:</strong> ${report.province}</p>
                <p style="margin: 4px 0;"><strong>الضرر:</strong> ${report.damageType}</p>
                <p style="margin: 4px 0;"><strong>الاستعجال:</strong> <span style="color: ${report.damageLevel === DamageLevel.CRITICAL ? 'red' : 'inherit'}">${urgencyText}</span></p>
                <hr style="margin: 8px 0; border: none; border-top: 1px solid #eee;">
                <p style="margin: 4px 0; font-size: 12px; color: #444;"><strong>الاحتياجات:</strong> ${report.needs}</p>
                <p style="margin: 8px 0 0 0; text-align: left;">
                  <a href="tel:${report.contactNumber}" style="background: #1e293b; color: white; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 11px;">اتصال: ${report.contactNumber}</a>
                </p>
              </div>
            `;

            L.marker([lat, lng]).addTo(mapInstance.current!)
              .bindPopup(popupContent);
          }
        }
      });

      if (bounds.length > 0) {
        mapInstance.current.fitBounds(bounds as any, { padding: [50, 50] });
      }
    }
  }, [reports]);

  const fetchData = async () => {
    try {
      const response = await fetch(JSON_URL);
      const text = await response.text();
      const jsonStr = text.substring(47).slice(0, -2);
      const data = JSON.parse(jsonStr);
      
      const rows = data.table.rows;
      // Fix: Aligned indices and field names with the Report interface and spreadsheet structure
      const fetched: Report[] = rows.map((row: any, index: number) => {
        const c = row.c;
        return {
          id: `map-${index}`,
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
      });
      setReports(fetched);
    } catch (err) {
      console.error("Map data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const mapNumericToLevel = (val: any): DamageLevel => {
    const s = String(val);
    if (s.includes('1')) return DamageLevel.LOW;
    if (s.includes('3')) return DamageLevel.HIGH;
    if (s.includes('4')) return DamageLevel.CRITICAL;
    return DamageLevel.MEDIUM;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-10">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-rose-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446 1.209-2.207a.75.75 0 0 1 1.05-.292c.606.33 1.223.596 1.855.797a.75.75 0 0 0 .911-.708V12.75a9 9 0 0 0-9-9c-1.052 0-2.062.18-3 .512V18c0 .414.336.75.75.75h1.25m4.5 0H9" />
          </svg>
          خريطة توزيع المناطق المتضررة
        </h2>
        <div className="text-sm text-slate-500 font-medium">
          إجمالي النقاط المحددة: <span className="text-rose-600 font-bold">{reports.filter(r => r.latitude).length}</span>
        </div>
      </div>
      
      <div className="flex-grow relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-50/80 z-20 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-rose-600 border-t-transparent mb-2"></div>
              <p className="text-slate-600 font-bold">جاري رسم الخريطة الميدانية...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full z-0" />
      </div>

      <div className="bg-slate-900 text-white p-3 text-xs text-center">
        انقر على أي نقطة حمراء لعرض تفاصيل الدوار والاحتياجات المسجلة
      </div>
    </div>
  );
};

export default MapOverview;
