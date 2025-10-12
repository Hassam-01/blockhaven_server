import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';

// Cache to store ticker -> image URL mapping
const imageUrlCache = new Map<string, string>();

export class ImageProxyController {
    
    /**
     * Proxy coin images from ChangeNOW to avoid exposing their branding
     * GET /api/blockhaven/coin-image/:ticker
     */
    async proxyCoinImage(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { ticker } = request.params as { ticker: string };
            
            if (!ticker) {
                return reply.status(400).send({
                    success: false,
                    error: 'Ticker is required'
                });
            }

            let imageUrl = imageUrlCache.get(ticker.toLowerCase());
            
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
                    
                    // Find the currency and get its image URL
                    const currency = currenciesResponse.data.find((curr: any) => 
                        curr.ticker.toLowerCase() === ticker.toLowerCase()
                    );
                    
                    if (currency && currency.image) {
                        imageUrl = currency.image;
                        imageUrlCache.set(ticker.toLowerCase(), currency.image);
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
    getCoinImageUrl(ticker: string, baseUrl: string = 'http://localhost:3000'): string {
        return `${baseUrl}/api/blockhaven/coin-image/${ticker.toLowerCase()}`;
    }
}