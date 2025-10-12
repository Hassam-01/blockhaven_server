# BlockHeaven API Endpoints

This document describes all the BlockHeaven API endpoints that integrate with ChangeNOW. These endpoints act as a proxy layer between the frontend and ChangeNOW's API, forwarding requests and responses.

## Base URL
All endpoints are prefixed with `/api/blockhaven`

## Authentication
All endpoints use the `CHANGENOW_API_KEY` environment variable for authentication with ChangeNOW's API.

## Endpoints

### Currency and Pair Endpoints

#### 1. Get Available Currencies
**GET** `/api/blockhaven/currencies`

Get list of available currencies for exchange.

**Query Parameters:**
- `active` (boolean, optional) - Filter by active currencies only
- `flow` (string, optional) - Exchange flow type: `standard` | `fixed-rate`
- `buy` (boolean, optional) - Filter currencies available for buying
- `sell` (boolean, optional) - Filter currencies available for selling

**Example:**
```
GET /api/blockhaven/currencies?active=true&flow=standard
```

#### 2. Get Available Pairs
**GET** `/api/blockhaven/available-pairs`

Get list of available trading pairs.

**Query Parameters:**
- `fromCurrency` (string, optional) - Source currency ticker
- `toCurrency` (string, optional) - Target currency ticker
- `fromNetwork` (string, optional) - Source currency network
- `toNetwork` (string, optional) - Target currency network
- `flow` (string, optional) - Exchange flow type: `standard` | `fixed-rate`

**Example:**
```
GET /api/blockhaven/available-pairs?fromCurrency=btc&toCurrency=eth
```

### Amount and Rate Endpoints

#### 3. Get Minimal Exchange Amount
**GET** `/api/blockhaven/min-amount`

Get minimum payment amount required for exchange.

**Query Parameters (Required):**
- `fromCurrency` (string) - Source currency ticker
- `toCurrency` (string) - Target currency ticker

**Query Parameters (Optional):**
- `fromNetwork` (string) - Source currency network
- `toNetwork` (string) - Target currency network
- `flow` (string) - Exchange flow type: `standard` | `fixed-rate`

**Example:**
```
GET /api/blockhaven/min-amount?fromCurrency=btc&toCurrency=eth&flow=standard
```

#### 4. Get Estimated Exchange Amount
**GET** `/api/blockhaven/estimated-amount`

Get estimated exchange amount and rate information.

**Query Parameters (Required):**
- `fromCurrency` (string) - Source currency ticker
- `toCurrency` (string) - Target currency ticker

**Query Parameters (Optional):**
- `fromAmount` (number) - Amount to exchange from
- `toAmount` (number) - Amount to receive (for reverse calculation)
- `fromNetwork` (string) - Source currency network
- `toNetwork` (string) - Target currency network
- `flow` (string) - Exchange flow type: `standard` | `fixed-rate`
- `type` (string) - Calculation type: `direct` | `reverse`
- `useRateId` (boolean) - Include rate ID for fixed-rate exchanges
- `isTopUp` (boolean) - Indicates if this is a top-up operation

**Example:**
```
GET /api/blockhaven/estimated-amount?fromCurrency=btc&toCurrency=eth&fromAmount=0.1&flow=fixed-rate
```

#### 5. Get Exchange Range
**GET** `/api/blockhaven/exchange-range`

Get minimum and maximum exchange amounts for a currency pair.

**Query Parameters (Required):**
- `fromCurrency` (string) - Source currency ticker
- `toCurrency` (string) - Target currency ticker

**Query Parameters (Optional):**
- `fromNetwork` (string) - Source currency network
- `toNetwork` (string) - Target currency network
- `flow` (string) - Exchange flow type: `standard` | `fixed-rate`

**Example:**
```
GET /api/blockhaven/exchange-range?fromCurrency=btc&toCurrency=eth
```

#### 6. Get Estimated Network Fee
**GET** `/api/blockhaven/network-fee`

Get estimated network fee for an exchange.

**Query Parameters (Required):**
- `fromCurrency` (string) - Source currency ticker
- `toCurrency` (string) - Target currency ticker
- `fromAmount` (number) - Amount to exchange

**Query Parameters (Optional):**
- `fromNetwork` (string) - Source currency network
- `toNetwork` (string) - Target currency network
- `convertedCurrency` (string) - Currency for fee conversion
- `convertedNetwork` (string) - Network for fee conversion

**Example:**
```
GET /api/blockhaven/network-fee?fromCurrency=btc&toCurrency=eth&fromAmount=0.1
```

### Transaction Status Endpoints

#### 7. Get Transaction Status
**GET** `/api/blockhaven/transaction-status/:id`

Get status and details for a transaction by ID.

**URL Parameters:**
- `id` (string) - Transaction ID

**Example:**
```
GET /api/blockhaven/transaction-status/abc123def456
```

### Address Endpoints

#### 8. Get User Addresses by Domain Name
**GET** `/api/blockhaven/addresses-by-name`

Get addresses bound to FIO/Unstoppable domain name.

**Query Parameters (Required):**
- `name` (string) - Domain name

**Query Parameters (Optional):**
- `apiKey` (string) - Optional API key override

**Example:**
```
GET /api/blockhaven/addresses-by-name?name=example.crypto
```

### Fiat Endpoints

#### 9. Create Fiat Transaction
**POST** `/api/blockhaven/fiat-transaction`

Create a fiat-to-cryptocurrency exchange transaction.

**Request Body (Required):**
- `from_currency` (string) - Source fiat currency
- `from_amount` (number) - Amount in source currency
- `to_currency` (string) - Target cryptocurrency
- `to_amount` (number) - Amount in target currency
- `to_address` (string) - Recipient address

**Request Body (Optional):**
- `from_network` (string) - Source currency network
- `to_network` (string) - Target currency network
- `deposit_type` (string) - Deposit method type
- `payout_type` (string) - Payout method type
- `user_refund_address` (string) - Refund address
- `user_refund_extra_id` (string) - Refund extra ID

**Example:**
```json
POST /api/blockhaven/fiat-transaction
{
  "from_currency": "usd",
  "from_amount": 100,
  "to_currency": "btc",
  "to_amount": 0.003,
  "to_address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
}
```

#### 10. Get Fiat Market Info
**GET** `/api/blockhaven/fiat-market-info/:fromCurrency/:toCurrency`

Get market information for fiat transactions.

**URL Parameters:**
- `fromCurrency` (string) - Source currency
- `toCurrency` (string) - Target currency

**Query Parameters (Optional):**
- `fromNetwork` (string) - Source currency network
- `toNetwork` (string) - Target currency network

**Example:**
```
GET /api/blockhaven/fiat-market-info/usd/btc
```

#### 11. Get Fiat Health Check
**GET** `/api/blockhaven/fiat-health-check`

Check health status of fiat-to-crypto exchange service.

**Example:**
```
GET /api/blockhaven/fiat-health-check
```

#### 12. Get Fiat Transaction Status
**GET** `/api/blockhaven/fiat-transaction-status/:id`

Get status of a fiat transaction by ID.

**URL Parameters:**
- `id` (string) - Fiat transaction ID

**Example:**
```
GET /api/blockhaven/fiat-transaction-status/fiat123abc
```

#### 13. Get Fiat Estimate
**GET** `/api/blockhaven/fiat-estimate`

Get estimate for fiat exchange transaction.

**Query Parameters (Required):**
- `from_currency` (string) - Source fiat currency
- `from_amount` (number) - Amount in source currency
- `to_currency` (string) - Target cryptocurrency

**Query Parameters (Optional):**
- `from_network` (string) - Source currency network
- `to_network` (string) - Target currency network
- `deposit_type` (string) - Deposit method type
- `payout_type` (string) - Payout method type

**Example:**
```
GET /api/blockhaven/fiat-estimate?from_currency=usd&from_amount=100&to_currency=btc
```

### Exchange Action Endpoints

#### 14. Get Exchange Actions
**GET** `/api/blockhaven/exchange-actions/:id`

Get possible actions that can be applied to an exchange transaction.

**URL Parameters:**
- `id` (string) - Transaction ID

**Note:** Access to this endpoint requires a dedicated request to partners@changenow.io

**Example:**
```
GET /api/blockhaven/exchange-actions/abc123def456
```

#### 15. Refund Exchange
**POST** `/api/blockhaven/refund`

Refund an exchange to the refund or original address.

**Request Body (Required):**
- `id` (string) - Transaction ID to refund
- `address` (string) - Refund address

**Request Body (Optional):**
- `extraId` (string) - Extra ID for refund address

**Note:** Access to this endpoint requires a dedicated request to partners@changenow.io

**Example:**
```json
POST /api/blockhaven/refund
{
  "id": "abc123def456",
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
}
```

#### 16. Continue Exchange
**POST** `/api/blockhaven/continue`

Continue an exchange that can be pushed.

**Request Body (Required):**
- `id` (string) - Transaction ID to continue

**Note:** Access to this endpoint requires a dedicated request to partners@changenow.io

**Example:**
```json
POST /api/blockhaven/continue
{
  "id": "abc123def456"
}
```

### Additional Utility Endpoints

#### 17. Validate Address
**GET** `/api/blockhaven/validate-address`

Validate a cryptocurrency wallet address for a specific currency.

**Query Parameters (Required):**
- `currency` (string) - Currency ticker (e.g., "btc", "eth")
- `address` (string) - Wallet address to validate

**Example:**
```
GET /api/blockhaven/validate-address?currency=btc&address=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "result": true
  }
}
```

#### 18. Get Fiat Currencies
**GET** `/api/blockhaven/fiat-currencies`

Get list of available fiat currencies for fiat-to-crypto exchanges.

**Example:**
```
GET /api/blockhaven/fiat-currencies
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ticker": "usd",
      "name": "US Dollar",
      "image": "https://changenow.io/images/currency/usd.svg",
      "buy": true,
      "sell": true
    },
    {
      "ticker": "eur",
      "name": "Euro",
      "image": "https://changenow.io/images/currency/eur.svg",
      "buy": true,
      "sell": true
    }
  ]
}
```

#### 19. Get Crypto Currencies for Fiat
**GET** `/api/blockhaven/crypto-currencies-for-fiat`

Get list of cryptocurrencies available for fiat exchanges.

**Example:**
```
GET /api/blockhaven/crypto-currencies-for-fiat
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ticker": "btc",
      "name": "Bitcoin",
      "image": "https://changenow.io/images/currency/btc.svg",
      "network": "btc",
      "buy": true,
      "sell": false
    },
    {
      "ticker": "eth",
      "name": "Ethereum",
      "image": "https://changenow.io/images/currency/eth.svg",
      "network": "eth",
      "buy": true,
      "sell": false
    }
  ]
}
```

## Response Format

All endpoints return responses in the following format:

### Success Response
```json
{
  "success": true,
  "data": {
    // ChangeNOW API response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Environment Variables

Make sure to set the following environment variable:

```env
CHANGENOW_API_KEY=your_changenow_api_key_here
```

## API Key Types

ChangeNOW uses two different API key headers:

1. **x-changenow-api-key** - Used for most endpoints (endpoints 1-16)
2. **x-api-key** - Used for fiat endpoints 15-16
3. **No API Key** - Used for utility endpoints 17-19

The service automatically handles which header to use based on the endpoint.

## Complete Endpoint List

### Currency & Exchange Information
1. `GET /api/blockhaven/currencies` - Get available currencies
2. `GET /api/blockhaven/available-pairs` - Get trading pairs
3. `GET /api/blockhaven/min-amount` - Get minimum exchange amount
4. `GET /api/blockhaven/estimated-amount` - Get exchange estimates
5. `GET /api/blockhaven/exchange-range` - Get min/max amounts
6. `GET /api/blockhaven/network-fee` - Get network fees

### Transaction Management
7. `GET /api/blockhaven/transaction-status/:id` - Get transaction status
8. `GET /api/blockhaven/addresses-by-name` - Get domain addresses
14. `GET /api/blockhaven/exchange-actions/:id` - Get possible actions
15. `POST /api/blockhaven/refund` - Refund exchange
16. `POST /api/blockhaven/continue` - Continue exchange

### Fiat Services
9. `POST /api/blockhaven/fiat-transaction` - Create fiat transaction
10. `GET /api/blockhaven/fiat-market-info/:from/:to` - Get fiat market info
11. `GET /api/blockhaven/fiat-health-check` - Check fiat service health
12. `GET /api/blockhaven/fiat-transaction-status/:id` - Get fiat transaction status
13. `GET /api/blockhaven/fiat-estimate` - Get fiat estimates
18. `GET /api/blockhaven/fiat-currencies` - Get available fiat currencies
19. `GET /api/blockhaven/crypto-currencies-for-fiat` - Get crypto currencies for fiat

### Utility Services
17. `GET /api/blockhaven/validate-address` - Validate cryptocurrency address

## Error Handling

The service includes comprehensive error handling:

- Parameter validation for required fields
- ChangeNOW API error forwarding
- Network error handling
- Proper HTTP status codes
- Detailed error messages

## Rate Limiting

Rate limits are handled by ChangeNOW's API. Check their documentation for current limits.

## Testing

You can test the endpoints using tools like Postman or curl:

```bash
# Example: Get available currencies
curl "http://localhost:3000/api/blockhaven/currencies?active=true"

# Example: Get estimated amount
curl "http://localhost:3000/api/blockhaven/estimated-amount?fromCurrency=btc&toCurrency=eth&fromAmount=0.1"

# Example: Validate address
curl "http://localhost:3000/api/blockhaven/validate-address?currency=btc&address=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"

# Example: Get fiat currencies
curl "http://localhost:3000/api/blockhaven/fiat-currencies"

# Example: Get crypto currencies for fiat
curl "http://localhost:3000/api/blockhaven/crypto-currencies-for-fiat"
```