'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, TrendingUp, DollarSign, PieChart, BarChart3, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { BalanceSheetData, IncomeStatementData, TrialBalanceData } from '@/lib/types/accounting';

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('current_year');

  // Report data
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementData | null>(null);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceData | null>(null);

  const reportPeriods = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'current_quarter', label: 'Current Quarter' },
    { value: 'current_year', label: 'Current Year' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  useEffect(() => {
    generateReports();
  }, []);

  const generateReports = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls
      // Mock data for demonstration
      
      // Balance Sheet Data
      setBalanceSheet({
        assets: {
          current: {
            '1': { name: 'Cash and Cash Equivalents', balance: 25000 },
            '2': { name: 'Accounts Receivable', balance: 15000 },
            '3': { name: 'Inventory', balance: 45000 }
          },
          fixed: {
            '4': { name: 'Equipment', balance: 75000 },
            '5': { name: 'Furniture & Fixtures', balance: 12000 }
          },
          total: 172000
        },
        liabilities: {
          current: {
            '6': { name: 'Accounts Payable', balance: 18000 },
            '7': { name: 'Sales Tax Payable', balance: 3500 }
          },
          longTerm: {
            '8': { name: 'Long-term Debt', balance: 50000 }
          },
          total: 71500
        },
        equity: {
          accounts: {
            '9': { name: 'Owner Equity', balance: 80000 },
            '10': { name: 'Retained Earnings', balance: 20500 }
          },
          total: 100500
        },
        totalLiabilitiesAndEquity: 172000
      });

      // Income Statement Data
      setIncomeStatement({
        revenue: {
          accounts: {
            '11': { name: 'Sales Revenue', amount: 150000 },
            '12': { name: 'Service Revenue', amount: 25000 }
          },
          total: 175000
        },
        costOfGoodsSold: {
          accounts: {
            '13': { name: 'Cost of Goods Sold', amount: 95000 }
          },
          total: 95000
        },
        grossProfit: 80000,
        expenses: {
          accounts: {
            '14': { name: 'Salaries and Wages', amount: 35000 },
            '15': { name: 'Rent Expense', amount: 12000 },
            '16': { name: 'Utilities', amount: 3500 },
            '17': { name: 'Office Supplies', amount: 2000 }
          },
          total: 52500
        },
        netIncome: 27500
      });

      // Trial Balance Data
      setTrialBalance({
        accounts: [
          { accountCode: '1100', accountName: 'Cash and Cash Equivalents', debitBalance: 25000, creditBalance: 0 },
          { accountCode: '1120', accountName: 'Accounts Receivable', debitBalance: 15000, creditBalance: 0 },
          { accountCode: '1130', accountName: 'Inventory', debitBalance: 45000, creditBalance: 0 },
          { accountCode: '1200', accountName: 'Equipment', debitBalance: 75000, creditBalance: 0 },
          { accountCode: '2110', accountName: 'Accounts Payable', debitBalance: 0, creditBalance: 18000 },
          { accountCode: '2130', accountName: 'Sales Tax Payable', debitBalance: 0, creditBalance: 3500 },
          { accountCode: '3100', accountName: 'Owner Equity', debitBalance: 0, creditBalance: 80000 },
          { accountCode: '4100', accountName: 'Sales Revenue', debitBalance: 0, creditBalance: 150000 },
          { accountCode: '5100', accountName: 'Cost of Goods Sold', debitBalance: 95000, creditBalance: 0 },
          { accountCode: '6100', accountName: 'Salaries and Wages', debitBalance: 35000, creditBalance: 0 }
        ],
        totalDebits: 290000,
        totalCredits: 251500,
        isBalanced: false
      });

      toast.success('Reports generated successfully');
    } catch (error) {
      console.error('Error generating reports:', error);
      toast.error('Failed to generate reports');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    
    const now = new Date();
    let from: Date, to: Date;

    switch (period) {
      case 'current_month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'current_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        from = new Date(now.getFullYear(), quarter * 3, 1);
        to = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'current_year':
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), 11, 31);
        break;
      case 'last_month':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last_year':
        from = new Date(now.getFullYear() - 1, 0, 1);
        to = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return; // Custom range - let user set dates manually
    }

    if (period !== 'custom') {
      setDateFrom(from.toISOString().split('T')[0]);
      setDateTo(to.toISOString().split('T')[0]);
    }
  };

  const exportReport = (reportType: string) => {
    // TODO: Implement export functionality
    toast.success(`Exporting ${reportType} report...`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Financial Reports</h1>
          <p className="text-slate-600">Generate and view financial statements and reports</p>
        </div>
      </div>

      {/* Report Parameters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="period">Period</Label>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {reportPeriods.map(period => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                disabled={selectedPeriod !== 'custom'}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                disabled={selectedPeriod !== 'custom'}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={generateReports} disabled={loading} className="w-full">
                {loading ? 'Generating...' : 'Generate Reports'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold">{balanceSheet ? formatCurrency(balanceSheet.assets.total) : '...'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{incomeStatement ? formatCurrency(incomeStatement.revenue.total) : '...'}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Income</p>
                <p className="text-2xl font-bold">{incomeStatement ? formatCurrency(incomeStatement.netIncome) : '...'}</p>
              </div>
              <PieChart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gross Profit %</p>
                <p className="text-2xl font-bold">
                  {incomeStatement ? formatPercentage(incomeStatement.grossProfit, incomeStatement.revenue.total) : '...'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="balance-sheet" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
        </TabsList>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Balance Sheet</span>
                </CardTitle>
                <Button variant="outline" onClick={() => exportReport('balance-sheet')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {balanceSheet ? (
                <div className="space-y-6">
                  {/* Assets */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">ASSETS</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Current Assets</h4>
                        <Table>
                          <TableBody>
                            {Object.entries(balanceSheet.assets.current).map(([id, account]) => (
                              <TableRow key={id}>
                                <TableCell className="pl-4">{account.name}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(account.balance)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-medium">
                              <TableCell className="pl-4">Total Current Assets</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(Object.values(balanceSheet.assets.current).reduce((sum, acc) => sum + acc.balance, 0))}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Fixed Assets</h4>
                        <Table>
                          <TableBody>
                            {Object.entries(balanceSheet.assets.fixed).map(([id, account]) => (
                              <TableRow key={id}>
                                <TableCell className="pl-4">{account.name}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(account.balance)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-medium">
                              <TableCell className="pl-4">Total Fixed Assets</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(Object.values(balanceSheet.assets.fixed).reduce((sum, acc) => sum + acc.balance, 0))}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="border-t pt-2">
                        <Table>
                          <TableBody>
                            <TableRow className="font-bold text-lg">
                              <TableCell>TOTAL ASSETS</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(balanceSheet.assets.total)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">LIABILITIES & EQUITY</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Current Liabilities</h4>
                        <Table>
                          <TableBody>
                            {Object.entries(balanceSheet.liabilities.current).map(([id, account]) => (
                              <TableRow key={id}>
                                <TableCell className="pl-4">{account.name}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(account.balance)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Long-term Liabilities</h4>
                        <Table>
                          <TableBody>
                            {Object.entries(balanceSheet.liabilities.longTerm).map(([id, account]) => (
                              <TableRow key={id}>
                                <TableCell className="pl-4">{account.name}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(account.balance)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-medium">
                              <TableCell className="pl-4">Total Liabilities</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(balanceSheet.liabilities.total)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Equity</h4>
                        <Table>
                          <TableBody>
                            {Object.entries(balanceSheet.equity.accounts).map(([id, account]) => (
                              <TableRow key={id}>
                                <TableCell className="pl-4">{account.name}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(account.balance)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-medium">
                              <TableCell className="pl-4">Total Equity</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(balanceSheet.equity.total)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="border-t pt-2">
                        <Table>
                          <TableBody>
                            <TableRow className="font-bold text-lg">
                              <TableCell>TOTAL LIABILITIES & EQUITY</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Generate reports to view balance sheet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Statement */}
        <TabsContent value="income-statement">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Income Statement</span>
                </CardTitle>
                <Button variant="outline" onClick={() => exportReport('income-statement')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {incomeStatement ? (
                <div className="space-y-6">
                  {/* Revenue */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">REVENUE</h3>
                    <Table>
                      <TableBody>
                        {Object.entries(incomeStatement.revenue.accounts).map(([id, account]) => (
                          <TableRow key={id}>
                            <TableCell className="pl-4">{account.name}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(account.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-medium border-t">
                          <TableCell className="pl-4">Total Revenue</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(incomeStatement.revenue.total)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Cost of Goods Sold */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">COST OF GOODS SOLD</h3>
                    <Table>
                      <TableBody>
                        {Object.entries(incomeStatement.costOfGoodsSold.accounts).map(([id, account]) => (
                          <TableRow key={id}>
                            <TableCell className="pl-4">{account.name}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(account.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-medium border-t">
                          <TableCell className="pl-4">Total Cost of Goods Sold</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(incomeStatement.costOfGoodsSold.total)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Gross Profit */}
                  <div className="border-t pt-4">
                    <Table>
                      <TableBody>
                        <TableRow className="font-bold text-lg">
                          <TableCell>GROSS PROFIT</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(incomeStatement.grossProfit)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Operating Expenses */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">OPERATING EXPENSES</h3>
                    <Table>
                      <TableBody>
                        {Object.entries(incomeStatement.expenses.accounts).map(([id, account]) => (
                          <TableRow key={id}>
                            <TableCell className="pl-4">{account.name}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(account.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-medium border-t">
                          <TableCell className="pl-4">Total Operating Expenses</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(incomeStatement.expenses.total)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Net Income */}
                  <div className="border-t pt-4">
                    <Table>
                      <TableBody>
                        <TableRow className="font-bold text-xl">
                          <TableCell>NET INCOME</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(incomeStatement.netIncome)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Generate reports to view income statement
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial Balance */}
        <TabsContent value="trial-balance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Trial Balance</span>
                </CardTitle>
                <Button variant="outline" onClick={() => exportReport('trial-balance')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {trialBalance ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Account Balances</h3>
                    <Badge variant={trialBalance.isBalanced ? 'default' : 'destructive'}>
                      {trialBalance.isBalanced ? 'Balanced' : 'Out of Balance'}
                    </Badge>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trialBalance.accounts.map((account, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{account.accountCode}</TableCell>
                          <TableCell>{account.accountName}</TableCell>
                          <TableCell className="text-right font-mono">
                            {account.debitBalance > 0 ? formatCurrency(account.debitBalance) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {account.creditBalance > 0 ? formatCurrency(account.creditBalance) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell colSpan={2}>TOTALS</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(trialBalance.totalDebits)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(trialBalance.totalCredits)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  
                  {!trialBalance.isBalanced && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 font-medium">
                        Trial Balance is out of balance by {formatCurrency(Math.abs(trialBalance.totalDebits - trialBalance.totalCredits))}
                      </p>
                      <p className="text-red-600 text-sm mt-1">
                        Please review journal entries for errors.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Generate reports to view trial balance
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}