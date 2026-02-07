
import React, { useState, useEffect, useRef } from 'react';
import { DamageLevel, Report } from '../types';

interface Props {
  onAddReport: (report: Report) => void;
}

interface HierarchyData {
  region: string;
  province: string;
  commune: string;
  douar: string;
}

const ReportForm: React.FC<Props> = ({ onAddReport }) => {
  const [region, setRegion] = useState('');
  const [province, setProvince] = useState('');
  const [commune, setCommune] = useState('');
  const [villageName, setVillageName] = useState('');
  const [damageType, setDamageType] = useState('');
  const [damageLevel, setDamageLevel] = useState<DamageLevel>(DamageLevel.MEDIUM);
  const [needs, setNeeds] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [mapsLink, setMapsLink] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [allData, setAllData] = useState<HierarchyData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showRegList, setShowRegList] = useState(false);
  const [showProvList, setShowProvList] = useState(false);
  const [showCommList, setShowCommList] = useState(false);
  const [showDouarList, setShowDouarList] = useState(false);

  const regRef = useRef<HTMLDivElement>(null);
  const provRef = useRef<HTMLDivElement>(null);
  const commRef = useRef<HTMLDivElement>(null);
  const douarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const SHEET_ID = '1EWdDVYYX7P5TcZElS54N6V49sCTJ5gnVkrgvhN1B9M4';
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
        const res = await fetch(url);
        const text = await res.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        
        const rows = json.table.rows.map((row: any) => ({
          region: String(row.c[0]?.v || '').trim(),
          province: String(row.c[1]?.v || '').trim(),
          commune: String(row.c[2]?.v || '').trim(),
          douar: String(row.c[3]?.v || '').trim()
        }));
        setAllData(rows);
      } catch (err) {
        console.error("Error fetching hierarchy data:", err);
        setError("تعذر جلب قوائم المناطق. يرجى التحقق من الاتصال.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchLocation();

    const handleClickOutside = (event: MouseEvent) => {
      if (regRef.current && !regRef.current.contains(event.target as Node)) setShowRegList(false);
      if (provRef.current && !provRef.current.contains(event.target as Node)) setShowProvList(false);
      if (commRef.current && !commRef.current.contains(event.target as Node)) setShowCommList(false);
      if (douarRef.current && !douarRef.current.contains(event.target as Node)) setShowDouarList(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'denied'>('idle');

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setMapsLink(`https://www.google.com/maps?q=${lat},${lng}`);
        setLocationStatus('success');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // دوال الفلترة الهرمية - تعيد خيارات بناءً على ما قبله
  const getFilteredRegions = () => {
    return Array.from(new Set(allData.map(d => d.region)))
      .filter(r => r && r.includes(region))
      .sort();
  };

  const getFilteredProvinces = () => {
    return Array.from(new Set(
      allData
        .filter(d => !region || d.region === region)
        .map(d => d.province)
    ))
    .filter(p => p && p.includes(province))
    .sort();
  };

  const getFilteredCommunes = () => {
    return Array.from(new Set(
      allData
        .filter(d => (!region || d.region === region) && (!province || d.province === province))
        .map(d => d.commune)
    ))
    .filter(c => c && c.includes(commune))
    .sort();
  };

  const getFilteredDouars = () => {
    return Array.from(new Set(
      allData
        .filter(d => 
          (!region || d.region === region) && 
          (!province || d.province === province) && 
          (!commune || d.commune === commune)
        )
        .map(d => d.douar)
    ))
    .filter(d => d && d.includes(villageName))
    .sort();
  };

  const handleRegionSelect = (val: string) => {
    setRegion(val);
    setProvince(''); // تصفير الحقول التابعة عند تغيير الأصل
    setCommune('');
    setVillageName('');
    setShowRegList(false);
  };

  const handleProvinceSelect = (val: string) => {
    setProvince(val);
    setCommune(''); // تصفير الجماعة عند تغيير الإقليم
    setVillageName('');
    setShowProvList(false);
  };

  const handleCommuneSelect = (val: string) => {
    setCommune(val);
    setVillageName(''); // تصفير الدوار عند تغيير الجماعة
    setShowCommList(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const newReport: Report = {
      id: crypto.randomUUID(),
      region,
      province,
      commune,
      villageName,
      damageType,
      damageLevel,
      needs,
      contactNumber,
      mapsLink,
      timestamp: new Date().toISOString(),
      latitude: coords?.lat,
      longitude: coords?.lng
    };

    try {
      const remoteData = {
        region: newReport.region,
        nom_douar: newReport.villageName,
        province: newReport.province,
        commune: newReport.commune,
        nature_dommages: newReport.damageType,
        niveau_urgence: newReport.damageLevel,
        besoins_essentiels: newReport.needs,
        numero_telephone: newReport.contactNumber,
        lien_maps: newReport.mapsLink,
        latitude: newReport.latitude || "",
        longitude: newReport.longitude || ""
      };

      await fetch("https://script.google.com/macros/s/AKfycbxNOHHaQ9fp5hKSHhDu4dM5mb1HI2kTV8UnLp3_ZcySraEi9I96PUfN9gELeWWkEd0-/exec", {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(remoteData)
      });

      onAddReport(newReport);
      setSuccess(true);
      resetForm();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError("حدث خطأ أثناء المزامنة. تم الحفظ محلياً.");
      onAddReport(newReport);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRegion('');
    setProvince('');
    setCommune('');
    setVillageName('');
    setDamageType('');
    setDamageLevel(DamageLevel.MEDIUM);
    setNeeds('');
    setContactNumber('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 transition-all hover:shadow-rose-100">
        <div className="bg-rose-600 p-10 text-white text-right relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16 blur-2xl"></div>
          <h1 className="text-4xl font-bold mb-3 relative z-10 text-white">منصة رصد الميدان</h1>
          <p className="opacity-90 text-lg relative z-10 font-medium">نظام التبليغ الذكي المربوط بقاعدة البيانات المركزية</p>
        </div>

        <div className="px-10 mt-8">
          <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
            locationStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            locationStatus === 'fetching' ? 'bg-blue-50 border-blue-200 text-blue-800 animate-pulse' :
            'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className={`p-2 rounded-full ${locationStatus === 'success' ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-grow">
              <p className="text-sm font-bold">الموقع الجغرافي</p>
              <p className="text-xs opacity-80">{locationStatus === 'success' ? 'تم تحديد الإحداثيات بنجاح' : 'جاري البحث عن الموقع...'}</p>
            </div>
            {locationStatus === 'success' && (
              <button type="button" onClick={() => window.open(mapsLink)} className="px-4 py-2 bg-white rounded-xl text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors">عرض الخريطة</button>
            )}
          </div>
        </div>

        {error && <div className="mx-10 mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-right text-sm font-bold">⚠ {error}</div>}
        {success && <div className="mx-10 mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-right text-sm font-bold">✓ تم إرسال المعطيات بنجاح.</div>}

        <form onSubmit={handleSubmit} className="p-10 space-y-8 text-right">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* الجهة */}
            <div className="relative" ref={regRef}>
              <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">الجهة *</label>
              <input
                required
                type="text"
                value={region}
                onChange={(e) => { setRegion(e.target.value); setShowRegList(true); }}
                onFocus={() => setShowRegList(true)}
                className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all outline-none bg-slate-50/50"
                placeholder="ابحث عن الجهة..."
              />
              {showRegList && getFilteredRegions().length > 0 && (
                <div className="absolute z-[60] w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                  {getFilteredRegions().map(r => (
                    <div key={r} onClick={() => handleRegionSelect(r)} className="px-5 py-3 hover:bg-rose-50 cursor-pointer text-sm border-b border-slate-50 last:border-0">{r}</div>
                  ))}
                </div>
              )}
            </div>

            {/* الإقليم */}
            <div className="relative" ref={provRef}>
              <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">الإقليم / العمالة *</label>
              <input
                required
                type="text"
                value={province}
                onChange={(e) => { setProvince(e.target.value); setShowProvList(true); }}
                onFocus={() => setShowProvList(true)}
                className={`w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all outline-none bg-slate-50/50 ${!region && 'opacity-50 cursor-not-allowed'}`}
                placeholder={region ? "ابحث عن الإقليم..." : "اختر الجهة أولاً"}
                disabled={!region}
              />
              {showProvList && getFilteredProvinces().length > 0 && (
                <div className="absolute z-[60] w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                  {getFilteredProvinces().map(p => (
                    <div key={p} onClick={() => handleProvinceSelect(p)} className="px-5 py-3 hover:bg-rose-50 cursor-pointer text-sm border-b border-slate-50 last:border-0">{p}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* الجماعة */}
            <div className="relative" ref={commRef}>
              <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">الجماعة *</label>
              <input
                required
                type="text"
                value={commune}
                onChange={(e) => { setCommune(e.target.value); setShowCommList(true); }}
                onFocus={() => setShowCommList(true)}
                className={`w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all outline-none bg-slate-50/50 ${!province && 'opacity-50 cursor-not-allowed'}`}
                placeholder={province ? "ابحث عن الجماعة..." : "اختر الإقليم أولاً"}
                disabled={!province}
              />
              {showCommList && getFilteredCommunes().length > 0 && (
                <div className="absolute z-[60] w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                  {getFilteredCommunes().map(c => (
                    <div key={c} onClick={() => handleCommuneSelect(c)} className="px-5 py-3 hover:bg-rose-50 cursor-pointer text-sm border-b border-slate-50 last:border-0">{c}</div>
                  ))}
                </div>
              )}
            </div>

            {/* الدوار */}
            <div className="relative" ref={douarRef}>
              <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">اسم الدوار *</label>
              <input
                required
                type="text"
                value={villageName}
                onChange={(e) => { setVillageName(e.target.value); setShowDouarList(true); }}
                onFocus={() => setShowDouarList(true)}
                className={`w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all outline-none bg-slate-50/50 ${!commune && 'opacity-50 cursor-not-allowed'}`}
                placeholder={commune ? "اكتب أو اختر اسم الدوار..." : "اختر الجماعة أولاً"}
                disabled={!commune}
              />
              {showDouarList && getFilteredDouars().length > 0 && (
                <div className="absolute z-[60] w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                  {getFilteredDouars().map(d => (
                    <div key={d} onClick={() => { setVillageName(d); setShowDouarList(false); }} className="px-5 py-3 hover:bg-rose-50 cursor-pointer text-sm border-b border-slate-50 last:border-0">{d}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">مستوى الضرر والاستعجال</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.values(DamageLevel).map((level) => (
                <label key={level} className="cursor-pointer group">
                  <input type="radio" name="damageLevel" value={level} checked={damageLevel === level} onChange={() => setDamageLevel(level)} className="sr-only" />
                  <div className={`text-center py-4 px-2 rounded-2xl border-2 transition-all duration-300 font-bold text-sm ${
                    damageLevel === level 
                      ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200' 
                      : 'bg-white border-slate-100 text-slate-400 group-hover:border-rose-200'
                  }`}>
                    {level === DamageLevel.LOW && '١- منخفض'}
                    {level === DamageLevel.MEDIUM && '٢- متوسط'}
                    {level === DamageLevel.HIGH && '٣- مرتفع'}
                    {level === DamageLevel.CRITICAL && '٤- حرج جداً'}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">طبيعة الأضرار الملاحظة</label>
              <input
                type="text"
                value={damageType}
                onChange={(e) => setDamageType(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all outline-none bg-slate-50/50"
                placeholder="مثال: انهيارات، انقطاع طرق..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">رقم الهاتف للتواصل</label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all outline-none bg-slate-50/50 text-left"
                dir="ltr"
                placeholder="06XXXXXXXX"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">الاحتياجات المستعجلة</label>
            <textarea
              rows={4}
              value={needs}
              onChange={(e) => setNeeds(e.target.value)}
              className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all outline-none bg-slate-50/50"
              placeholder="حدد المواد الغذائية، الأغطية، أو الأدوية المطلوبة..."
            />
          </div>

          <button
            disabled={isSubmitting || loading}
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-5 rounded-2xl shadow-2xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
          >
            {isSubmitting ? (
              <span className="animate-spin w-6 h-6 border-4 border-white border-t-transparent rounded-full"></span>
            ) : (
              <>
                إرسال المعطيات للمركز
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
