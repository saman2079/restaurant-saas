import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDoc = {
  openapi: '3.0.0',
  info: { title: 'Restaurant API', version: '1.0.0' },
  servers: [{ url: 'http://localhost:4000/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    }
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'لاگین',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@samanellahi.ir' },
                  password: { type: 'string', example: 'AdminPass123!' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'موفق' } }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'خروج',
        responses: { 200: { description: 'موفق' } }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'اطلاعات من',
        responses: { 200: { description: 'موفق' } }
      }
    },
    '/super/tenants': {
      get: {
        tags: ['Super Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'لیست رستوران‌ها',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'موفق' } }
      },
      post: {
        tags: ['Super Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'ایجاد رستوران جدید',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'ownerName', 'ownerEmail', 'ownerPassword'],
                properties: {
                  name: { type: 'string', example: 'رستوران تهران' },
                  ownerName: { type: 'string', example: 'علی محمدی' },
                  ownerEmail: { type: 'string', example: 'ali@tehran.com' },
                  ownerPassword: { type: 'string', example: 'Pass1234!' },
                  plan: { type: 'string', enum: ['basic', 'pro', 'business'], default: 'basic' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'ایجاد شد' } }
      }
    },
    '/super/tenants/{id}/toggle': {
      patch: {
        tags: ['Super Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'فعال/غیرفعال کردن رستوران',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'موفق' } }
      }
    },
    '/super/tenants/{id}': {
      patch: {
        tags: ['Super Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'آپدیت رستوران',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  phone: { type: 'string' },
                  address: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'موفق' } }
      }
    },
    '/{slug}/menu/full': {
      get: {
        tags: ['Menu - Public'],
        summary: 'منوی کامل رستوران (بدون auth)',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' }, example: 'kebab-house' }],
        responses: { 200: { description: 'موفق' } }
      }
    },
    '/{slug}/menu/categories': {
      get: {
        tags: ['Menu - Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'لیست دسته‌بندی‌ها',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'موفق' } }
      },
      post: {
        tags: ['Menu - Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'ایجاد دسته‌بندی',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'پیتزا' },
                  nameEn: { type: 'string', example: 'Pizza' },
                  icon: { type: 'string', example: '🍕' },
                  sortOrder: { type: 'integer', default: 0 }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'ایجاد شد' } }
      }
    },
    '/{slug}/menu/categories/{id}': {
      patch: {
        tags: ['Menu - Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'آپدیت دسته‌بندی',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, isActive: { type: 'boolean' } } } } }
        },
        responses: { 200: { description: 'موفق' } }
      },
      delete: {
        tags: ['Menu - Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'حذف دسته‌بندی',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'موفق' } }
      }
    },
    '/{slug}/menu/items': {
      get: {
        tags: ['Menu - Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'لیست آیتم‌های منو',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'categoryId', in: 'query', schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'موفق' } }
      },
      post: {
        tags: ['Menu - Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'ایجاد آیتم منو',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'price'],
                properties: {
                  name: { type: 'string', example: 'پیتزا مارگاریتا' },
                  nameEn: { type: 'string', example: 'Margherita Pizza' },
                  description: { type: 'string', example: 'پیتزا با پنیر موزارلا' },
                  price: { type: 'number', example: 150000 },
                  categoryId: { type: 'string' },
                  status: { type: 'string', enum: ['available', 'unavailable', 'out_of_stock'], default: 'available' },
                  isPopular: { type: 'boolean', default: false },
                  preparationTime: { type: 'integer', example: 20 }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'ایجاد شد' } }
      }
    },
    '/{slug}/menu/items/{id}': {
      patch: {
        tags: ['Menu - Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'آپدیت آیتم منو',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, price: { type: 'number' }, status: { type: 'string' } } } } }
        },
        responses: { 200: { description: 'موفق' } }
      },
      delete: {
        tags: ['Menu - Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'حذف آیتم منو',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'موفق' } }
      }
    },
    '/{slug}/orders': {
      post: {
        tags: ['Orders - Public'],
        summary: 'ثبت سفارش (بدون auth)',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items'],
                properties: {
                  tableNumber: { type: 'integer', example: 5 },
                  customerName: { type: 'string', example: 'علی' },
                  notes: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        menuItemId: { type: 'string' },
                        quantity: { type: 'integer', example: 2 },
                        notes: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'سفارش ثبت شد' } }
      },
      get: {
        tags: ['Orders - Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'لیست سفارشات',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }
        ],
        responses: { 200: { description: 'موفق' } }
      }
    },
    '/{slug}/orders/{id}/status': {
      patch: {
        tags: ['Orders - Admin'],
        security: [{ bearerAuth: [] }],
        summary: 'تغییر وضعیت سفارش',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'موفق' } }
      }
    },
    '/{slug}/ai/chat': {
      post: {
        tags: ['AI'],
        summary: 'چت با AI (بدون auth)',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message', 'sessionId'],
                properties: {
                  message: { type: 'string', example: 'منوتون چیه؟' },
                  sessionId: { type: 'string', example: 'session-123' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'موفق' } }
      }
    },
    '/{slug}/ai/analyze': {
      post: {
        tags: ['AI'],
        security: [{ bearerAuth: [] }],
        summary: 'تحلیل هوشمند برای ادمین',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  question: { type: 'string', example: 'پرفروش‌ترین آیتم این هفته چیه؟' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'موفق' } }
      }
    }
  }
};

export function setupSwagger(app: Express) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
    customSiteTitle: 'Restaurant API Docs',
  }));
  console.log('📚 Swagger: http://localhost:4000/docs');
}