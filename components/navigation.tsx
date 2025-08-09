"use client"

import { usePathname } from "next/navigation"
import { useAccount } from "wagmi"
import { isAdmin } from "@/lib/admin"
import { OutlineLink, OutlineButton } from "@/components/ui/gradient-outline"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function Navigation() {
  const pathname = usePathname()
  const { address } = useAccount()
  const userIsAdmin = isAdmin(address)

  const navItems = [
    { href: "/", label: "MARKETS" },
    { href: "/portfolio", label: "PORTFOLIO" },
    { href: "/create", label: "CREATE" },
    ...(userIsAdmin ? [{ href: "/admin", label: "ADMIN" }] : []),
  ]

  return (
    <nav className="sticky top-0 z-50 p-4">
      <div
        className="flex items-center justify-between py-4 px-6 rounded-xl shadow-2xl backdrop-blur-xl"
        style={{
          // Remove the border around the nav container so the logo has no visible outline
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(16px)",
          boxShadow: `
            0 0 0 1px rgba(73, 234, 203, 0.1),
            0 0 20px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.04)
          `,
        }}
      >
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-3">
            {/* Display the Insightra logo without an outline and at a larger size.  The
             * surrounding wrapper uses no border and grows slightly to make the
             * logo more prominent in the navbar. */}
            <div className="w-14 h-14 flex items-center justify-center overflow-hidden">
              <img
                src="/insightra-logo.webp"
                alt="Insightra logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-cyber font-bold bg-gradient-to-r from-[#49EACB] to-[#7C3AED] bg-clip-text text-transparent">
                INSIGHTRA
              </span>
              <span className="text-xs text-gray-400 font-sleek tracking-wider">PREDICTION MARKETS</span>
            </div>
          </a>

          {/* Navigation Links */}
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

        {/* Connect Button (Custom) */}
        <div className="flex items-center gap-3">
          {userIsAdmin && (
            <span className="hidden md:inline-flex items-center px-3 py-1 bg-[#49EACB]/10 rounded-full border border-[#49EACB]/30">
              <span className="text-xs text-[#49EACB] font-cyber tracking-wider">ADMIN</span>
            </span>
          )}

          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
              const connected = mounted && account && chain;
              // When not connected, prompt user to connect their wallet
              if (!connected) {
                return (
                  <OutlineButton size="md" onClick={openConnectModal}>
                    <span className="font-cyber">
                      <span className="md:hidden">CONNECT</span>
                      <span className="hidden md:inline">CONNECT WALLET</span>
                    </span>
                  </OutlineButton>
                );
              }
              // When connected, show the user's address only and open the account modal on click.
              return (
                <OutlineButton size="md" onClick={openAccountModal}>
                  <span className="font-cyber">
                    {/* Always display only the truncated address (0x1234…abcd) and avoid showing network names */}
                    {account?.address
                      ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}`
                      : account.displayName}
                  </span>
                </OutlineButton>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </nav>
  )
}
