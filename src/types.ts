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
  status: 'Ativo' | 'Em Manutenção' | 'Desativado' | 'Reserva' | string;
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

export interface DashboardStats {
  total: number;
  online: number;
  offline: number;
  os: {
    windows: number;
    linux: number;
    macos: number;
  };
  types: {
    desktops: number;
    notebooks: number;
    servers: number;
    vms: number;
  };
  status: {
    ativo: number;
    manutencao: number;
    desativado: number;
    reserva: number;
  };
  alerts: {
    diskAlerts: number;
    ramAlerts: number;
    longUptimeCount: number;
  };
  sectors: Array<{ name: string; count: number }>;
}

export interface FilterState {
  search: string;
  os: string;
  type: string;
  status: string;
  sector: string;
  company?: string;
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

export interface ScheduledMaintenanceRecord {
  id: string;
  machine_id: string;
  hostname: string;
  company_name: string;
  date_str: string;
  time_str?: string;
  title: string;
  maintenance_type: string;
  technician?: string;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
  status?: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada';
  created_at?: string;
}

export type StatusSituationType =
  | 'operacional'
  | 'manutencao'
  | 'analise'
  | 'pendencia'
  | 'concluido'
  | 'inativo'
  | 'reserva'
  | 'seguranca'
  | 'geral';

export interface EquipmentStatus {
  id: string;
  name: string;
  color: string; // 'emerald' | 'amber' | 'blue' | 'rose' | 'purple' | 'yellow' | 'cyan' | 'teal' | 'indigo' | 'slate' | 'red'
  hex_color: string;
  bg_class?: string;
  situation_type: StatusSituationType;
  description: string;
  requires_password: boolean;
  is_default: boolean;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EquipmentStatusLog {
  id: string;
  machine_id: string;
  hostname?: string;
  previous_status?: string;
  new_status: string;
  reason?: string;
  authorized_by: string;
  created_at: string;
}

export interface HeroSlide {
  id?: string;
  tag: string;
  title: string;
  description: string;
  cta: string;
  bgImage: string;
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


export interface WebsiteConfig {
  diagnostic_tag?: string;
  diagnostic_location?: string;
  diagnostic_text?: string;
  diagnostic_button?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  contact_email?: string;
  slides?: HeroSlide[];
  assistance_slides?: AssistanceSlide[];
}

export interface SystemSettings {
  id?: string;
  company_name: string;
  system_title: string;
  department: string;
  logo_url: string;
  footer_text: string;
  report_header: string;
  updated_at?: string;
  website_config?: WebsiteConfig;
}

export type UserRole = 'SuperAdmin' | 'Editor' | 'Operador' | 'Viewer';

export interface RoleItem {
  id: string;
  name: UserRole;
  description: string;
}

export interface ScopeItem {
  id: string;
  name: 'Rede' | 'Servidores' | 'Segurança' | 'Web-Apps' | string;
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

export interface FinancialInstitution {
  id: string;
  name: string;
  code?: string;
  color_gradient?: string;
  icon_name?: string;
  is_custom?: boolean | number;
  created_at?: string;
}

export interface FinancialCategory {
  id: string;
  name: string;
  color?: string;
  is_custom?: boolean | number;
  created_at?: string;
}

export interface CreditCardInfo {
  id: string;
  card_name: string;
  last_digits: string;
  holder_name: string;
  closing_day: number;
  due_day: number;
  credit_limit: number;
  company_name: string;
  bank_brand?: string;
  color_gradient?: string;
  created_at?: string;
  updated_at?: string;
  current_invoice_total?: number;
  used_limit?: number;
  available_limit?: number;
}

export interface CreditCardExpense {
  id: number;
  card_id: string;
  description: string;
  supplier: string;
  total_amount: number;
  installments_count: number;
  installment_value: number;
  purchase_date: string;
  first_due_month: number;
  first_due_year: number;
  category: string;
  company_name: string;
  status: 'Ativo' | 'Quitado' | 'Cancelado';
  created_at?: string;
  updated_at?: string;
  // Computed fields for active competence month
  current_installment_index?: number;
  is_active_in_competence?: boolean;
  remaining_installments?: number;
  remaining_debt?: number;
}

export interface AccountsPayableItem {
  id: string;
  code: number;
  description: string;
  category: string;
  supplier: string;
  amount: number;
  due_date: string;
  competence_month: number;
  competence_year: number;
  installment_number: number;
  total_installments: number;
  credit_card_expense_id?: number | null;
  company_name: string;
  status: 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado';
  paid_amount?: number;
  payment_date?: string;
  notes?: string;
  created_at?: string;
}

export interface AccountsReceivableItem {
  id: string;
  code: number;
  description: string;
  client_name: string;
  amount: number;
  due_date: string;
  competence_month: number;
  competence_year: number;
  installment_number: number;
  total_installments: number;
  company_name: string;
  status: 'Pendente' | 'Recebido' | 'Atrasado';
  received_amount?: number;
  receipt_date?: string;
  created_at?: string;
}

export interface FinancialCompetenceSummary {
  month: number;
  year: number;
  monthName: string;
  totalSaldoDevedor: number; // TOTAL GERAL - SALDO DEVEDOR
  vtPresta: number;          // VT PRESTA (Soma das parcelas ativas no mês)
  totalRemainingDebt?: number; // Saldo devedor restante
  activeExpensesCount: number;
  totalExpensesCount?: number;
  totalAccountsPayable: number;
  totalAccountsReceivable: number;
  netCashFlowForecast: number;
}

