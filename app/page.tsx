"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import GlassCard from "@/components/ui/glass-card"
import { Search, TrendingUp, Clock, Users, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import SuspenseWrapper from "@/components/ui/suspense-wrapper"
import { OutlineButton, OutlineField } from "@/components/ui/gradient-outline"

// Mock data for markets - expanded with more examples
const mockMarkets = [
  {
    id: 1,
    title: "Will Bitcoin reach $100,000 by end of 2024?",
    description: "Prediction market for Bitcoin price reaching $100,000 USD",
    yesPrice: 0.65,
    noPrice: 0.35,
    volume: 125000,
    participants: 1247,
    endDate: "2024-12-31",
    category: "Crypto",
  },
  {
    id: 2,
    title: "Will AI achieve AGI by 2025?",
    description: "Market predicting artificial general intelligence breakthrough",
    yesPrice: 0.23,
    noPrice: 0.77,
    volume: 89000,
    participants: 892,
    endDate: "2025-12-31",
    category: "Technology",
  },
  {
    id: 3,
    title: "Will SpaceX land humans on Mars by 2030?",
    description: "Prediction for first human Mars landing mission",
    yesPrice: 0.41,
    noPrice: 0.59,
    volume: 67000,
    participants: 634,
    endDate: "2030-12-31",
    category: "Space",
  },
  {
    id: 4,
    title: "Will Ethereum reach $5,000 by mid-2024?",
    description: "ETH price prediction for reaching $5,000 milestone",
    yesPrice: 0.52,
    noPrice: 0.48,
    volume: 98000,
    participants: 1156,
    endDate: "2024-06-30",
    category: "Crypto",
  },
  {
    id: 5,
    title: "Will Apple release AR glasses in 2024?",
    description: "Market for Apple's augmented reality glasses launch",
    yesPrice: 0.38,
    noPrice: 0.62,
    volume: 45000,
    participants: 567,
    endDate: "2024-12-31",
    category: "Technology",
  },
  {
    id: 6,
    title: "Will Tesla stock hit $300 by Q3 2024?",
    description: "TSLA stock price reaching $300 per share",
    yesPrice: 0.44,
    noPrice: 0.56,
    volume: 78000,
    participants: 923,
    endDate: "2024-09-30",
    category: "Technology",
  },
  {
    id: 7,
    title: "Will the US have a recession in 2024?",
    description: "Official recession declaration by NBER for 2024",
    yesPrice: 0.31,
    noPrice: 0.69,
    volume: 156000,
    participants: 2134,
    endDate: "2024-12-31",
    category: "Politics",
  },
  {
    id: 8,
    title: "Will OpenAI release GPT-5 in 2024?",
    description: "Launch of GPT-5 or equivalent next-gen model",
    yesPrice: 0.67,
    noPrice: 0.33,
    volume: 112000,
    participants: 1456,
    endDate: "2024-12-31",
    category: "Technology",
  },
  {
    id: 9,
    title: "Will NASA's Artemis 3 launch in 2025?",
    description: "Artemis 3 moon landing mission launch date",
    yesPrice: 0.29,
    noPrice: 0.71,
    volume: 34000,
    participants: 445,
    endDate: "2025-12-31",
    category: "Space",
  },
  {
    id: 10,
    title: "Will Dogecoin reach $1 by end of 2024?",
    description: "DOGE cryptocurrency reaching $1.00 USD",
    yesPrice: 0.18,
    noPrice: 0.82,
    volume: 67000,
    participants: 1789,
    endDate: "2024-12-31",
    category: "Crypto",
  },
  {
    id: 11,
    title: "Will Meta's VR headsets sell 10M+ units in 2024?",
    description: "Meta Quest series selling over 10 million units",
    yesPrice: 0.55,
    noPrice: 0.45,
    volume: 43000,
    participants: 678,
    endDate: "2024-12-31",
    category: "Technology",
  },
  {
    id: 12,
    title: "Will any country ban TikTok nationwide in 2024?",
    description: "Complete TikTok ban implemented by any nation",
    yesPrice: 0.72,
    noPrice: 0.28,
    volume: 89000,
    participants: 1234,
    endDate: "2024-12-31",
    category: "Politics",
  },
  {
    id: 13,
    title: "Will quantum computing break RSA encryption by 2025?",
    description: "Successful demonstration of RSA-2048 factorization",
    yesPrice: 0.15,
    noPrice: 0.85,
    volume: 23000,
    participants: 345,
    endDate: "2025-12-31",
    category: "Technology",
  },
  {
    id: 14,
    title: "Will Solana flip Ethereum by market cap in 2024?",
    description: "SOL market capitalization exceeding ETH",
    yesPrice: 0.12,
    noPrice: 0.88,
    volume: 78000,
    participants: 967,
    endDate: "2024-12-31",
    category: "Crypto",
  },
  {
    id: 15,
    title: "Will autonomous vehicles be legal in all US states by 2025?",
    description: "Full self-driving cars approved nationwide",
    yesPrice: 0.34,
    noPrice: 0.66,
    volume: 56000,
    participants: 723,
    endDate: "2025-12-31",
    category: "Technology",
  },
  {
    id: 16,
    title: "Will a major social media platform integrate crypto payments in 2024?",
    description: "Native cryptocurrency payment system launch",
    yesPrice: 0.58,
    noPrice: 0.42,
    volume: 91000,
    participants: 1123,
    endDate: "2024-12-31",
    category: "Technology",
  },
  {
    id: 17,
    title: "Will climate change cause a major city evacuation by 2025?",
    description: "Permanent evacuation due to climate events",
    yesPrice: 0.27,
    noPrice: 0.73,
    volume: 45000,
    participants: 567,
    endDate: "2025-12-31",
    category: "Politics",
  },
  {
    id: 18,
    title: "Will lab-grown meat be sold in US supermarkets by 2024?",
    description: "Commercial availability of cultured meat products",
    yesPrice: 0.61,
    noPrice: 0.39,
    volume: 34000,
    participants: 456,
    endDate: "2024-12-31",
    category: "Technology",
  },
]

const MARKETS_PER_PAGE = 9

function MarketsPageContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchFocused, setSearchFocused] = useState(false)

  const categories = ["All", "Crypto", "Technology", "Space", "Politics", "Sports"]

  const filteredMarkets = useMemo(() => {
    return mockMarkets.filter(
      (market) =>
        market.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === "All" || market.category === selectedCategory),
    )
  }, [searchTerm, selectedCategory])

  const totalPages = Math.ceil(filteredMarkets.length / MARKETS_PER_PAGE)
  const startIndex = (currentPage - 1) * MARKETS_PER_PAGE
  const paginatedMarkets = filteredMarkets.slice(startIndex, startIndex + MARKETS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Reset to page 1 when filters change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-cyber font-bold bg-gradient-to-r from-[#49EACB] to-[#7C3AED] bg-clip-text text-transparent">
          PREDICTION MARKETS
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto font-sleek">
          Trade on the outcome of future events with decentralized prediction markets
        </p>
      </motion.div>

      {/* Search and Filters */}
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Search Bar with glass + gradient outline */}
            <div>
              <OutlineField active={searchFocused}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search prediction markets..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-transparent text-white placeholder-gray-400 font-sleek focus:outline-none"
                  />
                </div>
              </OutlineField>
            </div>

            {/* Category Filters with glow/grow on selected */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-gray-400">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-sleek font-medium">Filter:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => {
                  const active = selectedCategory === category
                  return (
                    <OutlineButton
                      key={category}
                      size="sm"
                      active={active}
                      onClick={() => handleCategoryChange(category)}
                      className="font-sleek"
                    >
                      {category}
                    </OutlineButton>
                  )
                })}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Markets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedMarkets.map((market, index) => (
          <motion.div
            key={market.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard className="h-full">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <span className="px-3 py-1 rounded-full text-sm text-[#49EACB] font-cyber font-medium border border-white/10 bg-neutral-900/60">
                    {market.category.toUpperCase()}
                  </span>
                  <div className="flex items-center text-gray-400 text-sm font-sleek">
                    <Clock className="w-4 h-4 mr-1" />
                    {market.endDate}
                  </div>
                </div>

                <h3 className="text-lg font-sleek font-semibold text-white leading-tight">{market.title}</h3>

                <p className="text-gray-400 text-sm font-sleek">{market.description}</p>

                {/* Price Display */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                    <div className="text-green-400 font-cyber font-semibold text-sm">YES</div>
                    <div className="text-xl font-cyber font-bold text-white">${market.yesPrice.toFixed(2)}</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                    <div className="text-red-400 font-cyber font-semibold text-sm">NO</div>
                    <div className="text-xl font-cyber font-bold text-white">${market.noPrice.toFixed(2)}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between text-sm text-gray-400 font-sleek">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />${market.volume.toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {market.participants}
                  </div>
                </div>

                {/* Trade Button - glass with gradient outline */}
                <OutlineButton size="lg" className="w-full font-cyber">
                  TRADE NOW
                </OutlineButton>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Results Info moved above Pagination */}
      <div className="text-center">
        <p className="text-gray-400 font-sleek">
          Showing {startIndex + 1}-{Math.min(startIndex + MARKETS_PER_PAGE, filteredMarkets.length)} of{" "}
          {filteredMarkets.length} markets
        </p>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <GlassCard className="p-2">
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <OutlineButton
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </OutlineButton>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)

                if (!showPage) {
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-2 text-gray-600 font-sleek">
                        ...
                      </span>
                    )
                  }
                  return null
                }

                return (
                  <OutlineButton
                    key={page}
                    size="sm"
                    active={currentPage === page}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </OutlineButton>
                )
              })}

              {/* Next Button */}
              <OutlineButton
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </OutlineButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}

export default function MarketsPage() {
  return (
    <SuspenseWrapper>
      <MarketsPageContent />
    </SuspenseWrapper>
  )
}
