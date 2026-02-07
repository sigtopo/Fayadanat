
import React, { useState, useEffect } from 'react';
import { DamageLevel, Report } from '../types';

interface Props {
  onAddReport: (report: Report) => void;
}

const ReportForm: React.FC<Props> = ({ onAddReport }) => {
  const [villageName, setVillageName] = useState('');
  const [province, setProvince] = useState('');
  const [commune, setCommune] = useState('');
  const [damageType, setDamageType] = useState('');
  const [damageLevel, setDamageLevel] = useState<DamageLevel>(DamageLevel.MEDIUM);
  const [needs, setNeeds] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [mapsLink, setMapsLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [provinces, setProvinces] = useState<string[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'denied'>('idle');

  // جلب قائمة الأقاليم من الرابط المزود
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const SPREADSHEET_ID = '17xE9i0PhTYIOgtGr7S9VPbtbnH7firq6K8iihd02uZA';
        const JSON_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json`;
        const response = await fetch(JSON_URL);
        const text = await response.text();
        const jsonStr = text.substring(47).slice(0, -2);
        const data = JSON.parse(jsonStr);
        
        // استخراج عمود prov_ar (نفترض أنه العمود الأول أو نبحث عنه)
        const rows = data.table.rows;
        const provList: string[] = Array.from(new Set(rows.map((row: any) => row.c[0]?.v).filter(Boolean)));
        setProvinces(provList.sort());
      } catch (err) {
        console.error("Error fetching provinces:", err);
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
    fetchLocation();
  }, []);

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
      (err) => {
        console.error("Location error:", err);
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const levelToNumeric = (level: DamageLevel) => {
    switch (level) {
      case DamageLevel.LOW: return "1";
      case DamageLevel.MEDIUM: return "2";
      case DamageLevel.HIGH: return "3";
      case DamageLevel.CRITICAL: return "4";
      default: return "2";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const newReport: Report = {
      id: crypto.randomUUID(),
      villageName,
      province,
      commune,
      damageType,
      damageLevel,
      needs,
      contactNumber,
      mapsLink,
      timestamp: new Date().toISOString(),
      latitude: coords?.lat,
      longitude: coords?.lng
    };

    await sendToRemoteAndLocal(newReport);
  };

  const sendToRemoteAndLocal = async (report: Report) => {
    const remoteData = {
      nom_douar: report.villageName,
      province: report.province,
      commune: report.commune,
      nature_dommages: report.damageType,
      niveau_urgence: levelToNumeric(report.damageLevel),
      besoins_essentiels: report.needs,
      numero_telephone: report.contactNumber,
      lien_maps: report.mapsLink,
      latitude: report.latitude || "",
      longitude: report.longitude || ""
    };

    try {
      await fetch("https://script.google.com/macros/s/AKfycbxNOHHaQ9fp5hKSHhDu4dM5mb1HI2kTV8UnLp3_ZcySraEi9I96PUfN9gELeWWkEd0-/exec", {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(remoteData)
      });

      onAddReport(report);
      setIsSubmitting(false);
      setSuccess(true);
      resetForm();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("Sync error:", err);
      onAddReport(report);
      setIsSubmitting(false);
      setError("تم الحفظ محلياً ولكن تعذر الإرسال للقاعدة الخارجية.");
    }
  };

  const resetForm = () => {
    setVillageName('');
    setProvince('');
    setCommune('');
    setDamageType('');
    setDamageLevel(DamageLevel.MEDIUM);
    setNeeds('');
    setContactNumber('');
    // لا نمسح رابط الخريطة إذا كان الموقع ناجحاً ليبقى متاحاً للبلاغ التالي إذا لزم
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-rose-600 p-8 text-white text-right">
          <h1 className="text-3xl font-bold mb-2">التبليغ عن دوار متضرر</h1>
          <p className="opacity-90">يرجى ملء كافة الخانات لضمان دقة المعطيات الميدانية</p>
        </div>

        <div className="px-8 mt-6">
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${
            locationStatus === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
            locationStatus === 'fetching' ? 'bg-blue-50 border-blue-100 text-blue-700 animate-pulse' :
            'bg-slate-50 border-slate-100 text-slate-500'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <span className="text-sm font-medium flex-grow">
              {locationStatus === 'success' && `تم تحديد الموقع تلقائياً`}
              {locationStatus === 'fetching' && 'جاري تحديد موقعك الجغرافي...'}
              {locationStatus === 'denied' && 'لم يتم تحديد الموقع. يرجى تفعيل GPS.'}
            </span>
            {locationStatus === 'success' && coords && (
              <a 
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-emerald-200 text-xs hover:bg-emerald-100 transition-colors"
              >
                تأكد من موقعك
              </a>
            )}
          </div>
        </div>

        {success && (
          <div className="mx-8 mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            تم الإرسال والمزامنة بنجاح.
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-right">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم الدوار المتضرر *</label>
              <input
                required
                type="text"
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                placeholder="مثال: دوار تيزي"
              />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">الإقليم *</label>
               <select
                 required
                 value={province}
                 onChange={(e) => setProvince(e.target.value)}
                 className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 transition-all outline-none bg-white"
               >
                 <option value="">اختر الإقليم...</option>
                 {provinces.map((prov) => (
                   <option key={prov} value={prov}>{prov}</option>
                 ))}
                 {loadingProvinces && <option disabled>جاري التحميل...</option>}
               </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الجماعة *</label>
              <input
                required
                type="text"
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                placeholder="اسم الجماعة"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رابط الإحداثيات (خرائط جوجل)</label>
              <input
                readOnly
                type="text"
                value={mapsLink}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs font-mono"
                placeholder="سيظهر الرابط هنا تلقائياً عند تحديد الموقع"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">طبيعة الضرر</label>
            <input
              type="text"
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 transition-all outline-none"
              placeholder="مثال: انهيار مباني، انقطاع طرق..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">مستوى الاستعجال</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.values(DamageLevel).map((level) => (
                <label key={level} className="cursor-pointer">
                  <input
                    type="radio"
                    name="damageLevel"
                    value={level}
                    checked={damageLevel === level}
                    onChange={() => setDamageLevel(level)}
                    className="sr-only"
                  />
                  <div className={`text-center py-2 px-1 rounded-lg border transition-all text-xs font-bold ${
                    damageLevel === level 
                      ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500' 
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                    {level === DamageLevel.LOW && '1 - منخفض'}
                    {level === DamageLevel.MEDIUM && '2 - متوسط'}
                    {level === DamageLevel.HIGH && '3 - مرتفع'}
                    {level === DamageLevel.CRITICAL && '4 - حرج جداً'}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الاحتياجات الضرورية</label>
            <textarea
              rows={3}
              value={needs}
              onChange={(e) => setNeeds(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 transition-all outline-none"
              placeholder="مثال: خيام، أغطية، أدوية..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رقم هاتف للتواصل</label>
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 transition-all outline-none text-left"
              dir="ltr"
              placeholder="+212 ..."
            />
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'جاري المزامنة...' : 'إرسال ومزامنة المعطيات'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
