import axios from 'axios';
import { config } from 'dotenv';

config();

// ChangeNow API Types
export interface CreateExchangeRequest {
    fromCurrency: string;
    fromNetwork: string;
    toCurrency: string;
    toNetwork: string;
    fromAmount?: string;
    toAmount?: string;
    address: string;
    extraId?: string;
    refundAddress?: string;
    refundExtraId?: string;
    userId?: string;
    payload?: Record<string, any>;
    contactEmail?: string;
    flow: 'standard' | 'fixed-rate';
    type?: 'direct' | 'reverse';
    rateId?: string;
}

export interface CreateExchangeResponse {
    id: string;
    fromAmount: number;
    toAmount: number;
    flow: 'standard' | 'fixed-rate';
    type: 'direct' | 'reverse';
    payinAddress: string;
    payoutAddress: string;
    payinExtraId?: string;
    payoutExtraId?: string;
    fromCurrency: string;
    fromNetwork: string;
    toCurrency: string;
    toNetwork: string;
    refundAddress?: string;
    refundExtraId?: string;
    payoutExtraIdName?: string;
    rateId?: string;
}

export interface ExchangeStatusResponse {
    id: string;
    status: 'waiting' | 'confirming' | 'exchanging' | 'sending' | 'finished' | 'failed' | 'refunded' | 'verifying';
    fromAmount: number;
    toAmount: number;
    fromCurrency: string;
    toCurrency: string;
    fromNetwork: string;
    toNetwork: string;
    payinAddress: string;
    payoutAddress: string;
    payinHash?: string;
    payoutHash?: string;
    refundHash?: string;
    validUntil?: string;
    payinExtraId?: string;
    payoutExtraId?: string;
    refundAddress?: string;
    refundExtraId?: string;
}

export interface ChangeNowApiError {
    error: string;
    message: string;
}

class ChangeNowService {
    private readonly baseUrl = 'https://api.changenow.io/v2';
    private readonly apiKey: string;

    constructor() {
        this.apiKey = process.env.CHANGENOW_API_KEY || '';
        if (!this.apiKey) {
            console.warn('Warning: CHANGENOW_API_KEY not found in environment variables');
        }
    }

    async createExchange(exchangeData: CreateExchangeRequest, userIp?: string): Promise<CreateExchangeResponse> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-changenow-api-key': this.apiKey,
            };

            if (userIp) {
                headers['x-forwarded-for'] = userIp;
            }

            console.log('ChangeNow API Request Headers:', headers);
            console.log('ChangeNow API Request Body:', JSON.stringify(exchangeData, null, 2));

            const response = await axios.post<CreateExchangeResponse>(
                `${this.baseUrl}/exchange`,
                exchangeData,
                { headers }
            );

            console.log('ChangeNow API Response Status:', response.status);
            console.log('ChangeNow API Response Headers:', response.headers);
            console.log('ChangeNow API Response Data:', JSON.stringify(response.data, null, 2));

            if (!response.data) {
                throw new Error('Empty response from ChangeNow API');
            }

            return response.data;
        } catch (error: any) {
            console.error('ChangeNow API Error:', error.response?.data || error.message);
            console.error('ChangeNow API Status:', error.response?.status);
            console.error('ChangeNow API Headers:', error.response?.headers);
            
            if (axios.isAxiosError(error) && error.response?.data) {
                const apiError = error.response.data as ChangeNowApiError;
                throw new Error(`ChangeNow API Error: ${apiError.message || apiError.error}`);
            }
            
            throw new Error('Failed to create exchange transaction');
        }
    }

    async getExchangeStatus(transactionId: string): Promise<ExchangeStatusResponse> {
        try {
            const headers = {
                'x-changenow-api-key': this.apiKey,
            };

            const response = await axios.get<ExchangeStatusResponse>(
                `${this.baseUrl}/exchange/by-id/${transactionId}`,
                { headers }
            );

            return response.data;
        } catch (error: any) {
            console.error('ChangeNow API Error:', error.response?.data || error.message);
            
            if (axios.isAxiosError(error) && error.response?.data) {
                const apiError = error.response.data as ChangeNowApiError;
                throw new Error(`ChangeNow API Error: ${apiError.message || apiError.error}`);
            }
            
            throw new Error('Failed to get exchange status');
        }
    }

    async getAvailableCurrencies(): Promise<any[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/exchange/currencies`);
            return response.data;
        } catch (error: any) {
            console.error('ChangeNow API Error:', error.response?.data || error.message);
            throw new Error('Failed to get available currencies');
        }
    }

    async getEstimatedAmount(
        fromCurrency: string,
        toCurrency: string,
        fromAmount: string,
        fromNetwork?: string,
        toNetwork?: string,
        flow: 'standard' | 'fixed-rate' = 'standard',
        type: 'direct' | 'reverse' = 'direct'
    ): Promise<any> {
        try {
            const params = new URLSearchParams({
                fromCurrency,
                toCurrency,
                fromAmount,
                flow,
                type,
            });

            if (fromNetwork) params.append('fromNetwork', fromNetwork);
            if (toNetwork) params.append('toNetwork', toNetwork);

            const response = await axios.get(`${this.baseUrl}/exchange/estimated-amount?${params}`);
            return response.data;
        } catch (error: any) {
            console.error('ChangeNow API Error:', error.response?.data || error.message);
            throw new Error('Failed to get estimated amount');
        }
    }
}

export { ChangeNowService };