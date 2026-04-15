'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

async function fetchWallet() {
  const res = await fetch('/api/wallet')
  if (!res.ok) throw new Error('Failed to fetch wallet')
  return res.json()
}

async function fetchTransactions() {
  const res = await fetch('/api/wallet/transactions')
  if (!res.ok) throw new Error('Failed to fetch transactions')
  return res.json()
}

export default function WalletPage() {
  const [depositDialog, setDepositDialog] = useState(false)
  const [withdrawDialog, setWithdrawDialog] = useState(false)
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | 'crypto'>('stripe')

  const { toast } = useToast()

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: fetchTransactions,
  })

  const handleDeposit = async () => {
    if (!amount) {
      toast({
        title: 'Error',
        description: 'Please enter an amount',
        variant: 'destructive',
      })
      return
    }

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), method: selectedMethod }),
      })

      if (!res.ok) throw new Error('Deposit failed')

      toast({
        title: 'Success',
        description: 'Deposit initiated successfully',
      })
      setDepositDialog(false)
      setAmount('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate deposit',
        variant: 'destructive',
      })
    }
  }

  const handleWithdraw = async () => {
    if (!amount) {
      toast({
        title: 'Error',
        description: 'Please enter an amount',
        variant: 'destructive',
      })
      return
    }

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), method: selectedMethod }),
      })

      if (!res.ok) throw new Error('Withdrawal failed')

      toast({
        title: 'Success',
        description: 'Withdrawal initiated successfully',
      })
      setWithdrawDialog(false)
      setAmount('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate withdrawal',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-space-grotesk text-3xl font-bold">Wallet</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your funds and transactions</p>
      </div>

      {/* Wallet Balance */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-cyan-200 bg-cyan-50 dark:border-cyan-900 dark:bg-cyan-950">
          <CardHeader>
            <CardTitle className="text-cyan-900 dark:text-cyan-100">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {walletLoading ? (
              <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
            ) : (
              <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(wallet?.balance || 0)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(wallet?.available || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(wallet?.pending || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={() => setDepositDialog(true)} className="bg-cyan-500 hover:bg-cyan-600">
          <Icons.plus className="mr-2 h-4 w-4" />
          Deposit
        </Button>
        <Button onClick={() => setWithdrawDialog(true)} variant="outline">
          <Icons.download className="mr-2 h-4 w-4" />
          Withdraw
        </Button>
      </div>

      {/* Transactions */}
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-4">
          {transactionsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : transactions?.length > 0 ? (
            transactions.map((tx: any) => (
              <Card key={tx.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`rounded-full p-2 ${tx.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {tx.type === 'deposit' ? (
                          <Icons.arrowRight className={`h-4 w-4 ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`} />
                        ) : (
                          <Icons.arrowLeft className={`h-4 w-4 ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{tx.type}</p>
                        <p className="text-sm text-gray-500">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </p>
                      <Badge variant="outline">{tx.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Icons.wallet className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">No transactions yet</h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="deposits" className="mt-6">
          {transactions?.filter((tx: any) => tx.type === 'deposit').length > 0 ? (
            <div className="space-y-4">
              {transactions
                .filter((tx: any) => tx.type === 'deposit')
                .map((tx: any) => (
                  <Card key={tx.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tx.method}</p>
                          <p className="text-sm text-gray-500">{formatDateTime(tx.createdAt)}</p>
                        </div>
                        <p className="text-lg font-bold text-green-600">+{formatCurrency(tx.amount)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No deposits yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-6">
          {transactions?.filter((tx: any) => tx.type === 'withdrawal').length > 0 ? (
            <div className="space-y-4">
              {transactions
                .filter((tx: any) => tx.type === 'withdrawal')
                .map((tx: any) => (
                  <Card key={tx.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tx.method}</p>
                          <p className="text-sm text-gray-500">{formatDateTime(tx.createdAt)}</p>
                        </div>
                        <p className="text-lg font-bold text-red-600">-{formatCurrency(tx.amount)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No withdrawals yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Deposit Dialog */}
      <Dialog open={depositDialog} onOpenChange={setDepositDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit Funds</DialogTitle>
            <DialogDescription>Choose a payment method and enter the amount</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block text-sm font-medium">Payment Method</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'stripe', label: 'Card' },
                  { id: 'paypal', label: 'PayPal' },
                  { id: 'crypto', label: 'Crypto' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id as any)}
                    className={`rounded-lg border-2 py-2 font-medium transition ${
                      selectedMethod === method.id
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="deposit-amount">Amount</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
              />
            </div>
            <Button onClick={handleDeposit} className="w-full bg-cyan-500 hover:bg-cyan-600">
              Continue to Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>Choose where to withdraw your funds</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block text-sm font-medium">Withdrawal Method</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'stripe', label: 'Bank' },
                  { id: 'paypal', label: 'PayPal' },
                  { id: 'crypto', label: 'Crypto' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id as any)}
                    className={`rounded-lg border-2 py-2 font-medium transition ${
                      selectedMethod === method.id
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="withdraw-amount">Amount</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
              />
            </div>
            <Button onClick={handleWithdraw} className="w-full bg-cyan-500 hover:bg-cyan-600">
              Withdraw
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
