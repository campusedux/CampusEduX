import Link from "next/link";
import { ArrowRight, ChevronDown, Code2, FileText, Layers, ListChecks, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { whatsAppSupportUrl } from "@/lib/whatsapp";
import styles from "@/components/marketplace/projects.module.css";

const REQUEST_STEPS = [
  { title: "Your idea", mobileTitle: "Your idea", description: "Describe what you want to build", icon: FileText },
  { title: "Platform & features", mobileTitle: "Features", description: "Shape the scope around your needs", icon: Layers },
  { title: "Your estimate", mobileTitle: "Estimate", description: "Review the cost before you submit", icon: ListChecks },
];

/** Decorative local vector artwork; no image fetches, animation or client state. */
function DeveloperLaptop() {
  return (
    <svg viewBox="0 0 440 320" fill="none" aria-hidden="true" focusable="false" className="h-auto w-full">
      <defs>
        <linearGradient id="projects-laptop-frame" x1="100" y1="50" x2="340" y2="255" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9584DA" /><stop offset="0.5" stopColor="#514476" /><stop offset="1" stopColor="#A493E0" />
        </linearGradient>
        <linearGradient id="projects-laptop-base" x1="200" y1="248" x2="200" y2="282" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A99ACD" /><stop offset="1" stopColor="#4C416B" />
        </linearGradient>
        <radialGradient id="projects-laptop-glow">
          <stop stopColor="#A478FF" stopOpacity="0.35" /><stop offset="1" stopColor="#A478FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="225" cy="270" rx="210" ry="49" fill="url(#projects-laptop-glow)" />
      <ellipse cx="220" cy="277" rx="161" ry="11" fill="#080B23" fillOpacity="0.5" />
      <g transform="rotate(-6 220 160)">
        <rect x="65" y="48" width="310" height="205" rx="13" fill="url(#projects-laptop-frame)" />
        <rect x="70" y="53" width="300" height="195" rx="9" fill="#121429" stroke="#B9A7F0" strokeOpacity="0.45" />
        <rect x="78" y="62" width="284" height="175" rx="4" fill="#101326" />
        <path d="M78 84H362" stroke="#34324E" />
        <circle cx="90" cy="74" r="2.5" fill="#F18EA7" /><circle cx="100" cy="74" r="2.5" fill="#EABD7D" /><circle cx="110" cy="74" r="2.5" fill="#8BCFB3" />
        <rect x="143" y="70" width="75" height="8" rx="4" fill="#302A4B" />
        <rect x="78" y="85" width="40" height="152" fill="#19192F" />
        <g stroke="#79718F" strokeWidth="3" strokeLinecap="round">
          <path d="M90 99H105M90 111H99M90 123H103M90 135H99M90 147H105M90 159H101" />
        </g>
        <g strokeWidth="4" strokeLinecap="round">
          <path d="M137 103H163M174 103H227" stroke="#C59AFF" />
          <path d="M149 118H184M195 118H251" stroke="#82C6DB" />
          <path d="M161 133H183M194 133H221M231 133H276" stroke="#91D4B0" />
          <path d="M161 148H203M214 148H242" stroke="#E9ACCF" />
          <path d="M149 163H163" stroke="#C59AFF" />
          <path d="M137 178H166M177 178H212" stroke="#82C6DB" />
          <path d="M149 193H196M207 193H236" stroke="#E7C391" />
          <path d="M137 208H149" stroke="#C59AFF" />
        </g>
        <path d="M65 250H375L408 269C410 271 407 278 400 279H40C33 278 30 271 33 269L65 250Z" fill="url(#projects-laptop-base)" stroke="#C5B1E8" strokeOpacity="0.4" />
        <path d="M75 254H365L384 266H55L75 254Z" fill="#39324F" />
        <path d="M178 267H262L267 272H173L178 267Z" fill="#C4B5DE" fillOpacity="0.7" />
        <path d="M43 275H397" stroke="#E0CEF7" strokeOpacity="0.35" />
      </g>
      <g transform="rotate(8 361 95)">
        <rect x="322" y="57" width="69" height="64" rx="13" fill="#30244F" stroke="#B49AE7" strokeOpacity="0.6" />
        <path d="M348 78L338 88L348 98M365 78L375 88L365 98M360 75L353 102" stroke="#D8B4FE" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="rotate(-10 64 205)">
        <rect x="24" y="177" width="84" height="55" rx="11" fill="#241F43" stroke="#A58AD5" strokeOpacity="0.5" />
        <path d="M40 193H52M40 202H70M40 211H61" stroke="#B6A4E6" strokeWidth="3" strokeLinecap="round" />
        <circle cx="88" cy="204" r="9" fill="#6D50AD" /><path d="M84 204L87 207L92 201" stroke="#E2D5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g fill="#C4A5F3"><circle cx="36" cy="114" r="3" /><circle cx="397" cy="190" r="2" /><circle cx="292" cy="27" r="2" /></g>
      <path d="M46 65V77M40 71H52M399 239V249M394 244H404" stroke="#B49AE7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Server-rendered workflow preview; the builder owns all draft and request state. */
export function CustomProjectBanner() {
  return (
    <section
      aria-labelledby="custom-project-banner-title"
      className={styles.hero}
    >
      <svg aria-hidden="true" focusable="false" className={styles.heroCurves} viewBox="0 0 1440 400" preserveAspectRatio="none" fill="none">
        <path d="M340 440C620 320 620 -50 1080 -40C1250 -36 1370 80 1500 50" stroke="#A788E9" strokeOpacity="0.12" />
        <path d="M480 460C710 310 755 15 1140 30C1310 35 1390 125 1500 95" stroke="#B69BEF" strokeOpacity="0.09" />
        <path d="M630 440C850 310 880 125 1190 110C1330 103 1430 175 1510 150" stroke="#C5A5F3" strokeOpacity="0.07" />
      </svg>
      <div className={`container-page ${styles.heroContent}`}>
        <div className={styles.heroCopy}>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
            <Wrench className="h-3.5 w-3.5 shrink-0" aria-hidden /> Custom projects
          </p>
          <h1 id="custom-project-banner-title" className="mt-3 font-display text-[clamp(1.875rem,3.2vw,3rem)] max-sm:text-[clamp(1.875rem,8.5vw,2.125rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-white">
            Your idea.<br />Built <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">around you.</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300 sm:text-[15px]">
            Mentoring for your own code. Custom software for personal and business ideas.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button href="/custom-projects/start" rightIcon={ArrowRight} className="min-h-12 w-full border border-violet-300/20 bg-gradient-to-r from-violet-600 to-purple-600 px-5 shadow-[0_8px_28px_#7c3aed40] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121329] sm:w-auto">
              Get Your Custom Project
            </Button>
          </div>
        </div>

        <div className={styles.illustration} aria-hidden="true">
          <DeveloperLaptop />
        </div>

        <div className={styles.workspace}>
          <div className="flex min-w-0 items-center gap-2 border-b border-white/10 pb-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
              <Code2 className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Project workspace</p>
              <p className="mt-0.5 text-xs text-slate-400">Request workflow preview</p>
            </div>
            <a href="#project-results" className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-lg px-1 text-xs font-semibold text-violet-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
              <span className="sr-only xl:not-sr-only">Explore Projects</span> <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </a>
          </div>
          <ol aria-label="Custom project request steps" className="my-3 grid grid-cols-3 gap-2 sm:grid-cols-1">
            {REQUEST_STEPS.map(({ title, mobileTitle, description, icon: Icon }, index) => (
              <li key={title} className="min-w-0 rounded-xl border border-white/[0.07] bg-white/[0.04] p-2 sm:flex sm:items-center sm:gap-3">
                <span className="mb-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-200 sm:mb-0 sm:h-8 sm:w-8">
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="sr-only">{index + 1}.</span>
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-4 text-slate-100"><span className="sm:hidden">{mobileTitle}</span><span className="hidden sm:inline">{title}</span></p>
                  <p className="mt-0.5 hidden text-xs leading-4 text-slate-400 sm:block">{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <details className="group border-t border-white/10 text-xs text-slate-300">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg font-medium hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 [&::-webkit-details-marker]:hidden">
              Mentoring &amp; software
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transform-none" aria-hidden />
            </summary>
            <div className="pb-1 text-sm leading-relaxed">
              <p>Students can get code review, debugging help, architecture guidance and feedback on work they author. Personal and business customers can request complete software development.</p>
              <Link href="/custom-projects" className="mt-2 flex min-h-11 w-fit items-center rounded-lg font-semibold text-violet-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
                How it works <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden />
              </Link>
              <a
                href={whatsAppSupportUrl("Hello CampusEduX, I would like project mentoring, code review or debugging help on work I author. I understand you do not complete assessed work for students.")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex min-h-11 items-center rounded-lg font-semibold text-violet-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
              >
                Ask about mentoring<span className="sr-only"> on WhatsApp (opens in a new tab)</span>
              </a>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

export default CustomProjectBanner;
