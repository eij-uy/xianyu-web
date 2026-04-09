-- 创建闲鱼账号表
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  cookie TEXT NOT NULL,
  nickname VARCHAR(255) DEFAULT '',
  account_id VARCHAR(255) DEFAULT '',
  avatar VARCHAR(500) DEFAULT '',
  products INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  today_gmv DECIMAL(12, 2) DEFAULT 0,
  today_orders INTEGER DEFAULT 0,
  today_refunds INTEGER DEFAULT 0,
  total_gmv DECIMAL(12, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0
);

-- 创建闲鱼商品/订单表
CREATE TABLE IF NOT EXISTS xianyu_goods (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  xianyu_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) DEFAULT '',
  price DECIMAL(12, 2) DEFAULT 0,
  image VARCHAR(500) DEFAULT '',
  status INT DEFAULT 0, --'1=在售 2=已售 3=退款',
  created_at TIMESTAMP DEFAULT NOW(),
  update_time TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_xianyu_goods_account ON xianyu_goods(account_id);
CREATE INDEX idx_xianyu_goods_xianyu_id ON xianyu_goods(xianyu_id);

-- 创建库存商品表
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT '其他',
  stock INTEGER DEFAULT 0,
  capacity INTEGER DEFAULT 100,
  restock_qty INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT NOW()
);