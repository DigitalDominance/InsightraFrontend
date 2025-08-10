"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Workflow, Code2, ShieldCheck, GitBranch, ChevronRight } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";

function useScrollSpy(ids: string[], offset = 80) {
  const [active, setActive] = useState<string>(ids[0] || "");
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const onClick = (e: Event) => {
      const target = e.currentTarget as HTMLAnchorElement;
      const href = target.getAttribute("href") || "";
      if (href.startsWith("#")) {
        e.preventDefault();
        const id = href.slice(1);
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - offset;
          window.history.pushState({}, "", href);
          window.scrollTo({ top, behavior: "smooth" });
        }
      }
    };

    const links = Array.from(document.querySelectorAll('a[href^="#"]'));
    links.forEach((a) => a.addEventListener("click", onClick));

    const obs = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
      { rootMargin: `-${offset + 1}px 0px -60% 0px`, threshold: 0.01 }
    );
    els.forEach((el) => obs.observe(el));

    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top });
        setTimeout(() => window.scrollTo({ top }), 0);
      }
    }

    return () => {
      links.forEach((a) => a.removeEventListener("click", onClick));
      obs.disconnect();
    };
  }, [ids, offset]);

  return active;
}

export default function DocsPage() {
  const sections = [
    { id: "intro", label: "Overview" },
    { id: "contracts", label: "Contracts & Architecture" },
    { id: "market-lifecycle", label: "Market Lifecycle" },
    { id: "oracle", label: "Predikt Oracle" },
    { id: "fees", label: "Fees & Tokens" },
    { id: "uma-compare", label: "Why Predikt vs UMA" },
    { id: "dev", label: "For Developers" },
    { id: "faq", label: "FAQ" },
  ];

  const active = useScrollSpy(sections.map((s) => s.id));

  return (
    <div className="relative">
      {/* soft gradient background */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(1000px 600px at 70% -20%, rgba(124,58,237,0.25), transparent), radial-gradient(800px 500px at 20% 0%, rgba(73,234,203,0.15), transparent)"
      }} />

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
          <aside className="hidden md:block sticky top-24 h-[calc(100dvh-8rem)] overflow-y-auto pr-4">
            <nav className="space-y-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    active === s.id ? "bg-white/10 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          <main className="space-y-10">
            <header className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#49EACB] to-[#7C3AED] bg-clip-text text-transparent">Insightra Docs</h1>
                <p className="text-gray-300 mt-2">How Insightra markets, factories, and the Predikt Oracle fit together.</p>
              </div>
              <div className="hidden md:flex gap-3">
                <Link href="/create" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#49EACB] to-[#7C3AED] text-black font-semibold">
                  Create a Market <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </header>

            {/* OVERVIEW */}
            <GlassCard id="intro">
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <BookOpen className="w-5 h-5" /> <span className="font-semibold">Overview</span>
                </div>
                <p className="text-gray-300">
                  Insightra is a prediction-market protocol with factory-deployed markets and a lightweight onchain oracle
                  called <span className="text-white font-medium">Predikt</span>. Users can create markets, trade outcome tokens, and redeem after resolution.
                </p>
              </div>
            </GlassCard>

            {/* CONTRACTS & ARCHITECTURE */}
            <GlassCard id="contracts">
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <GitBranch className="w-5 h-5" /> <span className="font-semibold">Contracts & Architecture</span>
                </div>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li><b>Factories</b>: <code>BinaryFactory</code>, <code>CategoricalFactory</code>, <code>ScalarFactory</code> deploy markets and manage listing controls.</li>
                  <li><b>Markets</b>: <code>BinaryMarket</code>, <code>CategoricalMarket</code>, <code>ScalarMarket</code> (via <code>MarketBase</code>) mint outcome tokens, take liquidity, and settle from oracle results.</li>
                  <li><b>Oracle</b>: <code>KasOracle</code> (Predikt) exposes commit–reveal with escalating bonds and optional arbitration for final rulings.</li>
                  <li><b>Arbitrator</b>: <code>SimpleArbitrator</code> provides a deterministic onchain court when disputes escalate.</li>
                </ul>

                {/* Simple architecture diagram */}
                <div className="bg-white/5 rounded-xl p-4">
                  <svg viewBox="0 0 980 360" className="w-full h-auto">
                    <defs>
                      <linearGradient id="lg" x1="0" x2="1">
                        <stop offset="0%" stopColor="#49EACB" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                      <marker id="m" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
                        <path d="M2,2 L8,5 L2,8 z" fill="url(#lg)" />
                      </marker>
                    </defs>
                    <rect x="10" y="10" width="960" height="340" rx="16" fill="url(#lg)" opacity="0.07"/>
                    <g fontFamily="ui-sans-serif, system-ui" fontSize="14" fill="#d1d5db">
                      <rect x="40" y="60" width="160" height="60" rx="10" fill="#0b0f14" stroke="url(#lg)"/>
                      <text x="120" y="95" textAnchor="middle" fill="#fff">User (dApp)</text>

                      <rect x="360" y="40" width="240" height="80" rx="10" fill="#0b0f14" stroke="url(#lg)"/>
                      <text x="480" y="75" textAnchor="middle" fill="#fff">Predikt Oracle</text>

                      <rect x="340" y="170" width="280" height="80" rx="10" fill="#0b0f14" stroke="url(#lg)"/>
                      <text x="480" y="210" textAnchor="middle" fill="#fff">Factories</text>

                      <rect x="740" y="170" width="200" height="110" rx="10" fill="#0b0f14" stroke="url(#lg)"/>
                      <text x="840" y="210" textAnchor="middle" fill="#fff">Market</text>
                      <text x="840" y="230" textAnchor="middle">finalizeFromOracle()</text>

                      <rect x="740" y="40" width="200" height="80" rx="10" fill="#0b0f14" stroke="url(#lg)"/>
                      <text x="840" y="75" textAnchor="middle" fill="#fff">SimpleArbitrator</text>

                      <line x1="200" y1="90" x2="360" y2="80" stroke="url(#lg)" strokeWidth="2.5" markerEnd="url(#m)"/>
                      <text x="280" y="74" textAnchor="middle">createQuestionPublic (fee)</text>

                      <line x1="480" y1="120" x2="480" y2="170" stroke="url(#lg)" strokeWidth="2.5" markerEnd="url(#m)"/>
                      <text x="520" y="150">submit*</text>

                      <line x1="620" y1="210" x2="740" y2="210" stroke="url(#lg)" strokeWidth="2.5" markerEnd="url(#m)"/>
                      <text x="680" y="195" textAnchor="middle">market deployed</text>

                      <line x1="840" y1="170" x2="840" y2="120" stroke="url(#lg)" strokeWidth="2.5" markerEnd="url(#m)"/>
                      <text x="875" y="145">escalate</text>
                    </g>
                  </svg>
                </div>
              </div>
            </GlassCard>

            {/* MARKET LIFECYCLE */}
            <GlassCard id="market-lifecycle">
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <Workflow className="w-5 h-5" /> <span className="font-semibold">Market Lifecycle</span>
                </div>
                <ol className="list-decimal list-inside text-gray-300 space-y-2">
                  <li><b>Create</b>: Anyone can create a market. The app calls <code>createQuestionPublic</code> on the oracle (pays the current <code>questionFee</code> in the oracle’s <code>bondToken</code>), then calls the relevant factory <code>submit*</code> to deploy the market contract.</li>
                  <li><b>Trade</b>: Users add liquidity, buy/sell outcome tokens, and earn fees.</li>
                  <li><b>Report</b>: Reporters first <i>commit</i> a hashed answer; later they <i>reveal</i> the answer and post a bond. Each round’s minimum bond is either <code>minBaseBond</code> or the previous best bond × <code>bondMultiplier</code>.</li>
                  <li><b>Finalize</b>: If no valid challenge/escalation occurs and liveness expires, anyone can <code>finalize(id)</code> on the oracle. The market then calls <code>finalizeFromOracle()</code> to settle.</li>
                  <li><b>Dispute</b>: If challenged repeatedly up to <code>maxRounds</code>, the question is sent to <code>SimpleArbitrator</code> for a final onchain ruling.</li>
                </ol>

                {/* commit->reveal diagram */}
                <div className="bg-white/5 rounded-xl p-4">
                  <svg viewBox="0 0 980 300" className="w-full h-auto">
                    <defs>
                      <linearGradient id="lg2" x1="0" x2="1">
                        <stop offset="0%" stopColor="#49EACB" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                      <marker id="m2" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
                        <path d="M2,2 L8,5 L2,8 z" fill="url(#lg2)" />
                      </marker>
                    </defs>
                    <g fontFamily="ui-sans-serif, system-ui" fontSize="14" fill="#d1d5db">
                      <rect x="40" y="50" width="180" height="60" rx="10" fill="#0b0f14" stroke="url(#lg2)"/>
                      <text x="130" y="85" textAnchor="middle" fill="#fff">commit(hash)</text>

                      <rect x="280" y="50" width="180" height="60" rx="10" fill="#0b0f14" stroke="url(#lg2)"/>
                      <text x="370" y="85" textAnchor="middle" fill="#fff">reveal(answer)</text>

                      <rect x="520" y="50" width="180" height="60" rx="10" fill="#0b0f14" stroke="url(#lg2)"/>
                      <text x="610" y="85" textAnchor="middle" fill="#fff">liveness</text>

                      <rect x="760" y="50" width="180" height="60" rx="10" fill="#0b0f14" stroke="url(#lg2)"/>
                      <text x="850" y="85" textAnchor="middle" fill="#fff">finalize()</text>

                      <line x1="220" y1="80" x2="280" y2="80" stroke="url(#lg2)" strokeWidth="2.5" markerEnd="url(#m2)"/>
                      <line x1="460" y1="80" x2="520" y2="80" stroke="url(#lg2)" strokeWidth="2.5" markerEnd="url(#m2)"/>
                      <line x1="700" y1="80" x2="760" y2="80" stroke="url(#lg2)" strokeWidth="2.5" markerEnd="url(#m2)"/>

                      <rect x="520" y="180" width="180" height="60" rx="10" fill="#0b0f14" stroke="url(#lg2)"/>
                      <text x="610" y="215" textAnchor="middle" fill="#fff">challenge & escalate</text>
                      <line x1="610" y1="110" x2="610" y2="180" stroke="url(#lg2)" strokeWidth="2.5" markerEnd="url(#m2)"/>
                      <line x1="610" y1="240" x2="850" y2="240" stroke="url(#lg2)" strokeWidth="2.5" markerEnd="url(#m2)"/>
                      <text x="730" y="228">arbitrator ruling → finalize</text>
                    </g>
                  </svg>
                </div>
              </div>
            </GlassCard>

            {/* ORACLE */}
            <GlassCard id="oracle">
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <ShieldCheck className="w-5 h-5" /> <span className="font-semibold">Predikt Oracle</span>
                </div>
                <p className="text-gray-300">
                  Predikt (KasOracle) is an optimistic oracle with commit–reveal and bond escalation.
                </p>
                <div className="text-gray-300 space-y-2">
                  <p><b>Question params</b>:</p>
                  <ul className="list-disc list-inside ml-4">
                    <li><code>qtype</code> (binary / categorical / scalar), <code>options</code> (<= 256 for categorical), scalar fields for scalar questions</li>
                    <li><code>timeout</code> (liveness), <code>bondMultiplier</code>, <code>maxRounds</code></li>
                    <li><code>templateHash</code>, <code>dataSource</code>, <code>consumer</code>, <code>openingTs</code></li>
                  </ul>
                  <p><b>Commit</b>: <code>hashCommit = keccak256(abi.encode(id, encodedOutcome, salt, msg.sender))</code>.</p>
                  <p><b>Reveal</b>: Provide <code>encodedOutcome</code>, <code>salt</code>, and a bond ≥ <code>minBaseBond</code> or previous best × <code>bondMultiplier</code>.</p>
                  <p><b>Finalize</b>: After liveness with no successful escalation, <code>finalize(id)</code> pays winner from the bond pool minus <code>feeBps</code> to <code>feeSink</code>.</p>
                </div>
              </div>
            </GlassCard>

            {/* FEES */}
            <GlassCard id="fees">
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <Code2 className="w-5 h-5" /> <span className="font-semibold">Fees & Tokens</span>
                </div>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li><b>Market creation</b>: Public creation calls <code>createQuestionPublic</code> and pays the current <code>questionFee</code> in the oracle’s <code>bondToken</code>.</li>
                  <li><b>Protocol fee</b>: On resolution, a share of the bond pot (<code>feeBps</code>) is sent to <code>feeSink</code>; the rest goes to the winning reporter.</li>
                  <li><b>Bonds</b>: <code>minBaseBond</code> + geometric escalation via <code>bondMultiplier</code> per round up to <code>maxRounds</code>.</li>
                </ul>
              </div>
            </GlassCard>

            {/* UMA COMPARISON */}
            <GlassCard id="uma-compare">
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <Code2 className="w-5 h-5" /> <span className="font-semibold">Why Predikt vs UMA OO</span>
                </div>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li><b>Commit–Reveal</b>: Predikt adds commit–reveal (and <code>recommit</code>) to prevent copycats during liveness; UMA’s default flow doesn’t require it.</li>
                  <li><b>Local Arbitration</b>: Final escalations go to a pluggable onchain arbitrator instead of UMA’s DVM—keeps policy and finality on your chain.</li>
                  <li><b>Config knobs</b>: <code>minBaseBond</code>, <code>bondMultiplier</code>, <code>maxRounds</code> for stronger spam/grief resistance.</li>
                </ul>
              </div>
            </GlassCard>

            {/* DEV REFS */}
            <GlassCard id="dev">
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <Code2 className="w-5 h-5" /> <span className="font-semibold">For Developers</span>
                </div>
                <pre className="whitespace-pre-wrap text-xs md:text-sm text-gray-300 bg-black/40 px-4 py-3 rounded-lg overflow-x-auto">
{`// Oracle (selected)
function createQuestionPublic(QuestionParams p, bytes32 salt) payable returns (bytes32);
function commit(bytes32 id, bytes32 hashCommit);
function recommit(bytes32 id, bytes32 hashCommit);
function reveal(bytes32 id, bytes encodedOutcome, bytes32 salt, uint256 bond);
function finalize(bytes32 id);
function escalate(bytes32 id);
function receiveArbitratorRuling(bytes32 id, bytes encodedOutcome, address payee);

// Market
function finalizeFromOracle(); // pulls oracle result and settles
`}
                </pre>
              </div>
            </GlassCard>

            {/* FAQ */}
            <GlassCard id="faq">
              <div className="p-6 md:p-8 space-y-3">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <BookOpen className="w-5 h-5" /> <span className="font-semibold">FAQ</span>
                </div>
                <p className="text-gray-300"><b>How do I create a market?</b> Use the Create page. You’ll pay the oracle’s <code>questionFee</code> in its <code>bondToken</code>, then the app deploys the market via a factory.</p>
                <p className="text-gray-300"><b>What’s the commit hash formula?</b> <code>keccak256(abi.encode(id, encodedOutcome, salt, msg.sender))</code>.</p>
                <p className="text-gray-300"><b>What triggers arbitration?</b> Reaching <code>maxRounds</code> of escalation routes to the onchain arbitrator for a final ruling.</p>
              </div>
            </GlassCard>
          </main>
        </div>
      </div>
    </div>
  );
}
