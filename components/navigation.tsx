"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAccount } from "wagmi"
import { isAdmin } from "@/lib/admin"
import { OutlineLink, OutlineButton } from "@/components/ui/gradient-outline"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navigation() {
  const pathname = usePathname()
  const { address } = useAccount()
  const userIsAdmin = isAdmin(address)

  const navItems = [
    { href: "/", label: "MARKETS" },
    { href: "/portfolio", label: "PORTFOLIO" },
    { href: "/create", label: "CREATE" },
    ...(userIsAdmin ? [{ href: "/admin", label: "ADMIN" }] : []),
  ] as const

  return (
    <nav className="sticky top-0 z-50 p-4">
      <div
        className="flex items-center justify-between py-3 px-4 md:py-4 md:px-6 rounded-xl shadow-2xl backdrop-blur-xl"
        style={{
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(16px)",
          boxShadow: `
            0 0 0 1px rgba(73, 234, 203, 0.1),
            0 0 20px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.04)
          `,
        }}
      >
        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Logo + title (responsive sizes) */}
          <a href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center overflow-hidden">
              <img
                src="/insightra-logo.webp"
                alt="Insightra logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl md:text-2xl font-cyber font-bold bg-gradient-to-r from-[#49EACB] to-[#7C3AED] bg-clip-text text-transparent">
                INSIGHTRA
              </span>
              <span className="text-[10px] md:text-xs text-gray-400 font-sleek tracking-wider">
                PREDICTION MARKETS
              </span>
            </div>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex gap-2">
            {navItems.map((item) => (
              <OutlineLink
                key={item.href}
                href={item.href}
                size="sm"
                active={pathname === item.href}
                className="min-w-[110px] justify-center"
              >
                {item.label}
              </OutlineLink>
            ))}
          </div>
        </div>

        {/* Right side: Connect + Mobile dropdown */}
        <div className="flex items-center gap-3">
          {userIsAdmin && (
            <span className="hidden md:inline-flex items-center px-3 py-1 bg-[#49EACB]/10 rounded-full border border-[#49EACB]/30">
              <span className="text-xs text-[#49EACB] font-cyber tracking-wider">ADMIN</span>
            </span>
          )}

          {/* Mobile-only dropdown (single) */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <OutlineButton size="md">
                  <span className="font-cyber">MENU</span>
                </OutlineButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[170px] bg-black/80 backdrop-blur-xl border border-white/10">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Connect button (custom) */}
          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
              const connected = mounted && account && chain
              if (!connected) {
                return (
                  <div className="hidden md:block">
                    <OutlineButton size="md" onClick={openConnectModal}>
                      <span className="font-cyber">CONNECT WALLET</span>
                    </OutlineButton>
                  </div>
                )
              }
              return (
                <OutlineButton size="md" onClick={openAccountModal} className="hidden md:inline-flex">
                  <span className="font-cyber">
                    {account?.address
                      ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}`
                      : account?.displayName}
                  </span>
                </OutlineButton>
              )
            }}
          </ConnectButton.Custom>

          {/* Mobile connect (short label) */}
          <div className="md:hidden">
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
                const connected = mounted && account && chain
                if (!connected) {
                  return (
                    <OutlineButton size="md" onClick={openConnectModal}>
                      <span className="font-cyber">CONNECT</span>
                    </OutlineButton>
                  )
                }
                return (
                  <OutlineButton size="md" onClick={openAccountModal}>
                    <span className="font-cyber">
                      {account?.address
                        ? `${account.address.slice(0, 4)}…${account.address.slice(-3)}`
                        : "ACCOUNT"}
                    </span>
                  </OutlineButton>
                )
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </nav>
  )
}
