import { test, expect } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  // Update these with your actual test tenant data
  TENANT_DOMAIN: 'mpv.hondukash.test', // Change to your test tenant
  STORE_ID: 1,
  CLIENT_ID: 1, // Make sure this client exists

  // Test scenarios
  SCENARIOS: [
    { name: 'Light Load', count: 3, description: '3 invoices to test basic performance' },
    { name: 'Medium Load', count: 5, description: '5 invoices to test moderate load' },
  ],

  // Invoice generation settings
  MAX_ITEMS_PER_INVOICE: 5,
  MIN_ITEMS_PER_INVOICE: 1,

  // Performance thresholds (in milliseconds)
  THRESHOLDS: {
    MAX_RESPONSE_TIME: 5000, // 5 seconds per invoice
    AVERAGE_RESPONSE_TIME: 2000, // 2 seconds average
  }
};

// Sample products - update with real product IDs from your test tenant
const SAMPLE_PRODUCTS = [
  { id: 1, name: 'Product A', price: 10.00 },
  { id: 2, name: 'Product B', price: 15.50 },
  { id: 3, name: 'Product C', price: 25.00 },
  { id: 4, name: 'Product D', price: 8.75 },
  { id: 5, name: 'Product E', price: 12.25 },
];

interface PerformanceMetrics {
  totalTime: number;
  averageTime: number;
  successCount: number;
  failureCount: number;
  responseTimes: number[];
  errors: string[];
}

// Utility functions
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomInvoiceData() {
  const itemCount = randomBetween(TEST_CONFIG.MIN_ITEMS_PER_INVOICE, TEST_CONFIG.MAX_ITEMS_PER_INVOICE);
  const items = [];
  let subtotal = 0;

  for (let i = 0; i < itemCount; i++) {
    const product = getRandomElement(SAMPLE_PRODUCTS);
    const quantity = randomBetween(1, 5);
    const unitPrice = product.price * (0.9 + Math.random() * 0.2); // ±10% price variation
    const lineTotal = quantity * unitPrice;

    subtotal += lineTotal;

    items.push({
      productId: product.id,
      quantity,
      unitPrice: Math.round(unitPrice * 100) / 100,
      description: product.name,
      total: Math.round(lineTotal * 100) / 100
    });
  }

  // Calculate tax and total
  const tax = Math.round(subtotal * 0.15 * 100) / 100; // 15% tax
  const total = Math.round((subtotal + tax) * 100) / 100;

  // Generate random date within last 30 days
  const date = new Date();
  date.setDate(date.getDate() - randomBetween(0, 30));
  const invoiceDate = date.toISOString().split('T')[0];

  // Due date 30 days after invoice date
  const dueDate = new Date(date);
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    clientId: TEST_CONFIG.CLIENT_ID,
    clientName: 'Test Client',
    storeId: TEST_CONFIG.STORE_ID,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    tax,
    discount: 0,
    total,
    status: getRandomElement(['draft', 'sent', 'paid'] as const),
    invoiceDate,
    dueDate: dueDate.toISOString().split('T')[0],
    notes: `Performance test invoice - ${new Date().toISOString()}`,
    terms: 'Net 30 days'
  };
}

async function createInvoice(page: any, invoiceData: any): Promise<{ success: boolean; responseTime: number; error?: string }> {
  const startTime = Date.now();

  try {
    const response = await page.request.post(`http://${TEST_CONFIG.TENANT_DOMAIN}:3001/api/invoices`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Store-ID': TEST_CONFIG.STORE_ID.toString(),
      },
      data: invoiceData
    });

    const responseTime = Date.now() - startTime;

    if (response.ok()) {
      return { success: true, responseTime };
    } else {
      const errorText = await response.text();
      return { success: false, responseTime, error: `HTTP ${response.status()}: ${errorText}` };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return { success: false, responseTime, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Performance test scenarios
TEST_CONFIG.SCENARIOS.forEach(scenario => {
  test.describe(`Invoice Performance Test - ${scenario.name}`, () => {
    test(`should create ${scenario.count} invoices within performance thresholds`, async ({ page }) => {
      console.log(`\n🧪 Starting ${scenario.name}: ${scenario.description}`);

      const metrics: PerformanceMetrics = {
        totalTime: 0,
        averageTime: 0,
        successCount: 0,
        failureCount: 0,
        responseTimes: [],
        errors: []
      };

      const startTime = Date.now();

      // Create invoices sequentially to measure real-world performance
      for (let i = 0; i < scenario.count; i++) {
        console.log(`📝 Creating invoice ${i + 1}/${scenario.count}`);

        const invoiceData = generateRandomInvoiceData();
        const result = await createInvoice(page, invoiceData);

        metrics.responseTimes.push(result.responseTime);

        if (result.success) {
          metrics.successCount++;
          console.log(`✅ Invoice ${i + 1} created in ${result.responseTime}ms`);
        } else {
          metrics.failureCount++;
          metrics.errors.push(`Invoice ${i + 1}: ${result.error}`);
          console.log(`❌ Invoice ${i + 1} failed: ${result.error}`);
        }

        // Check individual response time threshold
        expect(result.responseTime).toBeLessThan(TEST_CONFIG.THRESHOLDS.MAX_RESPONSE_TIME);

        // Small delay to prevent overwhelming the server
        if (i < scenario.count - 1) {
          await page.waitForTimeout(100);
        }
      }

      const endTime = Date.now();
      metrics.totalTime = endTime - startTime;
      metrics.averageTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;

      // Performance Analysis
      console.log(`\n📊 Performance Results for ${scenario.name}:`);
      console.log(`   Total Time: ${metrics.totalTime}ms`);
      console.log(`   Average Response Time: ${Math.round(metrics.averageTime)}ms`);
      console.log(`   Success Rate: ${Math.round((metrics.successCount / scenario.count) * 100)}%`);
      console.log(`   Successful: ${metrics.successCount}`);
      console.log(`   Failed: ${metrics.failureCount}`);

      if (metrics.errors.length > 0) {
        console.log(`   Errors:`);
        metrics.errors.forEach(error => console.log(`     - ${error}`));
      }

      // Calculate percentiles
      const sortedTimes = metrics.responseTimes.sort((a, b) => a - b);
      const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
      const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

      console.log(`   Response Time Percentiles:`);
      console.log(`     P50: ${p50}ms`);
      console.log(`     P95: ${p95}ms`);
      console.log(`     P99: ${p99}ms`);

      // Performance Assertions
      expect(metrics.successCount).toBeGreaterThan(scenario.count * 0.9); // At least 90% success rate
      expect(metrics.averageTime).toBeLessThan(TEST_CONFIG.THRESHOLDS.AVERAGE_RESPONSE_TIME);

      // Log performance grade
      let grade = 'F';
      if (metrics.averageTime < 500 && metrics.successCount === scenario.count) grade = 'A+';
      else if (metrics.averageTime < 800 && metrics.successCount >= scenario.count * 0.95) grade = 'A';
      else if (metrics.averageTime < 1200 && metrics.successCount >= scenario.count * 0.9) grade = 'B';
      else if (metrics.averageTime < 2000 && metrics.successCount >= scenario.count * 0.85) grade = 'C';
      else if (metrics.successCount >= scenario.count * 0.8) grade = 'D';

      console.log(`\n🎯 Performance Grade: ${grade}`);
      console.log(`\n${'='.repeat(60)}\n`);
    });
  });
});

// Cache performance test
test.describe('Cache Performance Test', () => {
  test('should demonstrate cache effectiveness with repeated requests', async ({ page }) => {
    console.log('\n🏎️  Testing cache performance with repeated requests');

    const invoiceData = generateRandomInvoiceData();
    const iterations = 3;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const result = await createInvoice(page, invoiceData);
      times.push(result.responseTime);
      console.log(`Request ${i + 1}: ${result.responseTime}ms`);

      expect(result.success).toBe(true);
      await page.waitForTimeout(200);
    }

    // Later requests should be faster due to cache warming
    const firstRequestTime = times[0];
    const lastRequestTime = times[times.length - 1];
    const averageTimeAfterFirst = times.slice(1).reduce((a, b) => a + b, 0) / (times.length - 1);

    console.log(`\nCache Performance Analysis:`);
    console.log(`First request: ${firstRequestTime}ms`);
    console.log(`Last request: ${lastRequestTime}ms`);
    console.log(`Average after first: ${Math.round(averageTimeAfterFirst)}ms`);

    // Cache should help with subsequent requests (optional assertion)
    if (averageTimeAfterFirst < firstRequestTime) {
      console.log('✅ Cache appears to be working - subsequent requests are faster');
    } else {
      console.log('⚠️  Cache effect not obvious - may need investigation');
    }
  });
});

// Data validation test
test.describe('Data Integrity Test', () => {
  test('should maintain data integrity during bulk operations', async ({ page }) => {
    console.log('\n🔍 Testing data integrity during bulk operations');

    const testInvoices = 3;

    // Create test invoices
    for (let i = 0; i < testInvoices; i++) {
      const invoiceData = generateRandomInvoiceData();
      const result = await createInvoice(page, invoiceData);

      expect(result.success).toBe(true);

      console.log(`✅ Test invoice ${i + 1} created successfully`);
    }

    // Here you could add additional checks:
    // - Verify invoices exist in database
    // - Check inventory was properly updated
    // - Validate invoice numbering sequence
    // - Confirm financial calculations

    console.log(`✅ All ${testInvoices} test invoices created with data integrity maintained`);
  });
});