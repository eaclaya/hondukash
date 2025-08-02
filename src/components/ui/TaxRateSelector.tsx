'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TaxRate, TaxRateService } from '@/lib/services/taxRateService';

interface TaxRateSelectorProps {
  value?: number;
  onValueChange: (taxRateId: number | undefined, taxRate: number) => void;
  disabled?: boolean;
  allowNone?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function TaxRateSelector({
  value,
  onValueChange,
  disabled = false,
  allowNone = true,
  label = "Tax Rate",
  placeholder = "Select tax rate",
  className = ""
}: TaxRateSelectorProps) {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTaxRates();
  }, []);

  const loadTaxRates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get domain from current URL
      const domain = window.location.hostname.split('.')[0];
      const result = await TaxRateService.getAllTaxRates(domain);
      
      if (result.success && result.data) {
        setTaxRates(result.data);
      } else {
        setError(result.error || 'Failed to load tax rates');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === 'none') {
      onValueChange(undefined, 0);
    } else {
      const taxRateId = parseInt(selectedValue);
      const selectedTaxRate = taxRates.find(tr => tr.id === taxRateId);
      onValueChange(taxRateId, selectedTaxRate?.rate || 0);
    }
  };

  const formatTaxRate = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={className}>
        <Label>{label}</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Label>{label}</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Error loading tax rates" />
          </SelectTrigger>
        </Select>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Label>{label}</Label>
      <Select
        value={value ? value.toString() : 'none'}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowNone && (
            <SelectItem value="none">
              <div className="flex justify-between items-center w-full">
                <span>No Tax</span>
                <span className="text-muted-foreground text-xs">0%</span>
              </div>
            </SelectItem>
          )}
          {taxRates.map((taxRate) => (
            <SelectItem key={taxRate.id} value={taxRate.id.toString()}>
              <div className="flex justify-between items-center w-full">
                <span>{taxRate.name}</span>
                <span className="text-muted-foreground text-xs ml-2">
                  {formatTaxRate(taxRate.rate)}
                  {taxRate.isDefault && ' (Default)'}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <p className="text-xs text-muted-foreground mt-1">
          Selected: {taxRates.find(tr => tr.id === value)?.name || 'Unknown'} - {
            formatTaxRate(taxRates.find(tr => tr.id === value)?.rate || 0)
          }
        </p>
      )}
    </div>
  );
}