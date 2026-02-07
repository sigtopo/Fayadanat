
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
          contactNumber: