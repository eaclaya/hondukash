'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ChartOfAccount } from '@/lib/types/accounting';

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    accountCode: '',
    accountName: '',
    accountType: 'asset' as const,
    accountSubType: 'current_asset' as const,
    parentAccountId: '',
    normalBalance: 'debit' as const,
    description: ''
  });

  const accountTypes = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' }
  ];

  const accountSubTypes = {
    asset: [
      { value: 'current_asset', label: 'Current Asset' },
      { value: 'non_current_asset', label: 'Non-Current Asset' },
      { value: 'cash', label: 'Cash' },
      { value: 'accounts_receivable', label: 'Accounts Receivable' },
      { value: 'inventory', label: 'Inventory' },
      { value: 'prepaid_expenses', label: 'Prepaid Expenses' },
      { value: 'fixed_assets', label: 'Fixed Assets' },
      { value: 'intangible_assets', label: 'Intangible Assets' }
    ],
    liability: [
      { value: 'current_liability', label: 'Current Liability' },
      { value: 'non_current_liability', label: 'Non-Current Liability' },
      { value: 'accounts_payable', label: 'Accounts Payable' },
      { value: 'accrued_expenses', label: 'Accrued Expenses' },
      { value: 'notes_payable', label: 'Notes Payable' },
      { value: 'long_term_debt', label: 'Long-term Debt' }
    ],
    equity: [
      { value: 'owner_equity', label: 'Owner Equity' },
      { value: 'retained_earnings', label: 'Retained Earnings' },
      { value: 'common_stock', label: 'Common Stock' },
      { value: 'additional_paid_in_capital', label: 'Additional Paid-in Capital' }
    ],
    revenue: [
      { value: 'operating_revenue', label: 'Operating Revenue' },
      { value: 'non_operating_revenue', label: 'Non-Operating Revenue' },
      { value: 'sales_revenue', label: 'Sales Revenue' },
      { value: 'service_revenue', label: 'Service Revenue' },
      { value: 'other_income', label: 'Other Income' }
    ],
    expense: [
      { value: 'operating_expense', label: 'Operating Expense' },
      { value: 'cost_of_goods_sold', label: 'Cost of Goods Sold' },
      { value: 'administrative_expense', label: 'Administrative Expense' },
      { value: 'selling_expense', label: 'Selling Expense' },
      { value: 'financial_expense', label: 'Financial Expense' },
      { value: 'other_expense', label: 'Other Expense' }
    ]
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tenant/chart-of-accounts?activeOnly=true');
      
      if (response.ok) {
        const accounts = await response.json();
        setAccounts(accounts);
      } else {
        console.error('Failed to fetch chart of accounts:', response.statusText);
        toast.error('Failed to fetch chart of accounts');
        setAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to fetch chart of accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      // Validate required fields
      if (!formData.accountCode || !formData.accountName || !formData.accountType || !formData.accountSubType || !formData.normalBalance) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await fetch('/api/tenant/chart-of-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Account created successfully');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchAccounts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account');
    }
  };

  const resetForm = () => {
    setFormData({
      accountCode: '',
      accountName: '',
      accountType: 'asset',
      accountSubType: 'current_asset',
      parentAccountId: '',
      normalBalance: 'debit',
      description: ''
    });
    setEditingAccount(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      asset: 'bg-green-100 text-green-800',
      liability: 'bg-red-100 text-red-800',
      equity: 'bg-blue-100 text-blue-800',
      revenue: 'bg-purple-100 text-purple-800',
      expense: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.accountCode.includes(searchTerm);
    const matchesType = filterType === 'all' || account.accountType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Chart of Accounts</h1>
          <p className="text-slate-600">Manage your accounting structure</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="accountCode">Account Code</Label>
                <Input
                  id="accountCode"
                  value={formData.accountCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountCode: e.target.value }))}
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder="e.g., Cash and Cash Equivalents"
                />
              </div>
              <div>
                <Label htmlFor="accountType">Account Type</Label>
                <Select 
                  value={formData.accountType} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, accountType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="accountSubType">Account Sub-Type</Label>
                <Select 
                  value={formData.accountSubType} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, accountSubType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountSubTypes[formData.accountType]?.map(subType => (
                      <SelectItem key={subType.value} value={subType.value}>
                        {subType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Account description"
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAccount}>
                  Create Account
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {accountTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading accounts...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sub-Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map(account => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono">{account.accountCode}</TableCell>
                    <TableCell className="font-medium">{account.accountName}</TableCell>
                    <TableCell>
                      <Badge className={getAccountTypeColor(account.accountType)}>
                        {account.accountType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {account.accountSubType.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(account.currentBalance)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.isActive ? 'default' : 'secondary'}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!account.isSystemAccount && (
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}