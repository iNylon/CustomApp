CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(32) NOT NULL,
  name VARCHAR(128) NOT NULL,
  category VARCHAR(64) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  inventory INT NOT NULL
);

INSERT INTO products (sku, name, category, price, inventory) VALUES
  ('SKU-100', 'PHP Hoodie', 'apparel', 59.99, 120),
  ('SKU-101', 'Node Mug', 'accessories', 12.49, 340),
  ('SKU-102', 'Python Notebook', 'stationery', 9.95, 260),
  ('SKU-103', 'Java Sticker Pack', 'accessories', 4.99, 800)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  price = VALUES(price),
  inventory = VALUES(inventory);
