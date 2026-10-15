'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, RefreshCw, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { useInterestDistributions } from '@/hooks/useDAO'
import { formatToken, formatDate } from '@/lib/utils'

interface InterestHistoryProps {
  pageSize?: number
}

export function InterestHistory({ pageSize = 10 }: InterestHistoryProps) {
  const [cursorStack, setCursorStack] = useState<(number | undefined)[]>([undefined])
  const currentCursor = cursorStack[cursorStack.length - 1]

  const { distributions, isLoading, isError, refetch } = useInterestDistributions({
    before: currentCursor,
    limit: pageSize,
  })

  const hasNextPage = distributions.length === pageSize
  const hasPrevPage = cursorStack.length > 1

  const handleNextPage = () => {
    if (distributions.length > 0) {
      const oldestLedger = distributions[distributions.length - 1].ledger
      setCursorStack((prev) => [...prev, oldestLedger])
    }
  }

  const handlePrevPage = () => {
    if (cursorStack.length > 1) {
      setCursorStack((prev) => prev.slice(0, -1))
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Interest Distribution History
            </CardTitle>
            <CardDescription>
              Record of periodic interest yield distributed across active DAO members
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label="Refresh interest history"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p className="text-sm text-destructive mb-3">Failed to load interest distribution history.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : distributions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <TrendingUp className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm">No interest distributions recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" data-testid="interest-distributions-table">
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th scope="col" className="pb-3 pr-4 font-medium">Ledger</th>
                    <th scope="col" className="pb-3 px-4 font-medium">Amount Distributed</th>
                    <th scope="col" className="pb-3 px-4 font-medium">Active Members</th>
                    <th scope="col" className="pb-3 px-4 font-medium">Transaction</th>
                    <th scope="col" className="pb-3 pl-4 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {distributions.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-foreground">
                        #{item.ledger}
                      </td>
                      <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400">
                        +{formatToken(item.amount)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {item.active_members}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {item.tx_hash ? (
                          <span title={item.tx_hash}>
                            {item.tx_hash.slice(0, 6)}…{item.tx_hash.slice(-4)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 pl-4 text-right text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-2 border-t text-sm">
              <div className="text-xs text-muted-foreground">
                Page {cursorStack.length}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={!hasPrevPage || isLoading}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Newer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasNextPage || isLoading}
                  className="gap-1"
                >
                  Older
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
