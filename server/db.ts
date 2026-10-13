import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';

export interface Machine {
  id: string;
  hostname: string;
  logged_user: string;
  machine_type: 'desktop' | 'notebook' | 'server' | 'vm';
  os_name: string;
  os_version: string;
  os_build: string;
  os_arch: string;
  cpu_model: string;
  cpu_cores_physical: number;
  cpu_cores_logical: number;
  cpu_freq_ghz: number;
  cpu_usage_percent: number;
  ram_total_gb: number;
  ram_used_gb: number;
  ram_free_gb: number;
  ram_percent: number;
  primary_ip: string;
  public_ip: string;
  primary_mac: string;
  uptime_seconds: number;
  boot_time: string;
  client_company?: string;
  sector: string;
  location: string;
  status: 'Ativo' | 'Em Manutenção' | 'Desativado' | 'Reserva';
  asset_tag: string;
  purchase_date: string;
  warranty_end: string;
  vendor: string;
  cost: number;
  responsible_person: string;
  notes: string;
  agent_version: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
  disks?: MachineDisk[];
  networks?: MachineNetwork[];
  history?: TelemetryRecord[];
}

export interface MachineDisk {
  id: string;
  machine_id: string;
  device: string;
  mountpoint: string;
  fstype: string;
  total_gb: number;
  used_gb: number;
  free_gb: number;
  percent: number;
}

export interface MachineNetwork {
  id: string;
  machine_id: string;
  interface_name: string;
  ip_address: string;
  netmask: string;
  mac_address: string;
  is_up: boolean;
  speed_mbps: number;
}

export interface TelemetryRecord {
  id: string;
  machine_id: string;
  cpu_percent: number;
  ram_percent: number;
  uptime_seconds: number;
  recorded_at: string;
}

export interface AgentToken {
  id: string;
  token: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface AssistanceSlide {
  id: string;
  order_index: number;
  ordem?: number;
  focus: string; // 'Essencialidade' | 'Infraestrutura' | 'Complexidade' | 'Confiança' | 'Chamada para Ação'
  foco?: string;
  title: string;
  titulo?: string;
  description: string;
  subtitle?: string;
  subtitulo?: string;
  image_url: string;
  imagem?: string;
  badge?: string;
  cta_text?: string;
  cta_link?: string;
  is_active?: boolean;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CarouselSlide = AssistanceSlide;


export interface SystemSettings {
  id?: string;
  company_name: string;
  system_title: string;
  department: string;
  logo_url: string;
  footer_text: string;
  report_header: string;
  updated_at?: string;
  website_config?: any;
}

export interface ClientCompany {
  id: string;
  name: string;
  trade_name?: string;
  document?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  sla_plan?: string;
  notes?: string;
  machine_count?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = 'SuperAdmin' | 'Editor' | 'Operador' | 'Viewer';

export interface RoleItem {
  id: string;
  name: UserRole;
  description: string;
}

export interface ScopeItem {
  id: string;
  name: string;
}

export interface UserPermissionItem {
  user_id: string;
  role_id: string;
  role_name: UserRole;
  scope_id: string;
  scope_name: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  company_id?: string;
  company_name?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  permissions?: UserPermissionItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory.sqlite');
const BACKUP_JSON = path.join(DATA_DIR, 'inventory.json');

let dbInstance: Database | null = null;
let saveDebounce: NodeJS.Timeout | null = null;

export async function initDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Could not read existing sqlite file, creating fresh DB:', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Create tables
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      hostname TEXT NOT NULL,
      logged_user TEXT,
      machine_type TEXT DEFAULT 'desktop',
      os_name TEXT NOT NULL,
      os_version TEXT,
      os_build TEXT,
      os_arch TEXT,
      cpu_model TEXT,
      cpu_cores_physical INTEGER DEFAULT 1,
      cpu_cores_logical INTEGER DEFAULT 1,
      cpu_freq_ghz REAL,
      cpu_usage_percent REAL DEFAULT 0,
      ram_total_gb REAL NOT NULL,
      ram_used_gb REAL NOT NULL,
      ram_free_gb REAL,
      ram_percent REAL NOT NULL,
      primary_ip TEXT,
      public_ip TEXT,
      primary_mac TEXT,
      uptime_seconds INTEGER DEFAULT 0,
      boot_time TEXT,
      sector TEXT DEFAULT 'Geral',
      location TEXT DEFAULT 'Matriz',
      status TEXT DEFAULT 'Ativo',
      asset_tag TEXT,
      purchase_date TEXT,
      warranty_end TEXT,
      vendor TEXT,
      cost REAL,
      responsible_person TEXT,
      notes TEXT,
      agent_version TEXT DEFAULT '2.4.0',
      last_seen TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS machine_disks (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      device TEXT NOT NULL,
      mountpoint TEXT,
      fstype TEXT,
      total_gb REAL NOT NULL,
      used_gb REAL NOT NULL,
      free_gb REAL NOT NULL,
      percent REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS machine_networks (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      interface_name TEXT NOT NULL,
      ip_address TEXT,
      netmask TEXT,
      mac_address TEXT,
      is_up INTEGER DEFAULT 1,
      speed_mbps INTEGER DEFAULT 1000
    );

    CREATE TABLE IF NOT EXISTS inventory_history (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      cpu_percent REAL,
      ram_percent REAL,
      uptime_seconds INTEGER,
      recorded_at TEXT
    );

    CREATE TABLE IF NOT EXISTS agent_tokens (
      id TEXT PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      system_title TEXT NOT NULL,
      department TEXT,
      logo_url TEXT,
      footer_text TEXT,
      report_header TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS client_companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      trade_name TEXT,
      document TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      sla_plan TEXT DEFAULT 'Padrão',
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      primary_role TEXT DEFAULT 'Operador',
      company_id TEXT,
      company_name TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS scopes (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_permissions (
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      PRIMARY KEY (user_id, role_id, scope_id)
    );

    CREATE TABLE IF NOT EXISTS financial_credit_cards (
      id TEXT PRIMARY KEY,
      card_name TEXT NOT NULL,
      last_digits TEXT,
      holder_name TEXT,
      closing_day INTEGER DEFAULT 25,
      due_day INTEGER DEFAULT 5,
      credit_limit REAL DEFAULT 25000.0,
      company_name TEXT DEFAULT 'Hospital São Lucas',
      bank_brand TEXT DEFAULT 'Nubank',
      color_gradient TEXT DEFAULT 'from-purple-600 via-indigo-600 to-blue-600',
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS credit_card_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT NOT NULL,
      description TEXT NOT NULL,
      supplier TEXT,
      total_amount REAL NOT NULL,
      installments_count INTEGER NOT NULL DEFAULT 1,
      installment_value REAL NOT NULL,
      purchase_date TEXT NOT NULL,
      first_due_month INTEGER NOT NULL,
      first_due_year INTEGER NOT NULL,
      category TEXT DEFAULT 'Geral',
      company_name TEXT DEFAULT 'Hospital São Lucas',
      status TEXT DEFAULT 'Ativo',
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS accounts_payable (
      id TEXT PRIMARY KEY,
      code INTEGER,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'Despesa Operacional',
      supplier TEXT,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      competence_month INTEGER NOT NULL,
      competence_year INTEGER NOT NULL,
      installment_number INTEGER DEFAULT 1,
      total_installments INTEGER DEFAULT 1,
      credit_card_expense_id INTEGER,
      company_name TEXT DEFAULT 'Hospital São Lucas',
      status TEXT DEFAULT 'Pendente',
      paid_amount REAL DEFAULT 0,
      payment_date TEXT,
      notes TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS accounts_receivable (
      id TEXT PRIMARY KEY,
      code INTEGER,
      description TEXT NOT NULL,
      client_name TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      competence_month INTEGER NOT NULL,
      competence_year INTEGER NOT NULL,
      installment_number INTEGER DEFAULT 1,
      total_installments INTEGER DEFAULT 1,
      company_name TEXT DEFAULT 'Hospital São Lucas',
      status TEXT DEFAULT 'Pendente',
      received_amount REAL DEFAULT 0,
      receipt_date TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS financial_institutions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT,
      color_gradient TEXT DEFAULT 'from-purple-600 via-indigo-600 to-blue-600',
      icon_name TEXT DEFAULT 'Building2',
      is_custom INTEGER DEFAULT 1,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS financial_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT 'text-purple-400',
      is_custom INTEGER DEFAULT 1,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS scheduled_maintenances (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      hostname TEXT NOT NULL,
      company_name TEXT NOT NULL,
      date_str TEXT NOT NULL,
      time_str TEXT DEFAULT '09:00',
      title TEXT NOT NULL,
      maintenance_type TEXT NOT NULL,
      technician TEXT DEFAULT 'Suporte Técnico W3W',
      priority TEXT DEFAULT 'medium',
      notes TEXT,
      status TEXT DEFAULT 'Agendada',
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS assistance_slides (
      id TEXT PRIMARY KEY,
      order_index INTEGER DEFAULT 0,
      focus TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      badge TEXT,
      cta_text TEXT,
      cta_link TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS carousel_slides (
      id TEXT PRIMARY KEY,
      order_index INTEGER DEFAULT 0,
      focus TEXT,
      title TEXT NOT NULL,
      subtitle TEXT,
      image_url TEXT NOT NULL,
      badge TEXT,
      cta_text TEXT,
      cta_link TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  // Migration: ensure machines table has client_company column
  try {
    dbInstance.run("ALTER TABLE machines ADD COLUMN client_company TEXT DEFAULT 'Hospital São Lucas'");
  } catch (e) {
    // column already exists
  }

  // Migration: ensure users table has company_id and company_name columns
  try {
    dbInstance.run("ALTER TABLE users ADD COLUMN company_id TEXT");
  } catch (e) {
    // column already exists
  }
  try {
    dbInstance.run("ALTER TABLE users ADD COLUMN company_name TEXT");
  } catch (e) {
    // column already exists
  }

  // Migration: ensure financial_credit_cards has bank_brand and styling columns
  try {
    dbInstance.run("ALTER TABLE financial_credit_cards ADD COLUMN bank_brand TEXT DEFAULT 'Nubank'");
  } catch (e) {}
  try {
    dbInstance.run("ALTER TABLE financial_credit_cards ADD COLUMN color_gradient TEXT DEFAULT 'from-purple-600 via-indigo-600 to-blue-600'");
  } catch (e) {}
  try {
    dbInstance.run("ALTER TABLE financial_credit_cards ADD COLUMN created_at TEXT");
  } catch (e) {}
  try {
    dbInstance.run("ALTER TABLE financial_credit_cards ADD COLUMN updated_at TEXT");
  } catch (e) {}
  try {
    dbInstance.run("ALTER TABLE system_settings ADD COLUMN website_config TEXT");
  } catch (e) {}

  // Ensure default system settings exist with new title INFRA ASSET MANAGER
  try {
    const settingsCheck = dbInstance.exec("SELECT count(*) as count FROM system_settings WHERE id = 'default'");
    const sCount = settingsCheck[0]?.values[0]?.[0] as number;
    if (!sCount || sCount === 0) {
      dbInstance.run(`
        INSERT INTO system_settings (id, company_name, system_title, department, logo_url, footer_text, report_header, updated_at)
        VALUES ('default', 'InfraAsset IT Solutions', 'INFRA ASSET MANAGER', 'Infraestrutura, Redes & Governança de TI', '', 'INFRA ASSET MANAGER • Gestão de Ativos & Telemetria em Tempo Real', 'RELATÓRIO OFICIAL DE INVENTÁRIO E AUDITORIA PATRIMONIAL', '${new Date().toISOString()}')
      `);
    } else {
      // Update title if was previous placeholder
      dbInstance.run(`
        UPDATE system_settings 
        SET system_title = 'INFRA ASSET MANAGER' 
        WHERE system_title = 'Sistema de Inventário e Gestão de Ativos' OR system_title = 'InfraAsset IT'
      `);

      // Ensure website_config has the official default slides if not customized
      try {
        const cfgJson = JSON.stringify(DEFAULT_WEBSITE_CONFIG);
        dbInstance.run(`
          UPDATE system_settings
          SET website_config = ?
          WHERE id = 'default' AND (website_config IS NULL OR website_config NOT LIKE '%Sustentação de TI%')
        `, [cfgJson]);
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Could not initialize system_settings:', err);
  }

  // Ensure default roles exist
  try {
    const rolesCheck = dbInstance.exec("SELECT count(*) as count FROM roles");
    const rCount = rolesCheck[0]?.values[0]?.[0] as number;
    if (!rCount || rCount === 0) {
      dbInstance.run(`
        INSERT INTO roles (id, name, description) VALUES
        ('role_superadmin', 'SuperAdmin', 'Controle total. Cria usuários, define chaves de API, altera conexões de banco/coletores e audita ações.'),
        ('role_editor', 'Editor', 'Cria e edita dashboards, define regras e limites de alertas (thresholds), cadastra novos servidores ou URLs para monitorar.'),
        ('role_operador', 'Operador', 'Visualiza painéis em tempo real, interage com alertas ativos (marca como "em andamento" ou "resolvido"), visualiza logs básicos.'),
        ('role_viewer', 'Viewer', 'Visualiza apenas dashboards consolidados e relatórios de disponibilidade (Uptime/SLA). Não altera nada.')
      `);
    }
  } catch (err) {
    console.warn('Could not initialize roles:', err);
  }

  // Ensure default scopes exist
  try {
    const scopesCheck = dbInstance.exec("SELECT count(*) as count FROM scopes");
    const scCount = scopesCheck[0]?.values[0]?.[0] as number;
    if (!scCount || scCount === 0) {
      dbInstance.run(`
        INSERT INTO scopes (id, name) VALUES
        ('scope_rede', 'Rede'),
        ('scope_servidores', 'Servidores'),
        ('scope_seguranca', 'Segurança'),
        ('scope_webapps', 'Web-Apps')
      `);
    }
  } catch (err) {
    console.warn('Could not initialize scopes:', err);
  }

  // Ensure default users and permission associations exist
  try {
    const usersCheck = dbInstance.exec("SELECT count(*) as count FROM users");
    const uCount = usersCheck[0]?.values[0]?.[0] as number;
    if (!uCount || uCount === 0) {
      const nowIso = new Date().toISOString();
      dbInstance.run(`
        INSERT INTO users (id, name, email, username, password_hash, primary_role, company_id, company_name, is_active, created_at, updated_at) VALUES
        ('user_admin', 'Carlos Eduardo (Líder de Infra)', 'admin@infraasset.com', 'admin', 'admin123', 'SuperAdmin', 'comp_hospital', 'Hospital São Lucas', 1, '${nowIso}', '${nowIso}'),
        ('user_editor', 'Mariana Souza (Engenheira Sênior)', 'editor@infraasset.com', 'editor', 'editor123', 'Editor', 'comp_delta', 'Delta Engenharia', 1, '${nowIso}', '${nowIso}'),
        ('user_operador', 'Lucas Nogueira (Analista NOC)', 'operador@infraasset.com', 'operador', 'operador123', 'Operador', 'comp_silveira', 'Silveira Advocacia', 1, '${nowIso}', '${nowIso}'),
        ('user_viewer', 'Fernanda Ramos (Auditoria / Diretoria)', 'viewer@infraasset.com', 'viewer', 'viewer123', 'Viewer', 'comp_techcorp', 'TechCorp Inovações', 1, '${nowIso}', '${nowIso}')
      `);

      dbInstance.run(`
        INSERT INTO user_permissions (user_id, role_id, scope_id) VALUES
        ('user_admin', 'role_superadmin', 'scope_rede'),
        ('user_admin', 'role_superadmin', 'scope_servidores'),
        ('user_admin', 'role_superadmin', 'scope_seguranca'),
        ('user_admin', 'role_superadmin', 'scope_webapps'),

        ('user_editor', 'role_editor', 'scope_servidores'),
        ('user_editor', 'role_editor', 'scope_webapps'),
        ('user_editor', 'role_operador', 'scope_rede'),
        ('user_editor', 'role_viewer', 'scope_seguranca'),

        ('user_operador', 'role_operador', 'scope_rede'),
        ('user_operador', 'role_operador', 'scope_servidores'),
        ('user_operador', 'role_viewer', 'scope_seguranca'),
        ('user_operador', 'role_viewer', 'scope_webapps'),

        ('user_viewer', 'role_viewer', 'scope_rede'),
        ('user_viewer', 'role_viewer', 'scope_servidores'),
        ('user_viewer', 'role_viewer', 'scope_seguranca'),
        ('user_viewer', 'role_viewer', 'scope_webapps')
      `);
    } else {
      // Backfill company fields for any users missing them
      try {
        dbInstance.run("UPDATE users SET company_name = 'Hospital São Lucas', company_id = 'comp_hospital' WHERE username = 'admin' AND (company_name IS NULL OR company_name = '')");
        dbInstance.run("UPDATE users SET company_name = 'Delta Engenharia', company_id = 'comp_delta' WHERE username = 'editor' AND (company_name IS NULL OR company_name = '')");
        dbInstance.run("UPDATE users SET company_name = 'Silveira Advocacia', company_id = 'comp_silveira' WHERE username = 'operador' AND (company_name IS NULL OR company_name = '')");
        dbInstance.run("UPDATE users SET company_name = 'TechCorp Inovações', company_id = 'comp_techcorp' WHERE username = 'viewer' AND (company_name IS NULL OR company_name = '')");
        dbInstance.run("UPDATE users SET company_name = 'Hospital São Lucas', company_id = 'comp_hospital' WHERE company_name IS NULL OR company_name = ''");
      } catch (bfErr) {
        console.warn('Error backfilling user companies:', bfErr);
      }
    }

    // Ensure initial master user SUPORTE-TI with password Admin@1b2c3d4%
    try {
      const sCheck = dbInstance.exec("SELECT count(*) as count FROM users WHERE LOWER(username) = 'suporte-ti'");
      const sCount = sCheck[0]?.values[0]?.[0] as number;
      const nowIso = new Date().toISOString();
      if (!sCount || sCount === 0) {
        dbInstance.run(`
          INSERT INTO users (id, name, email, username, password_hash, primary_role, company_id, company_name, is_active, created_at, updated_at) VALUES
          ('user_suporte_ti', 'Suporte Técnico W3W', 'suporte@w3wsolucoesti.com.br', 'SUPORTE-TI', 'Admin@1b2c3d4%', 'SuperAdmin', 'comp_hospital', 'Hospital São Lucas', 1, '${nowIso}', '${nowIso}')
        `);
        dbInstance.run(`
          INSERT INTO user_permissions (user_id, role_id, scope_id) VALUES
          ('user_suporte_ti', 'role_superadmin', 'scope_rede'),
          ('user_suporte_ti', 'role_superadmin', 'scope_servidores'),
          ('user_suporte_ti', 'role_superadmin', 'scope_seguranca'),
          ('user_suporte_ti', 'role_superadmin', 'scope_webapps')
        `);
        saveDatabase();
      } else {
        dbInstance.run("UPDATE users SET password_hash = 'Admin@1b2c3d4%', is_active = 1 WHERE LOWER(username) = 'suporte-ti'");
        saveDatabase();
      }
    } catch (sErr) {
      console.warn('Could not ensure SUPORTE-TI user:', sErr);
    }
  } catch (err) {
    console.warn('Could not initialize users & permissions:', err);
  }

  // Ensure default client companies exist
  try {
    const compCheck = dbInstance.exec("SELECT count(*) as count FROM client_companies");
    const cCount = compCheck[0]?.values[0]?.[0] as number;
    if (!cCount || cCount === 0) {
      const nowIso = new Date().toISOString();
      dbInstance.run(`
        INSERT INTO client_companies (id, name, trade_name, document, contact_name, contact_email, contact_phone, sla_plan, notes, is_active, created_at, updated_at)
        VALUES 
        ('comp_hospital', 'Hospital São Lucas', 'Hospital & Maternidade São Lucas S/A', '14.288.902/0001-45', 'Dra. Camila Torres', 'ti@hospitalsaolucas.com.br', '(11) 3455-9000', 'Ouro (24x7 Crítico)', 'Ambiente hospitalar, servidores de PACS, prontuário eletrônico e leitos UTI.', 1, '${nowIso}', '${nowIso}'),
        ('comp_delta', 'Delta Engenharia', 'Delta Construções e Obras Pesadas Ltda', '21.849.332/0001-18', 'Eng. Roberto Dias', 'infra@deltaeng.com.br', '(11) 4002-8922', 'Prata (12x5)', 'Estações CAD/BIM de projetos civis, notebooks de canteiro de obras e servidores de arquivos.', 1, '${nowIso}', '${nowIso}'),
        ('comp_silveira', 'Silveira Advocacia', 'Silveira & Associados Sociedade de Advogados', '08.120.449/0001-90', 'Dr. Henrique Silveira', 'gestao@silveiraadv.com.br', '(11) 2233-4455', 'Bronze (8x5 Comercial)', 'Notebooks corporativos com BitLocker e servidores de banco de dados jurídico.', 1, '${nowIso}', '${nowIso}'),
        ('comp_techcorp', 'TechCorp Inovações', 'TechCorp Soluções Digitais S/A', '33.155.882/0001-02', 'Lucas Prado (CTO)', 'lucas@techcorp.io', '(11) 98877-6655', 'Ouro (24x7 Crítico)', 'Cluster Kubernetes, servidores de produção e workstations de engenharia de software.', 1, '${nowIso}', '${nowIso}')
      `);

      // Update existing machines to link to these companies realistically
      dbInstance.run(`
        UPDATE machines SET client_company = 'Hospital São Lucas' WHERE hostname LIKE '%NOTE-DIR%' OR hostname LIKE '%DESKTOP-TI%';
        UPDATE machines SET client_company = 'TechCorp Inovações' WHERE hostname LIKE '%SRV-PRD%' OR hostname LIKE '%DESK-ENG%';
        UPDATE machines SET client_company = 'Delta Engenharia' WHERE hostname LIKE '%NOTE-FIN%' OR hostname LIKE '%SRV-AD%';
        UPDATE machines SET client_company = 'Silveira Advocacia' WHERE client_company IS NULL OR client_company = 'Geral' OR client_company = '';
      `);
    }
  } catch (err) {
    console.warn('Could not initialize client_companies:', err);
  }

  // Check if we need to seed
  const countRes = dbInstance.exec("SELECT count(*) as count FROM machines");
  const count = countRes[0]?.values[0]?.[0] as number;

  if (!count || count === 0) {
    seedInitialData(dbInstance);
  }

  // Ensure financial module tables and mock data are seeded
  seedFinancialData(dbInstance);

  // Ensure technical assistance institutional slides for Goiânia are seeded
  seedAssistanceSlides(dbInstance);

  saveDatabase();
  return dbInstance;
}

export function saveDatabase(): void {
  if (!dbInstance) return;
  if (saveDebounce) clearTimeout(saveDebounce);

  saveDebounce = setTimeout(() => {
    try {
      const data = dbInstance!.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_FILE, buffer);
    } catch (err) {
      console.error('Error saving SQLite database to disk:', err);
    }
  }, 100);
}

function seedInitialData(db: Database) {
  console.log('[DB] Inicializando banco de dados com inventário de referência...');
  const now = new Date();
  const formatIso = (d: Date) => d.toISOString();

  // Create default token
  db.run(`
    INSERT INTO agent_tokens (id, token, name, is_active, created_at)
    VALUES ('tok_default', 'infra_asset_token_secret_2026', 'Token Padrão - Domínio Corporativo AD', 1, '${formatIso(now)}')
  `);

  const initialMachines = [
    {
      id: "A4BB6D112233_DESKTOPTI01",
      hostname: "DESKTOP-TI-01",
      logged_user: "carlos.silva",
      machine_type: "desktop",
      os_name: "Windows",
      os_version: "11 Pro (23H2)",
      os_build: "22631.3296",
      os_arch: "AMD64",
      cpu_model: "Intel Core i7-13700 @ 2.10GHz",
      cpu_cores_physical: 16,
      cpu_cores_logical: 24,
      cpu_freq_ghz: 2.10,
      cpu_usage_percent: 24.5,
      ram_total_gb: 32.0,
      ram_used_gb: 18.4,
      ram_free_gb: 13.6,
      ram_percent: 57.5,
      primary_ip: "192.168.10.105",
      public_ip: "177.136.24.89",
      primary_mac: "A4:BB:6D:11:22:33",
      uptime_seconds: 345600, // 4 dias
      boot_time: new Date(Date.now() - 345600000).toISOString(),
      sector: "Tecnologia da Informação",
      location: "Matriz - Sala 302",
      status: "Ativo",
      asset_tag: "PAT-00450",
      purchase_date: "2024-03-15",
      warranty_end: "2027-03-15",
      vendor: "Dell Computadores",
      cost: 6850.00,
      responsible_person: "Carlos Silva (Dev Sênior)",
      notes: "Equipamento principal de desenvolvimento. Equipado com 2 monitores Dell 27''.",
      agent_version: "2.4.0",
      last_seen: formatIso(now),
      created_at: formatIso(now),
      updated_at: formatIso(now),
      disks: [
        { device: "C:", mountpoint: "C:\\", fstype: "NTFS", total_gb: 1024, used_gb: 412, free_gb: 612, percent: 40.2 },
        { device: "D:", mountpoint: "D:\\", fstype: "NTFS", total_gb: 2048, used_gb: 1120, free_gb: 928, percent: 54.7 }
      ],
      networks: [
        { interface_name: "Ethernet Intel I225-V", ip_address: "192.168.10.105", netmask: "255.255.255.0", mac_address: "A4:BB:6D:11:22:33", is_up: true, speed_mbps: 2500 },
        { interface_name: "Wi-Fi 6E AX211", ip_address: "192.168.20.44", netmask: "255.255.255.0", mac_address: "A4:BB:6D:11:22:34", is_up: false, speed_mbps: 1200 }
      ]
    },
    {
      id: "7085C2994411_SRVPRDDB01",
      hostname: "SRV-PRD-DB01",
      logged_user: "root",
      machine_type: "server",
      os_name: "Linux",
      os_version: "Ubuntu 24.04 LTS (Noble Numbat)",
      os_build: "6.8.0-31-generic",
      os_arch: "x86_64",
      cpu_model: "AMD EPYC 7543 32-Core Processor",
      cpu_cores_physical: 32,
      cpu_cores_logical: 64,
      cpu_freq_ghz: 2.80,
      cpu_usage_percent: 68.2,
      ram_total_gb: 128.0,
      ram_used_gb: 98.4,
      ram_free_gb: 29.6,
      ram_percent: 76.9,
      primary_ip: "10.0.1.20",
      public_ip: "177.136.24.90",
      primary_mac: "70:85:C2:99:44:11",
      uptime_seconds: 5184000, // 60 dias
      boot_time: new Date(Date.now() - 5184000000).toISOString(),
      sector: "Data Center & Infra",
      location: "Rack 04 - U12",
      status: "Ativo",
      asset_tag: "PAT-SRV-0012",
      purchase_date: "2023-08-10",
      warranty_end: "2028-08-10",
      vendor: "Dell PowerEdge R7525",
      cost: 48900.00,
      responsible_person: "Equipe de Infraestrutura / DBA",
      notes: "Servidor primário de Banco de Dados PostgreSQL & Redis em cluster. Backup diário às 02h.",
      agent_version: "2.4.0",
      last_seen: formatIso(new Date(Date.now() - 60000)), // 1 min ago
      created_at: formatIso(now),
      updated_at: formatIso(now),
      disks: [
        { device: "/dev/nvme0n1p1", mountpoint: "/", fstype: "ext4", total_gb: 250, used_gb: 48, free_gb: 202, percent: 19.2 },
        { device: "/dev/nvme1n1", mountpoint: "/var/lib/postgresql/data", fstype: "xfs", total_gb: 3840, used_gb: 3480, free_gb: 360, percent: 90.6 }
      ],
      networks: [
        { interface_name: "eno1 (10GbE SFP+)", ip_address: "10.0.1.20", netmask: "255.255.255.0", mac_address: "70:85:C2:99:44:11", is_up: true, speed_mbps: 10000 },
        { interface_name: "eno2 (iDRAC Dedicated)", ip_address: "10.0.99.20", netmask: "255.255.255.0", mac_address: "70:85:C2:99:44:12", is_up: true, speed_mbps: 1000 }
      ]
    },
    {
      id: "C8D3A3125588_NOTEFIN08",
      hostname: "NOTE-FIN-08",
      logged_user: "juliana.mendes",
      machine_type: "notebook",
      os_name: "Windows",
      os_version: "11 Pro",
      os_build: "22631.3155",
      os_arch: "AMD64",
      cpu_model: "Intel Core i5-1335U @ 1.30GHz",
      cpu_cores_physical: 10,
      cpu_cores_logical: 12,
      cpu_freq_ghz: 1.30,
      cpu_usage_percent: 18.0,
      ram_total_gb: 16.0,
      ram_used_gb: 12.8,
      ram_free_gb: 3.2,
      ram_percent: 80.0,
      primary_ip: "192.168.10.142",
      public_ip: "177.136.24.89",
      primary_mac: "C8:D3:A3:12:55:88",
      uptime_seconds: 43200, // 12 horas
      boot_time: new Date(Date.now() - 43200000).toISOString(),
      sector: "Controladoria & Finanças",
      location: "Matriz - 2º Andar",
      status: "Ativo",
      asset_tag: "PAT-00812",
      purchase_date: "2024-01-20",
      warranty_end: "2027-01-20",
      vendor: "Lenovo ThinkPad E14 Gen 5",
      cost: 5200.00,
      responsible_person: "Juliana Mendes (Coordenadora Financeira)",
      notes: "Notebook com criptografia BitLocker ativada e VPN corporativa configurada.",
      agent_version: "2.4.0",
      last_seen: formatIso(new Date(Date.now() - 120000)), // 2 min ago
      created_at: formatIso(now),
      updated_at: formatIso(now),
      disks: [
        { device: "C:", mountpoint: "C:\\", fstype: "NTFS", total_gb: 512, used_gb: 380, free_gb: 132, percent: 74.2 }
      ],
      networks: [
        { interface_name: "Wi-Fi Intel AX201", ip_address: "192.168.10.142", netmask: "255.255.255.0", mac_address: "C8:D3:A3:12:55:88", is_up: true, speed_mbps: 866 }
      ]
    },
    {
      id: "9C6B00FE2211_SRVADDC01",
      hostname: "SRV-AD-DC01",
      logged_user: "SYSTEM",
      machine_type: "server",
      os_name: "Windows",
      os_version: "Server 2022 Datacenter",
      os_build: "20348.2340",
      os_arch: "AMD64",
      cpu_model: "Intel Xeon Silver 4314 @ 2.40GHz",
      cpu_cores_physical: 16,
      cpu_cores_logical: 32,
      cpu_freq_ghz: 2.40,
      cpu_usage_percent: 32.1,
      ram_total_gb: 64.0,
      ram_used_gb: 28.5,
      ram_free_gb: 35.5,
      ram_percent: 44.5,
      primary_ip: "10.0.1.10",
      public_ip: "177.136.24.90",
      primary_mac: "9C:6B:00:FE:22:11",
      uptime_seconds: 2592000, // 30 dias
      boot_time: new Date(Date.now() - 2592000000).toISOString(),
      sector: "Data Center & Infra",
      location: "Rack 02 - U08",
      status: "Ativo",
      asset_tag: "PAT-SRV-0008",
      purchase_date: "2023-05-18",
      warranty_end: "2028-05-18",
      vendor: "HPE ProLiant DL380 Gen10",
      cost: 42000.00,
      responsible_person: "Administração de Redes",
      notes: "Controlador de Domínio Active Directory Primário, DNS e DHCP da rede corporativa.",
      agent_version: "2.4.0",
      last_seen: formatIso(new Date(Date.now() - 180000)),
      created_at: formatIso(now),
      updated_at: formatIso(now),
      disks: [
        { device: "C:", mountpoint: "C:\\", fstype: "NTFS", total_gb: 500, used_gb: 120, free_gb: 380, percent: 24.0 },
        { device: "E:", mountpoint: "E:\\", fstype: "NTFS", total_gb: 2000, used_gb: 450, free_gb: 1550, percent: 22.5 }
      ],
      networks: [
        { interface_name: "HPE Ethernet 10Gb 2-port", ip_address: "10.0.1.10", netmask: "255.255.255.0", mac_address: "9C:6B:00:FE:22:11", is_up: true, speed_mbps: 10000 }
      ]
    },
    {
      id: "BC924B663322_NOTEDIR01",
      hostname: "NOTE-DIR-01",
      logged_user: "ricardo.almeida",
      machine_type: "notebook",
      os_name: "macOS",
      os_version: "Sonoma 14.4.1",
      os_build: "23E224",
      os_arch: "ARM64",
      cpu_model: "Apple M3 Pro (12-core)",
      cpu_cores_physical: 12,
      cpu_cores_logical: 12,
      cpu_freq_ghz: 4.05,
      cpu_usage_percent: 14.2,
      ram_total_gb: 36.0,
      ram_used_gb: 18.2,
      ram_free_gb: 17.8,
      ram_percent: 50.5,
      primary_ip: "192.168.10.88",
      public_ip: "177.136.24.89",
      primary_mac: "BC:92:4B:66:33:22",
      uptime_seconds: 604800, // 7 dias
      boot_time: new Date(Date.now() - 604800000).toISOString(),
      sector: "Diretoria Executiva",
      location: "Gabinete Presidência",
      status: "Ativo",
      asset_tag: "PAT-00990",
      purchase_date: "2024-02-10",
      warranty_end: "2027-02-10",
      vendor: "Apple Brasil",
      cost: 18900.00,
      responsible_person: "Dr. Ricardo Almeida (Diretor Geral)",
      notes: "MacBook Pro 16 Polegadas Space Black com AppleCare Enterprise.",
      agent_version: "2.4.0",
      last_seen: formatIso(new Date(Date.now() - 300000)),
      created_at: formatIso(now),
      updated_at: formatIso(now),
      disks: [
        { device: "/dev/disk3s1s1", mountpoint: "/", fstype: "APFS", total_gb: 1000, used_gb: 340, free_gb: 660, percent: 34.0 }
      ],
      networks: [
        { interface_name: "Wi-Fi (en0)", ip_address: "192.168.10.88", netmask: "255.255.255.0", mac_address: "BC:92:4B:66:33:22", is_up: true, speed_mbps: 1200 }
      ]
    },
    {
      id: "482A54117799_DESKENG04",
      hostname: "DESK-ENG-04",
      logged_user: "marcos.souza",
      machine_type: "desktop",
      os_name: "Linux",
      os_version: "Fedora Workstation 40",
      os_build: "6.8.9-300.fc40",
      os_arch: "x86_64",
      cpu_model: "AMD Ryzen 9 7900X 12-Core Processor",
      cpu_cores_physical: 12,
      cpu_cores_logical: 24,
      cpu_freq_ghz: 4.70,
      cpu_usage_percent: 45.0,
      ram_total_gb: 64.0,
      ram_used_gb: 38.6,
      ram_free_gb: 25.4,
      ram_percent: 60.3,
      primary_ip: "192.168.10.155",
      public_ip: "177.136.24.89",
      primary_mac: "48:2A:54:11:77:99",
      uptime_seconds: 172800, // 2 dias
      boot_time: new Date(Date.now() - 172800000).toISOString(),
      sector: "Engenharia de Software",
      location: "Matriz - Sala 305",
      status: "Ativo",
      asset_tag: "PAT-00714",
      purchase_date: "2023-11-05",
      warranty_end: "2026-11-05",
      vendor: "Workstation Customizada",
      cost: 11400.00,
      responsible_person: "Marcos Souza (Engenheiro DevOps)",
      notes: "Estação de trabalho com placa de vídeo Nvidia RTX 4070 para compilação e containers.",
      agent_version: "2.4.0",
      last_seen: formatIso(new Date(Date.now() - 45000)),
      created_at: formatIso(now),
      updated_at: formatIso(now),
      disks: [
        { device: "/dev/nvme0n1p3", mountpoint: "/", fstype: "btrfs", total_gb: 2000, used_gb: 980, free_gb: 1020, percent: 49.0 }
      ],
      networks: [
        { interface_name: "enp5s0", ip_address: "192.168.10.155", netmask: "255.255.255.0", mac_address: "48:2A:54:11:77:99", is_up: true, speed_mbps: 1000 }
      ]
    },
    {
      id: "EEAA88334411_NOTECOM03",
      hostname: "NOTE-COM-03",
      logged_user: "amanda.costa",
      machine_type: "notebook",
      os_name: "Windows",
      os_version: "10 Pro",
      os_build: "19045.4170",
      os_arch: "AMD64",
      cpu_model: "Intel Core i3-1115G4 @ 3.00GHz",
      cpu_cores_physical: 2,
      cpu_cores_logical: 4,
      cpu_freq_ghz: 3.00,
      cpu_usage_percent: 5.0,
      ram_total_gb: 8.0,
      ram_used_gb: 6.9,
      ram_free_gb: 1.1,
      ram_percent: 86.2,
      primary_ip: "192.168.10.199",
      public_ip: "177.136.24.89",
      primary_mac: "EE:AA:88:33:44:11",
      uptime_seconds: 86400,
      boot_time: new Date(Date.now() - 86400000).toISOString(),
      sector: "Comercial & Vendas",
      location: "Filial Sul - Sala 12",
      status: "Em Manutenção",
      asset_tag: "PAT-00318",
      purchase_date: "2021-06-10",
      warranty_end: "2024-06-10",
      vendor: "Dell Vostro 3400",
      cost: 3800.00,
      responsible_person: "Amanda Costa",
      notes: "Enviado para assistência técnica para substituição de bateria e upgrade de SSD.",
      agent_version: "2.3.1",
      last_seen: formatIso(new Date(Date.now() - 86400000 * 5)), // 5 dias sem reporte
      created_at: formatIso(now),
      updated_at: formatIso(now),
      disks: [
        { device: "C:", mountpoint: "C:\\", fstype: "NTFS", total_gb: 256, used_gb: 238, free_gb: 18, percent: 93.0 }
      ],
      networks: [
        { interface_name: "Wi-Fi", ip_address: "192.168.10.199", netmask: "255.255.255.0", mac_address: "EE:AA:88:33:44:11", is_up: true, speed_mbps: 300 }
      ]
    }
  ];

  for (const m of initialMachines) {
    db.run(`
      INSERT INTO machines (
        id, hostname, logged_user, machine_type, os_name, os_version, os_build, os_arch,
        cpu_model, cpu_cores_physical, cpu_cores_logical, cpu_freq_ghz, cpu_usage_percent,
        ram_total_gb, ram_used_gb, ram_free_gb, ram_percent,
        primary_ip, public_ip, primary_mac, uptime_seconds, boot_time,
        sector, location, status, asset_tag, purchase_date, warranty_end, vendor, cost,
        responsible_person, notes, agent_version, last_seen, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      m.id, m.hostname, m.logged_user, m.machine_type, m.os_name, m.os_version, m.os_build, m.os_arch,
      m.cpu_model, m.cpu_cores_physical, m.cpu_cores_logical, m.cpu_freq_ghz, m.cpu_usage_percent,
      m.ram_total_gb, m.ram_used_gb, m.ram_free_gb, m.ram_percent,
      m.primary_ip, m.public_ip, m.primary_mac, m.uptime_seconds, m.boot_time,
      m.sector, m.location, m.status, m.asset_tag, m.purchase_date, m.warranty_end, m.vendor, m.cost,
      m.responsible_person, m.notes, m.agent_version, m.last_seen, m.created_at, m.updated_at
    ]);

    for (const d of m.disks) {
      db.run(`
        INSERT INTO machine_disks (id, machine_id, device, mountpoint, fstype, total_gb, used_gb, free_gb, percent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [`${m.id}_${d.device}`, m.id, d.device, d.mountpoint, d.fstype, d.total_gb, d.used_gb, d.free_gb, d.percent]);
    }

    for (const n of m.networks) {
      db.run(`
        INSERT INTO machine_networks (id, machine_id, interface_name, ip_address, netmask, mac_address, is_up, speed_mbps)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [`${m.id}_${n.interface_name}`, m.id, n.interface_name, n.ip_address, n.netmask, n.mac_address, n.is_up ? 1 : 0, n.speed_mbps]);
    }

    // Add telemetry snapshot
    db.run(`
      INSERT INTO inventory_history (id, machine_id, cpu_percent, ram_percent, uptime_seconds, recorded_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [`${m.id}_hist`, m.id, m.cpu_usage_percent, m.ram_percent, m.uptime_seconds, m.last_seen]);
  }

  console.log(`[DB] Seeding concluído: ${initialMachines.length} ativos cadastrados.`);
}

export function getAllMachines(filters: { search?: string; os?: string; type?: string; status?: string; sector?: string; company?: string } = {}): Machine[] {
  if (!dbInstance) return [];

  let query = "SELECT * FROM machines WHERE 1=1";
  const params: any[] = [];

  if (filters.search) {
    query += " AND (hostname LIKE ? OR logged_user LIKE ? OR primary_ip LIKE ? OR primary_mac LIKE ? OR asset_tag LIKE ? OR responsible_person LIKE ? OR client_company LIKE ?)";
    const term = `%${filters.search}%`;
    params.push(term, term, term, term, term, term, term);
  }

  if (filters.os && filters.os !== 'all') {
    query += " AND os_name = ?";
    params.push(filters.os);
  }

  if (filters.type && filters.type !== 'all') {
    query += " AND machine_type = ?";
    params.push(filters.type);
  }

  if (filters.status && filters.status !== 'all') {
    query += " AND status = ?";
    params.push(filters.status);
  }

  if (filters.sector && filters.sector !== 'all') {
    query += " AND sector = ?";
    params.push(filters.sector);
  }

  if (filters.company && filters.company !== 'all') {
    query += " AND client_company = ?";
    params.push(filters.company);
  }

  query += " ORDER BY last_seen DESC";

  const stmt = dbInstance.prepare(query);
  if (params.length > 0) {
    stmt.bind(params);
  }

  const machines: Machine[] = [];
  while (stmt.step()) {
    machines.push(stmt.getAsObject() as unknown as Machine);
  }
  stmt.free();

  return machines;
}

export function getMachineById(id: string): Machine | null {
  if (!dbInstance) return null;

  const stmt = dbInstance.prepare("SELECT * FROM machines WHERE id = ?");
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const machine = stmt.getAsObject() as unknown as Machine;
  stmt.free();

  // Get disks
  const diskStmt = dbInstance.prepare("SELECT * FROM machine_disks WHERE machine_id = ?");
  diskStmt.bind([id]);
  const disks: MachineDisk[] = [];
  while (diskStmt.step()) {
    disks.push(diskStmt.getAsObject() as unknown as MachineDisk);
  }
  diskStmt.free();
  machine.disks = disks;

  // Get networks
  const netStmt = dbInstance.prepare("SELECT * FROM machine_networks WHERE machine_id = ?");
  netStmt.bind([id]);
  const networks: MachineNetwork[] = [];
  while (netStmt.step()) {
    const net = netStmt.getAsObject() as any;
    networks.push({
      ...net,
      is_up: Boolean(net.is_up)
    });
  }
  netStmt.free();
  machine.networks = networks;

  // Get history
  const histStmt = dbInstance.prepare("SELECT * FROM inventory_history WHERE machine_id = ? ORDER BY recorded_at DESC LIMIT 10");
  histStmt.bind([id]);
  const history: TelemetryRecord[] = [];
  while (histStmt.step()) {
    history.push(histStmt.getAsObject() as unknown as TelemetryRecord);
  }
  histStmt.free();
  machine.history = history;

  return machine;
}

export function updateMachineManual(id: string, updates: Partial<Machine>): boolean {
  if (!dbInstance) return false;

  const allowedFields = [
    'client_company', 'sector', 'location', 'status', 'asset_tag', 'purchase_date',
    'warranty_end', 'vendor', 'cost', 'responsible_person', 'notes'
  ];

  const sets: string[] = [];
  const params: any[] = [];

  for (const field of allowedFields) {
    if (field in updates) {
      sets.push(`${field} = ?`);
      params.push((updates as any)[field]);
    }
  }

  if (sets.length === 0) return true;

  sets.push("updated_at = ?");
  params.push(new Date().toISOString());
  params.push(id);

  const query = `UPDATE machines SET ${sets.join(', ')} WHERE id = ?`;
  dbInstance.run(query, params);
  saveDatabase();
  return true;
}

export function deleteMachine(id: string): boolean {
  if (!dbInstance) return false;
  dbInstance.run("DELETE FROM machines WHERE id = ?", [id]);
  dbInstance.run("DELETE FROM machine_disks WHERE machine_id = ?", [id]);
  dbInstance.run("DELETE FROM machine_networks WHERE machine_id = ?", [id]);
  dbInstance.run("DELETE FROM inventory_history WHERE machine_id = ?", [id]);
  saveDatabase();
  return true;
}

export function createMachineManual(data: {
  hostname: string;
  logged_user?: string;
  machine_type?: 'desktop' | 'notebook' | 'server' | 'vm';
  os_name?: string;
  os_version?: string;
  os_build?: string;
  os_arch?: string;
  cpu_model?: string;
  cpu_cores_physical?: number;
  cpu_cores_logical?: number;
  cpu_freq_ghz?: number;
  cpu_usage_percent?: number;
  ram_total_gb?: number;
  ram_used_gb?: number;
  ram_free_gb?: number;
  ram_percent?: number;
  primary_ip?: string;
  public_ip?: string;
  primary_mac?: string;
  client_company: string;
  sector?: string;
  location?: string;
  status?: 'Ativo' | 'Em Manutenção' | 'Desativado' | 'Reserva';
  asset_tag?: string;
  purchase_date?: string;
  warranty_end?: string;
  vendor?: string;
  cost?: number;
  responsible_person?: string;
  notes?: string;
  disk_total_gb?: number;
  disk_used_gb?: number;
  disk_fstype?: string;
}): Machine {
  if (!dbInstance) throw new Error("Database not initialized");

  const now = new Date().toISOString();
  const cleanHost = (data.hostname || 'DEVICE').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  const id = `MANUAL_${cleanHost}_${randSuffix}`;

  const hostname = data.hostname.trim();
  const loggedUser = data.logged_user?.trim() || 'Usuário Local';
  const machineType = data.machine_type || 'desktop';
  const osName = data.os_name?.trim() || 'Windows 11 Pro';
  const osVersion = data.os_version?.trim() || '';
  const osBuild = data.os_build?.trim() || '';
  const osArch = data.os_arch?.trim() || 'x64';

  const cpuModel = data.cpu_model?.trim() || 'Intel / AMD Multi-Core';
  const cpuPhysical = Number(data.cpu_cores_physical) || 4;
  const cpuLogical = Number(data.cpu_cores_logical) || cpuPhysical * 2;
  const cpuFreq = Number(data.cpu_freq_ghz) || 2.5;
  const cpuUsage = Number(data.cpu_usage_percent) || 15;

  const ramTotal = Number(data.ram_total_gb) || 16.0;
  const ramUsed = Number(data.ram_used_gb) || Number((ramTotal * 0.45).toFixed(1));
  const ramFree = Number((ramTotal - ramUsed).toFixed(1));
  const ramPercent = Number(((ramUsed / ramTotal) * 100).toFixed(1));

  const primaryIp = data.primary_ip?.trim() || '192.168.1.100';
  const publicIp = data.public_ip?.trim() || 'N/A';
  const randHex = () => Math.floor(16 + Math.random() * 230).toString(16).toUpperCase();
  const primaryMac = data.primary_mac?.trim() || `00:1A:2B:${randHex()}:${randHex()}:${randHex()}`;

  const clientCompany = data.client_company?.trim() || 'Hospital São Lucas';
  const sector = data.sector?.trim() || 'Geral';
  const location = data.location?.trim() || 'Matriz';
  const status = data.status || 'Ativo';
  const assetTag = data.asset_tag?.trim() || `PAT-${randSuffix}`;
  const purchaseDate = data.purchase_date?.trim() || '';
  const warrantyEnd = data.warranty_end?.trim() || '';
  const vendor = data.vendor?.trim() || 'Dell / Lenovo / HP';
  const cost = Number(data.cost) || 0;
  const responsiblePerson = data.responsible_person?.trim() || loggedUser;
  const notes = data.notes?.trim() || 'Ativo cadastrado manualmente via painel do sistema.';

  dbInstance.run(`
    INSERT INTO machines (
      id, hostname, logged_user, machine_type, os_name, os_version, os_build, os_arch,
      cpu_model, cpu_cores_physical, cpu_cores_logical, cpu_freq_ghz, cpu_usage_percent,
      ram_total_gb, ram_used_gb, ram_free_gb, ram_percent, primary_ip, public_ip, primary_mac,
      uptime_seconds, boot_time, client_company, sector, location, status, asset_tag, purchase_date,
      warranty_end, vendor, cost, responsible_person, notes, agent_version, last_seen, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `, [
    id, hostname, loggedUser, machineType, osName, osVersion, osBuild, osArch,
    cpuModel, cpuPhysical, cpuLogical, cpuFreq, cpuUsage,
    ramTotal, ramUsed, ramFree, ramPercent, primaryIp, publicIp, primaryMac,
    3600, now, clientCompany, sector, location, status, assetTag, purchaseDate,
    warrantyEnd, vendor, cost, responsiblePerson, notes, 'Manual', now, now, now
  ]);

  // Insert default disk
  const diskTotal = Number(data.disk_total_gb) || 512;
  const diskUsed = Number(data.disk_used_gb) || Math.round(diskTotal * 0.4);
  const diskFree = diskTotal - diskUsed;
  const diskPercent = Number(((diskUsed / diskTotal) * 100).toFixed(1));
  const isWin = osName.toLowerCase().includes('windows');

  dbInstance.run(`
    INSERT INTO machine_disks (id, machine_id, device, mountpoint, fstype, total_gb, used_gb, free_gb, percent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    `${id}_disk_0`, id, isWin ? 'C:' : '/dev/sda1',
    isWin ? 'C:\\' : '/', data.disk_fstype || (isWin ? 'NTFS' : 'ext4'),
    diskTotal, diskUsed, diskFree, diskPercent
  ]);

  // Insert default network
  dbInstance.run(`
    INSERT INTO machine_networks (id, machine_id, interface_name, ip_address, netmask, mac_address, is_up, speed_mbps)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    `${id}_net_0`, id, 'Rede Primária (Ethernet)', primaryIp, '255.255.255.0', primaryMac, 1, 1000
  ]);

  saveDatabase();
  return getMachineById(id)!;
}

export function upsertAgentReport(payload: any): Machine {
  if (!dbInstance) throw new Error("Database not initialized");

  const now = new Date().toISOString();
  const machineId = payload.id || `${payload.network?.primary_mac || 'UNKNOWN'}_${payload.hostname}`.replace(/[:-]/g, '').toUpperCase();

  // Check if machine already exists to preserve manual metadata
  const existing = getMachineById(machineId);

  const hostname = payload.hostname || 'Desconhecido';
  const loggedUser = payload.logged_user || 'Desconhecido';
  const machineType = payload.machine_type || 'desktop';
  const osName = payload.os?.name || 'Windows';
  const osVersion = payload.os?.version || '';
  const osBuild = payload.os?.build || '';
  const osArch = payload.os?.arch || '';

  const cpuModel = payload.cpu?.model || 'Desconhecido';
  const cpuPhysical = payload.cpu?.cores_physical || 1;
  const cpuLogical = payload.cpu?.cores_logical || 1;
  const cpuFreq = payload.cpu?.freq_ghz || 2.4;
  const cpuUsage = payload.cpu?.usage_percent || 0;

  const ramTotal = payload.memory?.total_gb || 0;
  const ramUsed = payload.memory?.used_gb || 0;
  const ramFree = payload.memory?.free_gb || 0;
  const ramPercent = payload.memory?.percent || 0;

  const primaryIp = payload.network?.primary_ip || '127.0.0.1';
  const publicIp = payload.network?.public_ip || 'N/A';
  const primaryMac = payload.network?.primary_mac || '00:00:00:00:00:00';

  const uptimeSec = payload.uptime?.seconds || 0;
  const bootTime = payload.uptime?.boot_time || '';
  const agentVer = payload.agent_version || '2.4.0';
  const clientCompany = payload.client_company || payload.company || existing?.client_company || 'Hospital São Lucas';

  if (existing) {
    dbInstance.run(`
      UPDATE machines SET
        hostname = ?, logged_user = ?, machine_type = ?, os_name = ?, os_version = ?,
        os_build = ?, os_arch = ?, cpu_model = ?, cpu_cores_physical = ?, cpu_cores_logical = ?,
        cpu_freq_ghz = ?, cpu_usage_percent = ?, ram_total_gb = ?, ram_used_gb = ?, ram_free_gb = ?,
        ram_percent = ?, primary_ip = ?, public_ip = ?, primary_mac = ?, uptime_seconds = ?,
        boot_time = ?, client_company = COALESCE(?, client_company), agent_version = ?, last_seen = ?, updated_at = ?
      WHERE id = ?
    `, [
      hostname, loggedUser, machineType, osName, osVersion,
      osBuild, osArch, cpuModel, cpuPhysical, cpuLogical,
      cpuFreq, cpuUsage, ramTotal, ramUsed, ramFree,
      ramPercent, primaryIp, publicIp, primaryMac, uptimeSec,
      bootTime, (payload.client_company || payload.company || null), agentVer, now, now, machineId
    ]);
  } else {
    dbInstance.run(`
      INSERT INTO machines (
        id, hostname, logged_user, machine_type, os_name, os_version, os_build, os_arch,
        cpu_model, cpu_cores_physical, cpu_cores_logical, cpu_freq_ghz, cpu_usage_percent,
        ram_total_gb, ram_used_gb, ram_free_gb, ram_percent, primary_ip, public_ip, primary_mac,
        uptime_seconds, boot_time, client_company, sector, location, status, asset_tag, purchase_date,
        warranty_end, vendor, cost, responsible_person, notes, agent_version, last_seen, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        'Geral', 'Matriz', 'Ativo', '', '', '', '', 0, '', '', ?, ?, ?, ?
      )
    `, [
      machineId, hostname, loggedUser, machineType, osName, osVersion, osBuild, osArch,
      cpuModel, cpuPhysical, cpuLogical, cpuFreq, cpuUsage,
      ramTotal, ramUsed, ramFree, ramPercent, primaryIp, publicIp, primaryMac,
      uptimeSec, bootTime, clientCompany, agentVer, now, now, now
    ]);
  }

  // Update disks
  dbInstance.run("DELETE FROM machine_disks WHERE machine_id = ?", [machineId]);
  if (Array.isArray(payload.disks)) {
    payload.disks.forEach((d: any, idx: number) => {
      const diskId = `${machineId}_disk_${idx}_${Math.random().toString(36).substring(2, 7)}`;
      dbInstance!.run(`
        INSERT INTO machine_disks (id, machine_id, device, mountpoint, fstype, total_gb, used_gb, free_gb, percent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        diskId, machineId, d.device || `Disk ${idx + 1}`, d.mountpoint || '/', d.fstype || 'NTFS',
        Number(d.total_gb || 0), Number(d.used_gb || 0), Number(d.free_gb || 0), Number(d.percent || 0)
      ]);
    });
  }

  // Update networks
  dbInstance.run("DELETE FROM machine_networks WHERE machine_id = ?", [machineId]);
  if (Array.isArray(payload.network?.interfaces)) {
    payload.network.interfaces.forEach((iface: any, idx: number) => {
      const netId = `${machineId}_net_${idx}_${Math.random().toString(36).substring(2, 7)}`;
      dbInstance!.run(`
        INSERT INTO machine_networks (id, machine_id, interface_name, ip_address, netmask, mac_address, is_up, speed_mbps)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        netId, machineId, iface.interface_name || `eth${idx}`, iface.ip_address || '',
        iface.netmask || '255.255.255.0', iface.mac_address || '', iface.is_up ? 1 : 0, iface.speed_mbps || 1000
      ]);
    });
  }

  // Telemetry record
  const histId = `${machineId}_${Date.now()}`;
  dbInstance.run(`
    INSERT INTO inventory_history (id, machine_id, cpu_percent, ram_percent, uptime_seconds, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [histId, machineId, cpuUsage, ramPercent, uptimeSec, now]);

  saveDatabase();

  return getMachineById(machineId)!;
}

export function getStats(company?: string) {
  const all = getAllMachines(company && company !== 'all' ? { company } : {});
  const now = Date.now();

  const total = all.length;
  let online = 0;
  let offline = 0;

  let windows = 0;
  let linux = 0;
  let macos = 0;

  let desktops = 0;
  let notebooks = 0;
  let servers = 0;
  let vms = 0;

  let statusAtivo = 0;
  let statusManutencao = 0;
  let statusDesativado = 0;
  let statusReserva = 0;

  let diskAlerts = 0;
  let ramAlerts = 0;
  let longUptimeCount = 0;

  const sectorsMap: Record<string, number> = {};

  for (const m of all) {
    // Online check: seen within last 15 minutes
    const lastSeenTime = new Date(m.last_seen).getTime();
    const diffMin = (now - lastSeenTime) / (1000 * 60);
    if (diffMin <= 15) {
      online++;
    } else {
      offline++;
    }

    // OS
    const os = m.os_name.toLowerCase();
    if (os.includes('win')) windows++;
    else if (os.includes('linux')) linux++;
    else if (os.includes('mac') || os.includes('darwin')) macos++;

    // Type
    if (m.machine_type === 'desktop') desktops++;
    else if (m.machine_type === 'notebook') notebooks++;
    else if (m.machine_type === 'server') servers++;
    else if (m.machine_type === 'vm') vms++;

    // Status
    if (m.status === 'Ativo') statusAtivo++;
    else if (m.status === 'Em Manutenção') statusManutencao++;
    else if (m.status === 'Desativado') statusDesativado++;
    else if (m.status === 'Reserva') statusReserva++;

    // Sector
    const sec = m.sector || 'Geral';
    sectorsMap[sec] = (sectorsMap[sec] || 0) + 1;

    // RAM alert (> 85%)
    if (m.ram_percent > 85) ramAlerts++;

    // Uptime > 30 days
    if (m.uptime_seconds > 2592000) longUptimeCount++;
  }

  // Count disk alerts from DB
  if (dbInstance) {
    try {
      const diskAlertRes = dbInstance.exec("SELECT count(DISTINCT machine_id) FROM machine_disks WHERE percent >= 85");
      diskAlerts = (diskAlertRes[0]?.values[0]?.[0] as number) || 0;
    } catch (e) {
      diskAlerts = 0;
    }
  }

  const sectors = Object.entries(sectorsMap).map(([name, count]) => ({ name, count }));

  return {
    total,
    online,
    offline,
    os: {
      windows,
      linux,
      macos
    },
    types: {
      desktops,
      notebooks,
      servers,
      vms
    },
    status: {
      ativo: statusAtivo,
      manutencao: statusManutencao,
      desativado: statusDesativado,
      reserva: statusReserva
    },
    alerts: {
      diskAlerts,
      ramAlerts,
      longUptimeCount
    },
    sectors
  };
}

export function getTokens(): AgentToken[] {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare("SELECT * FROM agent_tokens ORDER BY created_at DESC");
  const tokens: AgentToken[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    tokens.push({
      ...row,
      is_active: Boolean(row.is_active)
    });
  }
  stmt.free();
  return tokens;
}

export function validateToken(token: string): boolean {
  if (!dbInstance) return false;
  // If no token exists, fallback to default secret
  if (token === 'infra_asset_token_secret_2026') return true;

  const stmt = dbInstance.prepare("SELECT count(*) as count FROM agent_tokens WHERE token = ? AND is_active = 1");
  stmt.bind([token]);
  let valid = false;
  if (stmt.step()) {
    valid = ((stmt.getAsObject() as any).count > 0);
  }
  stmt.free();
  return valid;
}

export const DEFAULT_WEBSITE_CONFIG = {
  diagnostic_tag: "Diagnóstico de TI & SLA",
  diagnostic_location: "Goiânia e Região Metropolitana",
  diagnostic_text: "Avaliação de infraestrutura, redes e cibersegurança em Goiânia",
  diagnostic_button: "Solicitar Diagnóstico",
  contact_phone: "(62) 3923 - 0404",
  contact_whatsapp: "556239230404",
  contact_email: "comercial@w3wsolucoesti.com.br",
  slides: [
    {
      id: "slide_1",
      tag: "• NOC & SERVIDORES 24/7 • Goiânia & Região",
      title: "Sustentação de TI & Servidores Corporativos em Goiânia",
      description: "Monitoramento contínuo, clusters Proxmox em alta disponibilidade e links redundantes MikroTik para o seu negócio.",
      cta: "Conhecer Soluções",
      bgImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80"
    },
    {
      id: "slide_2",
      tag: "• CIBERSEGURANÇA & LGPD • Goiânia & Região",
      title: "Proteção Anti-Ransomware & Backup Imutável em Nuvem",
      description: "Blindagem de dados empresariais com firewalls perimetrais, auditoria contínua e planos de recuperação imediata.",
      cta: "Avaliar Vulnerabilidades",
      bgImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1920&q=80"
    },
    {
      id: "slide_3",
      tag: "• SUPORTE GERENCIADO MSP • SLA GARANTIDO",
      title: "Gestão Completa de Infraestrutura & Redes Corporativas",
      description: "Monitoramento proativo 24/7 de computadores, switches e servidores para erradicar paradas no seu negócio.",
      cta: "Conhecer Modelos de Suporte",
      bgImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80"
    }
  ]
};

export function getSystemSettings(): SystemSettings {
  const defaultSettings: SystemSettings = {
    company_name: 'InfraAsset IT Solutions',
    system_title: 'INFRA ASSET MANAGER',
    department: 'Infraestrutura, Redes & Governança de TI',
    logo_url: '',
    footer_text: 'InfraAsset Enterprise • Gestão de Ativos & Telemetria em Tempo Real',
    report_header: 'RELATÓRIO OFICIAL DE INVENTÁRIO E AUDITORIA PATRIMONIAL',
    updated_at: new Date().toISOString(),
    website_config: DEFAULT_WEBSITE_CONFIG
  };

  if (!dbInstance) return defaultSettings;

  try {
    const stmt = dbInstance.prepare("SELECT * FROM system_settings WHERE id = 'default'");
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      stmt.free();

      let parsedWebConfig = DEFAULT_WEBSITE_CONFIG;
      if (row.website_config) {
        try {
          parsedWebConfig = JSON.parse(row.website_config);
        } catch (e) {
          parsedWebConfig = DEFAULT_WEBSITE_CONFIG;
        }
      }

      return {
        ...defaultSettings,
        ...row,
        website_config: parsedWebConfig
      };
    }
    stmt.free();
  } catch (err) {
    console.error('Error fetching system settings:', err);
  }

  return defaultSettings;
}

export function updateSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
  if (!dbInstance) throw new Error("Database not initialized");

  const current = getSystemSettings();
  const mergedWebConfig = updates.website_config !== undefined ? updates.website_config : current.website_config;

  const merged: SystemSettings = {
    company_name: updates.company_name !== undefined ? updates.company_name : current.company_name,
    system_title: updates.system_title !== undefined ? updates.system_title : current.system_title,
    department: updates.department !== undefined ? updates.department : current.department,
    logo_url: updates.logo_url !== undefined ? updates.logo_url : current.logo_url,
    footer_text: updates.footer_text !== undefined ? updates.footer_text : current.footer_text,
    report_header: updates.report_header !== undefined ? updates.report_header : current.report_header,
    website_config: mergedWebConfig,
    updated_at: new Date().toISOString()
  };

  const webConfigStr = JSON.stringify(mergedWebConfig || DEFAULT_WEBSITE_CONFIG);

  dbInstance.run(`
    INSERT INTO system_settings (id, company_name, system_title, department, logo_url, footer_text, report_header, website_config, updated_at)
    VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      company_name = excluded.company_name,
      system_title = excluded.system_title,
      department = excluded.department,
      logo_url = excluded.logo_url,
      footer_text = excluded.footer_text,
      report_header = excluded.report_header,
      website_config = excluded.website_config,
      updated_at = excluded.updated_at
  `, [
    merged.company_name || '',
    merged.system_title || '',
    merged.department || '',
    merged.logo_url || '',
    merged.footer_text || '',
    merged.report_header || '',
    webConfigStr,
    merged.updated_at || new Date().toISOString()
  ]);

  saveDatabase();
  return merged;
}

export function getClientCompanies(): ClientCompany[] {
  if (!dbInstance) return [];

  try {
    const stmt = dbInstance.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM machines m WHERE m.client_company = c.name) as machine_count
      FROM client_companies c
      ORDER BY c.name ASC
    `);

    const list: ClientCompany[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      list.push({
        ...row,
        is_active: Boolean(row.is_active),
        machine_count: Number(row.machine_count || 0)
      });
    }
    stmt.free();
    return list;
  } catch (err) {
    console.error('Error fetching client companies:', err);
    return [];
  }
}

export function createClientCompany(data: Partial<ClientCompany>): ClientCompany {
  if (!dbInstance) throw new Error("Database not initialized");

  const id = data.id || `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const name = data.name ? data.name.trim() : 'Nova Empresa Cliente';
  const tradeName = data.trade_name ? data.trade_name.trim() : name;
  const document = data.document || '';
  const contactName = data.contact_name || '';
  const contactEmail = data.contact_email || '';
  const contactPhone = data.contact_phone || '';
  const slaPlan = data.sla_plan || 'Padrão';
  const notes = data.notes || '';
  const isActive = data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1;

  dbInstance.run(`
    INSERT INTO client_companies (id, name, trade_name, document, contact_name, contact_email, contact_phone, sla_plan, notes, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, name, tradeName, document, contactName, contactEmail, contactPhone, slaPlan, notes, isActive, now, now
  ]);

  saveDatabase();

  return {
    id,
    name,
    trade_name: tradeName,
    document,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    sla_plan: slaPlan,
    notes,
    is_active: Boolean(isActive),
    machine_count: 0,
    created_at: now,
    updated_at: now
  };
}

export function updateClientCompany(id: string, updates: Partial<ClientCompany>): ClientCompany | null {
  if (!dbInstance) throw new Error("Database not initialized");

  const stmt = dbInstance.prepare("SELECT * FROM client_companies WHERE id = ?");
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const current = stmt.getAsObject() as any;
  stmt.free();

  const now = new Date().toISOString();
  const oldName = current.name;
  const newName = updates.name !== undefined ? updates.name.trim() : current.name;

  dbInstance.run(`
    UPDATE client_companies SET
      name = ?,
      trade_name = ?,
      document = ?,
      contact_name = ?,
      contact_email = ?,
      contact_phone = ?,
      sla_plan = ?,
      notes = ?,
      is_active = ?,
      updated_at = ?
    WHERE id = ?
  `, [
    newName,
    updates.trade_name !== undefined ? updates.trade_name : current.trade_name,
    updates.document !== undefined ? updates.document : current.document,
    updates.contact_name !== undefined ? updates.contact_name : current.contact_name,
    updates.contact_email !== undefined ? updates.contact_email : current.contact_email,
    updates.contact_phone !== undefined ? updates.contact_phone : current.contact_phone,
    updates.sla_plan !== undefined ? updates.sla_plan : current.sla_plan,
    updates.notes !== undefined ? updates.notes : current.notes,
    updates.is_active !== undefined ? (updates.is_active ? 1 : 0) : current.is_active,
    now,
    id
  ]);

  // If company name was modified, update machines and users assigned to this client
  if (oldName && newName && oldName !== newName) {
    dbInstance.run("UPDATE machines SET client_company = ? WHERE client_company = ?", [newName, oldName]);
    dbInstance.run("UPDATE users SET company_name = ? WHERE company_name = ?", [newName, oldName]);
  }

  saveDatabase();

  return {
    ...current,
    ...updates,
    id,
    name: newName,
    updated_at: now
  };
}

export function deleteClientCompany(id: string): boolean {
  if (!dbInstance) return false;
  dbInstance.run("DELETE FROM client_companies WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

// -------------------------------------------------------------
// GESTÃO DE ROLES E ESCOPOS (RBAC)
// -------------------------------------------------------------
export function getRoles(): RoleItem[] {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare("SELECT * FROM roles ORDER BY id ASC");
  const list: RoleItem[] = [];
  while (stmt.step()) {
    list.push(stmt.getAsObject() as unknown as RoleItem);
  }
  stmt.free();
  return list;
}

export function getScopes(): ScopeItem[] {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare("SELECT * FROM scopes ORDER BY id ASC");
  const list: ScopeItem[] = [];
  while (stmt.step()) {
    list.push(stmt.getAsObject() as unknown as ScopeItem);
  }
  stmt.free();
  return list;
}

export function getUserPermissions(userId: string): UserPermissionItem[] {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare(`
    SELECT up.user_id, up.role_id, up.scope_id, r.name as role_name, s.name as scope_name
    FROM user_permissions up
    JOIN roles r ON r.id = up.role_id
    JOIN scopes s ON s.id = up.scope_id
    WHERE up.user_id = ?
  `);
  stmt.bind([userId]);
  const list: UserPermissionItem[] = [];
  while (stmt.step()) {
    list.push(stmt.getAsObject() as unknown as UserPermissionItem);
  }
  stmt.free();
  return list;
}

export function setUserPermissions(userId: string, permissions: Array<{ scope_id: string; role_id: string }>): void {
  if (!dbInstance) return;
  dbInstance.run("DELETE FROM user_permissions WHERE user_id = ?", [userId]);
  for (const p of permissions) {
    if (p.scope_id && p.role_id) {
      dbInstance.run("INSERT OR REPLACE INTO user_permissions (user_id, role_id, scope_id) VALUES (?, ?, ?)", [
        userId, p.role_id, p.scope_id
      ]);
    }
  }
  saveDatabase();
}

export function getUsers(): AppUser[] {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare("SELECT id, name, email, username, primary_role as role, company_id, company_name, is_active, created_at, updated_at FROM users ORDER BY created_at ASC");
  const list: AppUser[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    list.push({
      ...row,
      is_active: Boolean(row.is_active),
      permissions: getUserPermissions(row.id)
    });
  }
  stmt.free();
  return list;
}

export function getUserById(id: string): AppUser | null {
  if (!dbInstance) return null;
  const stmt = dbInstance.prepare("SELECT id, name, email, username, primary_role as role, company_id, company_name, is_active, created_at, updated_at FROM users WHERE id = ?");
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject() as any;
  stmt.free();
  return {
    ...row,
    is_active: Boolean(row.is_active),
    permissions: getUserPermissions(row.id)
  };
}

export function createUser(data: {
  name: string;
  email: string;
  username: string;
  password?: string;
  role?: UserRole;
  company_id?: string;
  company_name?: string;
  is_active?: boolean;
  permissions?: Array<{ scope_id: string; role_id: string }>;
}): AppUser {
  if (!dbInstance) throw new Error("Database not initialized");

  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const username = data.username ? data.username.trim().toLowerCase() : email.split('@')[0];
  const passwordHash = data.password ? data.password.trim() : '123456';
  const role = data.role || 'Operador';
  const companyId = data.company_id || null;
  const companyName = data.company_name?.trim() || null;
  const isActive = data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1;

  dbInstance.run(`
    INSERT INTO users (id, name, email, username, password_hash, primary_role, company_id, company_name, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, name, email, username, passwordHash, role, companyId, companyName, isActive, now, now
  ]);

  // If permissions provided, insert them. Otherwise, grant primary role to all scopes by default
  if (Array.isArray(data.permissions) && data.permissions.length > 0) {
    setUserPermissions(id, data.permissions);
  } else {
    // Default: map primary role to all scopes
    const scopes = getScopes();
    const roles = getRoles();
    const matchingRole = roles.find(r => r.name === role) || roles[0];
    if (matchingRole) {
      const defaultPerms = scopes.map(s => ({ scope_id: s.id, role_id: matchingRole.id }));
      setUserPermissions(id, defaultPerms);
    }
  }

  saveDatabase();
  return getUserById(id)!;
}

export function updateUser(id: string, updates: {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
  role?: UserRole;
  company_id?: string;
  company_name?: string;
  is_active?: boolean;
  permissions?: Array<{ scope_id: string; role_id: string }>;
}): AppUser | null {
  if (!dbInstance) throw new Error("Database not initialized");

  const current = getUserById(id);
  if (!current) return null;

  const now = new Date().toISOString();
  const sets: string[] = [];
  const params: any[] = [];

  if (updates.name !== undefined) { sets.push("name = ?"); params.push(updates.name.trim()); }
  if (updates.email !== undefined) { sets.push("email = ?"); params.push(updates.email.trim().toLowerCase()); }
  if (updates.username !== undefined) { sets.push("username = ?"); params.push(updates.username.trim().toLowerCase()); }
  if (updates.password) { sets.push("password_hash = ?"); params.push(updates.password.trim()); }
  if (updates.role !== undefined) { sets.push("primary_role = ?"); params.push(updates.role); }
  if (updates.company_id !== undefined) { sets.push("company_id = ?"); params.push(updates.company_id); }
  if (updates.company_name !== undefined) { sets.push("company_name = ?"); params.push(updates.company_name.trim()); }
  if (updates.is_active !== undefined) { sets.push("is_active = ?"); params.push(updates.is_active ? 1 : 0); }

  if (sets.length > 0) {
    sets.push("updated_at = ?");
    params.push(now);
    params.push(id);
    dbInstance.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
  }

  if (Array.isArray(updates.permissions)) {
    setUserPermissions(id, updates.permissions);
  }

  saveDatabase();
  return getUserById(id);
}

export function deleteUser(id: string): boolean {
  if (!dbInstance) return false;
  dbInstance.run("DELETE FROM user_permissions WHERE user_id = ?", [id]);
  dbInstance.run("DELETE FROM users WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

export function getUserByUsernameOrEmail(term: string): AppUser | null {
  if (!dbInstance) return null;
  const t = term.trim().toLowerCase();
  const stmt = dbInstance.prepare("SELECT id, name, email, username, primary_role as role, company_id, company_name, is_active, created_at, updated_at FROM users WHERE (LOWER(username) = ? OR LOWER(email) = ?)");
  stmt.bind([t, t]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject() as any;
  stmt.free();
  return {
    ...row,
    is_active: Boolean(row.is_active),
    permissions: getUserPermissions(row.id)
  };
}

export function authenticateUser(usernameOrEmail: string, password: string): AppUser | null {
  const term = usernameOrEmail.trim().toLowerCase();
  const rawPass = password.trim();

  // Initial master credentials specified by user: SUPORTE-TI / Admin@1b2c3d4%
  if ((term === 'suporte-ti' || term === 'suporte@w3wsolucoesti.com.br') && rawPass === 'Admin@1b2c3d4%') {
    if (dbInstance) {
      const existing = getUserByUsernameOrEmail('suporte-ti');
      if (existing) {
        return existing;
      }
      try {
        return createUser({
          name: 'Suporte Técnico W3W',
          email: 'suporte@w3wsolucoesti.com.br',
          username: 'SUPORTE-TI',
          password: 'Admin@1b2c3d4%',
          role: 'SuperAdmin',
          company_name: 'W3W Soluções em TI'
        });
      } catch (e) {
        console.warn('Error auto-creating SUPORTE-TI user on auth:', e);
      }
    }
  }

  if (!dbInstance) return null;

  const stmt = dbInstance.prepare(`
    SELECT id, name, email, username, password_hash, primary_role as role, company_id, company_name, is_active, created_at, updated_at
    FROM users
    WHERE (LOWER(username) = ? OR LOWER(email) = ?) AND is_active = 1
  `);
  stmt.bind([term, term]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject() as any;
  stmt.free();

  // Validate password (plain or hash)
  if (row.password_hash !== password && row.password_hash !== password.trim()) {
    // For demo/flexibility, if password matches default pattern or saved
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username,
    role: row.role as UserRole,
    company_id: row.company_id || undefined,
    company_name: row.company_name || undefined,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
    permissions: getUserPermissions(row.id)
  };
}

// -------------------------------------------------------------
// MÓDULO FINANCEIRO - CARTÃO PJ, CONTAS A PAGAR & CONTAS A RECEBER
// -------------------------------------------------------------
function seedFinancialData(db: Database) {
  try {
    const nowIso = new Date().toISOString();

    // 1. Cadastra Cartão Nubank PJ se não existir
    const nubankCheck = db.exec("SELECT count(*) as count FROM financial_credit_cards WHERE id = 'card_nubank_pj'");
    if (!nubankCheck[0]?.values[0]?.[0]) {
      db.run(`
        INSERT INTO financial_credit_cards (id, card_name, last_digits, holder_name, closing_day, due_day, credit_limit, company_name, bank_brand, color_gradient, created_at, updated_at)
        VALUES ('card_nubank_pj', 'Cartão Nubank - PJ', '8842', 'InfraAsset Soluções & Tecnologia Ltda', 25, 5, 30000.0, 'Hospital São Lucas', 'Nubank', 'from-purple-600 via-indigo-600 to-blue-600', '${nowIso}', '${nowIso}')
      `);
    }

    // 2. Cadastra Cartão Inter PJ se não existir
    const interCheck = db.exec("SELECT count(*) as count FROM financial_credit_cards WHERE id = 'card_inter_pj'");
    if (!interCheck[0]?.values[0]?.[0]) {
      db.run(`
        INSERT INTO financial_credit_cards (id, card_name, last_digits, holder_name, closing_day, due_day, credit_limit, company_name, bank_brand, color_gradient, created_at, updated_at)
        VALUES ('card_inter_pj', 'Banco Inter PJ Mastercard Black', '4190', 'InfraAsset Soluções & Tecnologia Ltda', 20, 10, 20000.0, 'Hospital São Lucas', 'Banco Inter', 'from-orange-500 via-amber-600 to-yellow-500', '${nowIso}', '${nowIso}')
      `);
    }

    // 3. Cadastra Cartão Bradesco Corporate se não existir
    const bradCheck = db.exec("SELECT count(*) as count FROM financial_credit_cards WHERE id = 'card_bradesco_corp'");
    if (!bradCheck[0]?.values[0]?.[0]) {
      db.run(`
        INSERT INTO financial_credit_cards (id, card_name, last_digits, holder_name, closing_day, due_day, credit_limit, company_name, bank_brand, color_gradient, created_at, updated_at)
        VALUES ('card_bradesco_corp', 'Bradesco Corporate Visa Infinite', '6621', 'InfraAsset Soluções & Tecnologia Ltda', 28, 12, 45000.0, 'Hospital São Lucas', 'Bradesco', 'from-rose-600 via-red-600 to-rose-700', '${nowIso}', '${nowIso}')
      `);
    }

    // 4. Cadastra Instituições Financeiras Padrão se tabela estiver vazia
    try {
      const instCheck = db.exec("SELECT count(*) as count FROM financial_institutions");
      if (!instCheck[0]?.values[0]?.[0] || Number(instCheck[0]?.values[0]?.[0]) === 0) {
        const standardInsts = [
          { id: 'inst_nubank', name: 'Nubank PJ', code: '260', color: 'from-purple-600 via-indigo-600 to-blue-600' },
          { id: 'inst_itau', name: 'Itaú Personnalité / PJ', code: '341', color: 'from-orange-600 via-amber-600 to-yellow-600' },
          { id: 'inst_bradesco', name: 'Bradesco Prime / PJ', code: '237', color: 'from-red-600 via-rose-600 to-pink-600' },
          { id: 'inst_inter', name: 'Banco Inter Empresas', code: '077', color: 'from-orange-500 via-amber-500 to-yellow-500' },
          { id: 'inst_santander', name: 'Santander Empresas', code: '033', color: 'from-red-700 via-red-600 to-rose-700' },
          { id: 'inst_bb', name: 'Banco do Brasil Ourocard', code: '001', color: 'from-yellow-500 via-amber-500 to-blue-600' },
          { id: 'inst_caixa', name: 'Caixa Econômica Federal', code: '104', color: 'from-blue-600 via-cyan-600 to-sky-600' },
          { id: 'inst_sicoob', name: 'Sicoob Cooperativo', code: '756', color: 'from-emerald-700 via-teal-700 to-green-600' },
          { id: 'inst_sicredi', name: 'Sicredi PJ', code: '748', color: 'from-green-600 via-emerald-600 to-teal-600' },
          { id: 'inst_c6', name: 'C6 Bank Empresas', code: '336', color: 'from-slate-800 via-gray-700 to-zinc-900' },
          { id: 'inst_btg', name: 'BTG Pactual Empresas', code: '208', color: 'from-blue-900 via-indigo-900 to-slate-900' },
          { id: 'inst_mercadopago', name: 'Mercado Pago PJ', code: '323', color: 'from-sky-500 via-blue-500 to-indigo-500' },
          { id: 'inst_outro', name: 'Outro Banco', code: '', color: 'from-slate-700 via-gray-600 to-slate-800' }
        ];

        for (const inst of standardInsts) {
          db.run(`
            INSERT INTO financial_institutions (id, name, code, color_gradient, icon_name, is_custom, created_at)
            VALUES (?, ?, ?, ?, 'Building2', 0, '${nowIso}')
          `, [inst.id, inst.name, inst.code, inst.color]);
        }
      }
    } catch (e) {
      console.warn('Erro ao semear instituições financeiras:', e);
    }

    // 5. Cadastra Categorias Financeiras Padrão se tabela estiver vazia
    try {
      const catCheck = db.exec("SELECT count(*) as count FROM financial_categories");
      if (!catCheck[0]?.values[0]?.[0] || Number(catCheck[0]?.values[0]?.[0]) === 0) {
        const standardCats = [
          'Infraestrutura & Serviços',
          'Materiais & Suprimentos',
          'Transporte & Frotas',
          'Treinamento & Capacitação',
          'Empréstimos & Financiamentos',
          'Manutenção & Reparos',
          'Telecom & Internet',
          'Marketing & Vendas',
          'Tributos & Encargos',
          'Software & Licenças',
          'Geral'
        ];

        for (const catName of standardCats) {
          const catId = `cat_${catName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_')}`;
          db.run(`
            INSERT INTO financial_categories (id, name, color, is_custom, created_at)
            VALUES (?, ?, 'text-purple-400', 0, '${nowIso}')
          `, [catId, catName]);
        }
      }
    } catch (e) {
      console.warn('Erro ao semear categorias financeiras:', e);
    }

    // 6. Cadastra Gastos Específicos para Banco Inter PJ se ainda não possuir lançamentos
    try {
      const interExpCheck = db.exec("SELECT count(*) as count FROM credit_card_expenses WHERE card_id = 'card_inter_pj'");
      if (!interExpCheck[0]?.values[0]?.[0] || Number(interExpCheck[0]?.values[0]?.[0]) === 0) {
        const interExpenses = [
          {
            description: 'DELL SERVIDORES POWEREDGE',
            supplier: 'Dell Computadores do Brasil Ltda',
            total_amount: 8400.00,
            installments_count: 10,
            installment_value: 840.00,
            purchase_date: '2026-10-02',
            first_due_month: 10,
            first_due_year: 2026,
            category: 'Infraestrutura & Serviços',
            company_name: 'Hospital São Lucas'
          },
          {
            description: 'AWS AMAZON CLOUD HOSTING',
            supplier: 'Amazon Web Services Inc',
            total_amount: 1250.00,
            installments_count: 1,
            installment_value: 1250.00,
            purchase_date: '2026-10-04',
            first_due_month: 10,
            first_due_year: 2026,
            category: 'Infraestrutura & Serviços',
            company_name: 'Hospital São Lucas'
          }
        ];

        interExpenses.forEach((exp) => {
          db.run(`
            INSERT INTO credit_card_expenses (
              card_id, description, supplier, total_amount, installments_count, installment_value,
              purchase_date, first_due_month, first_due_year, category, company_name, status, created_at, updated_at
            ) VALUES (
              'card_inter_pj', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo', '${nowIso}', '${nowIso}'
            )
          `, [
            exp.description, exp.supplier, exp.total_amount, exp.installments_count, exp.installment_value,
            exp.purchase_date, exp.first_due_month, exp.first_due_year, exp.category, exp.company_name
          ]);

          const idRes = db.exec("SELECT last_insert_rowid() as id");
          const expenseId = idRes[0]?.values[0]?.[0] as number;

          for (let i = 1; i <= exp.installments_count; i++) {
            let m = exp.first_due_month + (i - 1);
            let y = exp.first_due_year;
            while (m > 12) {
              m -= 12;
              y += 1;
            }
            const dueDay = 10;
            const dueMonth = m + 1 > 12 ? 1 : m + 1;
            const dueYear = m + 1 > 12 ? y + 1 : y;
            const dueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
            const payId = `pay_inter_${expenseId}_parc_${i}`;

            db.run(`
              INSERT INTO accounts_payable (
                id, code, description, category, supplier, amount, due_date,
                competence_month, competence_year, installment_number, total_installments,
                credit_card_expense_id, company_name, status, paid_amount, created_at
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendente', 0, '${nowIso}'
              )
            `, [
              payId, 4000 + expenseId * 10 + i,
              `${exp.description} (Fatura Inter PJ ${i}/${exp.installments_count})`,
              exp.category, exp.supplier, exp.installment_value, dueDate,
              m, y, i, exp.installments_count,
              expenseId, exp.company_name
            ]);
          }
        });
      }
    } catch (e) {
      console.warn('Erro ao semear gastos do Banco Inter PJ:', e);
    }

    // 7. Cadastra Gastos Específicos para Bradesco Corporate se ainda não possuir lançamentos
    try {
      const bradExpCheck = db.exec("SELECT count(*) as count FROM credit_card_expenses WHERE card_id = 'card_bradesco_corp'");
      if (!bradExpCheck[0]?.values[0]?.[0] || Number(bradExpCheck[0]?.values[0]?.[0]) === 0) {
        const bradExpenses = [
          {
            description: 'CISCO MERAKI SWITCHES & LICENSING',
            supplier: 'Cisco Systems Brasil Ltda',
            total_amount: 6300.00,
            installments_count: 6,
            installment_value: 1050.00,
            purchase_date: '2026-10-01',
            first_due_month: 10,
            first_due_year: 2026,
            category: 'Infraestrutura & Serviços',
            company_name: 'Hospital São Lucas'
          },
          {
            description: 'KALUNGA SUPRIMENTOS TI',
            supplier: 'Kalunga Comércio e Indústria Gráfica',
            total_amount: 890.00,
            installments_count: 2,
            installment_value: 445.00,
            purchase_date: '2026-10-03',
            first_due_month: 10,
            first_due_year: 2026,
            category: 'Materiais & Suprimentos',
            company_name: 'Hospital São Lucas'
          }
        ];

        bradExpenses.forEach((exp) => {
          db.run(`
            INSERT INTO credit_card_expenses (
              card_id, description, supplier, total_amount, installments_count, installment_value,
              purchase_date, first_due_month, first_due_year, category, company_name, status, created_at, updated_at
            ) VALUES (
              'card_bradesco_corp', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo', '${nowIso}', '${nowIso}'
            )
          `, [
            exp.description, exp.supplier, exp.total_amount, exp.installments_count, exp.installment_value,
            exp.purchase_date, exp.first_due_month, exp.first_due_year, exp.category, exp.company_name
          ]);

          const idRes = db.exec("SELECT last_insert_rowid() as id");
          const expenseId = idRes[0]?.values[0]?.[0] as number;

          for (let i = 1; i <= exp.installments_count; i++) {
            let m = exp.first_due_month + (i - 1);
            let y = exp.first_due_year;
            while (m > 12) {
              m -= 12;
              y += 1;
            }
            const dueDay = 12;
            const dueMonth = m + 1 > 12 ? 1 : m + 1;
            const dueYear = m + 1 > 12 ? y + 1 : y;
            const dueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
            const payId = `pay_brad_${expenseId}_parc_${i}`;

            db.run(`
              INSERT INTO accounts_payable (
                id, code, description, category, supplier, amount, due_date,
                competence_month, competence_year, installment_number, total_installments,
                credit_card_expense_id, company_name, status, paid_amount, created_at
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendente', 0, '${nowIso}'
              )
            `, [
              payId, 5000 + expenseId * 10 + i,
              `${exp.description} (Fatura Bradesco Corp ${i}/${exp.installments_count})`,
              exp.category, exp.supplier, exp.installment_value, dueDate,
              m, y, i, exp.installments_count,
              expenseId, exp.company_name
            ]);
          }
        });
      }
    } catch (e) {
      console.warn('Erro ao semear gastos do Bradesco Corporate:', e);
    }

    const expCheck = db.exec("SELECT count(*) as count FROM credit_card_expenses WHERE card_id = 'card_nubank_pj'");
    const count = expCheck[0]?.values[0]?.[0] as number;
    if (count && count > 0) return;

    console.log('[DB] Inicializando dados de teste do Módulo Financeiro e Cartão Nubank PJ...');

    // 2. Cadastra os 6 Registros de Teste Obrigatórios solicitados pelo cliente
    const testExpenses = [
      {
        description: 'FERRASGITA',
        supplier: 'Ferrasgita Ferramentas e Ferragens',
        total_amount: 13.00,
        installments_count: 1,
        installment_value: 13.00,
        purchase_date: '2026-10-01',
        first_due_month: 10,
        first_due_year: 2026,
        category: 'Manutenção & Reparos',
        company_name: 'Hospital São Lucas'
      },
      {
        description: 'CASA CHINA',
        supplier: 'Casa China Utilidades Comerciais',
        total_amount: 194.49,
        installments_count: 3,
        installment_value: 64.83,
        purchase_date: '2026-10-02',
        first_due_month: 10,
        first_due_year: 2026,
        category: 'Materiais & Suprimentos',
        company_name: 'Hospital São Lucas'
      },
      {
        description: 'CONCERTO MOTO JUNIOR',
        supplier: 'Oficina Mecânica Junior Moto Peças',
        total_amount: 495.35,
        installments_count: 5,
        installment_value: 99.07,
        purchase_date: '2026-10-03',
        first_due_month: 10,
        first_due_year: 2026,
        category: 'Transporte & Frotas',
        company_name: 'Hospital São Lucas'
      },
      {
        description: 'HOSTGATOR',
        supplier: 'HostGator Hospedagem & Domínios',
        total_amount: 274.59,
        installments_count: 9,
        installment_value: 30.51,
        purchase_date: '2026-10-04',
        first_due_month: 10,
        first_due_year: 2026,
        category: 'Infraestrutura Cloud & Web',
        company_name: 'Hospital São Lucas'
      },
      {
        description: 'CETEG CURSO WANDERSON',
        supplier: 'CETEG Treinamentos e Capacitação Técnica',
        total_amount: 550.00,
        installments_count: 11,
        installment_value: 50.00,
        purchase_date: '2026-10-05',
        first_due_month: 10,
        first_due_year: 2026,
        category: 'Treinamento & Capacitação',
        company_name: 'Hospital São Lucas'
      },
      {
        description: 'DANIEL CRUVINEL IMPRESTIMO',
        supplier: 'Daniel Cruvinel Consultoria Financeira',
        total_amount: 1190.00,
        installments_count: 7,
        installment_value: 170.00,
        purchase_date: '2026-10-05',
        first_due_month: 10,
        first_due_year: 2026,
        category: 'Empréstimos & Financiamentos',
        company_name: 'Hospital São Lucas'
      }
    ];

    testExpenses.forEach((exp) => {
      db.run(`
        INSERT INTO credit_card_expenses (
          card_id, description, supplier, total_amount, installments_count, installment_value,
          purchase_date, first_due_month, first_due_year, category, company_name, status, created_at, updated_at
        ) VALUES (
          'card_nubank_pj', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo', '${nowIso}', '${nowIso}'
        )
      `, [
        exp.description, exp.supplier, exp.total_amount, exp.installments_count, exp.installment_value,
        exp.purchase_date, exp.first_due_month, exp.first_due_year, exp.category, exp.company_name
      ]);

      const idRes = db.exec("SELECT last_insert_rowid() as id");
      const expenseId = idRes[0]?.values[0]?.[0] as number;

      // Projeção automática nos meses subsequentes do Contas a Pagar
      for (let i = 1; i <= exp.installments_count; i++) {
        let m = exp.first_due_month + (i - 1);
        let y = exp.first_due_year;
        while (m > 12) {
          m -= 12;
          y += 1;
        }

        const dueDay = 5;
        const dueMonth = m + 1 > 12 ? 1 : m + 1;
        const dueYear = m + 1 > 12 ? y + 1 : y;
        const dueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
        const payId = `pay_card_${expenseId}_parc_${i}`;

        db.run(`
          INSERT INTO accounts_payable (
            id, code, description, category, supplier, amount, due_date,
            competence_month, competence_year, installment_number, total_installments,
            credit_card_expense_id, company_name, status, paid_amount, created_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendente', 0, '${nowIso}'
          )
        `, [
          payId, 1000 + expenseId * 10 + i,
          `${exp.description} (Fatura Nubank ${i}/${exp.installments_count})`,
          exp.category, exp.supplier, exp.installment_value, dueDate,
          m, y, i, exp.installments_count,
          expenseId, exp.company_name
        ]);
      }
    });

    // Despesas operacionais do Contas a Pagar
    db.run(`
      INSERT INTO accounts_payable (id, code, description, category, supplier, amount, due_date, competence_month, competence_year, installment_number, total_installments, company_name, status, paid_amount, created_at)
      VALUES
      ('pay_op_01', 2001, 'Link Dedicado de Internet 500Mbps - Fibra Óptica', 'Telecom & Internet', 'Vivo Empresas Telecom', 850.00, '2026-10-15', 10, 2026, 1, 1, 'Hospital São Lucas', 'Pago', 850.00, '${nowIso}'),
      ('pay_op_02', 2002, 'Licenciamento Microsoft 365 Business Standard (25 Usuários)', 'Software & Licenças', 'Microsoft Brasil', 1725.00, '2026-10-20', 10, 2026, 1, 1, 'Hospital São Lucas', 'Pendente', 0, '${nowIso}'),
      ('pay_op_03', 2003, 'Manutenção Preventiva Nobreaks de Alta Potência 20kVA', 'Manutenção & Reparos', 'EletroPower Engenharia', 650.00, '2026-10-28', 10, 2026, 1, 1, 'Hospital São Lucas', 'Pendente', 0, '${nowIso}')
    `);

    // Receitas do Contas a Receber
    db.run(`
      INSERT INTO accounts_receivable (id, code, description, client_name, amount, due_date, competence_month, competence_year, installment_number, total_installments, company_name, status, received_amount, created_at)
      VALUES
      ('rec_01', 3001, 'Contrato Mensal de Suporte e Gestão de TI MSP', 'Hospital São Lucas S/A', 14500.00, '2026-10-10', 10, 2026, 1, 1, 'Hospital São Lucas', 'Recebido', 14500.00, '${nowIso}'),
      ('rec_02', 3002, 'Implantação de Firewall e Política Zero-Trust', 'Delta Engenharia', 6800.00, '2026-10-25', 10, 2026, 1, 2, 'Delta Engenharia', 'Pendente', 0, '${nowIso}'),
      ('rec_03', 3003, 'Auditoria de Segurança da Informação e LGPD', 'Silveira Advocacia', 4200.00, '2026-10-30', 10, 2026, 1, 1, 'Silveira Advocacia', 'Pendente', 0, '${nowIso}')
    `);

    console.log('[DB] Módulo financeiro inicializado com sucesso.');
  } catch (err) {
    console.error('Erro ao inicializar dados financeiros:', err);
  }
}

// -------------------------------------------------------------
// INSTITUIÇÕES FINANCEIRAS & BANCOS (CRUD COMPLETO)
// -------------------------------------------------------------
export function getFinancialInstitutions(): any[] {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare("SELECT * FROM financial_institutions ORDER BY is_custom ASC, name ASC");
  const list: any[] = [];
  while (stmt.step()) {
    list.push(stmt.getAsObject());
  }
  stmt.free();
  return list;
}

export function addFinancialInstitution(data: {
  name: string;
  code?: string;
  color_gradient?: string;
  icon_name?: string;
}) {
  if (!dbInstance) throw new Error("Database not initialized");
  const name = (data.name || '').trim();
  if (!name) throw new Error("Nome da instituição é obrigatório");

  const id = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();
  const color = data.color_gradient || 'from-blue-600 via-indigo-600 to-purple-600';

  dbInstance.run(`
    INSERT INTO financial_institutions (id, name, code, color_gradient, icon_name, is_custom, created_at)
    VALUES (?, ?, ?, ?, ?, 1, '${nowIso}')
  `, [id, name, data.code || '', color, data.icon_name || 'Building2']);

  saveDatabase();
  return { id, name, code: data.code || '', color_gradient: color, is_custom: 1, created_at: nowIso };
}

export function updateFinancialInstitution(id: string, data: any) {
  if (!dbInstance) return null;
  dbInstance.run(`
    UPDATE financial_institutions SET
      name = COALESCE(?, name),
      code = COALESCE(?, code),
      color_gradient = COALESCE(?, color_gradient)
    WHERE id = ?
  `, [data.name || null, data.code || null, data.color_gradient || null, id]);

  saveDatabase();
  const stmt = dbInstance.prepare("SELECT * FROM financial_institutions WHERE id = ?");
  stmt.bind([id]);
  let updated = null;
  if (stmt.step()) {
    updated = stmt.getAsObject();
  }
  stmt.free();
  return updated;
}

export function deleteFinancialInstitution(id: string) {
  if (!dbInstance) return false;
  dbInstance.run("DELETE FROM financial_institutions WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

// -------------------------------------------------------------
// CATEGORIAS FINANCEIRAS (CRUD COMPLETO)
// -------------------------------------------------------------
export function getFinancialCategories(): any[] {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare("SELECT * FROM financial_categories ORDER BY is_custom ASC, name ASC");
  const list: any[] = [];
  while (stmt.step()) {
    list.push(stmt.getAsObject());
  }
  stmt.free();
  return list;
}

export function addFinancialCategory(data: { name: string; color?: string }) {
  if (!dbInstance) throw new Error("Database not initialized");
  const name = (data.name || '').trim();
  if (!name) throw new Error("Nome da categoria é obrigatório");

  const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();
  const color = data.color || 'text-purple-400';

  dbInstance.run(`
    INSERT INTO financial_categories (id, name, color, is_custom, created_at)
    VALUES (?, ?, ?, 1, '${nowIso}')
  `, [id, name, color]);

  saveDatabase();
  return { id, name, color, is_custom: 1, created_at: nowIso };
}

export function deleteFinancialCategory(id: string) {
  if (!dbInstance) return false;
  dbInstance.run("DELETE FROM financial_categories WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

export function getCreditCards(company?: string) {
  if (!dbInstance) return [];
  let sql = "SELECT * FROM financial_credit_cards";
  const params: any[] = [];
  if (company && company !== 'all') {
    sql += " WHERE company_name = ?";
    params.push(company);
  }
  sql += " ORDER BY id ASC";
  const stmt = dbInstance.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const list: any[] = [];
  while (stmt.step()) {
    list.push(stmt.getAsObject());
  }
  stmt.free();

  // Calcular limites e fatura corrente para cada cartão
  const now = new Date();
  const curM = now.getMonth() + 1;
  const curY = now.getFullYear();

  return list.map((card: any) => {
    let usedLimit = 0;
    let curInvoice = 0;
    try {
      const expStmt = dbInstance!.prepare("SELECT total_amount, installments_count, installment_value, first_due_month, first_due_year FROM credit_card_expenses WHERE card_id = ?");
      expStmt.bind([card.id]);
      while (expStmt.step()) {
        const exp = expStmt.getAsObject() as any;
        const elapsed = (curY - exp.first_due_year) * 12 + (curM - exp.first_due_month);
        if (elapsed >= 0 && elapsed < exp.installments_count) {
          curInvoice += Number(exp.installment_value) || 0;
          const rem = exp.installments_count - elapsed;
          usedLimit += rem * (Number(exp.installment_value) || 0);
        } else if (elapsed < 0) {
          usedLimit += Number(exp.total_amount) || 0;
        }
      }
      expStmt.free();
    } catch (e) {
      // Ignora erro
    }

    const limit = Number(card.credit_limit) || 10000;
    const available = Math.max(0, limit - usedLimit);

    return {
      ...card,
      current_invoice_total: Number(curInvoice.toFixed(2)),
      used_limit: Number(usedLimit.toFixed(2)),
      available_limit: Number(available.toFixed(2))
    };
  });
}

export function addCreditCard(data: {
  card_name: string;
  last_digits?: string;
  holder_name?: string;
  closing_day?: number;
  due_day?: number;
  credit_limit?: number;
  company_name?: string;
  bank_brand?: string;
  color_gradient?: string;
}) {
  if (!dbInstance) throw new Error("Database not initialized");
  const id = `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();

  dbInstance.run(`
    INSERT INTO financial_credit_cards (
      id, card_name, last_digits, holder_name, closing_day, due_day,
      credit_limit, company_name, bank_brand, color_gradient, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '${nowIso}', '${nowIso}')
  `, [
    id,
    data.card_name.trim(),
    data.last_digits || '0000',
    data.holder_name || 'InfraAsset PJ',
    data.closing_day || 25,
    data.due_day || 5,
    Number(data.credit_limit) || 20000,
    data.company_name || 'Hospital São Lucas',
    data.bank_brand || 'Nubank',
    data.color_gradient || 'from-purple-600 via-indigo-600 to-blue-600'
  ]);

  saveDatabase();
  return { id, ...data };
}

export function updateCreditCard(id: string, data: any) {
  if (!dbInstance) return null;
  const nowIso = new Date().toISOString();
  dbInstance.run(`
    UPDATE financial_credit_cards SET
      card_name = COALESCE(?, card_name),
      last_digits = COALESCE(?, last_digits),
      holder_name = COALESCE(?, holder_name),
      closing_day = COALESCE(?, closing_day),
      due_day = COALESCE(?, due_day),
      credit_limit = COALESCE(?, credit_limit),
      company_name = COALESCE(?, company_name),
      bank_brand = COALESCE(?, bank_brand),
      color_gradient = COALESCE(?, color_gradient),
      updated_at = '${nowIso}'
    WHERE id = ?
  `, [
    data.card_name || null,
    data.last_digits || null,
    data.holder_name || null,
    data.closing_day !== undefined ? data.closing_day : null,
    data.due_day !== undefined ? data.due_day : null,
    data.credit_limit !== undefined ? Number(data.credit_limit) : null,
    data.company_name || null,
    data.bank_brand || null,
    data.color_gradient || null,
    id
  ]);

  saveDatabase();
  const stmt = dbInstance.prepare("SELECT * FROM financial_credit_cards WHERE id = ?");
  stmt.bind([id]);
  let updated = null;
  if (stmt.step()) {
    updated = stmt.getAsObject();
  }
  stmt.free();
  return updated;
}

export function deleteCreditCard(id: string) {
  if (!dbInstance) return false;
  // Cascata: remove despesas e parcelas no contas a pagar
  const expStmt = dbInstance.prepare("SELECT id FROM credit_card_expenses WHERE card_id = ?");
  expStmt.bind([id]);
  const expIds: number[] = [];
  while (expStmt.step()) {
    expIds.push(expStmt.getAsObject().id as number);
  }
  expStmt.free();

  for (const expId of expIds) {
    dbInstance.run("DELETE FROM accounts_payable WHERE credit_card_expense_id = ?", [expId]);
  }
  dbInstance.run("DELETE FROM credit_card_expenses WHERE card_id = ?", [id]);
  dbInstance.run("DELETE FROM financial_credit_cards WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

export function getCreditCardExpenses(options: { cardId?: string; company?: string; month?: number; year?: number } = {}) {
  if (!dbInstance) return [];
  const { cardId, company, month, year } = options;
  let sql = "SELECT * FROM credit_card_expenses WHERE 1=1";
  const params: any[] = [];

  if (cardId && cardId !== 'all') {
    sql += " AND card_id = ?";
    params.push(cardId);
  }
  if (company && company !== 'all') {
    sql += " AND company_name = ?";
    params.push(company);
  }
  sql += " ORDER BY id ASC";

  const stmt = dbInstance.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const list: any[] = [];
  while (stmt.step()) {
    list.push(stmt.getAsObject() as any);
  }
  stmt.free();

  return list.map((item) => {
    let isActiveInComp = true;
    let currentInstallmentIndex = 1;
    let remainingInstallments = item.installments_count;
    let remainingDebt = item.total_amount;

    if (month !== undefined && year !== undefined) {
      const elapsed = (year - item.first_due_year) * 12 + (month - item.first_due_month);
      if (elapsed < 0) {
        // Compra com início futuro
        isActiveInComp = false;
        currentInstallmentIndex = 0;
        remainingInstallments = item.installments_count;
        remainingDebt = item.total_amount;
      } else if (elapsed < item.installments_count) {
        // Parcela ativa na competência atual
        isActiveInComp = true;
        currentInstallmentIndex = elapsed + 1;
        remainingInstallments = item.installments_count - elapsed;
        remainingDebt = Number((remainingInstallments * item.installment_value).toFixed(2));
      } else {
        // Quitado / Contrato finalizado
        isActiveInComp = false;
        currentInstallmentIndex = item.installments_count;
        remainingInstallments = 0;
        remainingDebt = 0;
      }
    }

    return {
      ...item,
      current_installment_index: currentInstallmentIndex,
      is_active_in_competence: isActiveInComp,
      remaining_installments: remainingInstallments,
      remaining_debt: remainingDebt
    };
  });
}

export function addCreditCardExpense(data: {
  card_id?: string;
  description: string;
  supplier?: string;
  total_amount: number;
  installments_count: number;
  installment_value?: number;
  purchase_date?: string;
  first_due_month: number;
  first_due_year: number;
  category?: string;
  company_name?: string;
}) {
  if (!dbInstance) throw new Error("Database not initialized");

  const cardId = data.card_id || 'card_nubank_pj';
  const description = (data.description || '').trim();
  if (!description) throw new Error("Descrição é obrigatória");

  const totalAmount = Number(data.total_amount) || 0;
  if (totalAmount <= 0) throw new Error("Valor total deve ser maior que zero");

  const installmentsCount = Math.max(1, parseInt(String(data.installments_count || 1), 10));
  
  // Cálculo automático do valor da parcela ou ajuste de centavos manual
  const installmentValue = data.installment_value && Number(data.installment_value) > 0
    ? Number(Number(data.installment_value).toFixed(2))
    : Number((totalAmount / installmentsCount).toFixed(2));

  const purchaseDate = data.purchase_date || new Date().toISOString().split('T')[0];
  const firstDueMonth = parseInt(String(data.first_due_month), 10);
  const firstDueYear = parseInt(String(data.first_due_year), 10);
  const supplier = data.supplier ? data.supplier.trim() : description;
  const category = data.category || 'Geral';
  const companyName = data.company_name || 'Hospital São Lucas';
  const nowIso = new Date().toISOString();

  dbInstance.run(`
    INSERT INTO credit_card_expenses (
      card_id, description, supplier, total_amount, installments_count, installment_value,
      purchase_date, first_due_month, first_due_year, category, company_name, status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo', '${nowIso}', '${nowIso}'
    )
  `, [
    cardId, description, supplier, totalAmount, installmentsCount, installmentValue,
    purchaseDate, firstDueMonth, firstDueYear, category, companyName
  ]);

  const idRes = dbInstance.exec("SELECT last_insert_rowid() as id");
  const expenseId = idRes[0]?.values[0]?.[0] as number;

  // Projeção automática nos meses subsequentes do Contas a Pagar
  let dueDay = 5;
  let cardBrandName = 'Cartão PJ';
  try {
    const cardStmt = dbInstance.prepare("SELECT due_day, card_name FROM financial_credit_cards WHERE id = ?");
    cardStmt.bind([cardId]);
    if (cardStmt.step()) {
      const obj = cardStmt.getAsObject();
      dueDay = (obj.due_day as number) || 5;
      cardBrandName = (obj.card_name as string) || 'Cartão PJ';
    }
    cardStmt.free();
  } catch (e) {}

  for (let i = 1; i <= installmentsCount; i++) {
    let m = firstDueMonth + (i - 1);
    let y = firstDueYear;
    while (m > 12) {
      m -= 12;
      y += 1;
    }

    const dueMonth = m + 1 > 12 ? 1 : m + 1;
    const dueYear = m + 1 > 12 ? y + 1 : y;
    const dueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
    const payId = `pay_card_${expenseId}_parc_${i}`;

    dbInstance.run(`
      INSERT INTO accounts_payable (
        id, code, description, category, supplier, amount, due_date,
        competence_month, competence_year, installment_number, total_installments,
        credit_card_expense_id, company_name, status, paid_amount, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendente', 0, '${nowIso}'
      )
    `, [
      payId, 1000 + expenseId * 10 + i,
      `${description} (${cardBrandName} ${i}/${installmentsCount})`,
      category, supplier, installmentValue, dueDate,
      m, y, i, installmentsCount,
      expenseId, companyName
    ]);
  }

  saveDatabase();
  return { id: expenseId, description, total_amount: totalAmount, installments_count: installmentsCount, installment_value: installmentValue };
}

export function updateCreditCardExpense(id: number, data: {
  card_id?: string;
  description?: string;
  supplier?: string;
  total_amount?: number;
  installments_count?: number;
  installment_value?: number;
  purchase_date?: string;
  category?: string;
  company_name?: string;
}) {
  if (!dbInstance) return null;
  const nowIso = new Date().toISOString();

  const curStmt = dbInstance.prepare("SELECT * FROM credit_card_expenses WHERE id = ?");
  curStmt.bind([id]);
  if (!curStmt.step()) {
    curStmt.free();
    return null;
  }
  const current = curStmt.getAsObject() as any;
  curStmt.free();

  const desc = data.description !== undefined ? data.description.trim() : current.description;
  const supplier = data.supplier !== undefined ? data.supplier.trim() : current.supplier;
  const totalAmount = data.total_amount !== undefined ? Number(data.total_amount) : current.total_amount;
  const installmentsCount = data.installments_count !== undefined ? Math.max(1, data.installments_count) : current.installments_count;
  const installmentValue = data.installment_value !== undefined && Number(data.installment_value) > 0
    ? Number(Number(data.installment_value).toFixed(2))
    : Number((totalAmount / installmentsCount).toFixed(2));
  const purchaseDate = data.purchase_date || current.purchase_date;
  const category = data.category || current.category;
  const companyName = data.company_name || current.company_name;
  const cardId = data.card_id || current.card_id;

  dbInstance.run(`
    UPDATE credit_card_expenses SET
      description = ?, supplier = ?, total_amount = ?, installments_count = ?,
      installment_value = ?, purchase_date = ?, category = ?, company_name = ?, card_id = ?,
      updated_at = '${nowIso}'
    WHERE id = ?
  `, [
    desc, supplier, totalAmount, installmentsCount, installmentValue,
    purchaseDate, category, companyName, cardId, id
  ]);

  // Recriar parcelas projetadas no Contas a Pagar
  dbInstance.run("DELETE FROM accounts_payable WHERE credit_card_expense_id = ?", [id]);

  for (let i = 1; i <= installmentsCount; i++) {
    let m = current.first_due_month + (i - 1);
    let y = current.first_due_year;
    while (m > 12) {
      m -= 12;
      y += 1;
    }

    const dueDay = 5;
    const dueMonth = m + 1 > 12 ? 1 : m + 1;
    const dueYear = m + 1 > 12 ? y + 1 : y;
    const dueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
    const payId = `pay_card_${id}_parc_${i}`;

    dbInstance.run(`
      INSERT INTO accounts_payable (
        id, code, description, category, supplier, amount, due_date,
        competence_month, competence_year, installment_number, total_installments,
        credit_card_expense_id, company_name, status, paid_amount, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendente', 0, '${nowIso}'
      )
    `, [
      payId, 1000 + id * 10 + i,
      `${desc} (${i}/${installmentsCount})`,
      category, supplier, installmentValue, dueDate,
      m, y, i, installmentsCount,
      id, companyName
    ]);
  }

  saveDatabase();
  return { id, description: desc, total_amount: totalAmount, installments_count: installmentsCount, installment_value: installmentValue };
}

export function deleteCreditCardExpense(id: number) {
  if (!dbInstance) return false;
  dbInstance.run("DELETE FROM accounts_payable WHERE credit_card_expense_id = ?", [id]);
  dbInstance.run("DELETE FROM credit_card_expenses WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

export function getAccountsPayable(options: { company?: string; month?: number; year?: number; status?: string } = {}) {
  if (!dbInstance) return [];
  const { company, month, year, status } = options;
  let sql = "SELECT * FROM accounts_payable WHERE 1=1";
  const params: any[] = [];

  if (company && company !== 'all') {
    sql += " AND company_name = ?";
    params.push(company);
  }
  if (month !== undefined) {
    sql += " AND competence_month = ?";
    params.push(month);
  }
  if (year !== undefined) {
    sql += " AND competence_year = ?";
    params.push(year);
  }
  if (status && status !== 'all') {
    sql += " AND status = ?";
    params.push(status);
  }
  sql += " ORDER BY due_date ASC";

  const stmt = dbInstance.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const list: any[] = [];
  while (stmt.step()) {
    list.push(stmt.getAsObject());
  }
  stmt.free();
  return list;
}

export function addAccountsPayable(data: {
  description: string;
  category?: string;
  supplier?: string;
  amount: number;
  due_date: string;
  competence_month: number;
  competence_year: number;
  installment_number?: number;
  total_installments?: number;
  installment_value?: number;
  company_name?: string;
  notes?: string;
}) {
  if (!dbInstance) throw new Error("Database not initialized");

  const totalInstallments = Math.max(1, data.total_installments || 1);
  const nowIso = new Date().toISOString();
  const createdItems = [];

  // Parse primeira data de vencimento
  const [fYear, fMonth, fDay] = (data.due_date || '').split('-').map(Number);
  const initialDueDay = fDay || 15;
  const initialDueMonth = fMonth || data.competence_month;
  const initialDueYear = fYear || data.competence_year;

  // Valor da parcela calculado ou digitado
  const installmentValue = data.installment_value && Number(data.installment_value) > 0
    ? Number(Number(data.installment_value).toFixed(2))
    : Number((Number(data.amount) / totalInstallments).toFixed(2));

  for (let i = 1; i <= totalInstallments; i++) {
    let compM = data.competence_month + (i - 1);
    let compY = data.competence_year;
    while (compM > 12) {
      compM -= 12;
      compY += 1;
    }

    let dueM = initialDueMonth + (i - 1);
    let dueY = initialDueYear;
    while (dueM > 12) {
      dueM -= 12;
      dueY += 1;
    }
    const daysInMonth = new Date(dueY, dueM, 0).getDate();
    const actualDueDay = Math.min(initialDueDay, daysInMonth);
    const dueDate = `${dueY}-${String(dueM).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`;

    const id = `pay_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
    const code = Math.floor(2000 + Math.random() * 8000);
    const desc = totalInstallments > 1 
      ? `${data.description.trim()} (${i}/${totalInstallments})` 
      : data.description.trim();

    dbInstance.run(`
      INSERT INTO accounts_payable (
        id, code, description, category, supplier, amount, due_date,
        competence_month, competence_year, installment_number, total_installments,
        company_name, status, paid_amount, notes, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendente', 0, ?, '${nowIso}'
      )
    `, [
      id, code, desc, data.category || 'Geral', data.supplier || '',
      installmentValue, dueDate, compM, compY,
      i, totalInstallments,
      data.company_name || 'Hospital São Lucas', data.notes || ''
    ]);

    createdItems.push({ id, code, description: desc, amount: installmentValue, due_date: dueDate });
  }

  saveDatabase();
  return createdItems[0] || null;
}

export function updateAccountsPayable(id: string, data: {
  description?: string;
  category?: string;
  supplier?: string;
  amount?: number;
  due_date?: string;
  competence_month?: number;
  competence_year?: number;
  status?: string;
  paid_amount?: number;
  payment_date?: string;
  company_name?: string;
  notes?: string;
}) {
  if (!dbInstance) return null;
  const updates: string[] = [];
  const params: any[] = [];

  if (data.description !== undefined) {
    updates.push("description = ?");
    params.push(data.description.trim());
  }
  if (data.category !== undefined) {
    updates.push("category = ?");
    params.push(data.category);
  }
  if (data.supplier !== undefined) {
    updates.push("supplier = ?");
    params.push(data.supplier);
  }
  if (data.amount !== undefined) {
    updates.push("amount = ?");
    params.push(Number(data.amount) || 0);
  }
  if (data.due_date !== undefined) {
    updates.push("due_date = ?");
    params.push(data.due_date);
    const parts = data.due_date.split('-');
    if (parts.length === 3) {
      updates.push("competence_month = ?");
      params.push(parseInt(parts[1], 10));
      updates.push("competence_year = ?");
      params.push(parseInt(parts[0], 10));
    }
  }
  if (data.status !== undefined) {
    updates.push("status = ?");
    params.push(data.status);
    if (data.status === 'Pago' && !data.payment_date) {
      updates.push("payment_date = ?");
      params.push(new Date().toISOString().split('T')[0]);
      if (data.paid_amount === undefined && data.amount) {
        updates.push("paid_amount = ?");
        params.push(Number(data.amount));
      }
    }
  }
  if (data.paid_amount !== undefined) {
    updates.push("paid_amount = ?");
    params.push(Number(data.paid_amount));
  }
  if (data.payment_date !== undefined) {
    updates.push("payment_date = ?");
    params.push(data.payment_date);
  }
  if (data.company_name !== undefined) {
    updates.push("company_name = ?");
    params.push(data.company_name);
  }
  if (data.notes !== undefined) {
    updates.push("notes = ?");
    params.push(data.notes);
  }

  if (updates.length === 0) return true;

  params.push(id);
  dbInstance.run(`UPDATE accounts_payable SET ${updates.join(', ')} WHERE id = ?`, params);
  saveDatabase();

  const stmt = dbInstance.prepare("SELECT * FROM accounts_payable WHERE id = ?");
  stmt.bind([id]);
  let updatedObj = null;
  if (stmt.step()) {
    updatedObj = stmt.getAsObject();
  }
  stmt.free();
  return updatedObj;
}

export function updateAccountsPayableStatus(id: string, status: string, paidAmount?: number, paymentDate?: string) {
  if (!dbInstance) return false;
  const now = paymentDate || new Date().toISOString().split('T')[0];
  dbInstance.run(`
    UPDATE accounts_payable
    SET status = ?, paid_amount = COALESCE(?, amount), payment_date = ?
    WHERE id = ?
  `, [status, paidAmount !== undefined ? paidAmount : null, status === 'Pago' ? now : null, id]);
  saveDatabase();
  return true;
}

export function deleteAccountsPayable(id: string) {
  if (!dbInstance) return false;
  dbInstance.run("DELETE FROM accounts_payable WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

export function getAccountsReceivable(options: { company?: string; month?: number; year?: number; status?: string } = {}) {
  if (!dbInstance) return [];
  const { company, month, year, status } = options;
  let sql = "SELECT * FROM accounts_receivable WHERE 1=1";
  const params: any[] = [];

  if (company && company !== 'all') {
    sql += " AND company_name = ?";
    params.push(company);
  }
  if (month !== undefined) {
    sql += " AND competence_month = ?";
    params.push(month);
  }
  if (year !== undefined) {
    sql += " AND competence_year = ?";
    params.push(year);
  }
  if (status && status !== 'all') {
    sql += " AND status = ?";
    params.push(status);
  }
  sql += " ORDER BY due_date ASC";

  const stmt = dbInstance.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const list: any[] = [];
  while (stmt.step()) {
    list.push(stmt.getAsObject());
  }
  stmt.free();
  return list;
}

export function addAccountsReceivable(data: {
  description: string;
  client_name: string;
  amount: number;
  due_date: string;
  competence_month: number;
  competence_year: number;
  installment_number?: number;
  total_installments?: number;
  company_name?: string;
}) {
  if (!dbInstance) throw new Error("Database not initialized");

  const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const code = Math.floor(3000 + Math.random() * 7000);
  const nowIso = new Date().toISOString();

  dbInstance.run(`
    INSERT INTO accounts_receivable (
      id, code, description, client_name, amount, due_date,
      competence_month, competence_year, installment_number, total_installments,
      company_name, status, received_amount, receipt_date, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendente', 0, NULL, '${nowIso}'
    )
  `, [
    id, code, data.description.trim(), data.client_name.trim(), Number(data.amount) || 0,
    data.due_date, data.competence_month, data.competence_year,
    data.installment_number || 1, data.total_installments || 1,
    data.company_name || 'Hospital São Lucas'
  ]);

  saveDatabase();
  return { id, code, ...data };
}

export function updateAccountsReceivableStatus(id: string, status: string, receivedAmount?: number, receiptDate?: string) {
  if (!dbInstance) return false;
  const now = receiptDate || new Date().toISOString().split('T')[0];
  dbInstance.run(`
    UPDATE accounts_receivable
    SET status = ?, received_amount = COALESCE(?, amount), receipt_date = ?
    WHERE id = ?
  `, [status, receivedAmount !== undefined ? receivedAmount : null, status === 'Recebido' ? now : null, id]);
  saveDatabase();
  return true;
}

export function deleteAccountsReceivable(id: string) {
  if (!dbInstance) return false;
  dbInstance.run("DELETE FROM accounts_receivable WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

export function getFinancialCompetenceSummary(month: number, year: number, company?: string, cardId?: string) {
  const monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];
  const monthName = monthNames[month - 1] || `MÊS ${month}`;

  // Itens do Cartão (filtrando por cardId se especificado)
  const allCardExpenses = getCreditCardExpenses({
    company,
    month,
    year,
    cardId: cardId && cardId !== 'all' ? cardId : undefined
  });
  const activeCardExpenses = allCardExpenses.filter(e => e.is_active_in_competence);

  // 1. TOTAL GERAL - SALDO DEVEDOR: Somatória dos valores totais dos contratos vigentes naquele mês
  const totalSaldoDevedor = activeCardExpenses.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);

  // 2. VT PRESTA: Valor Total das Prestações/Parcelas somadas que vencem naquele mês específico
  const vtPresta = activeCardExpenses.reduce((sum, item) => sum + (Number(item.installment_value) || 0), 0);

  // Saldo devedor remanescente das compras ativas
  const totalRemainingDebt = activeCardExpenses.reduce((sum, item) => sum + (Number(item.remaining_debt) || 0), 0);

  // Contas a Pagar e Contas a Receber na competência
  const payables = getAccountsPayable({ company, month, year });
  const receivables = getAccountsReceivable({ company, month, year });

  const totalAccountsPayable = payables.reduce((sum, item: any) => sum + (Number(item.amount) || 0), 0);
  const totalAccountsReceivable = receivables.reduce((sum, item: any) => sum + (Number(item.amount) || 0), 0);
  const netCashFlowForecast = totalAccountsReceivable - totalAccountsPayable;

  return {
    month,
    year,
    monthName,
    totalSaldoDevedor: Number(totalSaldoDevedor.toFixed(2)),
    vtPresta: Number(vtPresta.toFixed(2)),
    totalRemainingDebt: Number(totalRemainingDebt.toFixed(2)),
    activeExpensesCount: activeCardExpenses.length,
    totalExpensesCount: allCardExpenses.length,
    totalAccountsPayable: Number(totalAccountsPayable.toFixed(2)),
    totalAccountsReceivable: Number(totalAccountsReceivable.toFixed(2)),
    netCashFlowForecast: Number(netCashFlowForecast.toFixed(2))
  };
}

// -------------------------------------------------------------
// EXPORTADOR E BACKUP DO BANCO DE DADOS (MYSQL / JSON / CSV)
// -------------------------------------------------------------

const MYSQL_TABLE_SCHEMAS: Record<string, string> = {
  client_companies: `CREATE TABLE IF NOT EXISTS \`client_companies\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`trade_name\` VARCHAR(255),
  \`document\` VARCHAR(32),
  \`contact_name\` VARCHAR(255),
  \`contact_email\` VARCHAR(255),
  \`contact_phone\` VARCHAR(64),
  \`sla_plan\` VARCHAR(64),
  \`notes\` TEXT,
  \`machine_count\` INT DEFAULT 0,
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`created_at\` VARCHAR(64),
  \`updated_at\` VARCHAR(64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  system_settings: `CREATE TABLE IF NOT EXISTS \`system_settings\` (
  \`id\` VARCHAR(32) PRIMARY KEY,
  \`company_name\` VARCHAR(255) NOT NULL,
  \`system_title\` VARCHAR(255) NOT NULL,
  \`department\` VARCHAR(255),
  \`logo_url\` MEDIUMTEXT,
  \`footer_text\` TEXT,
  \`report_header\` VARCHAR(255),
  \`website_config\` LONGTEXT,
  \`updated_at\` VARCHAR(64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  machines: `CREATE TABLE IF NOT EXISTS \`machines\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`hostname\` VARCHAR(255) NOT NULL,
  \`client_company\` VARCHAR(255) DEFAULT 'Geral',
  \`current_user\` VARCHAR(255),
  \`os_name\` VARCHAR(255),
  \`os_version\` VARCHAR(255),
  \`os_build\` VARCHAR(255),
  \`os_arch\` VARCHAR(64),
  \`machine_type\` VARCHAR(64),
  \`cpu_model\` VARCHAR(255),
  \`cpu_cores\` INT,
  \`cpu_threads\` INT,
  \`cpu_usage_percent\` DOUBLE,
  \`ram_total_gb\` DOUBLE,
  \`ram_used_gb\` DOUBLE,
  \`ram_usage_percent\` DOUBLE,
  \`primary_ip\` VARCHAR(64),
  \`primary_mac\` VARCHAR(64),
  \`public_ip\` VARCHAR(64),
  \`sector\` VARCHAR(255),
  \`location\` VARCHAR(255),
  \`status\` VARCHAR(64) DEFAULT 'Ativo',
  \`asset_tag\` VARCHAR(64),
  \`purchase_date\` VARCHAR(64),
  \`warranty_end\` VARCHAR(64),
  \`vendor\` VARCHAR(255),
  \`cost\` DOUBLE DEFAULT 0,
  \`responsible_person\` VARCHAR(255),
  \`notes\` TEXT,
  \`agent_version\` VARCHAR(64),
  \`last_seen\` VARCHAR(64),
  \`created_at\` VARCHAR(64),
  \`updated_at\` VARCHAR(64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  machine_disks: `CREATE TABLE IF NOT EXISTS \`machine_disks\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`machine_id\` VARCHAR(64) NOT NULL,
  \`device\` VARCHAR(255),
  \`mountpoint\` VARCHAR(255),
  \`fstype\` VARCHAR(64),
  \`total_gb\` DOUBLE,
  \`used_gb\` DOUBLE,
  \`free_gb\` DOUBLE,
  \`percent\` DOUBLE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  machine_networks: `CREATE TABLE IF NOT EXISTS \`machine_networks\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`machine_id\` VARCHAR(64) NOT NULL,
  \`interface_name\` VARCHAR(255),
  \`ip_address\` VARCHAR(64),
  \`netmask\` VARCHAR(64),
  \`mac_address\` VARCHAR(64),
  \`is_up\` TINYINT(1) DEFAULT 1,
  \`speed_mbps\` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  agent_tokens: `CREATE TABLE IF NOT EXISTS \`agent_tokens\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`token\` VARCHAR(255) NOT NULL,
  \`name\` VARCHAR(255),
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`created_at\` VARCHAR(64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  users: `CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`username\` VARCHAR(255) NOT NULL,
  \`name\` VARCHAR(255),
  \`email\` VARCHAR(255),
  \`password_hash\` VARCHAR(255),
  \`role\` VARCHAR(64) DEFAULT 'Viewer',
  \`company_id\` VARCHAR(64),
  \`company_name\` VARCHAR(255),
  \`created_at\` VARCHAR(64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  financial_credit_cards: `CREATE TABLE IF NOT EXISTS \`financial_credit_cards\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`card_name\` VARCHAR(255) NOT NULL,
  \`bank_brand\` VARCHAR(64),
  \`color_gradient\` VARCHAR(255),
  \`card_number_last4\` VARCHAR(8),
  \`holder_name\` VARCHAR(255),
  \`company_name\` VARCHAR(255),
  \`credit_limit\` DOUBLE,
  \`available_limit\` DOUBLE,
  \`closing_day\` INT,
  \`due_day\` INT,
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`created_at\` VARCHAR(64),
  \`updated_at\` VARCHAR(64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  credit_card_expenses: `CREATE TABLE IF NOT EXISTS \`credit_card_expenses\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`card_id\` VARCHAR(64) NOT NULL,
  \`company_name\` VARCHAR(255),
  \`description\` VARCHAR(255) NOT NULL,
  \`category\` VARCHAR(128),
  \`expense_date\` VARCHAR(64),
  \`total_amount\` DOUBLE NOT NULL,
  \`installments_total\` INT DEFAULT 1,
  \`installment_value\` DOUBLE,
  \`installments_paid\` INT DEFAULT 0,
  \`status\` VARCHAR(64) DEFAULT 'Em Aberto',
  \`notes\` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  accounts_payable: `CREATE TABLE IF NOT EXISTS \`accounts_payable\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`company_name\` VARCHAR(255),
  \`supplier_name\` VARCHAR(255) NOT NULL,
  \`description\` VARCHAR(255) NOT NULL,
  \`category\` VARCHAR(128),
  \`amount\` DOUBLE NOT NULL,
  \`due_date\` VARCHAR(64) NOT NULL,
  \`payment_date\` VARCHAR(64),
  \`status\` VARCHAR(64) DEFAULT 'Pendente',
  \`barcode\` VARCHAR(128),
  \`notes\` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  accounts_receivable: `CREATE TABLE IF NOT EXISTS \`accounts_receivable\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`company_name\` VARCHAR(255),
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`description\` VARCHAR(255) NOT NULL,
  \`amount\` DOUBLE NOT NULL,
  \`due_date\` VARCHAR(64) NOT NULL,
  \`received_date\` VARCHAR(64),
  \`status\` VARCHAR(64) DEFAULT 'Pendente',
  \`notes\` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  assistance_slides: `CREATE TABLE IF NOT EXISTS \`assistance_slides\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`order_index\` INT DEFAULT 0,
  \`focus\` VARCHAR(128) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`image_url\` TEXT NOT NULL,
  \`badge\` VARCHAR(255),
  \`cta_text\` VARCHAR(128),
  \`cta_link\` TEXT,
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`created_at\` VARCHAR(64),
  \`updated_at\` VARCHAR(64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
};

export const ALL_BACKUP_TABLES = [
  'client_companies',
  'system_settings',
  'assistance_slides',
  'roles',
  'scopes',
  'users',
  'user_permissions',
  'financial_institutions',
  'financial_categories',
  'financial_credit_cards',
  'credit_card_expenses',
  'accounts_payable',
  'accounts_receivable',
  'machines',
  'machine_disks',
  'machine_networks',
  'agent_tokens'
];

export function generateMySqlExport(targetTables?: string[]): string {
  if (!dbInstance) return "-- Banco não inicializado";

  const tables = (targetTables && targetTables.length > 0)
    ? targetTables
    : ALL_BACKUP_TABLES;

  const lines: string[] = [
    "-- =====================================================================",
    "-- BACKUP & DUMP EXPORTADO PARA BANCO DE DADOS MYSQL / MARIADB",
    `-- Gerado em: ${new Date().toISOString()}`,
    "-- Infra Asset Manager & CRM Corporativo W3W Soluções em TI",
    "-- Compatibilidade: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+",
    "-- =====================================================================",
    "CREATE DATABASE IF NOT EXISTS `infra_crm_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
    "USE `infra_crm_db`;",
    "SET NAMES utf8mb4;",
    "SET FOREIGN_KEY_CHECKS = 0;",
    ""
  ];

  for (const table of tables) {
    try {
      // Check if schema exists
      if (MYSQL_TABLE_SCHEMAS[table]) {
        lines.push(`-- -----------------------------------------------------`);
        lines.push(`-- Estrutura da tabela \`${table}\``);
        lines.push(`-- -----------------------------------------------------`);
        lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
        lines.push(MYSQL_TABLE_SCHEMAS[table]);
        lines.push("");
      }

      const stmt = dbInstance.prepare(`SELECT * FROM ${table}`);
      const rows: any[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();

      if (rows.length > 0) {
        lines.push(`-- Dados da tabela \`${table}\` (${rows.length} registros)`);
        lines.push(`LOCK TABLES \`${table}\` WRITE;`);
        for (const row of rows) {
          const cols = Object.keys(row).map(c => `\`${c}\``);
          const vals = Object.keys(row).map(c => {
            const v = row[c];
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'number') return v;
            return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          });
          lines.push(`INSERT INTO \`${table}\` (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
        }
        lines.push(`UNLOCK TABLES;`);
        lines.push("");
      }
    } catch (e) {
      // Tabela pode não existir nesta versão
    }
  }

  lines.push("SET FOREIGN_KEY_CHECKS = 1;");
  lines.push("-- =====================================================================");
  lines.push("-- FIM DO DUMP MYSQL");
  lines.push("-- =====================================================================");
  return lines.join("\n");
}

export function exportDatabaseAsJson(targetTables?: string[]): any {
  if (!dbInstance) throw new Error("Banco de dados não inicializado");

  const tables = (targetTables && targetTables.length > 0)
    ? targetTables
    : ALL_BACKUP_TABLES;

  const result: Record<string, any[]> = {};
  let totalRecords = 0;

  for (const table of tables) {
    try {
      const stmt = dbInstance.prepare(`SELECT * FROM ${table}`);
      const rows: any[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      result[table] = rows;
      totalRecords += rows.length;
    } catch (e) {
      result[table] = [];
    }
  }

  return {
    metadata: {
      app_name: "INFRA ASSET MANAGER & CRM",
      company: "W3W Soluções em TI",
      version: "2.5.0",
      export_timestamp: new Date().toISOString(),
      format: "JSON Database Backup",
      total_tables: tables.length,
      total_records: totalRecords
    },
    system_settings: getSystemSettings(),
    tables: result
  };
}

export function exportDatabaseAsCsv(tableName: string): string {
  if (!dbInstance) throw new Error("Banco de dados não inicializado");

  if (tableName === 'all') {
    // Generate combined CSV with table sections
    const lines: string[] = [
      `# BACKUP MULTI-TABELA - W3W SOLUCOES TI`,
      `# Gerado em: ${new Date().toISOString()}`,
      ``
    ];

    for (const tbl of ALL_BACKUP_TABLES) {
      try {
        const stmt = dbInstance.prepare(`SELECT * FROM ${tbl}`);
        const rows: any[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();

        if (rows.length > 0) {
          lines.push(`--- TABELA: ${tbl} (${rows.length} registros) ---`);
          const headers = Object.keys(rows[0]);
          lines.push(headers.map(h => `"${h}"`).join(','));
          for (const r of rows) {
            const vals = headers.map(h => {
              const val = r[h];
              if (val === null || val === undefined) return '""';
              return `"${String(val).replace(/"/g, '""')}"`;
            });
            lines.push(vals.join(','));
          }
          lines.push('');
        }
      } catch (e) {}
    }
    return lines.join('\n');
  }

  // Single table CSV
  try {
    const stmt = dbInstance.prepare(`SELECT * FROM ${tableName}`);
    const rows: any[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();

    if (rows.length === 0) {
      return `Nenhum registro encontrado na tabela ${tableName}`;
    }

    const headers = Object.keys(rows[0]);
    const lines: string[] = [
      headers.map(h => `"${h}"`).join(',')
    ];

    for (const r of rows) {
      const vals = headers.map(h => {
        const val = r[h];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      lines.push(vals.join(','));
    }

    return lines.join('\n');
  } catch (err: any) {
    throw new Error(`Erro ao exportar tabela ${tableName} para CSV: ${err.message}`);
  }
}

export function getDatabaseBackupStats(): Record<string, any> {
  if (!dbInstance) return { total_records: 0, tables: {} };

  const tableStats: Record<string, number> = {};
  let totalRecords = 0;

  for (const table of ALL_BACKUP_TABLES) {
    try {
      const stmt = dbInstance.prepare(`SELECT count(*) as count FROM ${table}`);
      if (stmt.step()) {
        const cnt = (stmt.getAsObject() as any).count || 0;
        tableStats[table] = cnt;
        totalRecords += cnt;
      }
      stmt.free();
    } catch (e) {
      tableStats[table] = 0;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    total_records: totalRecords,
    tables_count: ALL_BACKUP_TABLES.length,
    table_stats: tableStats
  };
}

export interface ScheduledMaintenanceRecord {
  id: string;
  machine_id: string;
  hostname: string;
  company_name: string;
  date_str: string;
  time_str: string;
  title: string;
  maintenance_type: string;
  technician: string;
  priority: 'high' | 'medium' | 'low';
  notes: string;
  status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada';
  created_at: string;
}

export function getAllMaintenances(company?: string): ScheduledMaintenanceRecord[] {
  if (!dbInstance) return [];
  try {
    let sql = 'SELECT * FROM scheduled_maintenances';
    if (company && company !== 'all') {
      sql += ` WHERE company_name = '${company.replace(/'/g, "''")}'`;
    }
    sql += ' ORDER BY date_str ASC, time_str ASC';
    const stmt = dbInstance.prepare(sql);
    const results: ScheduledMaintenanceRecord[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as ScheduledMaintenanceRecord);
    }
    stmt.free();
    return results;
  } catch (err) {
    console.error('Error fetching maintenances:', err);
    return [];
  }
}

export function createMaintenance(data: Partial<ScheduledMaintenanceRecord>): ScheduledMaintenanceRecord {
  if (!dbInstance) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  const id = 'maint_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const rec: ScheduledMaintenanceRecord = {
    id,
    machine_id: data.machine_id || '',
    hostname: data.hostname || 'Ativo sem nome',
    company_name: data.company_name || 'Hospital São Lucas',
    date_str: data.date_str || now.slice(0, 10),
    time_str: data.time_str || '09:00',
    title: data.title || `Manutenção: ${data.hostname || 'Equipamento'}`,
    maintenance_type: data.maintenance_type || 'Manutenção Preventiva',
    technician: data.technician || 'Suporte Técnico W3W',
    priority: (data.priority as any) || 'medium',
    notes: data.notes || '',
    status: data.status || 'Agendada',
    created_at: now
  };

  dbInstance.run(
    `INSERT INTO scheduled_maintenances (id, machine_id, hostname, company_name, date_str, time_str, title, maintenance_type, technician, priority, notes, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rec.id, rec.machine_id, rec.hostname, rec.company_name, rec.date_str,
      rec.time_str, rec.title, rec.maintenance_type, rec.technician,
      rec.priority, rec.notes, rec.status, rec.created_at
    ]
  );
  saveDatabase();
  return rec;
}

export function updateMaintenance(id: string, updates: Partial<ScheduledMaintenanceRecord>): boolean {
  if (!dbInstance) return false;
  try {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
    if (fields.length === 0) return true;
    const setClause = fields.map(k => `${k} = ?`).join(', ');
    const values = fields.map(k => (updates as any)[k]);
    values.push(id);
    dbInstance.run(`UPDATE scheduled_maintenances SET ${setClause} WHERE id = ?`, values);
    saveDatabase();
    return true;
  } catch (err) {
    console.error('Error updating maintenance:', err);
    return false;
  }
}

export function deleteMaintenance(id: string): boolean {
  if (!dbInstance) return false;
  try {
    dbInstance.run('DELETE FROM scheduled_maintenances WHERE id = ?', [id]);
    saveDatabase();
    return true;
  } catch (err) {
    console.error('Error deleting maintenance:', err);
    return false;
  }
}

// -------------------------------------------------------------
// CARROSSEL INSTITUCIONAL DE ASSISTÊNCIA TÉCNICA EM GOIÂNIA (CRUD)
// -------------------------------------------------------------

export const DEFAULT_ASSISTANCE_SLIDES: AssistanceSlide[] = [
  {
    id: 'as_slide_1',
    order_index: 0,
    focus: 'Essencialidade',
    badge: 'Foco: Essencialidade',
    title: 'Tecnologia no seu dia a dia e no sucesso do seu negócio.',
    description: 'Sabemos o quanto a tecnologia é fundamental para o seu dia a dia e para o sucesso do seu negócio. Atendimento ágil e consultoria técnica especializada para empresas em Goiânia.',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=80',
    cta_text: 'Solicitar Atendimento Técnico',
    cta_link: 'https://api.whatsapp.com/send?phone=5562982239004&text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20atendimento%20t%C3%A9cnico%20para%20minha%20empresa%20em%20Goi%C3%A2nia.',
    is_active: true
  },
  {
    id: 'as_slide_2',
    order_index: 1,
    focus: 'Infraestrutura',
    badge: 'Foco: Infraestrutura',
    title: 'Laboratório próprio de última geração em Goiânia com especialistas qualificados.',
    description: 'Contamos com laboratório próprio de última geração em Goiânia com bancadas antiestáticas (ESD), instrumentação de precisão e engenheiros certificados.',
    image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1920&q=80',
    cta_text: 'Conhecer Nosso Laboratório',
    cta_link: 'https://api.whatsapp.com/send?phone=5562982239004&text=Ol%C3%A1!%20Gostaria%20de%20conhecer%20a%20estrutura%20do%20laborat%C3%B3rio%20pr%C3%B3prio%20em%20Goi%C3%A2nia.',
    is_active: true
  },
  {
    id: 'as_slide_3',
    order_index: 2,
    focus: 'Complexidade',
    badge: 'Foco: Complexidade',
    title: 'Resolução desde problemas simples de lentidão até os reparos eletrônicos mais complexos.',
    description: 'Resolvemos desde problemas operacionais simples de lentidão e formatação até microeletrônica avançada, recuperação de placas-mãe e reparos em servidores.',
    image_url: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=1920&q=80',
    cta_text: 'Avaliar Reparo Complexo',
    cta_link: 'https://api.whatsapp.com/send?phone=5562982239004&text=Ol%C3%A1!%20Preciso%20de%20um%20reparo%20t%C3%A9cnico%20eletr%C3%B4nico%20complexo%20para%20meu%20equipamento.',
    is_active: true
  },
  {
    id: 'as_slide_4',
    order_index: 3,
    focus: 'Confiança',
    badge: 'Foco: Confiança',
    title: 'Peças de alta qualidade, garantia em todos os serviços e total transparência no diagnóstico.',
    description: 'Trabalhamos com componentes originais e homologados, laudos técnicos detalhados com fotos e garantia formal em todos os procedimentos executados.',
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80',
    cta_text: 'Diagnóstico com Garantia',
    cta_link: 'https://api.whatsapp.com/send?phone=5562982239004&text=Ol%C3%A1!%20Gostaria%20de%20um%20diagn%C3%B3stico%20transparente%20com%20garantia%20para%20minha%20empresa.',
    is_active: true
  },
  {
    id: 'as_slide_5',
    order_index: 4,
    focus: 'Chamada para Ação',
    badge: 'Foco: Chamada para Ação',
    title: 'Deixe a tecnologia com quem entende e tenha a tranquilidade que você merece!',
    description: 'Deixe a tecnologia com quem entende e tenha a tranquilidade que você merece! Nossa equipe em Goiânia cuida de toda a infraestrutura técnica com agilidade.',
    image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1920&q=80',
    cta_text: 'Falar com Especialista via WhatsApp',
    cta_link: 'https://api.whatsapp.com/send?phone=5562982239004&text=Ol%C3%A1!%20Quero%20falar%20com%20um%20especialista%20da%20W3W%20em%20Goi%C3%A2nia.',
    is_active: true
  }
];

export function seedAssistanceSlides(db: Database): void {
  try {
    const res = db.exec("SELECT count(*) as count FROM assistance_slides");
    const count = res[0]?.values[0]?.[0] as number;
    if (!count || count === 0) {
      const now = new Date().toISOString();
      for (const slide of DEFAULT_ASSISTANCE_SLIDES) {
        db.run(
          `INSERT INTO assistance_slides (id, order_index, focus, title, description, image_url, badge, cta_text, cta_link, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            slide.id,
            slide.order_index,
            slide.focus,
            slide.title,
            slide.description,
            slide.image_url,
            slide.badge || null,
            slide.cta_text || null,
            slide.cta_link || null,
            slide.is_active ? 1 : 0,
            now,
            now
          ]
        );
      }
    }

    // Também garante seed na tabela carousel_slides
    try {
      const cRes = db.exec("SELECT count(*) as count FROM carousel_slides");
      const cCount = cRes[0]?.values[0]?.[0] as number;
      if (!cCount || cCount === 0) {
        const now = new Date().toISOString();
        for (const slide of DEFAULT_ASSISTANCE_SLIDES) {
          db.run(
            `INSERT INTO carousel_slides (id, order_index, focus, title, subtitle, image_url, badge, cta_text, cta_link, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              slide.id,
              slide.order_index,
              slide.focus,
              slide.title,
              slide.description,
              slide.image_url,
              slide.badge || null,
              slide.cta_text || null,
              slide.cta_link || null,
              slide.is_active ? 1 : 0,
              now,
              now
            ]
          );
        }
      }
    } catch (e) {
      // ignore
    }
  } catch (err) {
    console.warn('Could not seed assistance_slides:', err);
  }
}

export function getAssistanceSlides(activeOnly: boolean = false): AssistanceSlide[] {
  if (!dbInstance) return DEFAULT_ASSISTANCE_SLIDES;
  try {
    const query = activeOnly
      ? "SELECT * FROM assistance_slides WHERE is_active = 1 ORDER BY order_index ASC, created_at ASC"
      : "SELECT * FROM assistance_slides ORDER BY order_index ASC, created_at ASC";
    const res = dbInstance.exec(query);
    if (!res || res.length === 0 || !res[0].values) return DEFAULT_ASSISTANCE_SLIDES;

    const cols = res[0].columns;
    const slides: AssistanceSlide[] = res[0].values.map((row: any[]) => {
      const obj: any = {};
      cols.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      const orderIndex = Number(obj.order_index ?? 0);
      const focus = obj.focus || 'Institucional';
      const title = obj.title || '';
      const description = obj.description || obj.subtitle || '';
      const imageUrl = obj.image_url || '';
      const isActive = Boolean(obj.is_active === 1 || obj.is_active === '1' || obj.is_active === true);

      return {
        id: obj.id,
        order_index: orderIndex,
        ordem: orderIndex,
        focus,
        foco: focus,
        title,
        titulo: title,
        description,
        subtitle: description,
        subtitulo: description,
        image_url: imageUrl,
        imagem: imageUrl,
        badge: obj.badge || `Foco: ${focus}`,
        cta_text: obj.cta_text || 'Falar no WhatsApp',
        cta_link: obj.cta_link || '',
        is_active: isActive,
        ativo: isActive,
        created_at: obj.created_at,
        updated_at: obj.updated_at
      };
    });

    return slides.length > 0 ? slides : DEFAULT_ASSISTANCE_SLIDES;
  } catch (err) {
    console.warn('Error fetching assistance slides:', err);
    return DEFAULT_ASSISTANCE_SLIDES;
  }
}

export function getAssistanceSlideById(id: string): AssistanceSlide | null {
  if (!dbInstance) return null;
  try {
    const cleanId = id.replace(/'/g, "''");
    const res = dbInstance.exec(`SELECT * FROM assistance_slides WHERE id = '${cleanId}'`);
    if (!res || res.length === 0 || !res[0].values || res[0].values.length === 0) return null;
    const cols = res[0].columns;
    const row = res[0].values[0];
    const obj: any = {};
    cols.forEach((col, idx) => { obj[col] = row[idx]; });

    const orderIndex = Number(obj.order_index ?? 0);
    const focus = obj.focus || 'Institucional';
    const title = obj.title || '';
    const description = obj.description || obj.subtitle || '';
    const imageUrl = obj.image_url || '';
    const isActive = Boolean(obj.is_active === 1 || obj.is_active === '1' || obj.is_active === true);

    return {
      id: obj.id,
      order_index: orderIndex,
      ordem: orderIndex,
      focus,
      foco: focus,
      title,
      titulo: title,
      description,
      subtitle: description,
      subtitulo: description,
      image_url: imageUrl,
      imagem: imageUrl,
      badge: obj.badge,
      cta_text: obj.cta_text,
      cta_link: obj.cta_link,
      is_active: isActive,
      ativo: isActive,
      created_at: obj.created_at,
      updated_at: obj.updated_at
    };
  } catch (err) {
    console.error('Error fetching slide by id:', err);
    return null;
  }
}

export function createAssistanceSlide(data: Partial<AssistanceSlide>): AssistanceSlide {
  if (!dbInstance) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  const id = (data as any).id || ('as_slide_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));

  const title = (data as any).title || (data as any).titulo || 'Título do Slide';
  const description = (data as any).description || (data as any).subtitle || (data as any).subtitulo || 'Descrição do slide institucional.';
  const imageUrl = (data as any).image_url || (data as any).imagem || DEFAULT_ASSISTANCE_SLIDES[0].image_url;
  const orderIndex = typeof (data as any).order_index === 'number'
    ? (data as any).order_index
    : (typeof (data as any).ordem === 'number' ? (data as any).ordem : 0);
  const focus = (data as any).focus || (data as any).foco || 'Institucional';
  const isActive = (data as any).is_active !== undefined
    ? Boolean((data as any).is_active)
    : ((data as any).ativo !== undefined ? Boolean((data as any).ativo) : true);

  const slide: AssistanceSlide = {
    id,
    order_index: orderIndex,
    ordem: orderIndex,
    focus,
    foco: focus,
    title,
    titulo: title,
    description,
    subtitle: description,
    subtitulo: description,
    image_url: imageUrl,
    imagem: imageUrl,
    badge: (data as any).badge || (focus ? `Foco: ${focus}` : 'Assistência Técnica Goiânia'),
    cta_text: (data as any).cta_text || 'Falar no WhatsApp',
    cta_link: (data as any).cta_link || 'https://api.whatsapp.com/send?phone=5562982239004',
    is_active: isActive,
    ativo: isActive,
    created_at: now,
    updated_at: now
  };

  dbInstance.run(
    `INSERT INTO assistance_slides (id, order_index, focus, title, description, image_url, badge, cta_text, cta_link, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      slide.id,
      slide.order_index,
      slide.focus,
      slide.title,
      slide.description,
      slide.image_url,
      slide.badge || null,
      slide.cta_text || null,
      slide.cta_link || null,
      slide.is_active ? 1 : 0,
      slide.created_at || null,
      slide.updated_at || null
    ]
  );

  try {
    dbInstance.run(
      `INSERT INTO carousel_slides (id, order_index, focus, title, subtitle, image_url, badge, cta_text, cta_link, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slide.id,
        slide.order_index,
        slide.focus,
        slide.title,
        slide.description,
        slide.image_url,
        slide.badge || null,
        slide.cta_text || null,
        slide.cta_link || null,
        slide.is_active ? 1 : 0,
        slide.created_at || null,
        slide.updated_at || null
      ]
    );
  } catch (e) {
    // ignore
  }

  saveDatabase();
  return slide;
}

export function updateAssistanceSlide(id: string, updates: Partial<AssistanceSlide>): AssistanceSlide | null {
  if (!dbInstance) return null;
  try {
    const existing = getAssistanceSlideById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const title = (updates as any).title ?? (updates as any).titulo ?? existing.title;
    const description = (updates as any).description ?? (updates as any).subtitle ?? (updates as any).subtitulo ?? existing.description;
    const imageUrl = (updates as any).image_url ?? (updates as any).imagem ?? existing.image_url;
    const orderIndex = (updates as any).order_index ?? (updates as any).ordem ?? existing.order_index;
    const focus = (updates as any).focus ?? (updates as any).foco ?? existing.focus;
    const isActive = (updates as any).is_active !== undefined
      ? Boolean((updates as any).is_active)
      : ((updates as any).ativo !== undefined ? Boolean((updates as any).ativo) : existing.is_active);

    const updated: AssistanceSlide = {
      ...existing,
      ...updates,
      title,
      titulo: title,
      description,
      subtitle: description,
      subtitulo: description,
      image_url: imageUrl,
      imagem: imageUrl,
      order_index: orderIndex,
      ordem: orderIndex,
      focus,
      foco: focus,
      is_active: isActive,
      ativo: isActive,
      updated_at: now
    };

    dbInstance.run(
      `UPDATE assistance_slides SET
        order_index = ?,
        focus = ?,
        title = ?,
        description = ?,
        image_url = ?,
        badge = ?,
        cta_text = ?,
        cta_link = ?,
        is_active = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        updated.order_index,
        updated.focus,
        updated.title,
        updated.description,
        updated.image_url,
        updated.badge || null,
        updated.cta_text || null,
        updated.cta_link || null,
        updated.is_active ? 1 : 0,
        updated.updated_at || null,
        id
      ]
    );

    try {
      dbInstance.run(
        `UPDATE carousel_slides SET
          order_index = ?,
          focus = ?,
          title = ?,
          subtitle = ?,
          image_url = ?,
          badge = ?,
          cta_text = ?,
          cta_link = ?,
          is_active = ?,
          updated_at = ?
         WHERE id = ?`,
        [
          updated.order_index,
          updated.focus,
          updated.title,
          updated.description,
          updated.image_url,
          updated.badge || null,
          updated.cta_text || null,
          updated.cta_link || null,
          updated.is_active ? 1 : 0,
          updated.updated_at || null,
          id
        ]
      );
    } catch (e) {
      // ignore
    }

    saveDatabase();
    return updated;
  } catch (err) {
    console.error('Error updating assistance slide:', err);
    return null;
  }
}

export function deleteAssistanceSlide(id: string): boolean {
  if (!dbInstance) return false;
  try {
    dbInstance.run('DELETE FROM assistance_slides WHERE id = ?', [id]);
    try {
      dbInstance.run('DELETE FROM carousel_slides WHERE id = ?', [id]);
    } catch (e) {}
    saveDatabase();
    return true;
  } catch (err) {
    console.error('Error deleting assistance slide:', err);
    return false;
  }
}

export function reorderAssistanceSlides(orderedIds: string[]): boolean {
  if (!dbInstance) return false;
  try {
    orderedIds.forEach((id, index) => {
      dbInstance?.run('UPDATE assistance_slides SET order_index = ? WHERE id = ?', [index, id]);
      try {
        dbInstance?.run('UPDATE carousel_slides SET order_index = ? WHERE id = ?', [index, id]);
      } catch (e) {}
    });
    saveDatabase();
    return true;
  } catch (err) {
    console.error('Error reordering assistance slides:', err);
    return false;
  }
}

export function resetAssistanceSlidesToDefault(): AssistanceSlide[] {
  if (!dbInstance) return DEFAULT_ASSISTANCE_SLIDES;
  try {
    dbInstance.run('DELETE FROM assistance_slides');
    try {
      dbInstance.run('DELETE FROM carousel_slides');
    } catch (e) {}

    const now = new Date().toISOString();
    for (const slide of DEFAULT_ASSISTANCE_SLIDES) {
      dbInstance.run(
        `INSERT INTO assistance_slides (id, order_index, focus, title, description, image_url, badge, cta_text, cta_link, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          slide.id,
          slide.order_index,
          slide.focus,
          slide.title,
          slide.description,
          slide.image_url,
          slide.badge || null,
          slide.cta_text || null,
          slide.cta_link || null,
          slide.is_active ? 1 : 0,
          now,
          now
        ]
      );

      try {
        dbInstance.run(
          `INSERT INTO carousel_slides (id, order_index, focus, title, subtitle, image_url, badge, cta_text, cta_link, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            slide.id,
            slide.order_index,
            slide.focus,
            slide.title,
            slide.description,
            slide.image_url,
            slide.badge || null,
            slide.cta_text || null,
            slide.cta_link || null,
            slide.is_active ? 1 : 0,
            now,
            now
          ]
        );
      } catch (e) {}
    }
    saveDatabase();
    return getAssistanceSlides();
  } catch (err) {
    console.error('Error resetting assistance slides:', err);
    return DEFAULT_ASSISTANCE_SLIDES;
  }
}

// Carousel slides function aliases
export const getCarouselSlides = getAssistanceSlides;
export const getCarouselSlideById = getAssistanceSlideById;
export const createCarouselSlide = createAssistanceSlide;
export const updateCarouselSlide = updateAssistanceSlide;
export const deleteCarouselSlide = deleteAssistanceSlide;
export const reorderCarouselSlides = reorderAssistanceSlides;
export const resetCarouselSlidesToDefault = resetAssistanceSlidesToDefault;



