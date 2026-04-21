'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/hooks/useToast'
import { formatCurrency } from '@/lib/utils'

export default function WithdrawPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('bank')
  const [selectedBank, setSelectedBank] = useState<string>('')
  const [selectedPayPal, setSelectedPayPal] = useState<string>('')
  const [selectedCrypto, setSelectedCrypto] = useState<string>('')
  const [amount, setAmount] = useState<number>(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [withdrawalData, setWithdrawalData] = useState<any>(null)
  const [showAddBankDialog, setShowAddBankDialog] = useState(false)
  const [showAddPayPalDialog, setShowAddPayPalDialog] = useState(false)
  const [showAddCryptoDialog, setShowAddCryptoDialog] = useState(false)

  // Form states for new accounts
  const [bankForm, setBankForm] = useState({
    accountHolder: session?.user?.legalFirstName 
      ? `${session.user.legalFirstName} ${session.user.legalLastName}`
      : '',
    bankName: '',
    accountNumber: '',
    accountType: 'CHECKING',
    country: session?.user?.country || 'US',
  })

  const [paypalForm, setPaypalForm] = useState({
    email: session?.user?.email || '',
  })

  const [cryptoForm, setCryptoForm] = useState({
    address: '',
    network: 'ETH',
    label: '',
  })

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await fetch('/api/wallet')
      return res.json()
    },
  })

  const { data: kycStatus } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: async () => {
      const res = await fetch('/api/user/kyc/status')
      return res.json()
    },
  })

  const { data: bankAccounts, isLoading: banksLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/wallet/bank-accounts')
      return res.json()
    },
  })

  const { data: paypalAccounts } = useQuery({
    queryKey: ['paypal-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/wallet/paypal-accounts')
      return res.json()
    },
  })

  const { data: cryptoWallets } = useQuery({
    queryKey: ['crypto-wallets'],
    queryFn: async () => {
      const res = await fetch('/api/wallet/crypto-wallets')
      return res.json()
    },
  })

  const addBankMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/wallet/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add bank account')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
      toast({ title: 'Success', description: 'Bank account added' })
      setShowAddBankDialog(false)
      setBankForm({
        accountHolder: '',
        bankName: '',
        accountNumber: '',
        accountType: 'CHECKING',
        country: 'US',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add bank account',
        variant: 'destructive',
      })
    },
  })

  const addPayPalMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/wallet/paypal-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add PayPal account')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paypal-accounts'] })
      toast({ title: 'Success', description: 'PayPal account added' })
      setShowAddPayPalDialog(false)
      setPaypalForm({ email: '' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add PayPal account',
        variant: 'destructive',
      })
    },
  })

  const addCryptoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/wallet/crypto-wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add crypto wallet')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crypto-wallets'] })
      toast({ title: 'Success', description: 'Crypto wallet added' })
      setShowAddCryptoDialog(false)
      setCryptoForm({ address: '', network: 'ETH', label: '' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add crypto wallet',
        variant: 'destructive',
      })
    },
  })

  const requestWithdrawalMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      toast({
        title: 'Withdrawal Requested',
        description: `Your withdrawal of ${formatCurrency(data.amount)} has been submitted for review.`,
      })
      setShowConfirmDialog(false)
      setAmount(0)
      router.push('/wallet')
    },
    onError: (error: Error) => {
      toast({
        title: 'Withdrawal Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleWithdrawal = () => {
    let destination = ''

    if (activeTab === 'bank') {
      if (!selectedBank) {
        toast({ title: 'Error', description: 'Please select a bank account', variant: 'destructive' })
        return
      }
      const bank = bankAccounts?.find((b: any) => b.id === selectedBank)
      destination = bank?.accountNumber
    } else if (activeTab === 'paypal') {
      if (!selectedPayPal) {
        toast({ title: 'Error', description: 'Please select a PayPal account', variant: 'destructive' })
        return
      }
      const paypal = paypalAccounts?.find((p: any) => p.id === selectedPayPal)
      destination = paypal?.email
    } else if (activeTab === 'crypto') {
      if (!selectedCrypto) {
        toast({ title: 'Error', description: 'Please select a crypto wallet', variant: 'destructive' })
        return
      }
      const crypto = cryptoWallets?.find((c: any) => c.id === selectedCrypto)
      destination = crypto?.address
    }

    const withdrawal = {
      amount,
      method: activeTab === 'bank' ? 'BANK_TRANSFER' : activeTab === 'paypal' ? 'PAYPAL' : 'CRYPTO',
      destination,
      bankAccountId: activeTab === 'bank' ? selectedBank : undefined,
      paypalAccountId: activeTab === 'paypal' ? selectedPayPal : undefined,
      cryptoWalletId: activeTab === 'crypto' ? selectedCrypto : undefined,
    }

    setWithdrawalData(withdrawal)
    setShowConfirmDialog(true)
  }

  if (kycStatus?.status !== 'APPROVED') {
    return (
      <div className="container mx-auto max-w-2xl space-y-6 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>KYC Required</CardTitle>
            <CardDescription>
              You must complete identity verification before making withdrawals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Icons.alertTriangle className="h-4 w-4" />
              <AlertTitle>Verification Required</AlertTitle>
              <AlertDescription>
                To protect your funds, we require identity verification before processing withdrawals.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button asChild>
                <Link href="/profile/verification">Complete KYC Verification</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const availableBalance = wallet?.availableBalance || 0
  const feePercentage = 2.5
  const fee = (amount * feePercentage) / 100
  const netAmount = amount - fee

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-space-grotesk text-3xl font-bold">Withdraw Funds</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Withdraw your earnings to your bank, PayPal, or crypto wallet
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Details</CardTitle>
              <CardDescription>
                Available balance: {formatCurrency(availableBalance)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="10"
                    max={Math.min(availableBalance, 10000)}
                    className="pl-8"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Withdrawal Method */}
              <div className="space-y-4">
                <Label>Withdrawal Method</Label>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bank">Bank</TabsTrigger>
                    <TabsTrigger value="paypal">PayPal</TabsTrigger>
                    <TabsTrigger value="crypto">Crypto</TabsTrigger>
                  </TabsList>

                  {/* Bank Transfer */}
                  <TabsContent value="bank" className="space-y-3 pt-4">
                    {bankAccounts?.length > 0 ? (
                      <>
                        <div className="space-y-2">
                          {bankAccounts.map((bank: any) => (
                            <label key={bank.id} className={`flex cursor-pointer items-center rounded-lg border p-3 ${
                              selectedBank === bank.id ? 'border-cyan-500 bg-cyan-50' : ''
                            }`}>
                              <input
                                type="radio"
                                name="bank"
                                value={bank.id}
                                checked={selectedBank === bank.id}
                                onChange={(e) => setSelectedBank(e.target.value)}
                                className="mr-3"
                              />
                              <div>
                                <p className="font-medium">{bank.bankName}</p>
                                <p className="text-sm text-gray-500">•••• {bank.accountNumber.slice(-4)}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowAddBankDialog(true)}
                        >
                          <Icons.plus className="mr-2 h-4 w-4" />
                          Add New Bank
                        </Button>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <Button onClick={() => setShowAddBankDialog(true)}>
                          Add Bank Account
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* PayPal */}
                  <TabsContent value="paypal" className="space-y-3 pt-4">
                    {paypalAccounts?.length > 0 ? (
                      <>
                        <div className="space-y-2">
                          {paypalAccounts.map((paypal: any) => (
                            <label key={paypal.id} className={`flex cursor-pointer items-center rounded-lg border p-3 ${
                              selectedPayPal === paypal.id ? 'border-cyan-500 bg-cyan-50' : ''
                            }`}>
                              <input
                                type="radio"
                                name="paypal"
                                value={paypal.id}
                                checked={selectedPayPal === paypal.id}
                                onChange={(e) => setSelectedPayPal(e.target.value)}
                                className="mr-3"
                              />
                              <p className="font-medium">{paypal.email}</p>
                            </label>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowAddPayPalDialog(true)}
                        >
                          <Icons.plus className="mr-2 h-4 w-4" />
                          Add PayPal
                        </Button>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <Button onClick={() => setShowAddPayPalDialog(true)}>
                          Add PayPal Account
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Crypto */}
                  <TabsContent value="crypto" className="space-y-3 pt-4">
                    {cryptoWallets?.length > 0 ? (
                      <>
                        <div className="space-y-2">
                          {cryptoWallets.map((crypto: any) => (
                            <label key={crypto.id} className={`flex cursor-pointer items-center rounded-lg border p-3 ${
                              selectedCrypto === crypto.id ? 'border-cyan-500 bg-cyan-50' : ''
                            }`}>
                              <input
                                type="radio"
                                name="crypto"
                                value={crypto.id}
                                checked={selectedCrypto === crypto.id}
                                onChange={(e) => setSelectedCrypto(e.target.value)}
                                className="mr-3"
                              />
                              <div>
                                <p className="font-medium">{crypto.network}</p>
                                <p className="font-mono text-sm text-gray-500">
                                  {crypto.address.slice(0, 10)}...
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowAddCryptoDialog(true)}
                        >
                          <Icons.plus className="mr-2 h-4 w-4" />
                          Add Crypto Wallet
                        </Button>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <Button onClick={() => setShowAddCryptoDialog(true)}>
                          Add Crypto Wallet
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <Button
                className="w-full"
                onClick={handleWithdrawal}
                disabled={
                  amount < 10 ||
                  amount > availableBalance ||
                  (activeTab === 'bank' && !selectedBank) ||
                  (activeTab === 'paypal' && !selectedPayPal) ||
                  (activeTab === 'crypto' && !selectedCrypto)
                }
              >
                Review Withdrawal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fee (2.5%)</span>
                <span className="text-amber-500">-{formatCurrency(fee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">You'll Receive</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(netAmount)}</span>
              </div>
              <Alert className="mt-4">
                <Icons.clock className="h-4 w-4" />
                <AlertTitle>Processing Time</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  Bank: 1-3 days • PayPal: 24 hours • Crypto: 1-6 hours
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fee</span>
                  <span>{formatCurrency(fee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(netAmount)}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => requestWithdrawalMutation.mutate(withdrawalData)}
              disabled={requestWithdrawalMutation.isPending}
            >
              {requestWithdrawalMutation.isPending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bank Dialog */}
      <Dialog open={showAddBankDialog} onOpenChange={setShowAddBankDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Account Holder</Label>
              <Input
                value={bankForm.accountHolder}
                onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select
                value={bankForm.accountType}
                onValueChange={(value) => setBankForm({ ...bankForm, accountType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKING">Checking</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddBankDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => addBankMutation.mutate(bankForm)}
              disabled={addBankMutation.isPending}
            >
              Add Bank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add PayPal Dialog */}
      <Dialog open={showAddPayPalDialog} onOpenChange={setShowAddPayPalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add PayPal Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>PayPal Email</Label>
              <Input
                type="email"
                value={paypalForm.email}
                onChange={(e) => setPaypalForm({ ...paypalForm, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddPayPalDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => addPayPalMutation.mutate(paypalForm)}
              disabled={addPayPalMutation.isPending}
            >
              Add PayPal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Crypto Dialog */}
      <Dialog open={showAddCryptoDialog} onOpenChange={setShowAddCryptoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Crypto Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Network</Label>
              <Select
                value={cryptoForm.network}
                onValueChange={(value) => setCryptoForm({ ...cryptoForm, network: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="USDT">Tether (USDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <Input
                value={cryptoForm.address}
                onChange={(e) => setCryptoForm({ ...cryptoForm, address: e.target.value })}
                placeholder="0x..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddCryptoDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => addCryptoMutation.mutate(cryptoForm)}
              disabled={addCryptoMutation.isPending}
            >
              Add Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
