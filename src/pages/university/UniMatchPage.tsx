import { IntakeForm } from "@/components/university/match/IntakeForm";

export const UniMatchPage = () => {
  return (
    <main className="mx-auto max-w-[1280px] px-6 min-[860px]:px-8">
      <section className="reveal-up reveal-delay-1 grid grid-cols-1 gap-8 pt-[40px] pb-16 min-[860px]:grid-cols-[1.4fr_1fr] min-[860px]:items-end min-[860px]:gap-20 min-[860px]:pt-[72px] min-[860px]:pb-20">
        <h1 className="text-[clamp(40px,6vw,76px)] font-medium leading-[1] tracking-[-0.03em] text-foreground [&_em]:font-normal [&_em]:italic [&_em]:text-primary">
          Let&apos;s find your <em>course</em>.
        </h1>
        <p className="max-w-[380px] pb-2 text-[18px] leading-[1.5] text-muted-foreground">
          Three quick questions. We match you against real courses — honestly,
          including the ones that are a stretch.
        </p>
      </section>

      <div className="reveal-up reveal-delay-2 border-t border-border pt-14 min-[860px]:pt-20">
        <IntakeForm />
      </div>
    </main>
  );
};
