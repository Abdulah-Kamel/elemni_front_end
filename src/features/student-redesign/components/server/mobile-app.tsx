import { Check, Bell, Smartphone } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";

export default function MobileApp() {
  return (
    <Section id="mobile" className="bg-[#F8FAFC]">
      <div className="grid gap-8 md:grid-cols-2">
        <Reveal className="h-full">
          <div>
            <h2 className="mb-4 text-3xl font-black text-[#0F172A] md:text-4xl leading-[1.3] font-cairo">حمّل تطبيق علمني<br />وذاكر من أي مكان</h2>
            <p className="mb-6 max-w-md text-sm leading-relaxed text-[#334155]">
              تطبيق الموبايل الحصري يوصلك بالمدرسين والكورسات أينما كنت. متابعة، حل أسئلة، وإشعارات فورية.
            </p>
            <div className="mb-6 flex flex-col gap-3">
              {["متابعة الحصص المباشرة من الموبايل", "إشعارات بمواعيد الكورسات والامتحانات", "حل بنوك الأسئلة في أي وقت"].map((text, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100">
                    <Check className="size-3 text-emerald-600" />
                  </span>
                  <span className="text-sm text-[#0F172A]">{text}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button className="rounded-xl bg-[#0F172A] px-5 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-all">حمل من Google Play</button>
              <button className="rounded-xl bg-[#0F172A] px-5 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-all">حمل من App Store</button>
            </div>
          </div>
        </Reveal>
        <Reveal delay={80} className="flex items-center justify-center">
          <div className="relative mx-auto w-64">
            <div className="rounded-[2.5rem] border-4 border-slate-200 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-primary-light p-3">
                <div className="grid size-8 place-items-center rounded-lg bg-primary text-white"><Smartphone className="size-4" /></div>
                <div>
                  <p className="text-xs font-bold text-[#0F172A]">علمني ELEMNI</p>
                  <p className="text-[10px] text-[#334155]">جاهز تذاكر النهاردة؟</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full bg-sky-100" />
                <div className="h-2 w-3/4 rounded-full bg-sky-100" />
                <div className="h-2 w-5/6 rounded-full bg-sky-100" />
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-2">
                <Bell className="size-4 text-amber-500" />
                <span className="text-[10px] font-medium text-amber-700">موعد كورس الفيزياء بكرة 5 مساءً</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
