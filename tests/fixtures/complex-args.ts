export const userWithAddress = {
  id: 'user-1',
  name: 'Alice',
  age: 30,
  address: {
    street: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
  },
  tags: ['admin', 'active'],
}

export const userWithDifferentAddress = {
  id: 'user-1',
  name: 'Alice',
  age: 30,
  address: {
    street: '456 Oak Ave',
    city: 'Springfield',
    state: 'IL',
    zip: '62702',
  },
  tags: ['admin', 'active'],
}

export const orderWithItems = {
  orderId: 'order-99',
  customer: { id: 'user-1', name: 'Alice' },
  items: [
    { sku: 'WIDGET-A', qty: 2, price: 9.99 },
    { sku: 'GADGET-B', qty: 1, price: 24.50 },
  ],
  metadata: { source: 'web', campaign: null },
}

export const orderWithDifferentItems = {
  orderId: 'order-99',
  customer: { id: 'user-1', name: 'Alice' },
  items: [
    { sku: 'WIDGET-A', qty: 5, price: 9.99 },
    { sku: 'GADGET-B', qty: 1, price: 24.50 },
    { sku: 'EXTRA-C', qty: 1, price: 4.00 },
  ],
  metadata: { source: 'web', campaign: null },
}

export const nestedConfig = {
  database: {
    host: 'localhost',
    port: 5432,
    credentials: {
      username: 'admin',
      password: 'secret',
    },
  },
  features: {
    flags: ['dark-mode', 'beta-ui'],
    limits: { maxRetries: 3, timeout: 5000 },
  },
}

export const nestedConfigWithChanges = {
  database: {
    host: 'localhost',
    port: 5432,
    credentials: {
      username: 'admin',
      password: 'changed',
    },
  },
  features: {
    flags: ['dark-mode'],
    limits: { maxRetries: 5, timeout: 5000 },
  },
}
