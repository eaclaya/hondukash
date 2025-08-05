import { InvoiceNumberService } from '../invoiceNumberService';

// Mock data for testing
const mockStoreDataSimple = {
  invoicePrefix: 'INV',
  invoiceCounter: 5,
  invoiceSequence: null
};

const mockStoreDataSequence = {
  invoicePrefix: 'INV',
  invoiceCounter: 5,
  invoiceSequence: JSON.stringify({
    enabled: true,
    sequence_start: 'SQ-2025-001',
    sequence_end: 'SQ-2025-999',
    limit_date: '2025-12-31'
  })
};

const mockStoreDataExpiredSequence = {
  invoicePrefix: 'INV',
  invoiceCounter: 5,
  invoiceSequence: JSON.stringify({
    enabled: true,
    sequence_start: 'SQ-2024-001',
    sequence_end: 'SQ-2024-999',
    limit_date: '2024-12-31'
  })
};

// No database mocks needed - using counter-based approach

describe('InvoiceNumberService', () => {
  describe('generateNextInvoiceNumber', () => {
    it('should generate simple counter-based invoice number', () => {
      const result = InvoiceNumberService.generateNextInvoiceNumber(mockStoreDataSimple);

      expect(result.success).toBe(true);
      expect(result.invoiceNumber).toBe('INV000005');
    });

    it('should generate sequence-based invoice number (counter = 0)', () => {
      const storeData = { ...mockStoreDataSequence, invoiceCounter: 0 };
      const result = InvoiceNumberService.generateNextInvoiceNumber(storeData);

      expect(result.success).toBe(true);
      expect(result.invoiceNumber).toBe('SQ-2025-001');
    });

    it('should generate sequence-based invoice number (counter = 50)', () => {
      const storeData = { ...mockStoreDataSequence, invoiceCounter: 50 };
      const result = InvoiceNumberService.generateNextInvoiceNumber(storeData);

      expect(result.success).toBe(true);
      expect(result.invoiceNumber).toBe('SQ-2025-051');
    });

    it('should fail for expired sequence', () => {
      const result = InvoiceNumberService.generateNextInvoiceNumber(mockStoreDataExpiredSequence);

      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('isSequenceEnabled', () => {
    it('should return true for enabled sequence', () => {
      const result = InvoiceNumberService.isSequenceEnabled(mockStoreDataSequence.invoiceSequence);
      expect(result).toBe(true);
    });

    it('should return false for null sequence', () => {
      const result = InvoiceNumberService.isSequenceEnabled(null);
      expect(result).toBe(false);
    });

    it('should return false for disabled sequence', () => {
      const disabledSequence = JSON.stringify({ enabled: false });
      const result = InvoiceNumberService.isSequenceEnabled(disabledSequence);
      expect(result).toBe(false);
    });
  });

  describe('validateSequenceConfig', () => {
    it('should validate correct sequence config', () => {
      const config = {
        enabled: true,
        sequence_start: 'INV-001',
        sequence_end: 'INV-999'
      };

      const result = InvoiceNumberService.validateSequenceConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should reject config with mismatched prefixes', () => {
      const config = {
        enabled: true,
        sequence_start: 'INV-001',
        sequence_end: 'SQ-999'
      };

      const result = InvoiceNumberService.validateSequenceConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('same prefix');
    });

    it('should reject config where start >= end', () => {
      const config = {
        enabled: true,
        sequence_start: 'INV-999',
        sequence_end: 'INV-001'
      };

      const result = InvoiceNumberService.validateSequenceConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('less than end number');
    });
  });
});

// Example usage and testing
export const testInvoiceNumberGeneration = {
  // Simple counter test
  testSimpleCounter() {
    const result = InvoiceNumberService.generateNextInvoiceNumber(mockStoreDataSimple);
    console.log('Simple counter result:', result);
    return result;
  },

  // Sequence test
  testSequence() {
    const storeData = { ...mockStoreDataSequence, invoiceCounter: 25 };
    const result = InvoiceNumberService.generateNextInvoiceNumber(storeData);
    console.log('Sequence result:', result);
    return result;
  },

  // Validation test
  testValidation() {
    const config = {
      enabled: true,
      sequence_start: 'TEST-001',
      sequence_end: 'TEST-100'
    };
    
    const result = InvoiceNumberService.validateSequenceConfig(config);
    console.log('Validation result:', result);
    return result;
  }
};