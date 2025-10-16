import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ExchangeController } from '../controller/exchange.controller.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';

export async function exchangeRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    const exchangeController = new ExchangeController();
    const authMiddleware = new AuthMiddleware();

    // Public routes (no authentication required)

    // GET /api/exchanges/currencies - Get available currencies
    fastify.get('/currencies', {
        schema: {
            summary: 'Get available currencies for exchange',
            description: 'Retrieve list of all available currencies from ChangeNow API',
            tags: ['Exchange'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'array' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return exchangeController.getAvailableCurrencies(request, reply);
    });

    // GET /api/exchanges/estimate - Get estimated exchange amount
    fastify.get('/estimate', {
        schema: {
            summary: 'Get estimated exchange amount',
            description: 'Calculate estimated amount for currency exchange',
            tags: ['Exchange'],
            querystring: {
                type: 'object',
                required: ['fromCurrency', 'toCurrency', 'fromAmount'],
                properties: {
                    fromCurrency: { type: 'string', description: 'Source currency ticker' },
                    toCurrency: { type: 'string', description: 'Target currency ticker' },
                    fromAmount: { type: 'string', description: 'Amount to exchange' },
                    fromNetwork: { type: 'string', description: 'Source currency network' },
                    toNetwork: { type: 'string', description: 'Target currency network' },
                    flow: { type: 'string', enum: ['standard', 'fixed-rate'], description: 'Exchange flow type' },
                    type: { type: 'string', enum: ['direct', 'reverse'], description: 'Exchange direction' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                }
            }
        }
    }, async (request: any, reply: any) => {
        return exchangeController.getEstimatedAmount(request, reply);
    });

    // POST /api/exchanges - Create new exchange transaction (Public - no authentication required)
    fastify.post('/', {
        schema: {
            summary: 'Create exchange transaction',
            description: 'Create a new exchange transaction using ChangeNow API',
            tags: ['Exchange'],
            body: {
                type: 'object',
                required: ['fromCurrency', 'fromNetwork', 'toCurrency', 'toNetwork', 'address'],
                properties: {
                    fromCurrency: { 
                        type: 'string', 
                        description: 'Source currency ticker (e.g., "btc")' 
                    },
                    fromNetwork: { 
                        type: 'string', 
                        description: 'Source currency network (e.g., "btc")' 
                    },
                    toCurrency: { 
                        type: 'string', 
                        description: 'Target currency ticker (e.g., "eth")' 
                    },
                    toNetwork: { 
                        type: 'string', 
                        description: 'Target currency network (e.g., "eth")' 
                    },
                    fromAmount: { 
                        type: 'string', 
                        description: 'Amount to exchange (for direct type)' 
                    },
                    toAmount: { 
                        type: 'string', 
                        description: 'Amount to receive (for reverse type)' 
                    },
                    address: { 
                        type: 'string', 
                        description: 'Destination wallet address' 
                    },
                    extraId: { 
                        type: 'string', 
                        description: 'Extra ID for destination (if required)' 
                    },
                    refundAddress: { 
                        type: 'string', 
                        description: 'Refund address (optional)' 
                    },
                    refundExtraId: { 
                        type: 'string', 
                        description: 'Refund extra ID (optional)' 
                    },
                    contactEmail: { 
                        type: 'string', 
                        format: 'email',
                        description: 'Contact email for notifications' 
                    },
                    flow: { 
                        type: 'string', 
                        enum: ['standard', 'fixed-rate'], 
                        default: 'standard',
                        description: 'Exchange flow type' 
                    },
                    type: { 
                        type: 'string', 
                        enum: ['direct', 'reverse'], 
                        default: 'direct',
                        description: 'Exchange direction' 
                    },
                    rateId: { 
                        type: 'string', 
                        description: 'Rate ID for fixed-rate exchanges' 
                    }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { 
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                fromAmount: { type: 'number' },
                                toAmount: { type: 'number' },
                                flow: { type: 'string' },
                                type: { type: 'string' },
                                payinAddress: { type: 'string' },
                                payoutAddress: { type: 'string' },
                                payinExtraId: { type: 'string' },
                                payoutExtraId: { type: 'string' },
                                fromCurrency: { type: 'string' },
                                fromNetwork: { type: 'string' },
                                toCurrency: { type: 'string' },
                                toNetwork: { type: 'string' },
                                refundAddress: { type: 'string' },
                                refundExtraId: { type: 'string' },
                                payoutExtraIdName: { type: 'string' },
                                rateId: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, async (request: any, reply: any) => {
        return exchangeController.createExchange(request, reply);
    });

    // Protected routes (authentication required)

    // GET /api/exchanges - Get all user's exchanges
    fastify.get('/', {
        preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
        schema: {
            summary: 'Get user exchanges',
            description: 'Retrieve all exchange transactions for authenticated user',
            tags: ['Exchange'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'array' }
                    }
                }
            }
        }
    }, async (request: any, reply: any) => {
        return exchangeController.getAllExchanges(request, reply);
    });

    // GET /api/exchanges/:id - Get exchange by ID
    fastify.get('/:id', {
        preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
        schema: {
            summary: 'Get exchange by ID',
            description: 'Retrieve specific exchange transaction by ID',
            tags: ['Exchange'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Exchange ID' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                }
            }
        }
    }, async (request: any, reply: any) => {
        return exchangeController.getExchange(request, reply);
    });

    // GET /api/exchanges/transaction/:transactionId - Get exchange by ChangeNow transaction ID
    fastify.get('/transaction/:transactionId', {
        preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
        schema: {
            summary: 'Get exchange by transaction ID',
            description: 'Retrieve specific exchange transaction by ChangeNow transaction ID',
            tags: ['Exchange'],
            params: {
                type: 'object',
                properties: {
                    transactionId: { type: 'string', description: 'ChangeNow transaction ID' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                }
            }
        }
    }, async (request: any, reply: any) => {
        return exchangeController.getExchange(request, reply);
    });

    // PUT /api/exchanges/:transactionId/status - Update exchange status
    fastify.put('/:transactionId/status', {
        preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
        schema: {
            summary: 'Update exchange status',
            description: 'Update exchange status from ChangeNow API',
            tags: ['Exchange'],
            params: {
                type: 'object',
                properties: {
                    transactionId: { type: 'string', description: 'ChangeNow transaction ID' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                }
            }
        }
    }, async (request: any, reply: any) => {
        return exchangeController.updateExchangeStatus(request, reply);
    });

    // POST /api/exchanges/fetch-pairs - Fetch and store available pairs (Admin Only)
    fastify.post('/fetch-pairs', {
        preHandler: [
            authMiddleware.authenticate.bind(authMiddleware),
            authMiddleware.requireAdmin.bind(authMiddleware)
        ],
        schema: {
            summary: 'Fetch and store available exchange pairs (Admin Only)',
            description: 'Fetch all available trading pairs from ChangeNow API and store them in the database. Requires admin privileges.',
            tags: ['Exchange', 'Admin'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request: any, reply: any) => {
        return exchangeController.fetchAndStoreAvailablePairs(request, reply);
    });

    // POST /api/exchanges/fetch-currencies - Fetch and store currencies (Admin Only)
    fastify.post('/fetch-currencies', {
        preHandler: [
            authMiddleware.authenticate.bind(authMiddleware),
            authMiddleware.requireAdmin.bind(authMiddleware)
        ],
        schema: {
            summary: 'Fetch and store currencies (Admin Only)',
            description: 'Fetch all available currencies from ChangeNow API and store them in the database. Requires admin privileges.',
            tags: ['Exchange', 'Admin'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request: any, reply: any) => {
        return exchangeController.fetchAndStoreCurrencies(request, reply);
    });

    // GET /api/exchanges/enhanced-pairs - Get enhanced pairs with currency details
    fastify.get('/enhanced-pairs', {
        schema: {
            summary: 'Get enhanced exchange pairs with currency details',
            description: 'Retrieve all available trading pairs with complete currency information including names, images, and features.',
            tags: ['Exchange'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    from: {
                                        type: 'object',
                                        properties: {
                                            ticker: { type: 'string' },
                                            network: { type: 'string' },
                                            name: { type: 'string' },
                                            image: { type: 'string' },
                                            featured: { type: 'boolean' }
                                        }
                                    },
                                    to: {
                                        type: 'object',
                                        properties: {
                                            ticker: { type: 'string' },
                                            network: { type: 'string' },
                                            name: { type: 'string' },
                                            image: { type: 'string' },
                                            featured: { type: 'boolean' }
                                        }
                                    },
                                    flow: {
                                        type: 'object',
                                        properties: {
                                            standard: { type: 'boolean' },
                                            'fixed-rate': { type: 'boolean' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request: any, reply: any) => {
        return exchangeController.getEnhancedPairs(request, reply);
    });
}