"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Workflow, Code2, ShieldCheck, GitBranch, ChevronRight } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";

export default function DocsPage() {
  useEffect(() => {
    // scroll to hash
    if (typeof window !== "undefined" && window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const sections = [
    { id: "intro", label: "Overview" },
    { id: "contracts", label: "Contracts & Architecture" },
    { id: "market-lifecycle", label: "Market Lifecycle" },
    { id: "oracle", label: "Predikt Oracle" },
    { id: "uma-compare", label: "Why Predikt vs UMA" },
    { id: "dev", label: "For Developers" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <div className="relative">
      {/* Background gradient like app */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_600px_at_70%_-20%,rgba(124,58,237,0.25),transparent),radial-gradient(800px_500px_at_20%_0%,rgba(73,234,203,0.15),transparent)]" />

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block sticky top-24 h-[calc(100dvh-8rem)] overflow-y-auto pr-4">
            <nav className="space-y-2">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">
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
                  Open App <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </header>

            <GlassCard id="intro">
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <BookOpen className="w-5 h-5" /> <span className="font-semibold">Overview</span>
                </div>
                <p className="text-gray-300">
                  Insightra is a prediction-market protocol powered by factory-deployed markets and a lightweight, onchain oracle
                  called <span className="text-white font-medium">Predikt</span>. Markets are ERC-20–collateralized and resolve by pulling
                  a final outcome from the oracle.
                </p>
              </div>
            </GlassCard>

            <GlassCard id="contracts">
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <GitBranch className="w-5 h-5" /> <span className="font-semibold">Contracts & Architecture</span>
                </div>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li><b>Factories</b>: <code>BinaryFactory</code>, <code>CategoricalFactory</code>, <code>ScalarFactory</code> create market instances and handle listing controls (remove/restore, redeem fee bps).</li>
                  <li><b>Markets</b>: <code>BinaryMarket</code>, <code>CategoricalMarket</code>, <code>ScalarMarket</code> extend <code>MarketBase</code>; mint outcome tokens, take liquidity, and settle via <code>finalizeFromOracle()</code>.</li>
                  <li><b>Oracle</b>: <code>KasOracle</code> (Predikt) exposes <code>createQuestion</code>, <code>commit</code>, <code>reveal</code>, <code>finalize</code>, <code>escalate</code>, and <code>receiveArbitratorRuling</code>; questions are keyed by <code>bytes32</code> ids.</li>
                  <li><b>Arbitration</b>: <code>SimpleArbitrator</code> can be plugged in for escalations and final rulings.</li>
                </ul>

                {/* Diagram: High-level */}
                <div className="bg-white/5 rounded-xl p-4">
                  <svg viewBox="0 0 920 360" className="w-full h-auto">
                    <defs>
                      <linearGradient id="g1" x1="0" x2="1">
                        <stop offset="0%" stopColor="#49EACB" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                    </defs>
                    <rect x="10" y="10" width="900" height="340" rx="16" fill="url(#g1)" opacity="0.08"/>
                    <g fontFamily="sans-serif" fontSize="14" fill="#d1d5db">
                      <rect x="40" y="60" width="200" height="80" rx="10" fill="#0b0f14" stroke="url(#g1)"/>
                      <text x="140" y="105" textAnchor="middle" fill="#fff">Factories</text>

                      <rect x="360" y="60" width="200" height="80" rx="10" fill="#0b0f14" stroke="url(#g1)"/>
                      <text x="460" y="100" textAnchor="middle" fill="#fff">Markets</text>
                      <text x="460" y="118" textAnchor="middle">Binary/Categorical/Scalar</text>

                      <rect x="680" y="60" width="200" height="80" rx="10" fill="#0b0f14" stroke="url(#g1)"/>
                      <text x="780" y="100" textAnchor="middle" fill="#fff">Predikt Oracle</text>

                      <line x1="240" y1="100" x2="360" y2="100" stroke="url(#g1)" strokeWidth="2"/>
                      <line x1="560" y1="100" x2="680" y2="100" stroke="url(#g1)" strokeWidth="2"/>

                      <text x="300" y="90" textAnchor="middle">deploy</text>
                      <text x="620" y="90" textAnchor="middle">resolve via id</text>
                    </g>
                  </svg>
                </div>
              </div>
            </GlassCard>

            <GlassCard id="market-lifecycle">
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <Workflow className="w-5 h-5" /> <span className="font-semibold">Market Lifecycle</span>
                </div>
                <ol className="list-decimal list-inside text-gray-300 space-y-2">
                  <li><b>Create</b>: Admin calls <code>createQuestion</code> (no fee) or users call <code>createQuestionPublic</code> (pays <code>questionFee</code> in the oracle’s <code>bondToken</code>). Factory <code>submit*</code> deploys the market linked to <code>questionId</code>.</li>
                  <li><b>Trade</b>: Liquidity is added and outcome tokens trade.</li>
                  <li><b>Report</b>: Reporters <i>commit</i> a hashed answer (commit-reveal) with a bond, then <i>reveal</i> the answer within liveness.</li>
                  <li><b>Finalize</b>: If unchallenged and liveness expires, anyone can <code>finalize(id)</code>. Market then calls <code>finalizeFromOracle()</code> to settle.</li>
                  <li><b>Dispute & Escalation</b>: If challenged, bonds escalate up to <code>maxRounds</code>. A final escalation routes to the pluggable <code>SimpleArbitrator</code>, which invokes <code>receiveArbitratorRuling</code>.</li>
                </ol>

                {/* Diagram: commit-reveal */}
                <div className="bg-white/5 rounded-xl p-4">
                  <svg viewBox="0 0 920 240" className="w-full h-auto">
                    <defs><linearGradient id="g2" x1="0" x2="1"><stop offset="0%" stopColor="#49EACB"/><stop offset="100%" stopColor="#7C3AED"/></linearGradient></defs>
                    <g fontFamily="sans-serif" fontSize="14" fill="#d1d5db">
                      <rect x="40" y="40" width="160" height="60" rx="10" fill="#0b0f14" stroke="url(#g2)"/>
                      <text x="120" y="75" textAnchor="middle" fill="#fff">commit(hash)</text>
                      <line x1="200" y1="70" x2="320" y2="70" stroke="url(#g2)" strokeWidth="2"/>
                      <rect x="320" y="40" width="160" height="60" rx="10" fill="#0b0f14" stroke="url(#g2)"/>
                      <text x="400" y="75" textAnchor="middle" fill="#fff">reveal(answer)</text>
                      <line x1="480" y1="70" x2="600" y2="70" stroke="url(#g2)" strokeWidth="2"/>
                      <rect x="600" y="40" width="160" height="60" rx="10" fill="#0b0f14" stroke="url(#g2)"/>
                      <text x="680" y="75" textAnchor="middle" fill="#fff">finalize()</text>
                    </g>
                  </svg>
                </div>
              </div>
            </GlassCard>

            <GlassCard id="oracle">
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <ShieldCheck className="w-5 h-5" /> <span className="font-semibold">Predikt Oracle</span>
                </div>
                <p className="text-gray-300">
                  Predikt (<code>KasOracle</code>) is a commitment-based optimistic oracle with bond escalation and optional arbitration.
                  Key surfaces:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li><code>createQuestion</code> (owner, no fee) and <code>createQuestionPublic</code> (anyone, pays <code>questionFee</code>).</li>
                  <li><code>commit</code>/<code>recommit</code> → <code>reveal</code> during liveness; strongest bond wins unless disputed.</li>
                  <li><code>finalize</code> closes optimistic flow and splits the bond pool minus protocol fee (<code>feeBps</code> to <code>feeSink</code>).</li>
                  <li><code>escalate</code> &rarr; <code>receiveArbitratorRuling</code> for a final onchain decision by <code>SimpleArbitrator</code>.</li>
                </ul>
              </div>
            </GlassCard>

            <GlassCard id="uma-compare">
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <Code2 className="w-5 h-5" /> <span className="font-semibold">Why Predikt vs UMA OO</span>
                </div>
                <p className="text-gray-300">
                  UMA’s Optimistic Oracle (OO) popularized proposer/disputer with liveness and a fallback to the DVM. Predikt keeps the
                  same spirit but adapts for lean, chain-local markets:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li><b>Commit–Reveal</b>: Predikt adds <code>commit</code>/<code>reveal</code> (and <code>recommit</code>) so reports aren’t trivially copied during liveness. UMA’s flow does not require commit-reveal by default.</li>
                  <li><b>Pluggable Arbitration</b>: Instead of routing to UMA’s DVM, Predikt calls a chain-local <code>SimpleArbitrator</code>, keeping fees and finality on the same chain and under your DAO’s policy.</li>
                  <li><b>Configurable Bonds</b>: Per-question <code>bondMultiplier</code>, <code>minBaseBond</code>, <code>escalationBond</code>, and <code>maxRounds</code> allow tighter control for spam resistance and economic security.</li>
                  <li><b>Owner & Public Paths</b>: Separate <code>createQuestion</code> (owner) and <code>createQuestionPublic</code> (fee) make admin-created markets free while preserving open creation for users.</li>
                </ul>
                <p className="text-xs text-gray-400">
                  Note: UMA and Predikt are different designs; always evaluate tradeoffs for your threat model and chain.
                </p>
              </div>
            </GlassCard>

            <GlassCard id="dev">
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <Code2 className="w-5 h-5" /> <span className="font-semibold">For Developers</span>
                </div>
                <pre className="whitespace-pre-wrap text-xs md:text-sm text-gray-300 bg-black/40 px-4 py-3 rounded-lg overflow-x-auto">
{`// Oracle (selected)
function createQuestion(QuestionParams p, bytes32 salt) onlyOwner returns (bytes32);
function createQuestionPublic(QuestionParams p, bytes32 salt) payable returns (bytes32);
function commit(bytes32 id, bytes32 hashCommit);
function recommit(bytes32 id, bytes32 hashCommit);
function reveal(bytes32 id, bytes encodedOutcome, bytes32 salt, uint256 bond);
function finalize(bytes32 id);
function escalate(bytes32 id);
function receiveArbitratorRuling(bytes32 id, bytes encodedOutcome, address payee);

// Market
function finalizeFromOracle(); // pulls oracle result and settles`}
                </pre>
              </div>
            </GlassCard>

            <GlassCard id="faq">
              <div className="p-6 md:p-8 space-y-3">
                <div className="flex items-center gap-2 text-[#49EACB]">
                  <BookOpen className="w-5 h-5" /> <span className="font-semibold">FAQ</span>
                </div>
                <p className="text-gray-300"><b>How do I create an admin market?</b> Use the Admin panel’s “Admin Create” which calls <code>createQuestion</code> then the relevant factory’s <code>submit*</code>.</p>
                <p className="text-gray-300"><b>What’s the public creation fee?</b> <code>questionFee</code> in the oracle’s <code>bondToken</code>. The owner can adjust it.</p>
                <p className="text-gray-300"><b>What happens on escalation?</b> Bonds escalate up to <code>maxRounds</code>; the arbitrator makes a final ruling invoked via <code>receiveArbitratorRuling</code>.</p>
              </div>
            </GlassCard>
          </main>
        </div>
      </div>
    </div>
  );
}
