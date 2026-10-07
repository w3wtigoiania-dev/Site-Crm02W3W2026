-- =====================================================================
-- INFRA ASSET MANAGER & CRM FINANCEIRO - SCHEMA COMPLETO MYSQL / MARIADB
-- Compatível com: MySQL 8.0+, MySQL 5.7+ e MariaDB 10.4+
-- Codificação: UTF8MB4 (Suporte a acentuação e emojis)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS infra_crm_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE infra_crm_db;

SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------
-- 1. TABELA DE EMPRESAS CLIENTES (B2B / MSP)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS client_companies;
CREATE TABLE client_companies (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  trade_name VARCHAR(150),
  document VARCHAR(30),
  contact_name VARCHAR(100),
  contact_email VARCHAR(120),
  contact_phone VARCHAR(30),
  sla_plan VARCHAR(60) DEFAULT 'Bronze (8x5 Comercial)',
  notes TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 2. TABELA DE USUÁRIOS E PERMISSÕES (RBAC)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  username VARCHAR(60) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  primary_role VARCHAR(50) DEFAULT 'Operador',
  company_id VARCHAR(64),
  company_name VARCHAR(150),
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_username (username),
  INDEX idx_user_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(60) UNIQUE NOT NULL,
  description VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS scopes;
CREATE TABLE scopes (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(60) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS user_permissions;
CREATE TABLE user_permissions (
  user_id VARCHAR(64) NOT NULL,
  role_id VARCHAR(64) NOT NULL,
  scope_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (user_id, role_id, scope_id),
  CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 3. TABELA DE ATIVOS DE TI / TELEMETRIA (MÁQUINAS)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS machines;
CREATE TABLE machines (
  id VARCHAR(100) PRIMARY KEY,
  hostname VARCHAR(100) NOT NULL,
  logged_user VARCHAR(100),
  machine_type VARCHAR(30) DEFAULT 'desktop',
  os_name VARCHAR(60) NOT NULL,
  os_version VARCHAR(60),
  os_build VARCHAR(40),
  os_arch VARCHAR(30),
  cpu_model VARCHAR(120),
  cpu_cores_physical INT DEFAULT 1,
  cpu_cores_logical INT DEFAULT 1,
  cpu_freq_ghz DECIMAL(6,2),
  cpu_usage_percent DECIMAL(5,2) DEFAULT 0.00,
  ram_total_gb DECIMAL(8,2) NOT NULL,
  ram_used_gb DECIMAL(8,2) NOT NULL,
  ram_free_gb DECIMAL(8,2),
  ram_percent DECIMAL(5,2) NOT NULL,
  primary_ip VARCHAR(50),
  public_ip VARCHAR(50),
  primary_mac VARCHAR(50),
  uptime_seconds BIGINT DEFAULT 0,
  boot_time DATETIME,
  client_company VARCHAR(150) DEFAULT 'Hospital São Lucas',
  sector VARCHAR(80) DEFAULT 'Geral',
  location VARCHAR(100) DEFAULT 'Matriz',
  status VARCHAR(40) DEFAULT 'Ativo',
  asset_tag VARCHAR(60),
  purchase_date DATE,
  warranty_end DATE,
  vendor VARCHAR(100),
  cost DECIMAL(12,2),
  responsible_person VARCHAR(100),
  notes TEXT,
  agent_version VARCHAR(30) DEFAULT '2.4.0',
  last_seen DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_machine_company (client_company),
  INDEX idx_machine_status (status),
  INDEX idx_machine_hostname (hostname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS machine_disks;
CREATE TABLE machine_disks (
  id VARCHAR(100) PRIMARY KEY,
  machine_id VARCHAR(100) NOT NULL,
  device VARCHAR(100) NOT NULL,
  mountpoint VARCHAR(100),
  fstype VARCHAR(40),
  total_gb DECIMAL(10,2) NOT NULL,
  used_gb DECIMAL(10,2) NOT NULL,
  free_gb DECIMAL(10,2) NOT NULL,
  percent DECIMAL(5,2) NOT NULL,
  CONSTRAINT fk_disk_machine FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS machine_networks;
CREATE TABLE machine_networks (
  id VARCHAR(100) PRIMARY KEY,
  machine_id VARCHAR(100) NOT NULL,
  interface_name VARCHAR(60) NOT NULL,
  ip_address VARCHAR(50),
  netmask VARCHAR(50),
  mac_address VARCHAR(50),
  is_up TINYINT(1) DEFAULT 1,
  speed_mbps INT DEFAULT 1000,
  CONSTRAINT fk_net_machine FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 4. CONFIGURAÇÕES GERAIS E TOKENS DE AGENTE
-- -------------------------------------------------------------
DROP TABLE IF EXISTS system_settings;
CREATE TABLE system_settings (
  id VARCHAR(32) PRIMARY KEY,
  company_name VARCHAR(150) NOT NULL,
  system_title VARCHAR(150) NOT NULL,
  department VARCHAR(150),
  logo_url TEXT,
  footer_text VARCHAR(255),
  report_header VARCHAR(255),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS agent_tokens;
CREATE TABLE agent_tokens (
  id VARCHAR(64) PRIMARY KEY,
  token VARCHAR(120) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 5. MÓDULO FINANCEIRO - INSTITUIÇÕES FINANCEIRAS & BANCOS
-- -------------------------------------------------------------
DROP TABLE IF EXISTS financial_institutions;
CREATE TABLE financial_institutions (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20),
  color_gradient VARCHAR(150) DEFAULT 'from-purple-600 via-indigo-600 to-blue-600',
  icon_name VARCHAR(60) DEFAULT 'Building2',
  is_custom TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_inst_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Instituições Padrão Pré-cadastradas
INSERT INTO financial_institutions (id, name, code, color_gradient, icon_name, is_custom) VALUES
('inst_nubank', 'Nubank PJ', '260', 'from-purple-600 via-indigo-600 to-blue-600', 'Building2', 0),
('inst_itau', 'Itaú Personnalité / PJ', '341', 'from-orange-600 via-amber-600 to-yellow-600', 'Building2', 0),
('inst_bradesco', 'Bradesco Prime / PJ', '237', 'from-red-600 via-rose-600 to-pink-600', 'Building2', 0),
('inst_inter', 'Banco Inter Empresas', '077', 'from-orange-500 via-amber-500 to-yellow-500', 'Building2', 0),
('inst_santander', 'Santander Empresas', '033', 'from-red-700 via-red-600 to-rose-700', 'Building2', 0),
('inst_bb', 'Banco do Brasil Ourocard', '001', 'from-yellow-500 via-amber-500 to-blue-600', 'Building2', 0),
('inst_caixa', 'Caixa Econômica Federal', '104', 'from-blue-600 via-cyan-600 to-sky-600', 'Building2', 0),
('inst_sicoob', 'Sicoob Cooperativo', '756', 'from-emerald-700 via-teal-700 to-green-600', 'Building2', 0),
('inst_sicredi', 'Sicredi PJ', '748', 'from-green-600 via-emerald-600 to-teal-600', 'Building2', 0),
('inst_c6', 'C6 Bank Empresas', '336', 'from-slate-800 via-gray-700 to-zinc-900', 'Building2', 0),
('inst_btg', 'BTG Pactual Empresas', '208', 'from-blue-900 via-indigo-900 to-slate-900', 'Building2', 0),
('inst_mercadopago', 'Mercado Pago PJ', '323', 'from-sky-500 via-blue-500 to-indigo-500', 'Building2', 0),
('inst_outro', 'Outro Banco', '', 'from-slate-700 via-gray-600 to-slate-800', 'Building2', 0);

-- -------------------------------------------------------------
-- 5.1. MÓDULO FINANCEIRO - CATEGORIAS DE DESPESAS E RECEITAS
-- -------------------------------------------------------------
DROP TABLE IF EXISTS financial_categories;
CREATE TABLE financial_categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(60) DEFAULT 'text-purple-400',
  is_custom TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cat_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO financial_categories (id, name, color, is_custom) VALUES
('cat_infraestrutura_servicos', 'Infraestrutura & Serviços', 'text-blue-400', 0),
('cat_materiais_suprimentos', 'Materiais & Suprimentos', 'text-amber-400', 0),
('cat_transporte_frotas', 'Transporte & Frotas', 'text-emerald-400', 0),
('cat_treinamento_capacitacao', 'Treinamento & Capacitação', 'text-purple-400', 0),
('cat_emprestimos_financiamentos', 'Empréstimos & Financiamentos', 'text-rose-400', 0),
('cat_manutencao_reparos', 'Manutenção & Reparos', 'text-orange-400', 0),
('cat_telecom_internet', 'Telecom & Internet', 'text-sky-400', 0),
('cat_marketing_vendas', 'Marketing & Vendas', 'text-pink-400', 0),
('cat_tributos_encargos', 'Tributos & Encargos', 'text-red-400', 0),
('cat_software_licencas', 'Software & Licenças', 'text-indigo-400', 0),
('cat_geral', 'Geral', 'text-slate-400', 0);

-- -------------------------------------------------------------
-- 6. MÓDULO FINANCEIRO - CARTÕES DE CRÉDITO CORPORATIVOS PJ
-- -------------------------------------------------------------
DROP TABLE IF EXISTS financial_credit_cards;
CREATE TABLE financial_credit_cards (
  id VARCHAR(64) PRIMARY KEY,
  card_name VARCHAR(100) NOT NULL,
  last_digits VARCHAR(8),
  holder_name VARCHAR(120),
  closing_day INT DEFAULT 25,
  due_day INT DEFAULT 5,
  credit_limit DECIMAL(12,2) DEFAULT 25000.00,
  company_name VARCHAR(150) DEFAULT 'Hospital São Lucas',
  bank_brand VARCHAR(50) DEFAULT 'Nubank',
  color_gradient VARCHAR(120) DEFAULT 'from-purple-600 via-indigo-600 to-blue-600',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_card_company (company_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 6. MÓDULO FINANCEIRO - DESPESAS DO CARTÃO DE CRÉDITO
-- -------------------------------------------------------------
DROP TABLE IF EXISTS credit_card_expenses;
CREATE TABLE credit_card_expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id VARCHAR(64) NOT NULL,
  description VARCHAR(200) NOT NULL,
  supplier VARCHAR(150),
  total_amount DECIMAL(12,2) NOT NULL,
  installments_count INT NOT NULL DEFAULT 1,
  installment_value DECIMAL(12,2) NOT NULL,
  purchase_date DATE NOT NULL,
  first_due_month INT NOT NULL,
  first_due_year INT NOT NULL,
  category VARCHAR(80) DEFAULT 'Geral',
  company_name VARCHAR(150) DEFAULT 'Hospital São Lucas',
  status VARCHAR(40) DEFAULT 'Ativo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cce_card (card_id),
  INDEX idx_cce_comp (first_due_year, first_due_month),
  CONSTRAINT fk_cce_card FOREIGN KEY (card_id) REFERENCES financial_credit_cards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 7. MÓDULO FINANCEIRO - CONTAS A PAGAR DO CRM
-- -------------------------------------------------------------
DROP TABLE IF EXISTS accounts_payable;
CREATE TABLE accounts_payable (
  id VARCHAR(64) PRIMARY KEY,
  code INT,
  description VARCHAR(200) NOT NULL,
  category VARCHAR(80) DEFAULT 'Despesa Operacional',
  supplier VARCHAR(150),
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  competence_month INT NOT NULL,
  competence_year INT NOT NULL,
  installment_number INT DEFAULT 1,
  total_installments INT DEFAULT 1,
  credit_card_expense_id INT,
  company_name VARCHAR(150) DEFAULT 'Hospital São Lucas',
  status VARCHAR(40) DEFAULT 'Pendente',
  paid_amount DECIMAL(12,2) DEFAULT 0.00,
  payment_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ap_comp (competence_year, competence_month),
  INDEX idx_ap_status (status),
  INDEX idx_ap_company (company_name),
  CONSTRAINT fk_ap_cce FOREIGN KEY (credit_card_expense_id) REFERENCES credit_card_expenses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 8. MÓDULO FINANCEIRO - CONTAS A RECEBER DO CRM
-- -------------------------------------------------------------
DROP TABLE IF EXISTS accounts_receivable;
CREATE TABLE accounts_receivable (
  id VARCHAR(64) PRIMARY KEY,
  code INT,
  description VARCHAR(200) NOT NULL,
  client_name VARCHAR(150) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  competence_month INT NOT NULL,
  competence_year INT NOT NULL,
  installment_number INT DEFAULT 1,
  total_installments INT DEFAULT 1,
  company_name VARCHAR(150) DEFAULT 'Hospital São Lucas',
  status VARCHAR(40) DEFAULT 'Pendente',
  received_amount DECIMAL(12,2) DEFAULT 0.00,
  receipt_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ar_comp (competence_year, competence_month),
  INDEX idx_ar_company (company_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
