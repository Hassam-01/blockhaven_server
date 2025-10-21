import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ImageProxyController } from '../controller/image-proxy.controller.js';

export async function imageProxyRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const imageProxyController = new ImageProxyController();

  // GET /api/blockhaven/coin-image/:ticker/:network - Proxy coin images (unique by ticker+network)
  fastify.get('/coin-image/:ticker/:network', {
    schema: {
      params: {
        type: 'object',
        properties: {
          ticker: { type: 'string' },
          network: { type: 'string' }
        },
        required: ['ticker', 'network']
      }
    }
  }, async (request, reply) => {
    return imageProxyController.proxyCoinImage(request, reply);
  });
}