'use client'

/**
 * Wallet connect button backed by the Freighter wallet context. Exposes both
 * a plain <ConnectButton /> and a <ConnectButton.Custom> render-prop variant
 * for pages that need custom layout around the connect/account state.
 */
import type { ReactNode } from 'react'
import { useWallet } from '@/lib/wallet'
import { formatStellarAddress } from '@/lib/stellar'
import { Button } from '@/components/ui/button'

interface CustomRenderProps {
  account?: { address: string; displayName: string }
  chain: { unsupported: boolean }
  openConnectModal: () => void
  openAccountModal: () => void
  mounted: boolean
  authenticationStatus: 'authenticated' | 'unauthenticated'
}

function ConnectButton() {
  const { address, isConnected, connect, disconnect, connecting } = useWallet()

  if (isConnected && address) {
    return (
      <Button variant="outline" onClick={disconnect} title={address}>
        {formatStellarAddress(address)}
      </Button>
    )
  }
  return (
    <Button onClick={connect} disabled={connecting}>
      {connecting ? 'Connecting…' : 'Connect Wallet'}
    </Button>
  )
}

function Custom({
  children,
}: {
  children: (props: CustomRenderProps) => ReactNode
}) {
  const { address, isConnected, connect, disconnect, networkMismatch } = useWallet()
  return (
    <>
      {children({
        account:
          isConnected && address
            ? { address, displayName: formatStellarAddress(address) }
            : undefined,
        chain: { unsupported: networkMismatch },
        openConnectModal: connect,
        openAccountModal: disconnect,
        mounted: true,
        authenticationStatus: isConnected ? 'authenticated' : 'unauthenticated',
      })}
    </>
  )
}

ConnectButton.Custom = Custom

export { ConnectButton }
