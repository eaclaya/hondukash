// No database imports needed - using counter-based approach

interface InvoiceNumberResult {
  success: boolean;
  invoiceNumber?: string;
  error?: string;
}

interface StoreData {
  invoicePrefix: string | null;
  invoiceCounter: number | null;
  invoiceSequence: string | null;
}

interface SequenceData {
  enabled: boolean;
  sequence_start: string;
  sequence_end: string;
  limit_date?: string;
}

export class InvoiceNumberService {
  /**
   * Generate the next invoice number based on store configuration
   * Handles both simple counter-based and complex sequence-based numbering
   */
  static generateNextInvoiceNumber(
    storeData: StoreData
  ): InvoiceNumberResult {
    try {
      const { invoicePrefix, invoiceCounter, invoiceSequence } = storeData;
      let invoiceNumber: string;
      const defaultPrefix = invoicePrefix || 'INV';

      // Check if invoice sequence is enabled
      if (invoiceSequence) {
        try {
          const sequenceData: SequenceData = JSON.parse(invoiceSequence);

          if (sequenceData?.enabled) {
            // Check if sequence has expired
            if (sequenceData.limit_date) {
              const limitDate = new Date(sequenceData.limit_date);
              const currentDate = new Date();
              currentDate.setHours(0, 0, 0, 0);
              limitDate.setHours(0, 0, 0, 0);

              if (currentDate >= limitDate) {
                return { 
                  success: false, 
                  error: 'Invoice sequence has expired. Please update the sequence configuration.' 
                };
              }
            }

            // Extract start and end numbers from patterns
            const startMatch = sequenceData.sequence_start.match(/(\d+)$/);
            const endMatch = sequenceData.sequence_end.match(/(\d+)$/);

            if (!startMatch || !endMatch) {
              return { 
                success: false, 
                error: 'Invalid sequence pattern. Sequence start and end must contain numbers at the end.' 
              };
            }

            const startNum = parseInt(startMatch[1]);
            const endNum = parseInt(endMatch[1]);

            // Use the invoice counter to determine current position in sequence
            // Counter represents how many invoices have been created, so next number is startNum + counter
            const currentNum = startNum + (invoiceCounter || 0);

            // Check if we've reached the sequence end
            if (currentNum > endNum) {
              return { 
                success: false, 
                error: `Invoice sequence has reached its maximum number (${endNum}). Please configure a new sequence.` 
              };
            }

            // Generate sequence-based number
            const sequencePrefix = sequenceData.sequence_start.replace(/\d+$/, '');
            const numberPadding = startMatch[1].length;
            invoiceNumber = sequencePrefix + currentNum.toString().padStart(numberPadding, '0');

          } else {
            // Use traditional prefix + counter
            invoiceNumber = `${defaultPrefix}${invoiceCounter?.toString().padStart(6, '0')}`;
          }
        } catch (error) {
          // If JSON parsing fails, fall back to prefix + counter
          invoiceNumber = `${defaultPrefix}${invoiceCounter?.toString().padStart(6, '0')}`;
        }
      } else {
        // Use traditional prefix + counter
        invoiceNumber = `${defaultPrefix}${invoiceCounter?.toString().padStart(6, '0')}`;
      }

      return {
        success: true,
        invoiceNumber
      };
    } catch (error: unknown) {
      console.error('InvoiceNumberService.generateNextInvoiceNumber error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if the store uses sequence-based numbering (vs simple counter)
   */
  static isSequenceEnabled(invoiceSequence: string | null): boolean {
    if (!invoiceSequence) return false;
    
    try {
      const sequenceData = JSON.parse(invoiceSequence);
      return sequenceData?.enabled === true;
    } catch {
      return false;
    }
  }

  /**
   * Validate sequence configuration format
   */
  static validateSequenceConfig(sequenceData: SequenceData): { valid: boolean; error?: string } {
    if (!sequenceData.sequence_start || !sequenceData.sequence_end) {
      return { valid: false, error: 'Sequence start and end are required' };
    }

    const startMatch = sequenceData.sequence_start.match(/(\d+)$/);
    const endMatch = sequenceData.sequence_end.match(/(\d+)$/);

    if (!startMatch || !endMatch) {
      return { 
        valid: false, 
        error: 'Sequence start and end must contain numbers at the end' 
      };
    }

    const startNum = parseInt(startMatch[1]);
    const endNum = parseInt(endMatch[1]);

    if (startNum >= endNum) {
      return { 
        valid: false, 
        error: 'Sequence start number must be less than end number' 
      };
    }

    // Check if prefixes match
    const startPrefix = sequenceData.sequence_start.replace(/\d+$/, '');
    const endPrefix = sequenceData.sequence_end.replace(/\d+$/, '');

    if (startPrefix !== endPrefix) {
      return { 
        valid: false, 
        error: 'Sequence start and end must have the same prefix' 
      };
    }

    return { valid: true };
  }

  /**
   * Parse sequence data with error handling
   */
  static parseSequenceData(invoiceSequence: string | null): SequenceData | null {
    if (!invoiceSequence) return null;

    try {
      const data = JSON.parse(invoiceSequence);
      if (data && typeof data === 'object' && 'enabled' in data) {
        return data as SequenceData;
      }
      return null;
    } catch {
      return null;
    }
  }

}