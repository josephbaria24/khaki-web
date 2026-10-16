import Link from "next/link";
import { QUALIFICATION_STAGES } from "@/lib/qualification";
import { LANDING } from "@/lib/landingContent";

export default function QualificationPath({ href = "/verify" }) {
  return (
    <section className="bg-[#FBF8F1] py-16 lg:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: LANDING.oliveMid }}>Tasker qualification</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-[#163044] sm:text-4xl">Five stages. Same Palawan colors.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#163044]/70">
          Register, confirm your email, then add an ID and a face photo. Later jobs, a license number, and strong reviews move the badge forward.
        </p>

        <div className="mt-8 grid gap-3 lg:grid-cols-5">
          {QUALIFICATION_STAGES.map((stage) => (
            <article key={stage.stage} className="flex flex-col rounded-[1.35rem] bg-white p-4 shadow-[0_8px_24px_rgba(22,48,68,0.08)]">
              <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: stage.ink }}>Stage {stage.stage}</p>
              <h3 className="mt-2 text-lg font-black leading-tight" style={{ color: stage.ink }}>{stage.name}</h3>
              <p className="mt-1 text-xs font-semibold text-[#163044]/55">{stage.kicker}</p>
              <ul className="mt-3 flex-1 space-y-1.5">
                {stage.points.map((point) => (
                  <li key={point} className="text-[12px] font-medium leading-snug text-[#163044]/80">• {point}</li>
                ))}
              </ul>
              <p className="mt-3 rounded-full px-2.5 py-1 text-center text-[11px] font-black" style={{ background: stage.soft, color: stage.ink }}>{stage.badge}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] text-[#F7F4EC]" style={{ background: LANDING.olive }}>
          <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#E8DCC4]">How it moves</p>
              <p className="mt-2 text-sm leading-relaxed text-[#F7F4EC]/85">Admin approves the ID and face photo. A finished job unlocks the skill stage. A saved license number unlocks Licensed. Pioneer is earned from reviews.</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#E8DCC4]">What posters see</p>
              <p className="mt-2 text-sm leading-relaxed text-[#F7F4EC]/85">When posting, choose the minimum stage. Taskers below that stage still exist — the gawain says what you asked for.</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#E8DCC4]">Start</p>
              <p className="mt-2 text-sm leading-relaxed text-[#F7F4EC]/85">The verification form is four short steps: account, email code, ID plus face photo, then review.</p>
              <Link href={href} className="btn-sand mt-4 inline-flex h-11 items-center px-5 text-sm">Start verification</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
