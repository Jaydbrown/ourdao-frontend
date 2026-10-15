'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Check,
  X,
  Lock,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import {
  useUserData,
  useTreasuryProposal,
  useTreasuryVoting,
  useProposalDocument,
} from '@/hooks/useDAO'
import { formatToken } from '@/lib/utils'
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_AWAITING_FUNDS } from '@/constants'

export default function TreasuryProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const proposalId = parseInt(params.id as string, 10)

  const { isMember } = useUserData()
  const { proposal, isLoading, isError, hasVoted, refetch } = useTreasuryProposal(proposalId)
  const { voteOnTreasury, isPending: isVoting } = useTreasuryVoting()
  const { cid: documentCid } = useProposalDocument('Treasury', proposalId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-48 rounded" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !proposal) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/treasury">
            <ArrowLeft className="h-4 w-4" />
            Back to Treasury
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <h3 className="text-lg font-semibold text-foreground">Treasury Proposal Not Found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              The treasury proposal #{proposalId} could not be found or failed to load.
            </p>
            <Button onClick={() => router.push('/treasury')}>Return to Treasury</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusLabel =
    PROPOSAL_STATUS_LABELS[proposal.status as keyof typeof PROPOSAL_STATUS_LABELS] || 'Unknown'
  const canVote = isMember && proposal.status === 2 && !proposal.isPrivate && !hasVoted
  const totalVotes = Number(proposal.votesFor) + Number(proposal.votesAgainst)
  const percentFor = totalVotes > 0 ? Math.round((Number(proposal.votesFor) / totalVotes) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/treasury">
            <ArrowLeft className="h-4 w-4" />
            Back to Treasury
          </Link>
        </Button>
      </div>

      <PageHeader
        title={proposal.title || `Treasury Proposal #${proposal.id}`}
        subtitle={`Proposal #${proposal.id} · Disbursement of DAO treasury funds`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Proposal Details</CardTitle>
                  <CardDescription>Requested allocation and recipient</CardDescription>
                </div>
                <Badge
                  variant={
                    proposal.status === 5
                      ? 'default'
                      : proposal.status === 4
                        ? 'destructive'
                        : proposal.status === PROPOSAL_STATUS_AWAITING_FUNDS
                          ? 'outline'
                          : 'secondary'
                  }
                  className="text-sm px-3 py-1"
                >
                  {statusLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {proposal.isPrivate && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <Lock className="h-5 w-5 shrink-0" />
                  <span>
                    This is a private treasury proposal. Voting uses commit-reveal encryption and
                    public votes are hidden until the reveal phase.
                  </span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4 bg-muted/40">
                  <p className="text-xs font-medium text-muted-foreground">Requested Amount</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {formatToken(proposal.amount)}
                  </p>
                </div>

                <div className="rounded-lg border p-4 bg-muted/40">
                  <p className="text-xs font-medium text-muted-foreground">Recipient Address</p>
                  <p className="text-sm font-mono text-foreground mt-1 break-all" title={proposal.recipient}>
                    {proposal.recipient}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Short: {formatStellarAddress(proposal.recipient)}
                  </p>
                </div>
              </div>

              {proposal.description && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Description / Reason</h4>
                  <div className="rounded-lg border p-4 bg-card text-sm text-muted-foreground whitespace-pre-wrap">
                    {proposal.description}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attached Document */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Supporting Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documentCid ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-8 w-8 shrink-0 text-primary-600" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">Attached document</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {documentCid}
                      </p>
                    </div>
                  </div>
                  {process.env.NEXT_PUBLIC_IPFS_GATEWAY && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}${documentCid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No document attached to this proposal.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Voting & Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Voting Results</CardTitle>
              <CardDescription>Current community consensus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-4 w-4" /> For
                  </span>
                  <span>{proposal.votesFor} ({percentFor}%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentFor}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <X className="h-4 w-4" /> Against
                  </span>
                  <span>{proposal.votesAgainst} ({100 - percentFor}%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${100 - percentFor}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                {hasVoted ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>You have already cast your vote on this proposal.</span>
                  </div>
                ) : canVote ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-2">Cast your vote as a DAO member:</p>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 gap-2"
                        disabled={isVoting}
                        onClick={async () => {
                          await voteOnTreasury(proposal.id, true)
                          refetch()
                        }}
                      >
                        <Check className="h-4 w-4" />
                        Vote For
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={isVoting}
                        onClick={async () => {
                          await voteOnTreasury(proposal.id, false)
                          refetch()
                        }}
                      >
                        <X className="h-4 w-4" />
                        Vote Against
                      </Button>
                    </div>
                  </div>
                ) : proposal.status !== 2 ? (
                  <p className="text-xs text-muted-foreground">Voting is closed for this proposal.</p>
                ) : !isMember ? (
                  <p className="text-xs text-muted-foreground">Only active DAO members may vote.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Voting is unavailable.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
