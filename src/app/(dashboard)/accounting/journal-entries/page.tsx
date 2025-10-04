'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Search, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { JournalEntry, JournalEntryLine } from '@/lib/types/accounting';

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    description: '',
    referenceNumber: '',
    notes: '',
    lines: [
      { accountId: 0, description: '', debitAmount: 0, creditAmount: 0 },
      { accountId: 0, description: '', debitAmount: 0, creditAmount: 0 }
    ]
  });

  // Mock chart of accounts for dropdowns
  const chartOfAccounts = [
    { id: 1, accountCode: '1100', accountName: 'Cash and Cash Equivalents' },
    { id: 2, accountCode: '1120', accountName: 'Accounts Receivable' },
    { id: 3, accountCode: '2110', accountName: 'Accounts Payable' },
    { id: 4, accountCode: '4100', accountName: 'Sales Revenue' },
    { id: 5, accountCode: '5100', accountName: 'Cost of Goods Sold' },
    { id: 6, accountCode: '6100', accountName: 'Salaries and Wages' }
  ];

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // Mock data
      setEntries([
        {
          id: 1,
          storeId: 1,
          entryNumber: 'JE-001',
          entryDate: '2024-01-15',
          description: 'Opening balance entry',
          referenceType: 'opening_balance',
          status: 'posted',
          totalDebits: 5000,
          totalCredits: 5000,
          lines: [
            {
              id: 1,
              journalEntryId: 1,
              accountId: 1,
              description: 'Opening cash balance',
              debitAmount: 5000,
              creditAmount: 0,
              lineOrder: 1,
              createdAt: new Date().toISOString()
            },
            {
              id: 2,
              journalEntryId: 1,
              accountId: 3,
              description: 'Owner equity',
              debitAmount: 0,
              creditAmount: 5000,
              lineOrder: 2,
              createdAt: new Date().toISOString()
            }
          ],
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        }
      ]);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast.error('Failed to fetch journal entries');
    } finally {
      setLoading(false);
    }
  };

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { accountId: 0, description: '', debitAmount: 0, creditAmount: 0 }]
    }));
  };

  const updateLine = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
  };

  const removeLine = (index: number) => {
    if (formData.lines.length > 2) {
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotals = () => {
    const totalDebits = formData.lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredits = formData.lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
    return { totalDebits, totalCredits };
  };

  const handleCreateEntry = async () => {
    try {
      const { totalDebits, totalCredits } = calculateTotals();
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        toast.error('Debits and credits must balance');
        return;
      }

      if (totalDebits === 0) {
        toast.error('Journal entry must have non-zero amounts');
        return;
      }

      // TODO: Replace with actual API call
      console.log('Creating journal entry:', formData);
      toast.success('Journal entry created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchEntries();
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast.error('Failed to create journal entry');
    }
  };

  const resetForm = () => {
    setFormData({
      entryDate: new Date().toISOString().split('T')[0],
      description: '',
      referenceNumber: '',
      notes: '',
      lines: [
        { accountId: 0, description: '', debitAmount: 0, creditAmount: 0 },
        { accountId: 0, description: '', debitAmount: 0, creditAmount: 0 }
      ]
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      posted: 'bg-green-100 text-green-800',
      reversed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.entryNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const { totalDebits, totalCredits } = calculateTotals();
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Journal Entries</h1>
          <p className="text-slate-600">Manage double-entry bookkeeping transactions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Journal Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entryDate">Entry Date</Label>
                  <Input
                    id="entryDate"
                    type="date"
                    value={formData.entryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, entryDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    placeholder="Optional reference"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Entry description"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Journal Lines</Label>
                  <Button type="button" onClick={addLine} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Label>Account</Label>
                        <Select 
                          value={line.accountId.toString()} 
                          onValueChange={(value) => updateLine(index, 'accountId', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {chartOfAccounts.map(account => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.accountCode} - {account.accountName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Label>Description</Label>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          placeholder="Line description"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Debit</Label>
                        <NumericInput
                          value={line.debitAmount?.toString() || ''}
                          onValueChange={(value) => updateLine(index, 'debitAmount', value || 0)}
                          placeholder="0.00"
                          allowDecimals={true}
                          maxDecimals={4}
                          allowNegative={false}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Credit</Label>
                        <NumericInput
                          value={line.creditAmount?.toString() || ''}
                          onValueChange={(value) => updateLine(index, 'creditAmount', value || 0)}
                          placeholder="0.00"
                          allowDecimals={true}
                          maxDecimals={4}
                          allowNegative={false}
                        />
                      </div>
                      <div className="col-span-1">
                        {formData.lines.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Total Debits: {formatCurrency(totalDebits)}</strong>
                    </div>
                    <div>
                      <strong>Total Credits: {formatCurrency(totalCredits)}</strong>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge variant={isBalanced ? 'default' : 'destructive'}>
                      {isBalanced ? 'Balanced' : `Out of balance by ${formatCurrency(Math.abs(totalDebits - totalCredits))}`}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEntry} disabled={!isBalanced}>
                  Create Entry
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
                  placeholder="Search journal entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="reversed">Reversed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Journal Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Journal Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading journal entries...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Debits</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                    <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{entry.description}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {entry.referenceNumber || '-'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(entry.totalDebits)}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(entry.totalCredits)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setViewingEntry(entry)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {entry.status === 'draft' && (
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
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

      {/* View Entry Dialog */}
      <Dialog open={!!viewingEntry} onOpenChange={() => setViewingEntry(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Journal Entry Details</DialogTitle>
          </DialogHeader>
          {viewingEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Entry Number</Label>
                  <div className="font-mono">{viewingEntry.entryNumber}</div>
                </div>
                <div>
                  <Label>Date</Label>
                  <div>{new Date(viewingEntry.entryDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label>Description</Label>
                  <div>{viewingEntry.description}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(viewingEntry.status)}>
                    {viewingEntry.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Journal Lines</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Debit</TableHead>
                      <TableHead>Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingEntry.lines.map(line => {
                      const account = chartOfAccounts.find(acc => acc.id === line.accountId);
                      return (
                        <TableRow key={line.id}>
                          <TableCell>
                            {account ? `${account.accountCode} - ${account.accountName}` : 'Unknown Account'}
                          </TableCell>
                          <TableCell>{line.description}</TableCell>
                          <TableCell className="font-mono">
                            {line.debitAmount > 0 ? formatCurrency(line.debitAmount) : '-'}
                          </TableCell>
                          <TableCell className="font-mono">
                            {line.creditAmount > 0 ? formatCurrency(line.creditAmount) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <strong>Total Debits: {formatCurrency(viewingEntry.totalDebits)}</strong>
                </div>
                <div>
                  <strong>Total Credits: {formatCurrency(viewingEntry.totalCredits)}</strong>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}