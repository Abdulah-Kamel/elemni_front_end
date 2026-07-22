import { Play } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";

const lessons = [
  { id: "l1", title: "أقوى شرح للتفاضل والتكامل", desc: "شرح مبسط مع أمثلة محلولة", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=400", duration: "45:00" },
  { id: "l2", title: "فيزياء — الكهربية", desc: "أساسيات الكهربية والتيار", image: "https://images.unsplash.com/photo-1581092335397-9583eb92a232?auto=format&fit=crop&q=80&w=400", duration: "38:15" },
  { id: "l3", title: "قواعد اللغة العربية", desc: "النحو والإعراب للمبتدئين", image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400", duration: "52:30" },
];

export default function FeaturedLessons() {
  return (
    <Section id="featured-lessons" className="bg-white">
      <Reveal>
        <div className="mb-4 text-center">
          <span className="inline-block rounded-full bg-primary-light px-4 py-1.5 text-xs font-bold text-primary">دروس مميزة</span>
        </div>
        <h2 className="mb-3 text-center text-3xl font-black text-[#0F172A] md:text-4xl font-cairo">أشهر الدروس على المنصة</h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-[#334155]">تصفح الدروس الأكثر مشاهدة وابدأ التعلم فوراً.</p>
      </Reveal>
      <div className="grid gap-6 md:grid-cols-3">
        {lessons.map(({ id, title, desc, image, duration }, i) => (
          <Reveal key={id} delay={i * 80} className="h-full">
            <div className="group relative h-full overflow-hidden rounded-2xl bg-slate-900">
              <img src={image} alt={title} className="h-48 w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 p-5 text-white">
                <span className="mb-1 inline-block rounded-full bg-primary/80 px-2.5 py-0.5 text-[11px] font-bold">{duration}</span>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-1 text-xs text-slate-300">{desc}</p>
              </div>
              <div className="absolute left-1/2 top-1/3 -translate-x-1/2 grid size-12 place-items-center rounded-full bg-white/90 text-primary opacity-0 transition-all group-hover:opacity-100">
                <Play className="size-5 fill-primary" />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
