import { BouncingBasketballLoader } from '@/components/ui/BouncingBasketballLoader';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#0B132B]/90 backdrop-blur-3xl flex flex-col items-center justify-center z-[100]">
      <div className="flex flex-col items-center gap-6 p-8 w-full max-w-sm mx-auto">
        <BouncingBasketballLoader />

        <div className="text-center mt-4">
          <h3 className="text-xl font-outfit font-bold text-white mb-2 tracking-wide drop-shadow-md">باقة الغربية</h3>
          <p className="text-sm font-bold text-gold-400 uppercase tracking-[0.2em] relative flex items-center justify-center gap-2 drop-shadow">
            <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-gold-400"></span>
            جاري التحميل
            <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-gold-400"></span>
          </p>
        </div>
      </div>
    </div>
  );
}
