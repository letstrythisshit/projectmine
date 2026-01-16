import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'factory_flow',
  port: Number(process.env.MYSQL_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

const ensureSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      surname VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      role VARCHAR(20) NOT NULL,
      password VARCHAR(255) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS materials (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      cost DECIMAL(10,2) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      stock DECIMAL(12,2) NOT NULL,
      created_at VARCHAR(50) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      materials JSON NOT NULL,
      created_at VARCHAR(50) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY,
      order_number VARCHAR(100) NOT NULL,
      products JSON NOT NULL,
      status VARCHAR(20) NOT NULL,
      total_cost DECIMAL(12,2) NOT NULL,
      leftovers JSON NOT NULL,
      created_at VARCHAR(50) NOT NULL,
      completed_at VARCHAR(50)
    )
  `);

  const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
  const count = Array.isArray(rows) ? rows[0]?.count : 0;
  if (count === 0) {
    await pool.query(
      `INSERT INTO users (id, email, name, surname, phone, role, password)
       VALUES (:id, :email, :name, :surname, :phone, :role, :password)`,
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@company.com',
        name: 'Admin',
        surname: 'User',
        phone: '+370 600 00000',
        role: 'admin',
        password: 'admin123',
      }
    );
  }
};

const parseJsonField = (value) => {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') return JSON.parse(value);
  return value;
};

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const mapMaterial = (row) => ({
  id: row.id,
  name: row.name,
  cost: Number(row.cost),
  unit: row.unit,
  stock: Number(row.stock),
  createdAt: row.created_at,
});

const mapProduct = (row) => ({
  id: row.id,
  name: row.name,
  materials: parseJsonField(row.materials),
  createdAt: row.created_at,
});

const mapOrder = (row) => ({
  id: row.id,
  orderNumber: row.order_number,
  products: parseJsonField(row.products),
  status: row.status,
  totalCost: Number(row.total_cost),
  leftovers: parseJsonField(row.leftovers),
  createdAt: row.created_at,
  completedAt: row.completed_at || undefined,
});

app.get('/api/health', asyncHandler(async (_req, res) => {
  res.json({ status: 'ok' });
}));

app.get('/api/users', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM users');
  res.json(rows);
}));

app.post('/api/users', asyncHandler(async (req, res) => {
  const user = req.body;
  await pool.query(
    `INSERT INTO users (id, email, name, surname, phone, role, password)
     VALUES (:id, :email, :name, :surname, :phone, :role, :password)`,
    user
  );
  res.status(201).json(user);
}));

app.put('/api/users/:id', asyncHandler(async (req, res) => {
  const user = { ...req.body, id: req.params.id };
  const [result] = await pool.query(
    `UPDATE users
     SET email = :email,
         name = :name,
         surname = :surname,
         phone = :phone,
         role = :role,
         password = :password
     WHERE id = :id`,
    user
  );
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
}));

app.delete('/api/users/:id', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM users WHERE id = :id', { id: req.params.id });
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.status(204).send();
}));

app.get('/api/materials', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM materials');
  res.json(rows.map(mapMaterial));
}));

app.post('/api/materials', asyncHandler(async (req, res) => {
  const material = req.body;
  await pool.query(
    `INSERT INTO materials (id, name, cost, unit, stock, created_at)
     VALUES (:id, :name, :cost, :unit, :stock, :created_at)`,
    {
      id: material.id,
      name: material.name,
      cost: material.cost,
      unit: material.unit,
      stock: material.stock,
      created_at: material.createdAt,
    }
  );
  res.status(201).json(material);
}));

app.put('/api/materials/:id', asyncHandler(async (req, res) => {
  const material = { ...req.body, id: req.params.id };
  const [result] = await pool.query(
    `UPDATE materials
     SET name = :name,
         cost = :cost,
         unit = :unit,
         stock = :stock,
         created_at = :created_at
     WHERE id = :id`,
    {
      id: material.id,
      name: material.name,
      cost: material.cost,
      unit: material.unit,
      stock: material.stock,
      created_at: material.createdAt,
    }
  );
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Material not found' });
    return;
  }
  res.json(material);
}));

app.delete('/api/materials/:id', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM materials WHERE id = :id', { id: req.params.id });
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Material not found' });
    return;
  }
  res.status(204).send();
}));

app.get('/api/products', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM products');
  res.json(rows.map(mapProduct));
}));

app.post('/api/products', asyncHandler(async (req, res) => {
  const product = req.body;
  await pool.query(
    `INSERT INTO products (id, name, materials, created_at)
     VALUES (:id, :name, :materials, :created_at)`,
    {
      id: product.id,
      name: product.name,
      materials: JSON.stringify(product.materials),
      created_at: product.createdAt,
    }
  );
  res.status(201).json(product);
}));

app.put('/api/products/:id', asyncHandler(async (req, res) => {
  const product = { ...req.body, id: req.params.id };
  const [result] = await pool.query(
    `UPDATE products
     SET name = :name,
         materials = :materials,
         created_at = :created_at
     WHERE id = :id`,
    {
      id: product.id,
      name: product.name,
      materials: JSON.stringify(product.materials),
      created_at: product.createdAt,
    }
  );
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(product);
}));

app.delete('/api/products/:id', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM products WHERE id = :id', { id: req.params.id });
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.status(204).send();
}));

app.get('/api/orders', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM orders');
  res.json(rows.map(mapOrder));
}));

app.post('/api/orders', asyncHandler(async (req, res) => {
  const order = req.body;
  await pool.query(
    `INSERT INTO orders (id, order_number, products, status, total_cost, leftovers, created_at, completed_at)
     VALUES (:id, :order_number, :products, :status, :total_cost, :leftovers, :created_at, :completed_at)`,
    {
      id: order.id,
      order_number: order.orderNumber,
      products: JSON.stringify(order.products),
      status: order.status,
      total_cost: order.totalCost,
      leftovers: JSON.stringify(order.leftovers),
      created_at: order.createdAt,
      completed_at: order.completedAt || null,
    }
  );
  res.status(201).json(order);
}));

app.put('/api/orders/:id', asyncHandler(async (req, res) => {
  const order = { ...req.body, id: req.params.id };
  const [result] = await pool.query(
    `UPDATE orders
     SET order_number = :order_number,
         products = :products,
         status = :status,
         total_cost = :total_cost,
         leftovers = :leftovers,
         created_at = :created_at,
         completed_at = :completed_at
     WHERE id = :id`,
    {
      id: order.id,
      order_number: order.orderNumber,
      products: JSON.stringify(order.products),
      status: order.status,
      total_cost: order.totalCost,
      leftovers: JSON.stringify(order.leftovers),
      created_at: order.createdAt,
      completed_at: order.completedAt || null,
    }
  );
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(order);
}));

app.delete('/api/orders/:id', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM orders WHERE id = :id', { id: req.params.id });
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.status(204).send();
}));

app.use((err, _req, res, _next) => {
  res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' });
});

const start = async () => {
  try {
    await ensureSchema();
    const port = Number(process.env.PORT || 4000);
    app.listen(port, () => {
      process.stdout.write(`Server listening on ${port}\n`);
    });
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Server error'}\n`);
    process.exit(1);
  }
};

start();
