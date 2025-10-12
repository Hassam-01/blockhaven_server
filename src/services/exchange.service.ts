import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source.js';
import { Exchange } from '../entities/exchange.entity.js';
import { ChangeNowService, CreateExchangeRequest, CreateExchangeResponse } from './changenow.service.js';

export interface CreateExchangeServiceRequest {
    fromCurrency: string;
    fromNetwork: string;
    toCurrency: string;
    toNetwork: string;
    fromAmount?: string | undefined;
    toAmount?: string | undefined;
    address: string;
    extraId?: string | undefined;
    refundAddress?: string | undefined;
    refundExtraId?: string | undefined;
    contactEmail?: string | undefined;
    flow?: 'standard' | 'fixed-rate';
    type?: 'direct' | 'reverse';
    rateId?: string | undefined;
    userId?: string | undefined;
    userIp?: string | undefined;
}

class ExchangeService {
    private exchangeRepository: Repository<Exchange>;
    private changeNowService: ChangeNowService;

    constructor() {
        this.exchangeRepository = AppDataSource.getRepository(Exchange);
        this.changeNowService = new ChangeNowService();
    }

    async createExchange(exchangeData: CreateExchangeServiceRequest): Promise<CreateExchangeResponse> {
        let changeNowResponse: CreateExchangeResponse | null = null;
        
        try {
            // Prepare Exchange API request
            const changeNowRequest: CreateExchangeRequest = {
                fromCurrency: exchangeData.fromCurrency,
                fromNetwork: exchangeData.fromNetwork,
                toCurrency: exchangeData.toCurrency,
                toNetwork: exchangeData.toNetwork,
                address: exchangeData.address,
                flow: exchangeData.flow || 'standard',
                type: exchangeData.type || 'direct',
            };

            // Add optional fields
            if (exchangeData.fromAmount) changeNowRequest.fromAmount = exchangeData.fromAmount;
            if (exchangeData.toAmount) changeNowRequest.toAmount = exchangeData.toAmount;
            if (exchangeData.extraId) changeNowRequest.extraId = exchangeData.extraId;
            if (exchangeData.refundAddress) changeNowRequest.refundAddress = exchangeData.refundAddress;
            if (exchangeData.refundExtraId) changeNowRequest.refundExtraId = exchangeData.refundExtraId;
            if (exchangeData.contactEmail) changeNowRequest.contactEmail = exchangeData.contactEmail;
            if (exchangeData.rateId) changeNowRequest.rateId = exchangeData.rateId;
            if (exchangeData.userId) changeNowRequest.userId = exchangeData.userId;

            console.log('Sending request to Exchange API:', JSON.stringify(changeNowRequest, null, 2));

            // Call Exchange API
            changeNowResponse = await this.changeNowService.createExchange(
                changeNowRequest,
                exchangeData.userIp
            );

            console.log('Exchange API Response received:', JSON.stringify(changeNowResponse, null, 2));
            console.log('Response type:', typeof changeNowResponse);
            console.log('Response keys:', Object.keys(changeNowResponse || {}));

            // Validate the response
            if (!changeNowResponse || !changeNowResponse.id) {
                throw new Error('Invalid response from Exchange API - missing transaction ID');
            }

            if (!changeNowResponse.payinAddress) {
                throw new Error('Invalid response from Exchange API - missing payin address');
            }

            // Save to database (optional - don't let DB errors affect the response)
            try {
                const exchange = new Exchange();
                exchange.transactionId = changeNowResponse.id;
                exchange.fromCurrency = changeNowResponse.fromCurrency;
                exchange.fromNetwork = changeNowResponse.fromNetwork;
                exchange.toCurrency = changeNowResponse.toCurrency;
                exchange.toNetwork = changeNowResponse.toNetwork;
                exchange.fromAmount = changeNowResponse.fromAmount;
                exchange.toAmount = changeNowResponse.toAmount;
                exchange.payinAddress = changeNowResponse.payinAddress;
                exchange.payoutAddress = changeNowResponse.payoutAddress;
                exchange.payinExtraId = changeNowResponse.payinExtraId || null;
                exchange.payoutExtraId = changeNowResponse.payoutExtraId || null;
                exchange.refundAddress = changeNowResponse.refundAddress || null;
                exchange.refundExtraId = changeNowResponse.refundExtraId || null;
                exchange.flow = changeNowResponse.flow;
                exchange.type = changeNowResponse.type;
                exchange.rateId = changeNowResponse.rateId || null;
                exchange.payoutExtraIdName = changeNowResponse.payoutExtraIdName || null;
                exchange.contactEmail = exchangeData.contactEmail || null;
                exchange.userId = exchangeData.userId || null;
                exchange.status = 'waiting';

                await this.exchangeRepository.save(exchange);
                console.log('Exchange saved to database successfully');
            } catch (dbError: any) {
                console.error('Database save error (non-critical):', dbError.message);
                // Don't throw - continue with Exchange API response
            }
            
            // Return the ChangeNow response directly
            return changeNowResponse;

        } catch (error: any) {
            console.error('Exchange Service Error:', error.message);
            if (changeNowResponse) {
                console.error('Exchange API Response received:', JSON.stringify(changeNowResponse, null, 2));
            }
            console.error('Full error details:', error);
            throw new Error(`Failed to create exchange: ${error.message}`);
        }
    }

    async getExchangeById(id: number): Promise<Exchange | null> {
        try {
            const exchange = await this.exchangeRepository.findOne({ where: { id } });
            return exchange;
        } catch (error: any) {
            console.error('Exchange Service Error:', error.message);
            throw new Error('Failed to get exchange');
        }
    }

    async getExchangeByTransactionId(transactionId: string): Promise<Exchange | null> {
        try {
            const exchange = await this.exchangeRepository.findOne({ where: { transactionId } });
            return exchange;
        } catch (error: any) {
            console.error('Exchange Service Error:', error.message);
            throw new Error('Failed to get exchange');
        }
    }

    async getAllExchanges(userId?: string): Promise<Exchange[]> {
        try {
            const whereCondition = userId ? { userId } : {};
            const exchanges = await this.exchangeRepository.find({
                where: whereCondition,
                order: { createdAt: 'DESC' }
            });
            return exchanges;
        } catch (error: any) {
            console.error('Exchange Service Error:', error.message);
            throw new Error('Failed to get exchanges');
        }
    }

    async updateExchangeStatus(transactionId: string): Promise<Exchange> {
        try {
            // Get current status from ChangeNow
            const statusResponse = await this.changeNowService.getExchangeStatus(transactionId);
            
            // Find exchange in database
            const exchange = await this.exchangeRepository.findOne({ where: { transactionId } });
            if (!exchange) {
                throw new Error('Exchange not found');
            }

            // Update status and other fields that might have changed
            exchange.status = statusResponse.status;
            if (statusResponse.toAmount) exchange.toAmount = statusResponse.toAmount;

            const updatedExchange = await this.exchangeRepository.save(exchange);
            return updatedExchange;

        } catch (error: any) {
            console.error('Exchange Service Error:', error.message);
            throw new Error(`Failed to update exchange status: ${error.message}`);
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
            console.log("test fromNetwork: ", fromNetwork)
            const estimation = await this.changeNowService.getEstimatedAmount(
                fromCurrency,
                toCurrency,
                fromAmount,
                fromNetwork,
                toNetwork,
                flow,
                type
            );
            return estimation;
        } catch (error: any) {
            console.error('Exchange Service Error:', error.message);
            throw new Error(`Failed to get estimated amount: ${error.message}`);
        }
    }

    async getAvailableCurrencies(): Promise<any[]> {
        try {
            const currencies = await this.changeNowService.getAvailableCurrencies();
            return currencies;
        } catch (error: any) {
            console.error('Exchange Service Error:', error.message);
            throw new Error(`Failed to get available currencies: ${error.message}`);
        }
    }
}

export { ExchangeService };