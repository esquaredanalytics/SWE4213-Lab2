const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3000;


const VALID_TOKENS = new Set([
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiQWRpdHlhIEJob3NhbGUiLCJhZG1pbiI6dHJ1ZX0.xBitzMVZCdV9a1IzChf3kxdxFRR1FHX_xgKoiuGXLZg',
  'token2'
]);

// Part 11
//Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { error: 'request limit exceeded' },
  standardHeaders: true, 
  legacyHeaders: false, 
  handler: (req, res) => {
    res.set('Retry-After', Math.ceil(limiter.windowMs / 1000));
    res.status(429).json({ error: 'request limit exceeded, please try again later.' });
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith('/health')) return next();
  limiter(req, res, next);
});

// Part 10
//Auth Middleware
const authMiddleware = (req, res, next) => {
  if (req.path.startsWith('/health')) return next();

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!VALID_TOKENS.has(token)) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  next();
};

app.use(authMiddleware);

// Proxy routes to microservices
app.use('/api/users', createProxyMiddleware({
  target: 'http://user-service:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/users' },
}));

app.use('/api/products', createProxyMiddleware({
  target: 'http://product-service:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/products': '/products' },
}));

app.use('/api/orders', createProxyMiddleware({
  target: 'http://order-service:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '/orders' },
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Gateway is running' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
