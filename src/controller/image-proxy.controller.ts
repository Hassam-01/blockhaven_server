import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { AppDataSource } from '../config/data-source.js';
import { Currencies } from '../entities/currencies.entity.js';

// Cache to store ticker+network -> image URL mapping
const imageUrlCache = new Map<string, string>();

export class ImageProxyController {
    
    /**
     * Proxy coin images from ChangeNOW to avoid exposing their branding
     * GET /api/blockhaven/coin-image/:ticker/:network
     * Images are uniquely identified by ticker + network
     */
    async proxyCoinImage(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { ticker, network } = request.params as { ticker: string; network: string };
            
            if (!ticker || !network) {
                return reply.status(400).send({
                    success: false,
                    error: 'Ticker and network are required'
                });
            }

            // Key images by ticker + network to avoid collisions
            const key = `${ticker.toLowerCase()}_${network.toLowerCase()}`;
            let imageUrl = imageUrlCache.get(key);

            // Try DB lookup first (local currencies table) to avoid relying solely on remote API
            try {
                const repo = AppDataSource.getRepository(Currencies);
                // Use case-insensitive match via LOWER in query builder
                const dbCurrency = await repo
                    .createQueryBuilder('c')
                    .where('LOWER(c.ticker) = :ticker', { ticker: ticker.toLowerCase() })
                    .andWhere('LOWER(c.network) = :network', { network: network.toLowerCase() })
                    .getOne();

                if (dbCurrency && dbCurrency.image) {
                    imageUrl = dbCurrency.image;
                    imageUrlCache.set(key, imageUrl);
                }
            } catch (dbErr) {
                // If DB isn't available yet or any error occurs, we'll fallback to remote API below
                // Do not fail hard here
                // console.debug('DB lookup for currency image failed:', dbErr?.message || dbErr);
            }
            
            // If we don't have the URL cached, we need to get it from the currencies API
            if (!imageUrl) {
                try {
                    // Call ChangeNOW API to get the actual image URL
                    const currenciesResponse = await axios.get(
                        `https://api.changenow.io/v2/exchange/currencies?active=true`,
                        {
                            headers: {
                                'x-changenow-api-key': process.env.CHANGENOW_API_KEY || ''
                            }
                        }
                    );

                    // First try to find currency using both ticker and network
                    let currency = currenciesResponse.data.find((curr: any) => 
                        curr.ticker && curr.ticker.toLowerCase() === ticker.toLowerCase() &&
                        ((curr.network || '').toLowerCase() === network.toLowerCase())
                    );

                    // If no exact network match, fall back to ticker-only match (preserve previous behavior)
                    if (!currency) {
                        currency = currenciesResponse.data.find((curr: any) => 
                            curr.ticker && curr.ticker.toLowerCase() === ticker.toLowerCase()
                        );
                    }

                    if (currency && currency.image) {
                        imageUrl = currency.image;
                        imageUrlCache.set(key, currency.image);
                    }
                } catch (apiError) {
                    console.error('Failed to fetch currency data:', apiError);
                }
            }
            
            if (!imageUrl) {
                return reply.status(404).send({
                    success: false,
                    error: 'Image not found for this ticker'
                });
            }

            try {
                const imageResponse = await axios.get(imageUrl, {
                    responseType: 'arraybuffer',
                    timeout: 5000
                });

                // Set appropriate headers
                reply.header('Content-Type', imageResponse.headers['content-type'] || 'image/svg+xml');
                reply.header('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
                reply.header('Access-Control-Allow-Origin', '*');
                
                return reply.send(Buffer.from(imageResponse.data));
                
            } catch (imageError) {
                console.error('Failed to fetch image:', imageError);
                return reply.status(404).send({
                    success: false,
                    error: 'Image not found'
                });
            }

        } catch (error: any) {
            console.error('Error proxying coin image:', error.message);
            return reply.status(500).send({
                success: false,
                error: 'Failed to proxy coin image'
            });
        }
    }

    /**
     * Get coin image URL without ChangeNOW branding
     * This returns the URL to your proxied image
     */
    getCoinImageUrl(ticker: string, network: string, baseUrl: string = 'http://localhost:3000'): string {
        return `${baseUrl}/api/blockhaven/coin-image/${ticker.toLowerCase()}/${network.toLowerCase()}`;
    }
}