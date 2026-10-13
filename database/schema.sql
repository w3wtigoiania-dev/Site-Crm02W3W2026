-- ==========================================================
-- SISTEMA DE INVENTÁRIO DE TI (ASSET MANAGEMENT)
-- Esquema de Banco de Dados Compatível com SQLite e PostgreSQL
-- ==========================================================

-- 1. TABELA PRINCIPAL DE MÁQUINAS (EQUIPAMENTOS)
CREATE TABLE IF NOT EXISTS machines (
    id VARCHAR(64) PRIMARY KEY,                  -- UUID único ou hash MAC+Hostname
    hostname VARCHAR(120) NOT NULL,              -- Nome da máquina na rede
    logged_user VARCHAR(100),                    -- Usuário logado no momento da coleta
    machine_type VARCHAR(30) DEFAULT 'desktop',  -- 'desktop', 'notebook', 'server', 'vm'
    
    -- Sistema Operacional
    os_name VARCHAR(100) NOT NULL,               -- 'Windows', 'Linux', 'macOS'
    os_version VARCHAR(100),                     -- Ex: '11 Pro', 'Ubuntu 24.04 LTS', 'Server 2022'
    os_build VARCHAR(50),                        -- Ex: '22631.3296', '6.8.0-31-generic'
    os_arch VARCHAR(30),                         -- Ex: 'x86_64', 'AMD64', 'ARM64'
    
    -- Processador (CPU)
    cpu_model VARCHAR(200),                      -- Ex: 'Intel Core i7-12700K', 'AMD Ryzen 7 5800X'
    cpu_cores_physical INT DEFAULT 1,            -- Núcleos físicos
    cpu_cores_logical INT DEFAULT 1,             -- Núcleos lógicos (threads)
    cpu_freq_ghz NUMERIC(4, 2),                  -- Frequência em GHz (ex: 3.60)
    cpu_usage_percent NUMERIC(5, 2) DEFAULT 0,   -- % de uso de CPU na última coleta
    
    -- Memória RAM
    ram_total_gb NUMERIC(6, 2) NOT NULL,         -- Total em Gigabytes
    ram_used_gb NUMERIC(6, 2) NOT NULL,          -- Em uso em Gigabytes
    ram_free_gb NUMERIC(6, 2),                   -- Livre em Gigabytes
    ram_percent NUMERIC(5, 2) NOT NULL,          -- Percentual em uso (0 - 100)
    
    -- Rede Principal
    primary_ip VARCHAR(45),                      -- IP Local (IPv4 ou IPv6)
    public_ip VARCHAR(45),                       -- IP Público (externo)
    primary_mac VARCHAR(20),                     -- Endereço MAC principal
    
    -- Tempo Ligado (Uptime)
    uptime_seconds BIGINT DEFAULT 0,             -- Segundos de uptime
    boot_time VARCHAR(50),                       -- Timestamp da inicialização do SO
    
    -- Campos Gerenciais Manuais (Preenchidos na interface Web)
    client_company VARCHAR(150) DEFAULT 'Cliente Padrão', -- Empresa Cliente (Ambiente B2B/MSP)
    sector VARCHAR(100) DEFAULT 'Geral',         -- Ex: 'TI', 'Financeiro', 'Engenharia', 'RH'
    location VARCHAR(100) DEFAULT 'Matriz',      -- Ex: 'Matriz - Sala 102', 'Data Center 01'
    status VARCHAR(30) DEFAULT 'Ativo',          -- 'Ativo', 'Em Manutenção', 'Desativado', 'Reserva'
    asset_tag VARCHAR(50),                       -- Número de Patrimônio (ex: PAT-00129)
    purchase_date VARCHAR(20),                   -- Data de Aquisição (YYYY-MM-DD)
    warranty_end VARCHAR(20),                    -- Fim da Garantia (YYYY-MM-DD)
    vendor VARCHAR(100),                         -- Fornecedor / Fabricante (Dell, Lenovo, HP)
    cost NUMERIC(10, 2),                         -- Valor de Aquisição em R$
    responsible_person VARCHAR(100),             -- Funcionário responsável pelo ativo
    notes TEXT,                                  -- Observações técnicas ou gerenciais
    
    -- Metadados de Telemetria
    agent_version VARCHAR(20) DEFAULT '1.0.0',   -- Versão do agente de coleta
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data/Hora do último reporte
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_machines_hostname ON machines(hostname);
CREATE INDEX IF NOT EXISTS idx_machines_os_name ON machines(os_name);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_sector ON machines(sector);
CREATE INDEX IF NOT EXISTS idx_machines_primary_ip ON machines(primary_ip);
CREATE INDEX IF NOT EXISTS idx_machines_last_seen ON machines(last_seen);

-- 2. TABELA DE DISCOS E PARTIÇÕES
CREATE TABLE IF NOT EXISTS machine_disks (
    id VARCHAR(64) PRIMARY KEY,
    machine_id VARCHAR(64) NOT NULL,
    device VARCHAR(100) NOT NULL,                -- Ex: 'C:\\' ou '/dev/sda1'
    mountpoint VARCHAR(100),                     -- Ex: 'C:\\' ou '/'
    fstype VARCHAR(30),                          -- Ex: 'NTFS', 'ext4', 'APFS', 'xfs'
    total_gb NUMERIC(8, 2) NOT NULL,             -- Capacidade total em GB
    used_gb NUMERIC(8, 2) NOT NULL,              -- Espaço usado em GB
    free_gb NUMERIC(8, 2) NOT NULL,              -- Espaço livre em GB
    percent NUMERIC(5, 2) NOT NULL,              -- % de ocupação
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_disks_machine_id ON machine_disks(machine_id);

-- 3. TABELA DE INTERFACES DE REDE (NICs)
CREATE TABLE IF NOT EXISTS machine_networks (
    id VARCHAR(64) PRIMARY KEY,
    machine_id VARCHAR(64) NOT NULL,
    interface_name VARCHAR(100) NOT NULL,        -- Ex: 'eth0', 'Ethernet', 'Wi-Fi', 'en0'
    ip_address VARCHAR(45),                      -- Ex: '192.168.1.150'
    netmask VARCHAR(45),                         -- Ex: '255.255.255.0'
    mac_address VARCHAR(30),                     -- Ex: '00:1A:2B:3C:4D:5E'
    is_up BOOLEAN DEFAULT TRUE,                  -- Conexão ativa?
    speed_mbps INT DEFAULT 1000,                 -- Velocidade nominal se detectada
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_networks_machine_id ON machine_networks(machine_id);

-- 4. TABELA DE HISTÓRICO DE TELEMETRIA (Métricas temporais de RAM, CPU e Disco)
CREATE TABLE IF NOT EXISTS inventory_history (
    id VARCHAR(64) PRIMARY KEY,
    machine_id VARCHAR(64) NOT NULL,
    cpu_percent NUMERIC(5, 2),
    ram_percent NUMERIC(5, 2),
    uptime_seconds BIGINT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_history_machine_id ON inventory_history(machine_id);

-- 5. TABELA DE TOKENS DE AUTENTICAÇÃO DO AGENTE
CREATE TABLE IF NOT EXISTS agent_tokens (
    id VARCHAR(64) PRIMARY KEY,
    token VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,                  -- Ex: 'Token Padrão - Domínio AD Matriz'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABELA DE CONFIGURAÇÕES E PARÂMETROS DO SISTEMA (LOGO, EMPRESA, CABEÇALHOS)
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
    company_name VARCHAR(150) DEFAULT 'InfraAsset IT Solutions',
    system_title VARCHAR(150) DEFAULT 'INFRA ASSET MANAGER',
    department VARCHAR(100) DEFAULT 'Infraestrutura, Redes & Governança de TI',
    logo_url TEXT,                                -- Data URL base64 ou URL pública da logo corporativa
    footer_text VARCHAR(255) DEFAULT 'INFRA ASSET MANAGER • Gestão de Ativos & Telemetria em Tempo Real',
    report_header TEXT DEFAULT 'RELATÓRIO OFICIAL DE INVENTÁRIO E AUDITORIA PATRIMONIAL',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABELA DE EMPRESAS CLIENTES (GESTÃO MULTI-EMPRESA B2B / MSP)
CREATE TABLE IF NOT EXISTS client_companies (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,                  -- Nome fantasia / comercial
    trade_name VARCHAR(150),                     -- Razão Social
    document VARCHAR(30),                        -- CNPJ / CPF
    contact_name VARCHAR(100),                   -- Contato técnico / gestor
    contact_email VARCHAR(120),                  -- E-mail para chamados/reportes
    contact_phone VARCHAR(30),                   -- Telefone / WhatsApp
    sla_plan VARCHAR(50) DEFAULT 'Padrão',       -- Plano de Suporte (Bronze, Prata, Ouro, 24x7)
    notes TEXT,                                  -- Observações de contrato e escopo
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABELA DE USUÁRIOS PRINCIPAIS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(60) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    primary_role VARCHAR(50) DEFAULT 'Operador',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. TABELA DE PAPÉIS (NÍVEIS HIERÁRQUICOS DE ACESSO)
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,            -- 'SuperAdmin', 'Editor', 'Operador', 'Viewer'
    description TEXT
);

-- 10. TABELA DE MÓDULOS / ESCOPOS DO SISTEMA
CREATE TABLE IF NOT EXISTS scopes (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE             -- 'Rede', 'Servidores', 'Segurança', 'Web-Apps'
);

-- 11. TABELA DE ASSOCIAÇÃO DE PERMISSÕES (USUÁRIO x PAPEL x ESCOPO)
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id VARCHAR(64) NOT NULL,
    role_id VARCHAR(64) NOT NULL,
    scope_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (user_id, role_id, scope_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (scope_id) REFERENCES scopes(id) ON DELETE CASCADE
);

-- 12. TABELA DE SLIDES DO CARROSSEL (CAROUSEL & ASSISTÊNCIA TÉCNICA)
-- Persistência de slides com imagem, título, subtítulo e ordem de exibição
CREATE TABLE IF NOT EXISTS carousel_slides (
    id VARCHAR(64) PRIMARY KEY,                  -- Identificador único do slide (ex: 'slide_01')
    image_url TEXT NOT NULL,                     -- URL ou Data URI da imagem do slide
    title VARCHAR(255) NOT NULL,                 -- Título principal do slide
    subtitle TEXT,                               -- Subtítulo ou descrição detalhada do slide
    order_index INT DEFAULT 0,                   -- Ordem sequencial de exibição no carrossel
    focus VARCHAR(100) DEFAULT 'Institucional',  -- Área de foco (ex: 'Essencialidade', 'Infraestrutura')
    badge VARCHAR(100),                          -- Selo ou tag destacada no card
    cta_text VARCHAR(100) DEFAULT 'Saiba Mais',  -- Texto do botão de ação
    cta_link VARCHAR(255),                       -- Link de direcionamento (ex: WhatsApp, URL)
    is_active BOOLEAN DEFAULT TRUE,              -- Slide visível ou oculto
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_carousel_slides_order ON carousel_slides(order_index);
CREATE INDEX IF NOT EXISTS idx_carousel_slides_active ON carousel_slides(is_active);

-- Alias / compatibilidade com a tabela assistance_slides
CREATE TABLE IF NOT EXISTS assistance_slides (
    id VARCHAR(64) PRIMARY KEY,
    order_index INT DEFAULT 0,
    focus VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    badge VARCHAR(100),
    cta_text VARCHAR(100),
    cta_link VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
-- 13. TABELA DE STATUS DE MANUTENÇÃO E EQUIPAMENTOS PERSONALIZÁVEIS
-- Diferenciação visual por cor e situação com controle de acesso por senha
CREATE TABLE IF NOT EXISTS equipment_statuses (
    id VARCHAR(64) PRIMARY KEY,                         -- Identificador único (ex: 'status_ativo', 'status_manutencao')
    name VARCHAR(100) NOT NULL UNIQUE,                 -- Nome do status (ex: 'Ativo', 'Em Manutenção', 'Aguardando Peça')
    color VARCHAR(30) NOT NULL,                        -- Paleta/código de cor (ex: 'emerald', 'amber', 'blue', 'rose', 'purple', 'yellow', 'cyan', 'teal', 'indigo', 'slate')
    hex_color VARCHAR(10) NOT NULL DEFAULT '#10b981',  -- Código Hexadecimal (ex: '#10b981', '#f59e0b')
    bg_class VARCHAR(120),                             -- Classe Tailwind para badge visual de alto contraste
    situation_type VARCHAR(60) NOT NULL DEFAULT 'geral', -- Tipo de situação (operacional, manutencao, pendencia, analise, concluido, inativo, reserva)
    description TEXT,                                  -- Descrição clara da situação técnica
    requires_password BOOLEAN DEFAULT TRUE,            -- Se exige senha do supervisor/técnico para aplicar
    is_default BOOLEAN DEFAULT FALSE,                  -- Se é status protegido do sistema
    order_index INT DEFAULT 0,                         -- Ordem sequencial de exibição
    is_active BOOLEAN DEFAULT TRUE,                    -- Se está ativo para seleção
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_equipment_statuses_order ON equipment_statuses(order_index);
CREATE INDEX IF NOT EXISTS idx_equipment_statuses_active ON equipment_statuses(is_active);

-- 14. TABELA DE AUDITORIA E HISTÓRICO DE MUDANÇA DE STATUS (COM SENHA / AUTORIZAÇÃO)
CREATE TABLE IF NOT EXISTS equipment_status_logs (
    id VARCHAR(64) PRIMARY KEY,
    machine_id VARCHAR(64) NOT NULL,
    hostname VARCHAR(255),
    previous_status VARCHAR(100),
    new_status VARCHAR(100) NOT NULL,
    reason TEXT,
    authorized_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_status_logs_machine ON equipment_status_logs(machine_id);
CREATE INDEX IF NOT EXISTS idx_status_logs_created ON equipment_status_logs(created_at);

