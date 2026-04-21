'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const WITHDRAWAL_METHODS = [
  { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: '🏦' },
  { id: 'PAYPAL', name: 'PayPal', icon: '🌐' },
  { id: 'CRYPTO', name: 'Cryptocurrency', icon: '₿' },
  { id: 'WISE', name: 'Wise', icon: '💱' },
  { id: 'PAYONEER', name: 'Payoneer', icon: '📱' },
]

const WITHDRAWAL_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

export default function WithdrawalPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [showDialog, setShowDialog] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<string>('BANK_TRANSFER')
  const [destination, setDestination] = useState('')
  const [destinationDetails, setDestinationDetails] = useState<Record<string, string>>({})

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet-summary'],
    queryFn: async () => {
      const res = await fetch('/api/wallet/summary')
      if (!res.ok) throw new Error('Failed to fetch wallet')
      return res.json()
    },
  })

  // Fetch withdrawal history
  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      const res = await fetch('/api/wallet/withdrawals')
      if (!res.ok) throw new Error('Failed to fetch withdrawals')
      return res.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Request withdrawal mutation
  const requestWithdrawalMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/wallet/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          method,
          destination,
          destinationDetails,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Withdrawal request failed')
      }

      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Withdrawal request submitted successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-summary'] })
      setShowDialog(false)
      setAmount('')
      setDestination('')
      setDestinationDetails({})
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request withdrawal',
        variant: 'destructive',
      })
    },
  })

  const handleRequestWithdrawal = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      })
      return
    }

    if (!destination) {
      toast({
        title: 'Error',
        description: 'Please enter a destination address',
        variant: 'destructive',
      })
      return
    }

    if (!wallet || parseFloat(amount) > wallet.balance.available) {
      toast({
        title: 'Error',
        description: 'Insufficient available balance',
        variant: 'destructive',
      })
      return
    }

    requestWithdrawalMutation.mutate()
  }

  const getMethodDetails = (selectedMethod: string) => {
    switch (selectedMethod) {
      case 'BANK_TRANSFER':
        return (
          <>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input
                  id="bank-name"
                  placeholder="Your bank name"
                  value={destinationDetails.bankName || ''}
                  onChange={(e) =>
                    setDestinationDetails({ ...destinationDetails, bankName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="account-number">Account Number</Label>
                <Input
                  id="account-number"
                  placeholder="Your account number"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="routing-number">Routing Number (optional)</Label>
                <Input
                  id="routing-number"
                  placeholder="Routing number"
                  value={destinationDetails.routingNumber || ''}
                  onChange={(e) =>
                    setDestinationDetails({ ...destinationDetails, routingNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="swift-code">SWIFT Code (optional)</Label>
                <Input
                  id="swift-code"
                  placeholder="SWIFT code"
                  value={destinationDetails.swiftCode || ''}
                  onChange={(e) =>
                    setDestinationDetails({ ...destinationDetails, swiftCode: e.target.value })
                  }
                />
              </div>
            </div>
          </>
        )
      case 'PAYPAL':
        return (
          <div>
            <Label htmlFor="paypal-email">PayPal Email</Label>
            <Input
              id="paypal-email"
              type="email"
              placeholder="your@email.com"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
        )
      case 'CRYPTO':
        return (
          <div className="grid gap-4">
            <div>
              <Label htmlFor="wallet-address">Wallet Address</Label>
              <Input
                id="wallet-address"
                placeholder="Your crypto wallet address"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="crypto-type">Cryptocurrency Type</Label>
              <Select
                value={destinationDetails.cryptoType || 'BTC'}
                onValueChange={(value) =>
                  setDestinationDetails({ ...destinationDetails, cryptoType: value })
                }
              >
                <SelectTrigger id="crypto-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  <SelectItem value="USDT">Tether (USDT)</SelectItem>
                  <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      case 'WISE':
        return (
          <div className="grid gap-4">
            <div>
              <Label htmlFor="wise-email">Wise Email</Label>
              <Input
                id="wise-email"
                type="email"
                placeholder="your@email.com"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="legal-name">Legal Name</Label>
              <Input
                id="legal-name"
                placeholder="Your full legal name"
                value={destinationDetails.legalName || ''}
                onChange={(e) =>
                  setDestinationDetails({ ...destinationDetails, legalName: e.target.value })
                }
              />
            </div>
          </div>
        )
      case 'PAYONEER':
        return (
          <div>
            <Label htmlFor="payoneer-email">Payoneer Email</Label>
            <Input
              id="payoneer-email"
              type="email"
              placeholder="your@email.com"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
        )
      default:
        return null
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-8">
        <p>Please sign in to access your wallet.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-space-grotesk text-3xl font-bold">Withdrawals</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your withdrawal requests</p>
      </div>

      {/* Wallet Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {walletLoading ? (
              <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
            ) : (
              <>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(wallet?.balance.available || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ready for withdrawal</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {formatCurrency(wallet?.balance.pending || 0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Under review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(wallet?.earnings.total || 0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Request Withdrawal Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowDialog(true)}
          disabled={!wallet || wallet.balance.available <= 0}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Icons.plus className="mr-2 h-4 w-4" />
          Request Withdrawal
        </Button>
      </div>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>Your recent withdrawal requests and status</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawalsLoading ? (
            <div className="flex justify-center py-8">
              <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
          ) : withdrawals?.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No withdrawals yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals?.map((withdrawal: any) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="font-semibold">
                        {formatCurrency(withdrawal.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {WITHDRAWAL_METHODS.find(m => m.id === withdrawal.method)?.icon}
                          {withdrawal.method}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600 dark:text-gray-400">
                        {withdrawal.destination}
                      </TableCell>
                      <TableCell>
                        <Badge className={WITHDRAWAL_STATUS_COLORS[withdrawal.status]}>
                          {withdrawal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(new Date(withdrawal.createdAt))}</TableCell>
                      <TableCell className="text-right">
                        {withdrawal.status === 'REJECTED' && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            {withdrawal.rejectionReason}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Request Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Transfer your available balance to your preferred payment method
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Amount */}
            <div>
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0"
                />
                <div className="flex flex-col justify-center rounded bg-gray-100 px-3 dark:bg-gray-900">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Max:</p>
                  <p className="font-semibold">{formatCurrency(wallet?.balance.available || 0)}</p>
                </div>
              </div>
            </div>

            {/* Fee Information */}
            {amount && (
              <Card className="border-dashed bg-cyan-50 dark:bg-cyan-950">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Gross Amount:</span>
                      <span className="font-semibold">{formatCurrency(parseFloat(amount))}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Fee (2.5%):</span>
                      <span className="font-semibold">
                        -{formatCurrency((parseFloat(amount) || 0) * 0.025)}
                      </span>
                    </div>
                    <div className="border-t pt-2 font-semibold">
                      <div className="flex justify-between text-green-600">
                        <span>You'll Receive:</span>
                        <span>{formatCurrency((parseFloat(amount) || 0) * 0.975)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Method Selection */}
            <div>
              <Label>Withdrawal Method</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                {WITHDRAWAL_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMethod(m.id)
                      setDestination('')
                      setDestinationDetails({})
                    }}
                    className={`rounded-lg border-2 p-3 text-center transition-all ${
                      method === m.id
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950'
                        : 'border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <div className="text-2xl">{m.icon}</div>
                    <p className="mt-1 text-xs font-medium">{m.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Method-Specific Fields */}
            <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <Label>Destination Details</Label>
              {getMethodDetails(method)}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestWithdrawal}
              disabled={requestWithdrawalMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {requestWithdrawalMutation.isPending && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Request Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
