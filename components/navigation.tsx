"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAccount } from "wagmi"
import { isAdmin } from "@/lib/admin"
import { OutlineLink, OutlineButton } from "@/components/ui/gradient-outline"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
    { href: "/create", label: "CREATE" },
    { href: "/portfolio", label: "PORTFOLIO" },
  ] as const

  return (
    <nav className="sticky top-0 z-50 p-4">
      <div
        className="flex items-center justify-between py-4 px-6 rounded-xl backdrop-blur-xl border border-white/5 bg-black/60 shadow-[0_0_20px_rgba(0,0,0,0.4)]"
      >
        {/* Left: Brand */}
        <Link href="/" className="font-bold tracking-widest text-white/90">INSIGHTRA</Link>

        {/* Center: Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
          {navItems.map((it) => (
            <OutlineLink
              key={it.href}
              href={it.href}
              className={
                pathname === it.href
                  ? "border-cyan-300/40 text-white"
                  : "text-white/70 hover:text-white"
              }
            >
              {it.label}
            </OutlineLink>
          ))}
          {userIsAdmin && (
            <OutlineLink href="/admin">ADMIN</OutlineLink>
          )}
        </div>

        {/* Right: Wallet & Mobile menu */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ConnectButton chainStatus="none" showBalance={false} />
          </div>

          {/* Mobile: compact 'More' dropdown for quick nav */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <OutlineButton className="px-3 py-2 text-sm">More</OutlineButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px] bg-black/80 backdrop-blur-xl border border-white/10">
                <DropdownMenuItem asChild>
                  <Link href="/create">Create</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/portfolio">Portfolio</Link>
                </DropdownMenuItem>
                {userIsAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile: hamburger sheet with full nav */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <OutlineButton aria-label="Open menu" className="px-2 py-2">
                  <Menu className="h-5 w-5" />
                </OutlineButton>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black/80 backdrop-blur-xl border-l border-white/10">
                <SheetHeader>
                  <SheetTitle className="text-white/90">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-2">
                  {navItems.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={
                        "px-3 py-2 rounded-lg border border-white/10 text-white/80 hover:text-white hover:border-cyan-300/40"
                      }
                    >
                      {it.label}
                    </Link>
                  ))}
                  {userIsAdmin && (
                    <Link
                      href="/admin"
                      className="px-3 py-2 rounded-lg border border-white/10 text-white/80 hover:text-white hover:border-cyan-300/40"
                    >
                      ADMIN
                    </Link>
                  )}
                  <div className="pt-4">
                    <ConnectButton chainStatus="none" showBalance={false} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
