"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Workflow, Code2, ShieldCheck, GitBranch, ChevronRight } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";

/** Smooth scroll + active section highlight */
function useScrollSpy(ids: string[], offset = 80) {
  const [active, setActive] = useState<string>(ids[0] || "");
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

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

    // Attach click handlers to internal sidebar links
    const links = Array.from(document.querySelectorAll('a[href^="#"]'));
    links.forEach((a) => a.addEventListener("click", onClick));

    // IntersectionObserver to set active section
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: `-${offset + 1}px 0px -60% 0px`, threshold: 0.01 }
    );
    els.forEach((el) => obs.observe(el));

    // Jump to hash on first load
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
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_600px_at_70%_-20%,rgba(124,58,237,0.25),transparent),radial-gradient(800px_500px_at_20%_0%,rgba(73,234,203,0.15),transparent)]" />

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
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

          {/* Content */}
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
                  <li><b>Factories</b>: <code>BinaryFactory</code>, <code>CategoricalFactory</code>, <code>ScalarFactory</code> deploy markets and manage listing controls (remove/restore, redeem fee bps).</li>
                  <li><b>Markets</b>: <code>BinaryMarket</code>, <code>CategoricalMarket</code>, <code>ScalarMarket</code> (via <code>MarketBase</code>) mint outcome tokens, take liquidity, and settle from oracle results.</li>
                  <li><b>Oracle</b>: <code>KasOracle</code> (Predikt) exposes commit–reveal with escalating bonds and optional arbitration for final rulings.</li>
                  <li><b>Arbitrator</b>: <code>SimpleArbitrator</code> provides a deterministic onchain “court” when disputes escalate.</li>
                </ul>

                {/* Diagram: Architecture with arrows */}
                <div className="bg-white/5 rounded-xl p-4">
                  <svg viewBox="0 0 1000 420" className="w-full h-auto">
                    <defs>
                      <linearGradient id="g1" x1="0" x2="1">
                        <stop offset="0%" stopColor="#49EACB" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                      <marker id="arrow" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto">
                        <path d="M2,2 L10,6 L2,10 z" fill="url(#g1)" />
                      </marker>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="black" flood-opacity="0.6"/>
                      </filter>
                    </defs>
                    <rect x="10" y="10" width="980" height="400" rx="16" fill="url(#g1)" opacity="0.07"/>
                    <g fontFamily="ui-sans-serif, system-ui" fontSize="14" fill="#d1d5db">
                      {/* User */}
                      <rect x="40" y="60" width="160" height="70" rx="12" fill="#0b0f14" stroke="url(#g1)" filter="url(#shadow)"/>
                      <text x="120" y="100" textAnchor="middle" fill="#fff">User (dApp)</text>

                      {/* Oracle */}
                      <rect x="380" y="40" width="240" height="90" rx="12" fill="#0b0f14" stroke="url(#g1)" filter="url(#shadow)"/>
                      <text x="500" y="75" textAnchor="middle" fill="#fff">Predikt Oracle</text>
                      <text x="500" y="93" textAnchor="middle">createQuestionPublic / commit / reveal / finalize</text>

                      {/* Factories */}
                      <rect x="360" y="180" width="280" height="90" rx="12" fill="#0b0f14" stroke="url(#g1)" filter="url(#shadow)"/>
                      <text x="500" y="215" textAnchor="middle" fill="#fff">Factories</text>
                      <text x="500" y="233" textAnchor="middle">Binary / Categorical / Scalar</text>

                      {/* Markets */}
                      <rect x="760" y="180" width="200" height="120" rx="12" fill="#0b0f14" stroke="url(#g1)" filter="url(#shadow)"/>
                      <text x="860" y="215" textAnchor="middle" fill="#fff">Market</text>
                      <text x="860" y="233" textAnchor="middle">Trade, LP, Redeem</text>
                      <text x="860" y="251" textAnchor="middle">finalizeFromOracle()</text>

                      {/* Arbitrator */}
                      <rect x="760" y="40" width="200" height="90" rx="12" fill="#0b0f14" stroke="url(#g1)" filter="url(#shadow)"/>
                      <text x="860" y="75" textAnchor="middle" fill="#fff">SimpleArbitrator</text>

                      {/* Arrows */}
                      <line x1="200" y1="95" x2="380" y2="85" stroke="url(#g1)" strokeWidth="2.5" markerEnd="url(#arrow)"/>
                      <text x="290" y="78" textAnchor="middle">createQuestionPublic (fee)</text>

                      <line x1="500" y1="130" x2="500" y2="180" stroke="url(#g1)" strokeWidth="2.5" markerEnd="url(#arrow)"/>
                      <text x="540" y="158">submit*</text>

                      <line x1="640" y1="225" x2="760" y2="225" stroke="url(#g1)" strokeWidth="2.5" markerEnd="url(#arrow)"/>
                      <text x="700" y="210" textAnchor="middle">market deployed</text>

                      <line x1="860" y1="180" x2="860" y2="130" stroke="url(#g1)" strokeWidth="2.5" markerEnd="url(#arrow)"/>
                      <text x="895" y="155">escalate</text>

                      <line x1="760" y1="260" x2="640" y2="260" stroke="url(#g1)" strokeWidth="2.5" markerEnd="url(#arrow)"/>
                      <text x="700" y="278" textAnchor="middle">finalizeFromOracle</text>
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

                {/* Diagram: commit → reveal → finalize with disputes */}
                <div className="bg-white/5 rounded-xl p-4">
                  <svg viewBox="0 0 1000 360" className="w-full h-auto">
                    <defs>
                      <linearGradient id="g2" x1="0" x2="1"><stop offset="0%" stopColor="#49EACB"/><stop offset="100%" stopColor="#7C3AED"/></linearGradient>
                      <marker id="arrow2" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto">
                        <path d="M2,2 L10,6 L2,10 z" fill="url(#g2)" />
                      </marker>
                    </defs>
                    <g fontFamily="ui-sans-serif, system-ui" fontSize="14" fill="#d1d5db">
                      <rect x="40" y="60" width="180" height="70" rx="10" fill="#0b0f14" stroke="url(#g2)"/>
                      <text x="130" y="98" textAnchor="middle" fill="#fff">commit(hash)</text>

                      <rect x="280" y="60" width="180" height="70" rx="10" fill="#0b0f14" stroke="url(#g2)"/>
                      <text x="370" y="98" textAnchor="middle" fill="#fff">reveal(answer)</text>

                      <rect x="520" y="60" width="180" height="70" rx="10" fill="#0b0f14" stroke="url(#g2)"/>
                      <text x="610" y="98" textAnchor="middle" fill="#fff">liveness countdown</text>

                      <rect x="760" y="60" width="180" height="70" rx="10" fill="#0b0f14" stroke="url(#g2)"/>
                      <text x="850" y="98" textAnchor="middle" fill="#fff">finalize()</text>

                      <line x1="220" y1="95" x2="280" y2="95" stroke="url(#g2)" strokeWidth="2.5" markerEnd="url(#arrow2)"/>
                      <line x1="460" y1="95" x2="520" y2="95" stroke="url(#g2)" strokeWidth="2.5" markerEnd="url(#arrow2)"/>
                      <line x1="700" y1="95" x2="760" y2="95" stroke="url(#g2)" strokeWidth="2.5" markerEnd="url(#arrow2)"/>

                      {/* Dispute path */}
                      <rect x="520" y="200" width="180" height="70" rx="10" fill="#0b0f14" stroke="url(#g2)"/>
                      <text x="610" y="238" textAnchor="middle" fill="#fff">challenge & escalate</text>
                      <line x1="610" y1="130" x2="610" y2="200" stroke="url(#g2)" strokeWidth="2.5" markerEnd="url(#arrow2)"/>
                      <line x1="610" y1="270" x2="850" y2="270" stroke="url(#g2)" strokeWidth="2.5" markerEnd="url(#arrow2)"/>
                      <text x="730" y="258">arbitrator ruling → finalize</text>
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
                  Predikt (<code>KasOracle</code>) is an optimistic oracle with commit–reveal and bond escalation.
                </p>
                <div className="text-gray-300 space-y-2">
                  <p><b>Question params</b> (per <code>QuestionParams</code>):</p>
                  <ul className="list-disc list-inside ml-4">
                    <li><code>qtype</code> (binary / categorical / scalar), <code>options</code> (<= 256 for categorical)</li>
                    <li><code>scalarMin</code>, <code>scalarMax</code>, <code>scalarDecimals</code> (for scalar questions)</li>
                    <li><code>timeout</code> (liveness seconds), <code>bondMultiplier</code> (2–6), <code>maxRounds</code> (<= 10)</li>
                    <li><code>templateHash</code> (hash of the question text), <code>dataSource</code> (URL/IPFS), <code>consumer</code> (optional), <code>openingTs</code> (earliest timestamp to answer)</li>
                  </ul>
                  <p><b>Commit</b>: Reporters submit <code>hashCommit = keccak256(abi.encode(id, encodedOutcome, salt, msg.sender))</code>.</p>
                  <p><b>Reveal</b>: Provide <code>encodedOutcome</code>, <code>salt</code>, and a <b>bond</b> &ge; <code>minBaseBond</code> or <code>prevBond × bondMultiplier</code>.</p>
                  <p><b>Finalize</b>: After liveness with no successful escalation, <code>finalize(id)</code> pays the winning reporter from the bond pool minus <code>feeBps</code> to <code>feeSink</code>.</p>
                  <p><b>Arbitration</b>: If escalated to the limit, <code>SimpleArbitrator</code> issues a decision consumed by <code>receiveArbitratorRuling</code>.</p>
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
                  <li><b>Protocol fee</b>: On resolution, a share of the total bond pot (<code>feeBps</code>) is sent to <code>feeSink</code>; the rest goes to the winning reporter.</li>
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
                <p className="text-gray-300">
                  UMA’s OO pioneered proposer/disputer with a liveness period and a fallback to the DVM. Predikt keeps the optimistic design,
                  but it’s built for chain-local, DAO-owned resolution.
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li><b>Commit–Reveal</b>: Predikt uses commit–reveal (plus <code>recommit</code>) to prevent copycats during liveness—UMA’s default flow doesn’t require this step.</li>
                  <li><b>Local Arbitration</b>: Final escalations go to a pluggable onchain arbitrator, keeping costs and policy within your chain, instead of routing to UMA’s DVM.</li>
                  <li><b>More knobs</b>: Explicit <code>minBaseBond</code>, <code>bondMultiplier</code>, <code>maxRounds</code> for tighter control over spam and griefing resistance.</li>
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
