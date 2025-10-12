# Frontend Integration Guide - BlockHeaven API

This guide shows how to integrate with the BlockHeaven API endpoints that proxy ChangeNOW functionality.

## Base Configuration

```typescript
const API_CONFIG = {
  BASE_URL: 'http://localhost:3000', // or your production URL
  ENDPOINTS: {
    BLOCKHAVEN: '/api/blockhaven'
  }
};

// Generic headers for API requests
const getHeaders = () => ({
  'Content-Type': 'application/json',
  // Add authentication headers if needed
});
```

## API Functions

### 1. Currency & Exchange Information

```typescript
// Get available currencies
export async function getAvailableCurrencies(options = {}) {
  const params = new URLSearchParams();
  if (options.active !== undefined) params.append('active', options.active);
  if (options.flow) params.append('flow', options.flow);
  if (options.buy !== undefined) params.append('buy', options.buy);
  if (options.sell !== undefined) params.append('sell', options.sell);

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BLOCKHAVEN}/currencies?${params}`,
    { headers: getHeaders() }
  );
  return response.json();
}

// Get estimated exchange amount
export async function getEstimatedAmount(fromCurrency, toCurrency, options = {}) {
  const params = new URLSearchParams({ fromCurrency, toCurrency });
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, value.toString());
  });

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BLOCKHAVEN}/estimated-amount?${params}`,
    { headers: getHeaders() }
  );
  return response.json();
}

// Get minimum exchange amount
export async function getMinAmount(fromCurrency, toCurrency, options = {}) {
  const params = new URLSearchParams({ fromCurrency, toCurrency });
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, value.toString());
  });

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BLOCKHAVEN}/min-amount?${params}`,
    { headers: getHeaders() }
  );
  return response.json();
}
```

### 2. Address Validation

```typescript
// Validate cryptocurrency address
export async function validateAddress(currency, address) {
  const params = new URLSearchParams({ currency, address });

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BLOCKHAVEN}/validate-address?${params}`,
    { headers: getHeaders() }
  );
  return response.json();
}
```

### 3. Fiat Services

```typescript
// Get available fiat currencies
export async function getFiatCurrencies() {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BLOCKHAVEN}/fiat-currencies`,
    { headers: getHeaders() }
  );
  return response.json();
}

// Get crypto currencies available for fiat exchange
export async function getCryptoCurrenciesForFiat() {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BLOCKHAVEN}/crypto-currencies-for-fiat`,
    { headers: getHeaders() }
  );
  return response.json();
}

// Create fiat transaction
export async function createFiatTransaction(transactionData) {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BLOCKHAVEN}/fiat-transaction`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(transactionData)
    }
  );
  return response.json();
}

// Get fiat estimate
export async function getFiatEstimate(fromCurrency, fromAmount, toCurrency, options = {}) {
  const params = new URLSearchParams({
    from_currency: fromCurrency,
    from_amount: fromAmount.toString(),
    to_currency: toCurrency
  });
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, value.toString());
  });

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BLOCKHAVEN}/fiat-estimate?${params}`,
    { headers: getHeaders() }
  );
  return response.json();
}
```

### 4. Transaction Management

```typescript
// Get transaction status
export async function getTransactionStatus(transactionId) {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BLOCKHAVEN}/transaction-status/${transactionId}`,
    { headers: getHeaders() }
  );
  return response.json();
}

// Refund exchange
export async function refundExchange(transactionId, refundAddress, extraId = null) {
  const body = { id: transactionId, address: refundAddress };
  if (extraId) body.extraId = extraId;

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BLOCKHAVEN}/refund`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    }
  );
  return response.json();
}
```

## Response Format

All endpoints return responses in this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Error Handling

```typescript
export async function safeApiCall(apiFunction, ...args) {
  try {
    const response = await apiFunction(...args);
    
    if (!response.success) {
      throw new Error(response.error || 'API call failed');
    }
    
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Usage example
try {
  const currencies = await safeApiCall(getAvailableCurrencies, { active: true });
  console.log('Available currencies:', currencies);
} catch (error) {
  // Handle error
  console.error('Failed to fetch currencies:', error.message);
}
```

## TypeScript Interfaces

```typescript
interface Currency {
  ticker: string;
  name: string;
  image: string;
  hasExternalId: boolean;
  isFiat: boolean;
  featured: boolean;
  isStable: boolean;
  supportsFixedRate: boolean;
  network: string | null;
  tokenContract: string | null;
  buy: boolean;
  sell: boolean;
  legacyTicker: string;
  isExtraIdSupported: boolean;
}

interface EstimatedAmount {
  estimatedAmount: number;
  transactionSpeedForecast?: string;
  warningMessage?: string;
  rateId?: string;
  validUntil?: string;
}

interface ValidationResponse {
  valid: boolean;
  result: boolean;
}

interface FiatCurrency {
  ticker: string;
  name: string;
  image: string;
  buy: boolean;
  sell: boolean;
}

interface CryptoCurrencyForFiat {
  ticker: string;
  name: string;
  image: string;
  network: string;
  buy: boolean;
  sell: boolean;
}
```

## Complete Implementation Example

```typescript
class BlockHeavenApi {
  private baseUrl: string;
  
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}/api/blockhaven${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data.data;
  }

  // Currency methods
  async getCurrencies(options = {}) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });
    return this.request(`/currencies?${params}`);
  }

  async validateAddress(currency: string, address: string) {
    const params = new URLSearchParams({ currency, address });
    return this.request(`/validate-address?${params}`);
  }

  async getEstimatedAmount(fromCurrency: string, toCurrency: string, options = {}) {
    const params = new URLSearchParams({ fromCurrency, toCurrency });
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });
    return this.request(`/estimated-amount?${params}`);
  }

  // Fiat methods
  async getFiatCurrencies() {
    return this.request('/fiat-currencies');
  }

  async getCryptoCurrenciesForFiat() {
    return this.request('/crypto-currencies-for-fiat');
  }

  // Transaction methods
  async getTransactionStatus(id: string) {
    return this.request(`/transaction-status/${id}`);
  }
}

// Usage
const api = new BlockHeavenApi();

// Example usage
async function example() {
  try {
    const currencies = await api.getCurrencies({ active: true });
    const validation = await api.validateAddress('btc', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    const estimate = await api.getEstimatedAmount('btc', 'eth', { fromAmount: 0.1 });
    
    console.log({ currencies, validation, estimate });
  } catch (error) {
    console.error('API Error:', error);
  }
}
```

This guide provides everything needed to integrate with the BlockHeaven API endpoints from the frontend.