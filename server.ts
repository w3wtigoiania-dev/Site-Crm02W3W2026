import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  getAllMachines,
  getMachineById,
  createMachineManual,
  updateMachineManual,
  deleteMachine,
  upsertAgentReport,
  getStats,
  getTokens,
  validateToken,
  getSystemSettings,
  updateSystemSettings,
  getClientCompanies,
  createClientCompany,
  updateClientCompany,
  deleteClientCompany,
  getRoles,
  getScopes,
  getUserPermissions,
  setUserPermissions,
  getUsers,
  getUserById,
  getUserByUsernameOrEmail,
  createUser,
  updateUser,
  deleteUser,
  authenticateUser,
  getCreditCards,
  addCreditCard,
  updateCreditCard,
  deleteCreditCard,
  getFinancialInstitutions,
  addFinancialInstitution,
  updateFinancialInstitution,
  deleteFinancialInstitution,
  getFinancialCategories,
  addFinancialCategory,
  deleteFinancialCategory,
  getCreditCardExpenses,
  addCreditCardExpense,
  updateCreditCardExpense,
  deleteCreditCardExpense,
  getAccountsPayable,
  addAccountsPayable,
  updateAccountsPayable,
  updateAccountsPayableStatus,
  deleteAccountsPayable,
  getAccountsReceivable,
  addAccountsReceivable,
  updateAccountsReceivableStatus,
  deleteAccountsReceivable,
  getFinancialCompetenceSummary,
  generateMySqlExport,
  exportDatabaseAsJson,
  exportDatabaseAsCsv,
  getDatabaseBackupStats,
  ALL_BACKUP_TABLES,
  getAllMaintenances,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getAssistanceSlides,
  getAssistanceSlideById,
  createAssistanceSlide,
  updateAssistanceSlide,
  deleteAssistanceSlide,
  reorderAssistanceSlides,
  resetAssistanceSlidesToDefault,
  getCarouselSlides,
  getCarouselSlideById,
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
  reorderCarouselSlides,
  resetCarouselSlidesToDefault,
  getEquipmentStatuses,
  getEquipmentStatusById,
  createEquipmentStatus,
  updateEquipmentStatus,
  deleteEquipmentStatus,
  verifyStatusChangePassword,
  updateMachineStatusWithAuth,
  getEquipmentStatusLogs
} from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const UPLOADS_DIR = path.resolve(__dirname, 'data', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Simple in-memory session tokens for demo / auth
const activeSessions = new Set<string>(['demo_admin_session_token']);

// -------------------------------------------------------------
// ROTAS DE AUTENTICAÇÃO
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  // Verifica credenciais no banco de dados SQLite
  const dbUser = authenticateUser(username, password);
  if (!dbUser) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique usuário e senha.' });
  }

  const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  activeSessions.add(sessionToken);

  return res.json({
    token: sessionToken,
    user: {
      id: dbUser.id,
      name: dbUser.name,
      role: dbUser.role,
      email: dbUser.email,
      username: dbUser.username,
      company_id: dbUser.company_id,
      company_name: dbUser.company_name,
      permissions: dbUser.permissions
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, username, email, password, role, company_name } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Nome, Usuário e Senha são obrigatórios.' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email && email.trim() ? email.trim() : `${cleanUsername.toLowerCase()}@w3wsolucoesti.com.br`;

    // Verifica se já existe
    const existing = getUserByUsernameOrEmail(cleanUsername) || getUserByUsernameOrEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Usuário ou E-mail já cadastrado. Escolha outro identificador.' });
    }

    const newUser = createUser({
      name: name.trim(),
      email: cleanEmail,
      username: cleanUsername,
      password: password.trim(),
      role: role || 'Operador',
      company_name: company_name ? company_name.trim() : 'W3W Soluções em TI',
      is_active: true
    });

    const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    activeSessions.add(sessionToken);

    return res.status(201).json({
      success: true,
      token: sessionToken,
      user: {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
        email: newUser.email,
        username: newUser.username,
        company_id: newUser.company_id,
        company_name: newUser.company_name,
        permissions: newUser.permissions
      }
    });
  } catch (err: any) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Erro ao cadastrar usuário: ' + err.message });
  }
});

app.post('/api/diagnostics', (req, res) => {
  try {
    const diagnosticData = req.body;
    console.log('[DIAGNÓSTICO RECEBIDO DO SITE]:', diagnosticData);
    res.status(201).json({ success: true, message: 'Diagnóstico registrado com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao registrar diagnóstico: ' + err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  // Retorna sessão atual
  res.json({
    authenticated: true,
    user: {
      name: 'Administrador de TI',
      role: 'SuperAdmin',
      company_id: 'comp_hospital',
      company_name: 'Hospital São Lucas',
      email: 'admin.infra@empresa.com.br'
    }
  });
});

// -------------------------------------------------------------
// ROTAS DE ESTATÍSTICAS E DASHBOARD
// -------------------------------------------------------------
app.get('/api/stats', (req, res) => {
  try {
    const company = req.query.company as string;
    const stats = getStats(company);
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Erro ao processar estatísticas' });
  }
});

// -------------------------------------------------------------
// ROTAS DE GESTÃO DE MÁQUINAS (INVENTÁRIO)
// -------------------------------------------------------------
app.get('/api/machines', (req, res) => {
  try {
    const { search, os, type, status, sector, company } = req.query as Record<string, string>;
    const machines = getAllMachines({ search, os, type, status, sector, company });
    res.json({
      data: machines,
      total: machines.length
    });
  } catch (err: any) {
    console.error('Error fetching machines:', err);
    res.status(500).json({ error: 'Erro ao carregar máquinas do inventário' });
  }
});

app.post('/api/machines', (req, res) => {
  try {
    const { hostname, client_company } = req.body;
    if (!hostname || !client_company) {
      return res.status(400).json({
        error: 'Nome do equipamento (Hostname) e Empresa Vinculada são obrigatórios para cadastro.'
      });
    }

    const machine = createMachineManual(req.body);
    console.log(`[MANUAL] Dispositivo cadastrado manualmente: ${machine.hostname} (${machine.machine_type}) - Empresa: ${machine.client_company}`);
    res.status(201).json({
      success: true,
      message: `Dispositivo "${machine.hostname}" cadastrado com sucesso para a empresa "${machine.client_company}"!`,
      data: machine
    });
  } catch (err: any) {
    console.error('Error creating machine manually:', err);
    res.status(500).json({ error: 'Erro ao cadastrar equipamento: ' + err.message });
  }
});

app.get('/api/machines/:id', (req, res) => {
  try {
    const machine = getMachineById(req.params.id);
    if (!machine) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }
    res.json(machine);
  } catch (err: any) {
    console.error('Error fetching machine details:', err);
    res.status(500).json({ error: 'Erro ao carregar detalhes da máquina' });
  }
});

app.patch('/api/machines/:id', (req, res) => {
  try {
    const success = updateMachineManual(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ error: 'Máquina não encontrada para atualização' });
    }
    const updated = getMachineById(req.params.id);
    res.json({ message: 'Dados atualizados com sucesso', data: updated });
  } catch (err: any) {
    console.error('Error updating machine:', err);
    res.status(500).json({ error: 'Erro ao atualizar dados manuais da máquina' });
  }
});

app.delete('/api/machines/:id', (req, res) => {
  try {
    const success = deleteMachine(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Máquina não encontrada' });
    }
    res.json({ message: 'Equipamento removido do inventário com sucesso' });
  } catch (err: any) {
    console.error('Error deleting machine:', err);
    res.status(500).json({ error: 'Erro ao excluir equipamento' });
  }
});

// -------------------------------------------------------------
// STATUS DE MANUTENÇÃO & EQUIPAMENTOS (COM SEGURANÇA E SENHA)
// -------------------------------------------------------------

// Listar todos os status cadastrados
app.get(['/api/equipment-statuses', '/api/statuses'], (req, res) => {
  try {
    const onlyActive = req.query.active === 'true';
    const statuses = getEquipmentStatuses(onlyActive);
    res.json({ success: true, statuses, total: statuses.length });
  } catch (err: any) {
    console.error('Error fetching statuses:', err);
    res.status(500).json({ success: false, error: 'Erro ao carregar status de equipamentos' });
  }
});

// Cadastrar novo status de equipamento / manutenção
app.post(['/api/equipment-statuses', '/api/statuses'], (req, res) => {
  try {
    const { name, color, hex_color, bg_class, situation_type, description, requires_password, is_active } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Nome do status é obrigatório.' });
    }
    const created = createEquipmentStatus({
      name,
      color,
      hex_color,
      bg_class,
      situation_type,
      description,
      requires_password: requires_password !== undefined ? requires_password : true,
      is_active: is_active !== undefined ? is_active : true
    });
    res.status(201).json({ success: true, message: 'Status cadastrado com sucesso!', status: created });
  } catch (err: any) {
    console.error('Error creating status:', err);
    res.status(400).json({ success: false, error: err.message || 'Erro ao cadastrar status.' });
  }
});

// Atualizar status existente
app.put(['/api/equipment-statuses/:id', '/api/statuses/:id'], (req, res) => {
  try {
    const success = updateEquipmentStatus(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Status não encontrado para atualização.' });
    }
    const updated = getEquipmentStatusById(req.params.id);
    res.json({ success: true, message: 'Status atualizado com sucesso!', status: updated });
  } catch (err: any) {
    console.error('Error updating status:', err);
    res.status(400).json({ success: false, error: err.message || 'Erro ao atualizar status.' });
  }
});

// Excluir status customizado
app.delete(['/api/equipment-statuses/:id', '/api/statuses/:id'], (req, res) => {
  try {
    const success = deleteEquipmentStatus(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Status não encontrado.' });
    }
    res.json({ success: true, message: 'Status removido com sucesso!' });
  } catch (err: any) {
    console.error('Error deleting status:', err);
    res.status(400).json({ success: false, error: err.message || 'Erro ao excluir status.' });
  }
});

// Validar senha de segurança para alteração de status
app.post('/api/statuses/verify-password', (req, res) => {
  try {
    const { password } = req.body;
    const auth = verifyStatusChangePassword(password);
    if (!auth.valid) {
      return res.status(401).json({ success: false, error: 'Senha de autorização incorreta.' });
    }
    res.json({ success: true, authorized_by: auth.authorizedBy });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao validar senha de segurança.' });
  }
});

// Alterar status de máquina com autenticação por senha e auditoria
app.post('/api/machines/:id/change-status', (req, res) => {
  try {
    const { status, password, reason, requested_by } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'O novo status é obrigatório.' });
    }
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'A senha de autorização técnica/supervisor é obrigatória para alterar o status do equipamento.'
      });
    }

    const result = updateMachineStatusWithAuth(req.params.id, status, password, reason, requested_by);
    if (!result.success) {
      return res.status(401).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      message: `Status do equipamento alterado para "${status}" com sucesso!`,
      machine: result.machine,
      log: result.log
    });
  } catch (err: any) {
    console.error('Error changing machine status:', err);
    res.status(500).json({ success: false, error: err.message || 'Erro ao alterar status com senha.' });
  }
});

// Logs de histórico de alterações de status
app.get(['/api/statuses/logs', '/api/machines/:id/status-logs'], (req, res) => {
  try {
    const machineId = req.params.id || (req.query.machine_id as string);
    const logs = getEquipmentStatusLogs(machineId);
    res.json({ success: true, logs, total: logs.length });
  } catch (err: any) {
    console.error('Error fetching status logs:', err);
    res.status(500).json({ success: false, error: 'Erro ao buscar histórico de status.' });
  }
});

// -------------------------------------------------------------
// ROTAS DE AGENDAMENTO DE MANUTENÇÃO (CALENDÁRIO DO CRM)
// -------------------------------------------------------------
app.get('/api/maintenances', (req, res) => {
  try {
    const company = req.query.company as string;
    const records = getAllMaintenances(company);
    res.json({ data: records, total: records.length });
  } catch (err: any) {
    console.error('Error fetching maintenances:', err);
    res.status(500).json({ error: 'Erro ao carregar manutenções agendadas' });
  }
});

app.post('/api/maintenances', (req, res) => {
  try {
    const { machine_id, hostname, company_name, date_str, title, maintenance_type } = req.body;
    if (!hostname || !company_name || !date_str) {
      return res.status(400).json({
        error: 'Equipamento (hostname), Empresa Cliente e Data são obrigatórios para agendar a manutenção.'
      });
    }

    const created = createMaintenance(req.body);

    // Se solicitado atualizar status do ativo para "Em Manutenção"
    if (req.body.update_machine_status && machine_id) {
      try {
        updateMachineManual(machine_id, { status: 'Em Manutenção' });
      } catch (mErr) {
        console.warn('Could not update machine status:', mErr);
      }
    }

    res.status(201).json({ message: 'Manutenção agendada com sucesso', data: created });
  } catch (err: any) {
    console.error('Error scheduling maintenance:', err);
    res.status(500).json({ error: 'Erro ao agendar manutenção: ' + err.message });
  }
});

app.put('/api/maintenances/:id', (req, res) => {
  try {
    const success = updateMaintenance(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ error: 'Agendamento de manutenção não encontrado' });
    }
    res.json({ message: 'Manutenção atualizada com sucesso' });
  } catch (err: any) {
    console.error('Error updating maintenance:', err);
    res.status(500).json({ error: 'Erro ao atualizar manutenção' });
  }
});

app.delete('/api/maintenances/:id', (req, res) => {
  try {
    const success = deleteMaintenance(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Agendamento não encontrado para exclusão' });
    }
    res.json({ message: 'Agendamento de manutenção excluído com sucesso' });
  } catch (err: any) {
    console.error('Error deleting maintenance:', err);
    res.status(500).json({ error: 'Erro ao excluir agendamento' });
  }
});

// -------------------------------------------------------------
// ROTA DO AGENTE DE COLETA (RECEBIMENTO DE DADOS EM TEMPO REAL)
// -------------------------------------------------------------
app.post('/api/agent/report', (req, res) => {
  try {
    const agentToken = req.headers['x-agent-token'] || req.query.token;
    
    // Validação de token de segurança
    if (agentToken && !validateToken(String(agentToken))) {
      return res.status(401).json({
        error: 'Token de Agente inválido ou não autorizado.',
        hint: 'Use o token configurado no painel de administração.'
      });
    }

    const payload = req.body;
    if (!payload || !payload.hostname) {
      return res.status(400).json({ error: 'Payload de telemetria inválido. Hostname é obrigatório.' });
    }

    // Suporte a empresa cliente via header, query ou body
    const headerCompany = req.headers['x-client-company'] || req.query.company;
    if (headerCompany && !payload.client_company && !payload.company) {
      payload.client_company = String(headerCompany);
    }

    const machine = upsertAgentReport(payload);
    console.log(`[AGENT] Coleta recebida com sucesso: ${machine.hostname} (${machine.os_name}) - Empresa: ${machine.client_company || 'Padrão'} - IP: ${machine.primary_ip}`);

    res.status(201).json({
      status: 'success',
      message: 'Telemetria e dados de hardware registrados com sucesso!',
      machine_id: machine.id,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Error receiving agent report:', err);
    res.status(500).json({ error: 'Erro ao processar dados do agente: ' + err.message });
  }
});

// -------------------------------------------------------------
// ROTA DE SIMULAÇÃO DE AGENTE (TESTES DIRETOS VIA UI)
// -------------------------------------------------------------
app.post('/api/agent/simulate', (req, res) => {
  try {
    const { preset, company } = req.body;
    const now = new Date();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const randIpLast = Math.floor(10 + Math.random() * 200);

    let samplePayload: any;

    if (preset === 'ubuntu_server') {
      samplePayload = {
        id: `0242AC1100${randomSuffix}_SRVUBUNTU${randomSuffix}`,
        hostname: `SRV-APP-LINUX-${randomSuffix}`,
        logged_user: 'deployer',
        machine_type: 'server',
        os: {
          name: 'Linux',
          version: 'Ubuntu 24.04 LTS',
          build: '6.8.0-35-generic',
          arch: 'x86_64'
        },
        cpu: {
          model: 'AMD EPYC 7763 64-Core Processor',
          cores_physical: 16,
          cores_logical: 32,
          freq_ghz: 2.45,
          usage_percent: Math.round(15 + Math.random() * 45)
        },
        memory: {
          total_gb: 64.0,
          used_gb: 42.1,
          free_gb: 21.9,
          percent: 65.8
        },
        disks: [
          { device: '/dev/sda1', mountpoint: '/', fstype: 'ext4', total_gb: 500, used_gb: 180, free_gb: 320, percent: 36.0 },
          { device: '/dev/sdb1', mountpoint: '/var/data', fstype: 'xfs', total_gb: 2000, used_gb: 1450, free_gb: 550, percent: 72.5 }
        ],
        network: {
          primary_ip: `10.0.2.${randIpLast}`,
          primary_mac: `02:42:AC:11:00:${randomSuffix.toString().slice(0, 2)}`,
          public_ip: '177.136.24.95',
          interfaces: [
            { interface_name: 'eth0', ip_address: `10.0.2.${randIpLast}`, netmask: '255.255.255.0', mac_address: `02:42:AC:11:00:${randomSuffix.toString().slice(0, 2)}`, is_up: true }
          ]
        },
        uptime: {
          seconds: 86400 * 14,
          boot_time: new Date(Date.now() - 86400000 * 14).toISOString()
        },
        agent_version: '2.4.0'
      };
    } else if (preset === 'macbook_m3') {
      samplePayload = {
        id: `F01898${randomSuffix}_MBPRO${randomSuffix}`,
        hostname: `MBP-DESIGN-${randomSuffix}`,
        logged_user: 'gabriel.costa',
        machine_type: 'notebook',
        os: {
          name: 'macOS',
          version: 'Sonoma 14.5',
          build: '23F79',
          arch: 'ARM64'
        },
        cpu: {
          model: 'Apple M3 Max (16-core)',
          cores_physical: 16,
          cores_logical: 16,
          freq_ghz: 4.05,
          usage_percent: 22.0
        },
        memory: {
          total_gb: 48.0,
          used_gb: 29.4,
          free_gb: 18.6,
          percent: 61.2
        },
        disks: [
          { device: '/dev/disk3s1', mountpoint: '/', fstype: 'APFS', total_gb: 1000, used_gb: 410, free_gb: 590, percent: 41.0 }
        ],
        network: {
          primary_ip: `192.168.10.${randIpLast}`,
          primary_mac: `F0:18:98:AA:${randomSuffix.toString().slice(0, 2)}:11`,
          public_ip: '177.136.24.89',
          interfaces: [
            { interface_name: 'en0 (Wi-Fi 6E)', ip_address: `192.168.10.${randIpLast}`, netmask: '255.255.255.0', mac_address: `F0:18:98:AA:${randomSuffix.toString().slice(0, 2)}:11`, is_up: true }
          ]
        },
        uptime: {
          seconds: 86400 * 3,
          boot_time: new Date(Date.now() - 86400000 * 3).toISOString()
        },
        agent_version: '2.4.0'
      };
    } else {
      // Default: Windows 11 Desktop
      samplePayload = {
        id: `E454E8${randomSuffix}_DESKWIN${randomSuffix}`,
        hostname: `DESK-FIN-${randomSuffix}`,
        logged_user: `usuario.teste${randomSuffix}`,
        machine_type: 'desktop',
        os: {
          name: 'Windows',
          version: '11 Pro',
          build: '22631.3447',
          arch: 'AMD64'
        },
        cpu: {
          model: 'Intel Core i5-14400 @ 2.50GHz',
          cores_physical: 10,
          cores_logical: 16,
          freq_ghz: 2.50,
          usage_percent: 31.4
        },
        memory: {
          total_gb: 16.0,
          used_gb: 10.2,
          free_gb: 5.8,
          percent: 63.8
        },
        disks: [
          { device: 'C:', mountpoint: 'C:\\', fstype: 'NTFS', total_gb: 512, used_gb: 215, free_gb: 297, percent: 42.0 }
        ],
        network: {
          primary_ip: `192.168.10.${randIpLast}`,
          primary_mac: `E4:54:E8:11:${randomSuffix.toString().slice(0, 2)}:55`,
          public_ip: '177.136.24.89',
          interfaces: [
            { interface_name: 'Ethernet Realtek GbE', ip_address: `192.168.10.${randIpLast}`, netmask: '255.255.255.0', mac_address: `E4:54:E8:11:${randomSuffix.toString().slice(0, 2)}:55`, is_up: true }
          ]
        },
        uptime: {
          seconds: 14400,
          boot_time: new Date(Date.now() - 14400000).toISOString()
        },
        agent_version: '2.4.0'
      };
    }

    if (company) {
      samplePayload.client_company = company;
    }

    const machine = upsertAgentReport(samplePayload);
    res.json({
      status: 'simulated',
      message: `Agente simulado com sucesso: ${machine.hostname} (${machine.client_company})`,
      data: machine
    });
  } catch (err: any) {
    console.error('Error simulating agent:', err);
    res.status(500).json({ error: 'Erro ao simular envio do agente' });
  }
});

// -------------------------------------------------------------
// DOWNLOAD E CÓPIA DOS SCRIPTS DO AGENTE
// -------------------------------------------------------------
app.get('/api/agent/scripts/:filename', (req, res) => {
  const allowed = ['agent_collector.py', 'agent_collector.ps1', 'agent_collector.sh'];
  const filename = req.params.filename;
  if (!allowed.includes(filename)) {
    return res.status(404).send('Script não encontrado');
  }

  const scriptPath = path.join(__dirname, 'scripts', filename);
  if (!fs.existsSync(scriptPath)) {
    return res.status(404).send('Arquivo não encontrado no servidor');
  }

  const content = fs.readFileSync(scriptPath, 'utf-8');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(content);
});

// -------------------------------------------------------------
// EXPORTAÇÃO CSV DE INVENTÁRIO
// -------------------------------------------------------------
app.get('/api/export/csv', (req, res) => {
  try {
    const company = req.query.company as string;
    const machines = getAllMachines(company && company !== 'all' ? { company } : {});
    const headers = [
      'Patrimônio', 'Hostname', 'Empresa Cliente', 'Usuário Logado', 'Tipo', 'Sistema Operacional',
      'Versão SO', 'Processador', 'Núcleos', 'RAM Total (GB)', 'RAM Usada (%)',
      'IP Local', 'IP Público', 'MAC Address', 'Uptime (Horas)', 'Setor',
      'Localização', 'Status', 'Responsável', 'Data Compra', 'Garantia Até', 'Último Visto'
    ];

    const rows = machines.map(m => {
      const uptimeHours = Math.round(m.uptime_seconds / 3600);
      return [
        `"${m.asset_tag || ''}"`,
        `"${m.hostname || ''}"`,
        `"${(m.client_company || 'Cliente Geral').replace(/"/g, '""')}"`,
        `"${m.logged_user || ''}"`,
        `"${m.machine_type || ''}"`,
        `"${m.os_name || ''}"`,
        `"${m.os_version || ''}"`,
        `"${(m.cpu_model || '').replace(/"/g, '""')}"`,
        m.cpu_cores_logical || 1,
        m.ram_total_gb || 0,
        m.ram_percent || 0,
        `"${m.primary_ip || ''}"`,
        `"${m.public_ip || ''}"`,
        `"${m.primary_mac || ''}"`,
        uptimeHours,
        `"${m.sector || ''}"`,
        `"${m.location || ''}"`,
        `"${m.status || ''}"`,
        `"${m.responsible_person || ''}"`,
        `"${m.purchase_date || ''}"`,
        `"${m.warranty_end || ''}"`,
        `"${m.last_seen || ''}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    const filenameSuffix = company && company !== 'all' ? `_${company.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : '';
    res.setHeader('Content-Disposition', `attachment; filename="inventario_ti${filenameSuffix}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).send('Erro ao exportar CSV: ' + err.message);
  }
});

// -------------------------------------------------------------
// GESTÃO DE TOKENS DO AGENTE
// -------------------------------------------------------------
app.get('/api/tokens', (req, res) => {
  res.json({ tokens: getTokens() });
});

// -------------------------------------------------------------
// CONFIGURAÇÕES E PARÂMETROS DO SISTEMA (LOGO, TÍTULO, CABEÇALHOS)
// -------------------------------------------------------------
// Clientes conectados ao Server-Sent Events (SSE) para sincronização em tempo real do CMS
const sseCmsClients = new Set<express.Response>();

function broadcastCmsUpdate(websiteConfig: any, senderId?: string) {
  if (!websiteConfig) return;
  const payload = JSON.stringify({
    type: 'website_config_updated',
    website_config: websiteConfig,
    timestamp: new Date().toISOString(),
    senderId: senderId || 'server'
  });

  for (const client of sseCmsClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (e) {
      sseCmsClients.delete(client);
    }
  }
}

function broadcastAssistanceSlidesUpdate(slides: any[], senderId?: string) {
  if (!slides) return;
  const payload = JSON.stringify({
    type: 'assistance_slides_updated',
    assistance_slides: slides,
    timestamp: new Date().toISOString(),
    senderId: senderId || 'server'
  });

  for (const client of sseCmsClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (e) {
      sseCmsClients.delete(client);
    }
  }
}

// Stream SSE em tempo real para sincronização instantânea com W3WSiteView e CRM
app.get('/api/cms/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  sseCmsClients.add(res);

  // Envia payload inicial com a configuração atual do website e slides de assistência
  try {
    const current = getSystemSettings();
    const assistanceSlides = getAssistanceSlides(true);
    const initPayload = JSON.stringify({
      type: 'connected',
      website_config: current.website_config,
      assistance_slides: assistanceSlides,
      timestamp: new Date().toISOString(),
      activeClients: sseCmsClients.size
    });
    res.write(`data: ${initPayload}\n\n`);
  } catch (e) {}

  const pingInterval = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch (e) {
      clearInterval(pingInterval);
      sseCmsClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(pingInterval);
    sseCmsClients.delete(res);
  });
});

// Endpoint de sincronização imediata em tempo real do CMS
app.post('/api/cms/sync', (req, res) => {
  try {
    const { website_config, senderId } = req.body;
    if (!website_config) {
      return res.status(400).json({ error: 'Configuração do website ausente' });
    }

    const updated = updateSystemSettings({ website_config });
    broadcastCmsUpdate(updated.website_config, senderId);

    res.json({
      success: true,
      website_config: updated.website_config,
      activeClients: sseCmsClients.size,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Error syncing CMS in real-time:', err);
    res.status(500).json({ error: 'Erro ao sincronizar configurações do CMS: ' + err.message });
  }
});

app.get('/api/settings', (req, res) => {
  try {
    const settings = getSystemSettings();
    res.json(settings);
  } catch (err: any) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Erro ao carregar parâmetros do sistema' });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const updated = updateSystemSettings(req.body);
    if (updated.website_config) {
      broadcastCmsUpdate(updated.website_config, req.body.senderId);
    }
    res.json({
      success: true,
      message: 'Parâmetros e logotipo do sistema atualizados com sucesso!',
      settings: updated
    });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Erro ao salvar parâmetros do sistema: ' + err.message });
  }
});

// -------------------------------------------------------------
// CARROSSEL INSTITUCIONAL & SLIDES (API MOCK / PERSISTÊNCIA SQLITE)
// Rotas unificadas: /api/carousel-slides, /api/slides, /api/assistance-slides
// -------------------------------------------------------------

// Esquema de banco de dados e metadados dos slides do carrossel
const CAROUSEL_DB_SCHEMA = {
  table: 'carousel_slides',
  description: 'Tabela de persistência dos slides do carrossel institucional',
  fields: [
    { name: 'id', type: 'VARCHAR(64)', primary_key: true, description: 'Identificador único do slide' },
    { name: 'image_url', aliases: ['imagem'], type: 'TEXT', required: true, description: 'URL ou Data URI da imagem do slide' },
    { name: 'title', aliases: ['titulo'], type: 'VARCHAR(255)', required: true, description: 'Título principal do slide' },
    { name: 'subtitle', aliases: ['subtitulo', 'description'], type: 'TEXT', required: false, description: 'Subtítulo ou descrição do slide' },
    { name: 'order_index', aliases: ['ordem'], type: 'INTEGER', default: 0, description: 'Ordem sequencial de exibição' },
    { name: 'focus', aliases: ['foco'], type: 'VARCHAR(100)', default: 'Institucional', description: 'Área de foco técnico' },
    { name: 'badge', type: 'VARCHAR(100)', required: false, description: 'Selo ou tag em destaque' },
    { name: 'cta_text', type: 'VARCHAR(100)', default: 'Falar no WhatsApp', description: 'Texto da chamada para ação' },
    { name: 'cta_link', type: 'VARCHAR(255)', required: false, description: 'Link de redirecionamento do CTA' },
    { name: 'is_active', aliases: ['ativo'], type: 'BOOLEAN', default: true, description: 'Status de visibilidade do slide' },
    { name: 'created_at', type: 'TIMESTAMP', description: 'Data de criação do registro' },
    { name: 'updated_at', type: 'TIMESTAMP', description: 'Data de atualização do registro' }
  ],
  sample_item: {
    id: 'as_slide_1',
    order_index: 0,
    ordem: 0,
    title: 'Tecnologia no seu dia a dia e no sucesso do seu negócio.',
    titulo: 'Tecnologia no seu dia a dia e no sucesso do seu negócio.',
    subtitle: 'Sabemos o quanto a tecnologia é fundamental para o seu dia a dia e para o sucesso do seu negócio.',
    subtitulo: 'Sabemos o quanto a tecnologia é fundamental para o seu dia a dia e para o sucesso do seu negócio.',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=80',
    imagem: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=80',
    focus: 'Essencialidade',
    foco: 'Essencialidade',
    badge: 'Foco: Essencialidade',
    cta_text: 'Solicitar Atendimento Técnico',
    cta_link: 'https://api.whatsapp.com/send?phone=5562982239004',
    is_active: true,
    ativo: true
  }
};

// Endpoint de consulta do esquema de banco de dados dos slides
['/api/carousel-slides/schema', '/api/slides/schema', '/api/assistance-slides/schema'].forEach(pathUrl => {
  app.get(pathUrl, (req, res) => {
    res.json({
      success: true,
      schema: CAROUSEL_DB_SCHEMA
    });
  });
});

// Listar todos os slides de carrossel
['/api/carousel-slides', '/api/slides', '/api/assistance-slides'].forEach(pathUrl => {
  app.get(pathUrl, (req, res) => {
    try {
      const activeOnly = req.query.active === '1' || req.query.active === 'true' || req.query.ativo === '1' || req.query.ativo === 'true';
      const slides = getAssistanceSlides(activeOnly);
      res.json({ success: true, slides, total: slides.length });
    } catch (err: any) {
      console.error('Error fetching carousel slides:', err);
      res.status(500).json({ error: 'Erro ao buscar slides do carrossel: ' + err.message });
    }
  });
});

// Buscar slide por ID
['/api/carousel-slides/:id', '/api/slides/:id', '/api/assistance-slides/:id'].forEach(pathUrl => {
  app.get(pathUrl, (req, res) => {
    try {
      const slide = getAssistanceSlideById(req.params.id);
      if (!slide) {
        return res.status(404).json({ error: 'Slide não encontrado' });
      }
      res.json({ success: true, slide });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao buscar slide: ' + err.message });
    }
  });
});

// Criar novo slide (com persistência no banco e broadcast)
['/api/carousel-slides', '/api/slides', '/api/assistance-slides'].forEach(pathUrl => {
  app.post(pathUrl, (req, res) => {
    try {
      const slide = createAssistanceSlide(req.body);
      broadcastAssistanceSlidesUpdate(getAssistanceSlides(true), req.body.senderId);
      res.status(201).json({ success: true, message: 'Slide criado com sucesso!', slide });
    } catch (err: any) {
      console.error('Error creating carousel slide:', err);
      res.status(500).json({ error: 'Erro ao criar slide: ' + err.message });
    }
  });
});

// Atualizar slide existente
['/api/carousel-slides/:id', '/api/slides/:id', '/api/assistance-slides/:id'].forEach(pathUrl => {
  app.put(pathUrl, (req, res) => {
    try {
      const updated = updateAssistanceSlide(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Slide não encontrado para atualização' });
      }
      broadcastAssistanceSlidesUpdate(getAssistanceSlides(true), req.body.senderId);
      res.json({ success: true, message: 'Slide atualizado com sucesso!', slide: updated });
    } catch (err: any) {
      console.error('Error updating carousel slide:', err);
      res.status(500).json({ error: 'Erro ao atualizar slide: ' + err.message });
    }
  });
});

// Excluir slide
['/api/carousel-slides/:id', '/api/slides/:id', '/api/assistance-slides/:id'].forEach(pathUrl => {
  app.delete(pathUrl, (req, res) => {
    try {
      const success = deleteAssistanceSlide(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Slide não encontrado para exclusão' });
      }
      broadcastAssistanceSlidesUpdate(getAssistanceSlides(true), req.body?.senderId);
      res.json({ success: true, message: 'Slide excluído com sucesso!' });
    } catch (err: any) {
      console.error('Error deleting carousel slide:', err);
      res.status(500).json({ error: 'Erro ao excluir slide: ' + err.message });
    }
  });
});

// Reordenar slides
['/api/carousel-slides/reorder', '/api/slides/reorder', '/api/assistance-slides/reorder'].forEach(pathUrl => {
  app.post(pathUrl, (req, res) => {
    try {
      const slideIds = req.body.slideIds || req.body.slide_ids || req.body.ids;
      if (!Array.isArray(slideIds)) {
        return res.status(400).json({ error: 'Array slideIds (ou slide_ids/ids) é obrigatório' });
      }
      reorderAssistanceSlides(slideIds);
      broadcastAssistanceSlidesUpdate(getAssistanceSlides(true), req.body.senderId);
      res.json({ success: true, message: 'Ordem dos slides atualizada!', slideIds });
    } catch (err: any) {
      console.error('Error reordering slides:', err);
      res.status(500).json({ error: 'Erro ao reordenar slides: ' + err.message });
    }
  });
});

// Restaurar slides padrão
['/api/carousel-slides/reset', '/api/slides/reset', '/api/assistance-slides/reset'].forEach(pathUrl => {
  app.post(pathUrl, (req, res) => {
    try {
      const slides = resetAssistanceSlidesToDefault();
      broadcastAssistanceSlidesUpdate(slides, req.body.senderId);
      res.json({ success: true, message: 'Slides restaurados para o padrão original!', slides });
    } catch (err: any) {
      console.error('Error resetting carousel slides:', err);
      res.status(500).json({ error: 'Erro ao restaurar slides: ' + err.message });
    }
  });
});

// Upload de imagem do slide (base64 ou link)
['/api/carousel-slides/upload', '/api/slides/upload', '/api/assistance-slides/upload'].forEach(pathUrl => {
  app.post(pathUrl, (req, res) => {
    try {
      const { image_data, imagem, filename } = req.body;
      const rawData = image_data || imagem;
      if (!rawData) {
        return res.status(400).json({ error: 'Nenhum dado de imagem fornecido' });
      }

      // Se já for uma URL HTTP/HTTPS, apenas retorna
      if (typeof rawData === 'string' && (rawData.startsWith('http://') || rawData.startsWith('https://'))) {
        return res.json({ success: true, url: rawData });
      }

      // Extrai base64
      const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Formato base64 de imagem inválido' });
      }

      const rawExt = matches[1].split('/')[1] || 'png';
      const ext = rawExt.includes('svg') ? 'svg' : (rawExt.includes('jpeg') ? 'jpg' : rawExt);
      const buffer = Buffer.from(matches[2], 'base64');
      const safeName = (filename ? filename.replace(/[^a-zA-Z0-9_-]/g, '_') : 'slide') + '_' + Date.now() + '.' + ext;
      const filePath = path.join(UPLOADS_DIR, safeName);

      fs.writeFileSync(filePath, buffer);
      const publicUrl = `/uploads/${safeName}`;

      res.json({
        success: true,
        message: 'Upload de imagem concluído com sucesso!',
        url: publicUrl
      });
    } catch (err: any) {
      console.error('Error uploading slide image:', err);
      res.status(500).json({ error: 'Erro ao realizar upload da imagem: ' + err.message });
    }
  });
});

// -------------------------------------------------------------
// GESTÃO DE EMPRESAS CLIENTES (B2B / MSP MULTI-CLIENTE)
// -------------------------------------------------------------
app.get('/api/companies', (req, res) => {
  try {
    const list = getClientCompanies();
    res.json({ companies: list });
  } catch (err: any) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ error: 'Erro ao buscar empresas clientes: ' + err.message });
  }
});

app.post('/api/companies', (req, res) => {
  try {
    const created = createClientCompany(req.body);
    res.status(201).json({ success: true, company: created });
  } catch (err: any) {
    console.error('Error creating company:', err);
    res.status(500).json({ error: 'Erro ao cadastrar empresa cliente: ' + err.message });
  }
});

app.put('/api/companies/:id', (req, res) => {
  try {
    const updated = updateClientCompany(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Empresa cliente não encontrada' });
    }
    res.json({ success: true, company: updated });
  } catch (err: any) {
    console.error('Error updating company:', err);
    res.status(500).json({ error: 'Erro ao atualizar empresa cliente: ' + err.message });
  }
});

app.delete('/api/companies/:id', (req, res) => {
  try {
    deleteClientCompany(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting company:', err);
    res.status(500).json({ error: 'Erro ao remover empresa cliente: ' + err.message });
  }
});

// -------------------------------------------------------------
// GESTÃO DE USUÁRIOS E MATRIZ DE PERMISSÕES RBAC
// -------------------------------------------------------------
app.get('/api/roles', (_req, res) => {
  try {
    const roles = getRoles();
    res.json({ roles });
  } catch (err: any) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ error: 'Erro ao carregar papéis de acesso: ' + err.message });
  }
});

app.get('/api/scopes', (_req, res) => {
  try {
    const scopes = getScopes();
    res.json({ scopes });
  } catch (err: any) {
    console.error('Error fetching scopes:', err);
    res.status(500).json({ error: 'Erro ao carregar escopos do sistema: ' + err.message });
  }
});

app.get('/api/users', (_req, res) => {
  try {
    const users = getUsers();
    res.json({ users });
  } catch (err: any) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Erro ao listar usuários: ' + err.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { name, email, username, password, role, company_id, company_name, is_active, permissions } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e E-mail são obrigatórios.' });
    }
    const newUser = createUser({
      name,
      email,
      username: username || email.split('@')[0],
      password: password || '123456',
      role: role || 'Operador',
      company_id,
      company_name,
      is_active: is_active !== undefined ? is_active : true,
      permissions
    });
    res.status(201).json({ success: true, user: newUser });
  } catch (err: any) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Erro ao cadastrar usuário: ' + err.message });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const user = getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ user });
  } catch (err: any) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Erro ao buscar usuário: ' + err.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const updated = updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ success: true, user: updated });
  } catch (err: any) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário: ' + err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const deleted = deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Erro ao remover usuário: ' + err.message });
  }
});

app.get('/api/users/:id/permissions', (req, res) => {
  try {
    const permissions = getUserPermissions(req.params.id);
    res.json({ permissions });
  } catch (err: any) {
    console.error('Error fetching user permissions:', err);
    res.status(500).json({ error: 'Erro ao buscar permissões: ' + err.message });
  }
});

app.put('/api/users/:id/permissions', (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Array de permissões inválido.' });
    }
    setUserPermissions(req.params.id, permissions);
    const updatedUser = getUserById(req.params.id);
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error('Error updating permissions:', err);
    res.status(500).json({ error: 'Erro ao gravar matriz de permissões: ' + err.message });
  }
});

// -------------------------------------------------------------
// ROTAS DO MÓDULO FINANCEIRO (CARTÃO PJ, CONTAS A PAGAR & RECEBER)
// -------------------------------------------------------------
app.get('/api/financial/institutions', (_req, res) => {
  try {
    const institutions = getFinancialInstitutions();
    res.json({ institutions });
  } catch (err: any) {
    console.error('Error fetching financial institutions:', err);
    res.status(500).json({ error: 'Erro ao listar instituições financeiras: ' + err.message });
  }
});

app.post('/api/financial/institutions', (req, res) => {
  try {
    const created = addFinancialInstitution(req.body);
    res.status(201).json({ success: true, institution: created });
  } catch (err: any) {
    console.error('Error creating financial institution:', err);
    res.status(400).json({ error: 'Erro ao cadastrar instituição financeira: ' + err.message });
  }
});

app.put('/api/financial/institutions/:id', (req, res) => {
  try {
    const updated = updateFinancialInstitution(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Instituição não encontrada' });
    res.json({ success: true, institution: updated });
  } catch (err: any) {
    console.error('Error updating financial institution:', err);
    res.status(500).json({ error: 'Erro ao atualizar instituição: ' + err.message });
  }
});

app.delete('/api/financial/institutions/:id', (req, res) => {
  try {
    const deleted = deleteFinancialInstitution(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Instituição não encontrada' });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting financial institution:', err);
    res.status(500).json({ error: 'Erro ao excluir instituição: ' + err.message });
  }
});

app.get('/api/financial/categories', (_req, res) => {
  try {
    const categories = getFinancialCategories();
    res.json({ categories });
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Erro ao listar categorias: ' + err.message });
  }
});

app.post('/api/financial/categories', (req, res) => {
  try {
    const created = addFinancialCategory(req.body);
    res.status(201).json({ success: true, category: created });
  } catch (err: any) {
    console.error('Error creating category:', err);
    res.status(400).json({ error: 'Erro ao cadastrar categoria: ' + err.message });
  }
});

app.delete('/api/financial/categories/:id', (req, res) => {
  try {
    const deleted = deleteFinancialCategory(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Erro ao excluir categoria: ' + err.message });
  }
});

app.get('/api/financial/cards', (req, res) => {
  try {
    const company = req.query.company as string;
    const cards = getCreditCards(company);
    res.json({ cards });
  } catch (err: any) {
    console.error('Error fetching credit cards:', err);
    res.status(500).json({ error: 'Erro ao carregar cartões de crédito: ' + err.message });
  }
});

app.post('/api/financial/cards', (req, res) => {
  try {
    const created = addCreditCard(req.body);
    res.status(201).json({ success: true, card: created });
  } catch (err: any) {
    console.error('Error creating credit card:', err);
    res.status(400).json({ error: 'Erro ao cadastrar cartão de crédito: ' + err.message });
  }
});

app.put('/api/financial/cards/:id', (req, res) => {
  try {
    const updated = updateCreditCard(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Cartão não encontrado' });
    res.json({ success: true, card: updated });
  } catch (err: any) {
    console.error('Error updating credit card:', err);
    res.status(500).json({ error: 'Erro ao atualizar cartão: ' + err.message });
  }
});

app.delete('/api/financial/cards/:id', (req, res) => {
  try {
    const deleted = deleteCreditCard(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Cartão não encontrado' });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting credit card:', err);
    res.status(500).json({ error: 'Erro ao remover cartão: ' + err.message });
  }
});

app.get('/api/financial/credit-card-expenses', (req, res) => {
  try {
    const { cardId, company, month, year } = req.query;
    const expenses = getCreditCardExpenses({
      cardId: cardId as string,
      company: company as string,
      month: month !== undefined ? parseInt(String(month), 10) : undefined,
      year: year !== undefined ? parseInt(String(year), 10) : undefined
    });
    res.json({ expenses });
  } catch (err: any) {
    console.error('Error fetching credit card expenses:', err);
    res.status(500).json({ error: 'Erro ao listar gastos do cartão: ' + err.message });
  }
});

app.post('/api/financial/credit-card-expenses', (req, res) => {
  try {
    const created = addCreditCardExpense(req.body);
    res.status(201).json({ success: true, expense: created });
  } catch (err: any) {
    console.error('Error adding credit card expense:', err);
    res.status(400).json({ error: 'Erro ao registrar despesa no cartão: ' + err.message });
  }
});

app.put('/api/financial/credit-card-expenses/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = updateCreditCardExpense(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Lançamento não encontrado' });
    res.json({ success: true, expense: updated });
  } catch (err: any) {
    console.error('Error updating credit card expense:', err);
    res.status(500).json({ error: 'Erro ao atualizar lançamento: ' + err.message });
  }
});

app.delete('/api/financial/credit-card-expenses/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = deleteCreditCardExpense(id);
    if (!success) return res.status(404).json({ error: 'Lançamento não encontrado' });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Erro ao remover lançamento: ' + err.message });
  }
});

app.get('/api/financial/accounts-payable', (req, res) => {
  try {
    const { company, month, year, status } = req.query;
    const payables = getAccountsPayable({
      company: company as string,
      month: month !== undefined ? parseInt(String(month), 10) : undefined,
      year: year !== undefined ? parseInt(String(year), 10) : undefined,
      status: status as string
    });
    res.json({ payables });
  } catch (err: any) {
    console.error('Error fetching accounts payable:', err);
    res.status(500).json({ error: 'Erro ao listar contas a pagar: ' + err.message });
  }
});

app.post('/api/financial/accounts-payable', (req, res) => {
  try {
    const created = addAccountsPayable(req.body);
    res.status(201).json({ success: true, payable: created });
  } catch (err: any) {
    console.error('Error adding payable:', err);
    res.status(400).json({ error: 'Erro ao cadastrar conta a pagar: ' + err.message });
  }
});

app.put('/api/financial/accounts-payable/:id', (req, res) => {
  try {
    const updated = updateAccountsPayable(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    res.json({ success: true, payable: updated });
  } catch (err: any) {
    console.error('Error updating payable:', err);
    res.status(500).json({ error: 'Erro ao modificar conta a pagar: ' + err.message });
  }
});

app.patch('/api/financial/accounts-payable/:id', (req, res) => {
  try {
    const { status, paid_amount, payment_date } = req.body;
    const updated = updateAccountsPayableStatus(req.params.id, status, paid_amount, payment_date);
    res.json({ success: updated });
  } catch (err: any) {
    console.error('Error updating payable:', err);
    res.status(500).json({ error: 'Erro ao atualizar status da conta: ' + err.message });
  }
});

app.delete('/api/financial/accounts-payable/:id', (req, res) => {
  try {
    deleteAccountsPayable(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting payable:', err);
    res.status(500).json({ error: 'Erro ao remover conta a pagar: ' + err.message });
  }
});

app.get('/api/financial/accounts-receivable', (req, res) => {
  try {
    const { company, month, year, status } = req.query;
    const receivables = getAccountsReceivable({
      company: company as string,
      month: month !== undefined ? parseInt(String(month), 10) : undefined,
      year: year !== undefined ? parseInt(String(year), 10) : undefined,
      status: status as string
    });
    res.json({ receivables });
  } catch (err: any) {
    console.error('Error fetching accounts receivable:', err);
    res.status(500).json({ error: 'Erro ao listar contas a receber: ' + err.message });
  }
});

app.post('/api/financial/accounts-receivable', (req, res) => {
  try {
    const created = addAccountsReceivable(req.body);
    res.status(201).json({ success: true, receivable: created });
  } catch (err: any) {
    console.error('Error adding receivable:', err);
    res.status(400).json({ error: 'Erro ao cadastrar conta a receber: ' + err.message });
  }
});

app.patch('/api/financial/accounts-receivable/:id', (req, res) => {
  try {
    const { status, received_amount, receipt_date } = req.body;
    const updated = updateAccountsReceivableStatus(req.params.id, status, received_amount, receipt_date);
    res.json({ success: updated });
  } catch (err: any) {
    console.error('Error updating receivable:', err);
    res.status(500).json({ error: 'Erro ao atualizar status: ' + err.message });
  }
});

app.delete('/api/financial/accounts-receivable/:id', (req, res) => {
  try {
    deleteAccountsReceivable(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting receivable:', err);
    res.status(500).json({ error: 'Erro ao remover conta a receber: ' + err.message });
  }
});

app.get('/api/financial/summary', (req, res) => {
  try {
    const { month, year, company, cardId } = req.query;
    const m = month ? parseInt(String(month), 10) : (new Date().getMonth() + 1);
    const y = year ? parseInt(String(year), 10) : new Date().getFullYear();
    const summary = getFinancialCompetenceSummary(m, y, company as string, cardId as string);
    res.json(summary);
  } catch (err: any) {
    console.error('Error calculating financial summary:', err);
    res.status(500).json({ error: 'Erro ao calcular resumo financeiro: ' + err.message });
  }
});

// -------------------------------------------------------------
// ROTAS DE EXPORTAÇÃO E BACKUP DO BANCO DE DADOS (MYSQL, JSON, CSV)
// -------------------------------------------------------------
app.get('/api/backup/stats', (_req, res) => {
  try {
    const stats = getDatabaseBackupStats();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching backup stats:', err);
    res.status(500).json({ error: 'Erro ao obter estatísticas de backup: ' + err.message });
  }
});

app.get('/api/backup/download', (req, res) => {
  try {
    const format = (req.query.format as string || 'sql').toLowerCase();
    const table = (req.query.table as string || 'all').toLowerCase();
    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      const data = exportDatabaseAsJson(table !== 'all' ? [table] : undefined);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="backup_database_${table}_${dateStr}.json"`);
      return res.send(JSON.stringify(data, null, 2));
    }

    if (format === 'csv') {
      const csv = exportDatabaseAsCsv(table);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="export_${table}_${dateStr}.csv"`);
      return res.send(csv);
    }

    // Default: MySQL SQL dump
    const dump = generateMySqlExport(table !== 'all' ? [table] : undefined);
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mysql_backup_${table}_${dateStr}.sql"`);
    return res.send(dump);
  } catch (err: any) {
    console.error('Error in backup download:', err);
    res.status(500).json({ error: 'Erro ao gerar download de backup: ' + err.message });
  }
});

// Rota retrocompatível de exportação MySQL
app.get('/api/database/mysql-export', (_req, res) => {
  try {
    const dump = generateMySqlExport();
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="infra_crm_mysql_backup.sql"');
    res.send(dump);
  } catch (err: any) {
    console.error('Error generating MySQL export:', err);
    res.status(500).json({ error: 'Erro ao gerar script de exportação MySQL: ' + err.message });
  }
});

// -------------------------------------------------------------
// INICIALIZAÇÃO DO SERVIDOR COM VITE (DEV) OU ARQUIVOS ESTÁTICOS (PROD)
// -------------------------------------------------------------
async function startServer() {
  await initDatabase();
  console.log('[SISTEMA] Banco de Dados SQLite carregado e sincronizado.');

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[SISTEMA] Servidor Vite acoplado em modo desenvolvimento.');
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================================`);
    console.log(` INFRAASSET IT - SISTEMA DE INVENTÁRIO EM EXECUÇÃO`);
    console.log(` Porta: ${PORT}`);
    console.log(` Endpoint do Agente: http://localhost:${PORT}/api/agent/report`);
    console.log(` Token Padrão: infra_asset_token_secret_2026`);
    console.log(`========================================================`);
  });
}

startServer().catch(err => {
  console.error('Falha crítica ao iniciar o servidor:', err);
  process.exit(1);
});
