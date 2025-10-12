import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ImageProxyController } from '../controller/image-proxy.controller.js';

export async function imageProxyRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const imageProxyController = new ImageProxyController();

  // GET /api/blockhaven/coin-image/:ticker - Proxy coin images
  fastify.get('/coin-image/:ticker', {
    schema: {
      params: {
        type: 'object',
        properties: {
          ticker: { type: 'string' }
        },
        required: ['ticker']
      }
    }
  }, async (request, reply) => {
    return imageProxyController.proxyCoinImage(request, reply);
  });
}