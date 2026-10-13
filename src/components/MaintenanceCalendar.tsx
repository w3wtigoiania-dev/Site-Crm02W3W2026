import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Machine, SystemSettings, ClientCompany, ScheduledMaintenanceRecord } from '../types.ts';
import { printCalendarReport } from '../utils/printUtils.ts';
import { StatusBadge } from '../utils/statusUtils.tsx';
import { StatusManagementModal } from './StatusManagementModal.tsx';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  RefreshCw,
  Clock,
  Laptop,
  Server,
  Monitor,
  AlertTriangle,
  Building,
  User,
  ExternalLink,
  Edit3,
  Filter,
  CheckCircle2,
  CalendarDays,
  FileSpreadsheet,
  Building2,
  Printer,
  Plus,
  PlusCircle,
  Search,
  Check,
  Trash2,
  X,
  CalendarCheck,
  Tag,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Phone,
  Palette,
  Lock
} from 'lucide-react';

export type EventType = 'warranty_expiry' | 'maintenance' | 'lifecycle_refresh' | 'support_renewal';

export interface CalendarEvent {
  id: string;
  machineId: string;
  machine: Machine;
  dateStr: string; // YYYY-MM-DD
  title: string;
  description: string;
  type: EventType;
  severity: 'high' | 'medium' | 'low';
  maintenanceRecord?: ScheduledMaintenanceRecord;
}

interface MaintenanceCalendarProps {
  machines: Machine[];
  settings?: SystemSettings;
  companies?: ClientCompany[];
  selectedCompany?: string;
  onSelectCompany?: (company: string) => void;
  onSelectMachine: (machine: Machine) => void;
  onEditMachine: (machine: Machine) => void;
  onRefreshMachines?: () => void;
}

export const MaintenanceCalendar: React.FC<MaintenanceCalendarProps> = ({
  machines,
  settings,
  companies = [],
  selectedCompany = 'all',
  onSelectCompany,
  onSelectMachine,
  onEditMachine,
  onRefreshMachines
}) => {
  // Current viewed month/year in calendar
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>(selectedCompany || 'all');

  // Scheduled maintenances persisted in DB
  const [scheduledMaintenances, setScheduledMaintenances] = useState<ScheduledMaintenanceRecord[]>([]);
  const [isLoadingMaintenances, setIsLoadingMaintenances] = useState<boolean>(false);

  // Modal de Agendamento de Manutenção
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleCompany, setScheduleCompany] = useState<string>('');
  const [companySearch, setCompanySearch] = useState<string>('');
  const [equipmentSearch, setEquipmentSearch] = useState<string>('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [autocompleteQuery, setAutocompleteQuery] = useState<string>('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState<boolean>(false);
  const autocompleteContainerRef = React.useRef<HTMLDivElement>(null);
  const [maintenanceDate, setMaintenanceDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [maintenanceTime, setMaintenanceTime] = useState<string>('09:00');
  const [maintenanceType, setMaintenanceType] = useState<string>('Manutenção Preventiva');
  const [maintenancePriority, setMaintenancePriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [maintenanceTechnician, setMaintenanceTechnician] = useState<string>('Suporte Técnico W3W');
  const [updateMachineStatus, setUpdateMachineStatus] = useState<boolean>(true);
  const [maintenanceTitle, setMaintenanceTitle] = useState<string>('');
  const [maintenanceNotes, setMaintenanceNotes] = useState<string>('');
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState<boolean>(false);
  const [scheduleFeedback, setScheduleFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);

  // Fechar menu de autocompletar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteContainerRef.current &&
        !autocompleteContainerRef.current.contains(event.target as Node)
      ) {
        setIsAutocompleteOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Carregar manutenções agendadas do backend
  const fetchMaintenances = useCallback(async () => {
    try {
      setIsLoadingMaintenances(true);
      const q = companyFilter && companyFilter !== 'all' ? `?company=${encodeURIComponent(companyFilter)}` : '';
      const res = await fetch(`/api/maintenances${q}`);
      if (res.ok) {
        const json = await res.json();
        setScheduledMaintenances(json.data || []);
      }
    } catch (e) {
      console.warn('Erro ao carregar manutenções agendadas:', e);
    } finally {
      setIsLoadingMaintenances(false);
    }
  }, [companyFilter]);

  useEffect(() => {
    fetchMaintenances();
  }, [fetchMaintenances]);

  useEffect(() => {
    if (selectedCompany) {
      setCompanyFilter(selectedCompany);
    }
  }, [selectedCompany]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // Month names in Portuguese
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Distinct sectors
  const sectors = useMemo(() => {
    return Array.from(new Set(machines.map(m => m.sector || 'Geral'))).sort();
  }, [machines]);

  // Generate calendar events from machines data
  const allEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    machines.forEach((m) => {
      // 1. Warranty Expiration (Vencimento de Garantia)
      if (m.warranty_end) {
        events.push({
          id: `warr_${m.id}_${m.warranty_end}`,
          machineId: m.id,
          machine: m,
          dateStr: m.warranty_end.slice(0, 10),
          title: `Fim de Garantia: ${m.hostname}`,
          description: `Vencimento da garantia comercial / suporte de fábrica (${m.vendor || 'Fabricante'}).`,
          type: 'warranty_expiry',
          severity: 'high'
        });

        // 2. Warranty Expiration Warning (Lembrete de renovação 30 dias antes)
        try {
          const wDate = new Date(m.warranty_end);
          if (!isNaN(wDate.getTime())) {
            const warningDate = new Date(wDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            events.push({
              id: `warn_${m.id}_${warningDate.toISOString().slice(0, 10)}`,
              machineId: m.id,
              machine: m,
              dateStr: warningDate.toISOString().slice(0, 10),
              title: `Renovação Contratual: ${m.hostname}`,
              description: `Lembrete de renovação de extensão de suporte (faltam 30 dias).`,
              type: 'support_renewal',
              severity: 'medium'
            });
          }
        } catch (e) {
          // ignore date parse errors
        }
      }

      // 3. Maintenance schedules:
      // If machine is currently in maintenance, record an active maintenance event
      if (m.status === 'Em Manutenção') {
        const mDate = m.updated_at ? m.updated_at.slice(0, 10) : new Date().toISOString().slice(0, 10);
        events.push({
          id: `maint_${m.id}_${mDate}`,
          machineId: m.id,
          machine: m,
          dateStr: mDate,
          title: `Manutenção Ativa: ${m.hostname}`,
          description: m.notes || 'Equipamento em processo de reparo técnico, troca de peças ou recall.',
          type: 'maintenance',
          severity: 'high'
        });
      }

      // 4. Hardware Lifecycle Refresh (Ciclo de Vida do Ativo)
      // Notebooks = 3 years, Desktops = 4 years, Servers = 5 years
      if (m.purchase_date) {
        try {
          const pDate = new Date(m.purchase_date);
          if (!isNaN(pDate.getTime())) {
            let refreshYears = 3;
            if (m.machine_type === 'server') refreshYears = 5;
            else if (m.machine_type === 'desktop') refreshYears = 4;

            const refreshDate = new Date(pDate.getFullYear() + refreshYears, pDate.getMonth(), pDate.getDate());
            events.push({
              id: `refresh_${m.id}_${refreshDate.toISOString().slice(0, 10)}`,
              machineId: m.id,
              machine: m,
              dateStr: refreshDate.toISOString().slice(0, 10),
              title: `Renovação de Parque (${refreshYears}a): ${m.hostname}`,
              description: `Limite do ciclo de vida recomendado para renovação tecnológica (${refreshYears} anos de uso).`,
              type: 'lifecycle_refresh',
              severity: 'medium'
            });

            // Semiannual Preventive Checkup
            const checkupDate1 = new Date(pDate.getFullYear(), pDate.getMonth() + 6, pDate.getDate());
            if (checkupDate1.getFullYear() >= 2024 && checkupDate1.getFullYear() <= 2028) {
              events.push({
                id: `checkup_${m.id}_${checkupDate1.toISOString().slice(0, 10)}`,
                machineId: m.id,
                machine: m,
                dateStr: checkupDate1.toISOString().slice(0, 10),
                title: `Preventiva Semestral: ${m.hostname}`,
                description: `Inspeção de coolers, pasta térmica, limpeza interna e integridade de discos.`,
                type: 'maintenance',
                severity: 'low'
              });
            }
          }
        } catch (e) {
          // ignore
        }
      }
    });

    // 5. Agendamentos Manuais/Oficiais de Manutenção (Salvos no Banco de Dados)
    scheduledMaintenances.forEach((sm) => {
      const matchingMachine = machines.find(m => m.id === sm.machine_id || m.hostname === sm.hostname);
      const machineObj: Machine = matchingMachine || {
        id: sm.machine_id || `custom_${sm.id}`,
        hostname: sm.hostname,
        client_company: sm.company_name,
        machine_type: 'desktop',
        status: (sm.status === 'Concluída' ? 'Ativo' : 'Em Manutenção') as any,
        sector: 'Geral',
        logged_user: '-',
        os_name: 'SO Corporativo',
        os_version: '',
        os_build: '',
        os_arch: 'x64',
        cpu_model: '',
        cpu_cores_physical: 4,
        cpu_cores_logical: 8,
        cpu_freq_ghz: 2.5,
        cpu_usage_percent: 0,
        ram_total_gb: 8,
        ram_used_gb: 4,
        ram_free_gb: 4,
        ram_percent: 50,
        primary_ip: '-',
        public_ip: '-',
        primary_mac: '-',
        uptime_seconds: 0,
        boot_time: '',
        location: '',
        asset_tag: '',
        purchase_date: '',
        warranty_end: '',
        vendor: '',
        cost: 0,
        responsible_person: sm.technician || 'W3W TI',
        notes: sm.notes || '',
        agent_version: '',
        last_seen: '',
        created_at: sm.created_at || '',
        updated_at: ''
      };

      events.push({
        id: `sched_${sm.id}`,
        machineId: sm.machine_id || machineObj.id,
        machine: machineObj,
        dateStr: sm.date_str,
        title: sm.title || `Manutenção: ${sm.hostname}`,
        description: `${sm.time_str ? `[${sm.time_str}] ` : ''}${sm.maintenance_type} • Técnico: ${sm.technician || 'W3W'} • ${sm.notes || 'Agendamento de Manutenção'}${sm.status ? ` (${sm.status})` : ''}`,
        type: 'maintenance',
        severity: sm.priority || 'high',
        maintenanceRecord: sm
      });
    });

    return events;
  }, [machines, scheduledMaintenances]);

  // Lista consolidada e enriquecida de Empresas Clientes (ClientCompany) e seus respectivos equipamentos
  const enrichedCompanies = useMemo(() => {
    const map = new Map<string, { company: ClientCompany; machines: Machine[] }>();

    // 1. A partir das empresas cadastradas no CRM/banco (prop companies)
    companies.forEach(comp => {
      if (comp.name) {
        const key = comp.name.toLowerCase().trim();
        const compMachines = machines.filter(
          m => m.client_company && m.client_company.toLowerCase().trim() === key
        );
        map.set(key, {
          company: {
            ...comp,
            machine_count: compMachines.length || comp.machine_count || 0
          },
          machines: compMachines
        });
      }
    });

    // 2. Extrair das máquinas caso haja alguma empresa vinculada que não esteja cadastrada na lista
    machines.forEach(m => {
      if (m.client_company) {
        const key = m.client_company.toLowerCase().trim();
        if (!map.has(key)) {
          const compMachines = machines.filter(
            x => x.client_company && x.client_company.toLowerCase().trim() === key
          );
          map.set(key, {
            company: {
              id: `comp_${key}`,
              name: m.client_company,
              trade_name: m.client_company,
              machine_count: compMachines.length
            },
            machines: compMachines
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.company.name.localeCompare(b.company.name));
  }, [companies, machines]);

  // Lista simples de nomes de empresas clientes
  const clientCompanyList = useMemo(() => {
    return enrichedCompanies.map(item => item.company.name);
  }, [enrichedCompanies]);

  // Dados completos da empresa selecionada no modal
  const selectedCompanyInfo = useMemo(() => {
    if (!scheduleCompany) return null;
    const found = enrichedCompanies.find(
      item => item.company.name.toLowerCase().trim() === scheduleCompany.toLowerCase().trim()
    );
    return found ? found.company : null;
  }, [enrichedCompanies, scheduleCompany]);

  // Equipamentos disponíveis filtrados pela empresa selecionada no modal
  const availableEquipmentsForModal = useMemo(() => {
    let list = machines;
    if (scheduleCompany) {
      list = list.filter(m => m.client_company === scheduleCompany);
    }
    if (equipmentSearch.trim()) {
      const q = equipmentSearch.toLowerCase();
      list = list.filter(m =>
        m.hostname.toLowerCase().includes(q) ||
        (m.asset_tag && m.asset_tag.toLowerCase().includes(q)) ||
        (m.primary_ip && m.primary_ip.includes(q)) ||
        (m.logged_user && m.logged_user.toLowerCase().includes(q)) ||
        (m.sector && m.sector.toLowerCase().includes(q)) ||
        (m.vendor && m.vendor.toLowerCase().includes(q))
      );
    }
    return list;
  }, [machines, scheduleCompany, equipmentSearch]);

  const selectedMachineForModal = useMemo(() => {
    return machines.find(m => m.id === selectedEquipmentId) || null;
  }, [machines, selectedEquipmentId]);

  // Resultados filtrados para o campo de busca com autocompletar (ClientCompany e Equipamentos)
  const autocompleteResults = useMemo(() => {
    const q = autocompleteQuery.trim().toLowerCase();

    if (!q) {
      return {
        matchedCompanies: enrichedCompanies,
        directMachines: [] as Machine[],
        totalMatches: enrichedCompanies.length
      };
    }

    // Filtrar empresas onde nome, razão social, documento, contato ou plano batem com o termo
    const matchedCompanies = enrichedCompanies.filter(({ company }) => {
      return (
        company.name.toLowerCase().includes(q) ||
        (company.trade_name && company.trade_name.toLowerCase().includes(q)) ||
        (company.document && company.document.toLowerCase().includes(q)) ||
        (company.contact_name && company.contact_name.toLowerCase().includes(q)) ||
        (company.contact_phone && company.contact_phone.toLowerCase().includes(q)) ||
        (company.sla_plan && company.sla_plan.toLowerCase().includes(q))
      );
    });

    // Filtrar equipamentos cujos dados (hostname, ip, patrimônio, setor, etc.) batem com o termo
    const directMachines = machines.filter(m => {
      return (
        m.hostname.toLowerCase().includes(q) ||
        (m.asset_tag && m.asset_tag.toLowerCase().includes(q)) ||
        (m.primary_ip && m.primary_ip.toLowerCase().includes(q)) ||
        (m.sector && m.sector.toLowerCase().includes(q)) ||
        (m.logged_user && m.logged_user.toLowerCase().includes(q)) ||
        (m.os_name && m.os_name.toLowerCase().includes(q)) ||
        (m.machine_type && m.machine_type.toLowerCase().includes(q)) ||
        (m.vendor && m.vendor.toLowerCase().includes(q))
      );
    });

    return {
      matchedCompanies,
      directMachines,
      totalMatches: matchedCompanies.length + directMachines.length
    };
  }, [enrichedCompanies, machines, autocompleteQuery]);

  // Selecionar empresa através do autocompletar
  const handleSelectCompanyFromAutocomplete = (compName: string) => {
    setScheduleCompany(compName);
    setAutocompleteQuery(compName);
    setSelectedEquipmentId('');
    setIsAutocompleteOpen(false);
  };

  // Selecionar equipamento diretamente através do autocompletar
  const handleSelectEquipmentFromAutocomplete = (m: Machine) => {
    if (m.client_company) {
      setScheduleCompany(m.client_company);
    }
    setSelectedEquipmentId(m.id);
    setAutocompleteQuery(`${m.hostname} • ${m.client_company || 'Equipamento'}`);
    if (!maintenanceTitle || maintenanceTitle.startsWith('Manutenção:')) {
      setMaintenanceTitle(`${maintenanceType}: ${m.hostname}`);
    }
    setIsAutocompleteOpen(false);
  };

  const handleOpenScheduleModal = (dateStr?: string) => {
    if (dateStr) {
      setMaintenanceDate(dateStr);
    } else if (selectedDateStr) {
      setMaintenanceDate(selectedDateStr);
    } else {
      setMaintenanceDate(new Date().toISOString().slice(0, 10));
    }

    const defaultComp = (companyFilter && companyFilter !== 'all') ? companyFilter : (clientCompanyList[0] || '');
    setScheduleCompany(defaultComp);
    setAutocompleteQuery(defaultComp);
    setCompanySearch('');
    setEquipmentSearch('');
    setSelectedEquipmentId('');
    setMaintenanceTime('09:00');
    setMaintenanceType('Manutenção Preventiva');
    setMaintenancePriority('medium');
    setMaintenanceTechnician('Suporte Técnico W3W');
    setUpdateMachineStatus(true);
    setMaintenanceTitle('');
    setMaintenanceNotes('');
    setScheduleFeedback(null);
    setIsAutocompleteOpen(false);
    setIsScheduleModalOpen(true);
  };

  const handleSelectEquipment = (m: Machine) => {
    setSelectedEquipmentId(m.id);
    if (!maintenanceTitle || maintenanceTitle.startsWith('Manutenção:')) {
      setMaintenanceTitle(`${maintenanceType}: ${m.hostname}`);
    }
  };

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineForModal) {
      setScheduleFeedback({ type: 'error', message: 'Por favor, busque e selecione um equipamento cadastrado.' });
      return;
    }

    try {
      setIsSubmittingSchedule(true);
      setScheduleFeedback(null);

      const payload = {
        machine_id: selectedMachineForModal.id,
        hostname: selectedMachineForModal.hostname,
        company_name: scheduleCompany || selectedMachineForModal.client_company || 'Cliente Geral',
        date_str: maintenanceDate,
        time_str: maintenanceTime,
        title: maintenanceTitle || `Manutenção: ${selectedMachineForModal.hostname}`,
        maintenance_type: maintenanceType,
        technician: maintenanceTechnician,
        priority: maintenancePriority,
        notes: maintenanceNotes,
        update_machine_status: updateMachineStatus
      };

      const res = await fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Falha ao agendar manutenção');
      }

      setScheduleFeedback({
        type: 'success',
        message: `Manutenção agendada com sucesso para ${selectedMachineForModal.hostname} em ${maintenanceDate.split('-').reverse().join('/')} às ${maintenanceTime}!`
      });

      await fetchMaintenances();
      if (updateMachineStatus) {
        onRefreshMachines?.();
      }

      setSelectedDateStr(maintenanceDate);

      setTimeout(() => {
        setIsScheduleModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setScheduleFeedback({ type: 'error', message: err.message || 'Erro ao agendar manutenção' });
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleCompleteMaintenance = async (maintId: string, machineId?: string) => {
    try {
      const cleanId = maintId.startsWith('sched_') ? maintId.replace('sched_', '') : maintId;
      const res = await fetch(`/api/maintenances/${cleanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Concluída' })
      });
      if (res.ok) {
        if (machineId) {
          try {
            await fetch(`/api/machines/${machineId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'Ativo' })
            });
            onRefreshMachines?.();
          } catch (e) {
            console.warn(e);
          }
        }
        await fetchMaintenances();
      }
    } catch (err) {
      console.error('Erro ao concluir manutenção:', err);
    }
  };

  const handleDeleteMaintenance = async (maintId: string) => {
    if (!window.confirm('Deseja realmente excluir este agendamento de manutenção?')) return;
    try {
      const cleanId = maintId.startsWith('sched_') ? maintId.replace('sched_', '') : maintId;
      const res = await fetch(`/api/maintenances/${cleanId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchMaintenances();
      }
    } catch (err) {
      console.error('Erro ao excluir manutenção:', err);
    }
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return allEvents.filter(ev => {
      if (selectedEventType !== 'all' && ev.type !== selectedEventType) {
        return false;
      }
      if (companyFilter !== 'all' && ev.machine.client_company !== companyFilter) {
        return false;
      }
      if (sectorFilter !== 'all' && ev.machine.sector !== sectorFilter) {
        return false;
      }
      return true;
    });
  }, [allEvents, selectedEventType, companyFilter, sectorFilter]);

  // Calendar day grid calculations
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Previous month filler days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const days: Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: CalendarEvent[];
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Fill days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(currentYear, currentMonth - 1, dayNum);
      const dStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        events: filteredEvents.filter(ev => ev.dateStr === dStr)
      });
    }

    // Fill days of current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const dStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr: dStr,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        events: filteredEvents.filter(ev => ev.dateStr === dStr)
      });
    }

    // Fill remaining days to make complete 7-day grid (35 or 42 cells)
    const remainingDays = 42 - days.length;
    if (remainingDays > 0 && remainingDays < 7) {
      for (let day = 1; day <= remainingDays; day++) {
        const d = new Date(currentYear, currentMonth + 1, day);
        const dStr = d.toISOString().slice(0, 10);
        days.push({
          date: d,
          dateStr: dStr,
          isCurrentMonth: false,
          isToday: dStr === todayStr,
          events: filteredEvents.filter(ev => ev.dateStr === dStr)
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, filteredEvents]);

  // Selected day events
  const selectedDayEvents = useMemo(() => {
    if (!selectedDateStr) return [];
    return filteredEvents.filter(ev => ev.dateStr === selectedDateStr);
  }, [selectedDateStr, filteredEvents]);

  // KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const nowStr = now.toISOString().slice(0, 10);
    const in30Str = in30Days.toISOString().slice(0, 10);
    const in90Str = in90Days.toISOString().slice(0, 10);

    const expiringSoon = allEvents.filter(ev =>
      ev.type === 'warranty_expiry' && ev.dateStr >= nowStr && ev.dateStr <= in90Str
    ).length;

    const activeMaintenance = machines.filter(m => m.status === 'Em Manutenção').length;

    const refreshThisYear = allEvents.filter(ev =>
      ev.type === 'lifecycle_refresh' && ev.dateStr.startsWith(String(currentYear))
    ).length;

    const totalTrackedWarranties = machines.filter(m => Boolean(m.warranty_end)).length;

    return {
      expiringSoon,
      activeMaintenance,
      refreshThisYear,
      totalTrackedWarranties
    };
  }, [allEvents, machines, currentYear]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().slice(0, 10));
  };

  const getEventBadge = (type: EventType) => {
    switch (type) {
      case 'warranty_expiry':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Fim Garantia</span>
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Wrench className="w-3 h-3 text-amber-400" />
            <span>Manutenção</span>
          </span>
        );
      case 'lifecycle_refresh':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <RefreshCw className="w-3 h-3 text-blue-400" />
            <span>Renovação Parque</span>
          </span>
        );
      case 'support_renewal':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Clock className="w-3 h-3 text-purple-400" />
            <span>Lembrete Suporte</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'server':
        return <Server className="w-3.5 h-3.5 text-purple-400" />;
      case 'notebook':
        return <Laptop className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Highlights / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Vencimento de Garantia */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">{kpis.expiringSoon}</div>
            <div className="text-xs text-slate-400">Garantias Vencendo (90d)</div>
            <div className="text-[10px] text-rose-400/80 mt-0.5">Atenção a extensões de suporte</div>
          </div>
        </div>

        {/* KPI 2: Manutenções em Aberto */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">{kpis.activeMaintenance}</div>
            <div className="text-xs text-slate-400">Ativos em Manutenção</div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">Necessitam vistoria ou peças</div>
          </div>
        </div>

        {/* KPI 3: Ciclos de Renovação Tecnológica */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">{kpis.refreshThisYear}</div>
            <div className="text-xs text-slate-400">Renovações em {currentYear}</div>
            <div className="text-[10px] text-blue-400/80 mt-0.5">Ciclo de vida recomendado atingido</div>
          </div>
        </div>

        {/* KPI 4: Garantias Cadastradas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">{kpis.totalTrackedWarranties}</div>
            <div className="text-xs text-slate-400">Garantias Mapeadas</div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">De {machines.length} ativos totais</div>
          </div>
        </div>
      </div>

      {/* Main Calendar View Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Calendar Toolbar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/60">
          {/* Month & Navigation */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <button
                  onClick={handleGoToToday}
                  className="px-2.5 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
                >
                  Hoje
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Cronograma de garantias de hardware, manutenções preventivas e ciclo de vida
              </p>
            </div>
          </div>

          {/* Month Switcher Controls & Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Prev / Next Month Buttons */}
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
              <button
                onClick={handlePrevMonth}
                title="Mês Anterior"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                title="Próximo Mês"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Company Filter (MSP) */}
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                if (onSelectCompany) onSelectCompany(e.target.value);
              }}
              className="py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-blue-400 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">🏢 Todas as Empresas (MSP)</option>
              {companies.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            {/* Event Type Filter */}
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Todos os Eventos</option>
              <option value="warranty_expiry">Fim de Garantia</option>
              <option value="maintenance">Manutenções</option>
              <option value="lifecycle_refresh">Renovação de Ciclo</option>
              <option value="support_renewal">Lembretes de Suporte</option>
            </select>

            {/* Sector Filter */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Todos os Setores</option>
              {sectors.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Action Button: Agendar Manutenção (Buscando Cliente & Equipamento) */}
            <button
              onClick={() => handleOpenScheduleModal()}
              title="Cadastrar e agendar manutenção preventiva ou corretiva buscando cliente e equipamento"
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/25 border border-blue-400/40"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>+ Agendar Manutenção</span>
            </button>

            {/* Action Button: Gerenciar Status de Manutenção */}
            <button
              onClick={() => setIsStatusModalOpen(true)}
              title="Cadastrar e gerenciar opções de status de manutenção com cores personalizadas"
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Status de Manutenção</span>
            </button>

            {/* Action Button: Imprimir Calendário & Cronograma */}
            <button
              onClick={() => printCalendarReport(
                filteredEvents,
                monthNames[currentMonth],
                currentYear,
                companyFilter === 'all' ? 'Todas as Empresas (MSP)' : companyFilter,
                scheduledMaintenances
              )}
              title="Imprimir cronograma consolidado de manutenções e garantias formatado para impressora ou PDF"
              className="py-1.5 px-3 bg-blue-950/80 hover:bg-blue-900/90 text-blue-200 hover:text-white text-xs font-semibold rounded-lg border border-blue-700/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Imprimir Calendário</span>
            </button>
          </div>
        </div>

        {/* Legend Ribbon */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-4 text-xs flex-wrap text-slate-400">
          <span className="font-semibold text-slate-300">Legenda:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Garantia Vencendo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Manutenção Técnica</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Renovação de Parque</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Lembrete de Suporte (30d)</span>
          </div>
        </div>

        {/* Main Grid & Side Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Calendar Month Grid (3 cols on large screen) */}
          <div className="lg:col-span-3 p-4 sm:p-5">
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 mb-2">
              {weekDayNames.map((d, i) => (
                <div key={d} className={`py-1.5 ${i === 0 || i === 6 ? 'text-slate-500' : ''}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((dayItem, index) => {
                const isSelected = selectedDateStr === dayItem.dateStr;
                const hasEvents = dayItem.events.length > 0;

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDateStr(dayItem.dateStr)}
                    className={`min-h-[92px] sm:min-h-[105px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      dayItem.isCurrentMonth
                        ? 'bg-slate-950/50 border-slate-800/80 hover:border-blue-500/60 hover:bg-slate-900'
                        : 'bg-slate-950/20 border-slate-900/60 text-slate-600 opacity-60'
                    } ${
                      isSelected ? 'ring-2 ring-blue-500 border-transparent bg-slate-900/90 shadow-md' : ''
                    } ${
                      dayItem.isToday ? 'border-blue-500/50 bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Day number & indicators */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          dayItem.isToday
                            ? 'bg-blue-600 text-white shadow-sm'
                            : isSelected
                            ? 'text-blue-400'
                            : dayItem.isCurrentMonth
                            ? 'text-slate-300'
                            : 'text-slate-600'
                        }`}
                      >
                        {dayItem.date.getDate()}
                      </span>

                      {/* Event count dot if many */}
                      {dayItem.events.length > 0 && (
                        <span className="text-[10px] font-mono px-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {dayItem.events.length}
                        </span>
                      )}
                    </div>

                    {/* Event badges container inside day cell */}
                    <div className="space-y-1 mt-1 overflow-hidden flex-1">
                      {dayItem.events.slice(0, 2).map((ev) => {
                        let bgColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                        if (ev.type === 'warranty_expiry') bgColor = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
                        if (ev.type === 'maintenance') bgColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                        if (ev.type === 'support_renewal') bgColor = 'bg-purple-500/15 text-purple-300 border-purple-500/30';

                        return (
                          <div
                            key={ev.id}
                            title={`${ev.title} - ${ev.description}`}
                            className={`text-[10px] px-1.5 py-0.5 rounded border truncate font-medium flex items-center gap-1 ${bgColor}`}
                          >
                            <span className="truncate">{ev.machine.hostname}</span>
                          </div>
                        );
                      })}

                      {dayItem.events.length > 2 && (
                        <div className="text-[9px] text-slate-400 font-semibold px-1">
                          +{dayItem.events.length - 2} mais...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detail Sidebar */}
          <div className="lg:col-span-1 p-4 sm:p-5 bg-slate-950/40 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-blue-400" />
                    Compromissos do Dia
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedDateStr
                      ? new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : 'Selecione um dia no calendário'}
                  </p>
                </div>

                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {selectedDayEvents.length}
                </span>
              </div>

              {/* Botão de Ação Rápida: Agendar Manutenção para este Dia */}
              <button
                type="button"
                onClick={() => handleOpenScheduleModal(selectedDateStr || undefined)}
                className="w-full mb-3 py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-blue-400" />
                <span>+ Agendar Manutenção para este Dia</span>
              </button>

              {/* Event items list */}
              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-10 px-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-2 text-slate-500">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400/60" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-300">Sem eventos agendados</h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto">
                    Nenhum vencimento de garantia ou manutenção programada para este dia.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`p-3 bg-slate-900 border rounded-xl space-y-2 transition-colors shadow-sm ${
                        ev.maintenanceRecord ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {getEventBadge(ev.type)}
                        <span className="text-[10px] text-slate-500 font-mono">
                          {ev.machine.asset_tag || 'S/ Pat.'}
                        </span>
                      </div>

                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          {getTypeIcon(ev.machine.machine_type)}
                          <span>{ev.machine.hostname}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          {ev.description}
                        </p>
                      </div>

                      {/* Technical metadata */}
                      <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-400" />
                            Empresa:
                          </span>
                          <strong className="text-blue-300 font-semibold truncate max-w-[130px]">
                            {ev.machine.client_company || 'Cliente Geral'}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Setor:</span>
                          <strong className="text-slate-300">{ev.machine.sector || 'Geral'}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Usuário / Responsável:</span>
                          <span className="text-slate-300 truncate max-w-[120px]">{ev.machine.logged_user || ev.machine.responsible_person || '-'}</span>
                        </div>
                        {ev.machine.vendor && (
                          <div className="flex items-center justify-between">
                            <span>Modelo / Fornecedor:</span>
                            <span className="text-slate-300 truncate max-w-[120px]">{ev.machine.vendor}</span>
                          </div>
                        )}
                        {ev.machine.warranty_end && (
                          <div className="flex items-center justify-between">
                            <span>Fim da Garantia:</span>
                            <span className="text-rose-400 font-semibold">{ev.machine.warranty_end}</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => onSelectMachine(ev.machine)}
                          className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3 text-blue-400" />
                          <span>Ficha Técnica</span>
                        </button>
                        <button
                          onClick={() => onEditMachine(ev.machine)}
                          className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Editar Garantia ou Status"
                        >
                          <Edit3 className="w-3 h-3 text-emerald-400" />
                        </button>
                      </div>

                      {/* Se for Manutenção Agendada explícita, exibir opções de Concluir ou Excluir */}
                      {ev.maintenanceRecord && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                          {ev.maintenanceRecord.status !== 'Concluída' ? (
                            <button
                              onClick={() => handleCompleteMaintenance(ev.maintenanceRecord!.id, ev.maintenanceRecord!.machine_id)}
                              className="flex-1 py-1 px-2 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 text-[11px] font-semibold rounded-lg border border-emerald-700/60 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Marcar Concluída</span>
                            </button>
                          ) : (
                            <span className="flex-1 text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1 py-1">
                              <Check className="w-3 h-3" /> Concluída
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteMaintenance(ev.maintenanceRecord!.id)}
                            className="p-1 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 hover:border-rose-800/60 transition-colors cursor-pointer"
                            title="Excluir este agendamento de manutenção"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Helper Tip */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Dica de Gestão de Ciclo de Vida:
              </span>
              <p className="text-[10px] text-slate-500 leading-tight">
                Utilize o botão <strong>+ Agendar Manutenção</strong> para vincular a empresa cliente e seu equipamento diretamente na agenda.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE AGENDAMENTO DE MANUTENÇÃO (BUSCANDO CLIENTE & SEU EQUIPAMENTO CADASTRADO) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#0b101d] border border-blue-500/40 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[94vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/15 border border-blue-500/30 rounded-xl text-blue-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Agendar Manutenção de Ativo</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                      CRM W3W
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecione a empresa cliente e busque o equipamento cadastrado para programar a manutenção
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmSchedule} className="space-y-4">
              {/* FEEDBACK MSG */}
              {scheduleFeedback && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  scheduleFeedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                }`}>
                  {scheduleFeedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{scheduleFeedback.message}</span>
                </div>
              )}

              {/* 1. CAMPO DE BUSCA COM AUTOCOMPLETAR (CLIENTCOMPANY E SEUS EQUIPAMENTOS) */}
              <div ref={autocompleteContainerRef} className="relative bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>1. Campo de Busca com Autocompletar: Empresa Cliente & Equipamentos:</span>
                  </label>
                  <span className="text-[11px] font-mono text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-full">
                    {enrichedCompanies.length} empresas • {machines.length} ativos
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    value={autocompleteQuery}
                    onChange={(e) => {
                      setAutocompleteQuery(e.target.value);
                      setIsAutocompleteOpen(true);
                    }}
                    onFocus={() => setIsAutocompleteOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.preventDefault();
                    }}
                    placeholder="Digite o nome da empresa cliente, CNPJ, hostname, IP, patrimônio ou setor..."
                    className="w-full pl-10 pr-20 py-2.5 bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs text-white placeholder-slate-400 outline-none transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
                    {autocompleteQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setAutocompleteQuery('');
                          setIsAutocompleteOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                        title="Limpar busca"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsAutocompleteOpen(!isAutocompleteOpen)}
                      className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                      title="Exibir/Ocultar lista suspensa"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAutocompleteOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* MENU SUSPENSO DE AUTOCOMPLETAR */}
                  {isAutocompleteOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#090f1d] border border-blue-500/40 rounded-xl shadow-2xl shadow-black/90 max-h-80 overflow-y-auto divide-y divide-slate-800/80 backdrop-blur-md">
                      {/* Ribbon informativo */}
                      <div className="px-3.5 py-2 bg-slate-900/95 flex items-center justify-between text-[11px] font-semibold text-slate-300">
                        <span className="flex items-center gap-1.5 text-blue-300">
                          <Building2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Selecione a Empresa Cliente ou clique diretamente no Equipamento:</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {autocompleteResults.matchedCompanies.length} empresa(s) listada(s)
                        </span>
                      </div>

                      {autocompleteResults.matchedCompanies.length === 0 && autocompleteResults.directMachines.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          <Building className="w-6 h-6 mx-auto mb-1.5 text-slate-500 opacity-60" />
                          <span>Nenhuma empresa cliente ou equipamento encontrado para <strong>"{autocompleteQuery}"</strong>.</span>
                        </div>
                      ) : (
                        <>
                          {/* Seção 1: Empresas Clientes Cadastradas e seus equipamentos */}
                          {autocompleteResults.matchedCompanies.map(({ company, machines: compMachines }) => {
                            const isCurrentSelected = scheduleCompany === company.name;
                            return (
                              <div key={company.id || company.name} className="p-2.5 hover:bg-slate-800/40 transition-colors">
                                {/* Card da Empresa (clique seleciona a empresa) */}
                                <div
                                  onClick={() => handleSelectCompanyFromAutocomplete(company.name)}
                                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                    isCurrentSelected
                                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="p-2 rounded-lg bg-blue-950 border border-blue-800/70 text-blue-400 flex-shrink-0">
                                      <Building2 className="w-4 h-4" />
                                    </div>
                                    <div className="truncate">
                                      <div className="font-bold text-xs flex items-center gap-2">
                                        <span className="truncate">{company.name}</span>
                                        {company.trade_name && company.trade_name !== company.name && (
                                          <span className="text-[10px] font-normal text-slate-400 truncate">
                                            ({company.trade_name})
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                                        {company.document && (
                                          <span className="font-mono bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">
                                            Doc: {company.document}
                                          </span>
                                        )}
                                        {company.contact_phone && (
                                          <span className="flex items-center gap-1 text-slate-400">
                                            <Phone className="w-2.5 h-2.5" /> {company.contact_phone}
                                          </span>
                                        )}
                                        {company.sla_plan && (
                                          <span className="text-amber-400 font-semibold">
                                            SLA: {company.sla_plan}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold">
                                      {compMachines.length} ativo(s)
                                    </span>
                                    <button
                                      type="button"
                                      className="text-[10px] px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
                                    >
                                      {isCurrentSelected ? 'Empresa Selecionada ✓' : 'Escolher Empresa'}
                                    </button>
                                  </div>
                                </div>

                                {/* Lista de Equipamentos Desta Empresa (clique seleciona o equipamento diretamente) */}
                                {compMachines.length > 0 && (
                                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-blue-500/30 space-y-1">
                                    <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                      <Monitor className="w-3 h-3 text-emerald-400" />
                                      <span>Equipamentos cadastrados desta empresa (clique para selecionar):</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                      {compMachines.slice(0, 6).map(m => {
                                        const isMSelected = selectedEquipmentId === m.id;
                                        return (
                                          <div
                                            key={m.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSelectEquipmentFromAutocomplete(m);
                                            }}
                                            className={`p-1.5 rounded-lg border text-[11px] transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                                              isMSelected
                                                ? 'bg-emerald-600/25 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500 font-semibold'
                                                : 'bg-slate-900/90 border-slate-800 hover:border-blue-500 hover:bg-slate-800/80 text-slate-300'
                                            }`}
                                          >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <span className="text-blue-400 flex-shrink-0">
                                                {getTypeIcon(m.machine_type)}
                                              </span>
                                              <span className="font-bold truncate">{m.hostname}</span>
                                              {m.asset_tag && (
                                                <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                                                  {m.asset_tag}
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-[9px] font-mono text-slate-400 flex-shrink-0">
                                              {m.primary_ip || m.sector || m.status}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {compMachines.length > 6 && (
                                      <div className="text-[10px] text-blue-400 pt-0.5 font-medium">
                                        + {compMachines.length - 6} outros equipamentos disponíveis desta empresa
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Seção 2: Equipamentos Correspondentes Diretos (se busca digitada deu match em máquina de outra empresa) */}
                          {autocompleteResults.directMachines.length > 0 && (
                            <div className="p-3 bg-slate-950/90">
                              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Monitor className="w-3.5 h-3.5 text-amber-400" />
                                <span>Equipamentos Encontrados por Hostname / IP / Patrimônio ({autocompleteResults.directMachines.length})</span>
                              </div>
                              <div className="space-y-1.5">
                                {autocompleteResults.directMachines.slice(0, 8).map(m => {
                                  const isMSelected = selectedEquipmentId === m.id;
                                  return (
                                    <div
                                      key={m.id}
                                      onClick={() => handleSelectEquipmentFromAutocomplete(m)}
                                      className={`p-2 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                        isMSelected
                                          ? 'bg-emerald-600/20 border-emerald-500 text-white font-semibold'
                                          : 'bg-slate-900 border-slate-800 hover:border-blue-500 text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1 rounded-md bg-slate-800 text-blue-400">
                                          {getTypeIcon(m.machine_type)}
                                        </div>
                                        <div className="truncate">
                                          <div className="font-bold flex items-center gap-2">
                                            <span>{m.hostname}</span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 border border-blue-800/80 text-blue-300 font-normal">
                                              🏢 {m.client_company || 'Sem Empresa'}
                                            </span>
                                          </div>
                                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                            <span>IP: {m.primary_ip || 'Sem IP'}</span>
                                            {m.asset_tag && <span>• Patr: {m.asset_tag}</span>}
                                            {m.sector && <span>• Setor: {m.sector}</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        className="text-[10px] px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex-shrink-0"
                                      >
                                        Selecionar Ativo →
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Seletor Rápido de Empresa Alternativo (Dropdown clássico para comodidade) */}
                <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                  <div className="flex-1 flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
                    <Building className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-slate-400 text-[11px] whitespace-nowrap">Empresa Ativa:</span>
                    <select
                      value={scheduleCompany}
                      onChange={(e) => {
                        setScheduleCompany(e.target.value);
                        setAutocompleteQuery(e.target.value);
                        setSelectedEquipmentId('');
                      }}
                      className="bg-transparent text-white font-bold text-xs focus:outline-none flex-1 cursor-pointer"
                    >
                      <option value="" disabled>-- Selecione a Empresa Cliente --</option>
                      {clientCompanyList.map(c => (
                        <option key={c} value={c} className="bg-slate-900 text-white">🏢 {c}</option>
                      ))}
                    </select>
                  </div>

                  {selectedCompanyInfo && (
                    <div className="px-3 py-1.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[11px] text-blue-300 flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{selectedCompanyInfo.name}</span>
                      {selectedCompanyInfo.document && <span className="text-slate-400">({selectedCompanyInfo.document})</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. EQUIPAMENTOS CADASTRADOS DA EMPRESA SELECIONADA */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-emerald-400" />
                    <span>2. Equipamentos Cadastrados da Empresa: {scheduleCompany ? `(${scheduleCompany})` : ''}</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {availableEquipmentsForModal.length} ativo(s) cadastrado(s)
                  </span>
                </div>

                {/* Filtro Rápido no Parque Desta Empresa */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por hostname, patrimônio, IP, modelo, usuário ou setor..."
                    value={equipmentSearch}
                    onChange={(e) => setEquipmentSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {equipmentSearch && (
                    <button
                      type="button"
                      onClick={() => setEquipmentSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Grade/Lista de Equipamentos */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-800 rounded-lg p-1.5 bg-slate-900/50">
                  {availableEquipmentsForModal.length === 0 ? (
                    <div className="text-center py-5 text-slate-400 text-xs">
                      Nenhum equipamento cadastrado encontrado para esta empresa.
                      {scheduleCompany && <div className="mt-1 text-slate-500">Empresa: <strong>{scheduleCompany}</strong></div>}
                    </div>
                  ) : (
                    availableEquipmentsForModal.map((eq) => {
                      const isSelected = selectedEquipmentId === eq.id;
                      return (
                        <div
                          key={eq.id}
                          onClick={() => handleSelectEquipment(eq)}
                          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500 text-white shadow-sm'
                              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg border ${
                              isSelected ? 'bg-blue-500 text-white border-blue-400' : 'bg-slate-800 text-blue-400 border-slate-700'
                            }`}>
                              {getTypeIcon(eq.machine_type)}
                            </div>
                            <div className="truncate">
                              <div className="font-bold flex items-center gap-2">
                                <span className="truncate">{eq.hostname}</span>
                                {eq.asset_tag && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                    {eq.asset_tag}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{eq.os_name || 'SO'}</span>
                                <span>•</span>
                                <span className="font-mono text-slate-500">{eq.primary_ip || 'Sem IP'}</span>
                                <span>•</span>
                                <span>{eq.sector || 'Geral'}</span>
                                {eq.logged_user && <span>• Usuário: {eq.logged_user}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StatusBadge status={eq.status || 'Ativo'} size="sm" />
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-blue-400 bg-blue-500 text-white' : 'border-slate-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Card de Resumo do Equipamento Selecionado */}
                {selectedMachineForModal && (
                  <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-lg flex items-center justify-between text-xs text-blue-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div>
                        <strong>Equipamento Escolhido:</strong> {selectedMachineForModal.hostname} ({selectedMachineForModal.client_company})
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      IP: {selectedMachineForModal.primary_ip || '-'}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. PARÂMETROS DO AGENDAMENTO (DATA, HORA, TIPO, PRIORIDADE) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Data */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data da Manutenção *
                  </label>
                  <input
                    type="date"
                    required
                    value={maintenanceDate}
                    onChange={(e) => setMaintenanceDate(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Horário */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Horário Previsto *
                  </label>
                  <input
                    type="time"
                    required
                    value={maintenanceTime}
                    onChange={(e) => setMaintenanceTime(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Prioridade */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nível de Prioridade
                  </label>
                  <select
                    value={maintenancePriority}
                    onChange={(e) => setMaintenancePriority(e.target.value as any)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="low">🟢 Baixa (Rotina / Preventiva)</option>
                    <option value="medium">🟡 Média (Padrão)</option>
                    <option value="high">🔴 Alta (Crítica / Urgente)</option>
                  </select>
                </div>
              </div>

              {/* Tipo de Manutenção & Técnico */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo de Manutenção
                  </label>
                  <select
                    value={maintenanceType}
                    onChange={(e) => {
                      setMaintenanceType(e.target.value);
                      if (selectedMachineForModal) {
                        setMaintenanceTitle(`${e.target.value}: ${selectedMachineForModal.hostname}`);
                      }
                    }}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Manutenção Preventiva">Manutenção Preventiva (Limpeza & Cooler)</option>
                    <option value="Manutenção Corretiva">Manutenção Corretiva (Reparo de Falha)</option>
                    <option value="Upgrade de Hardware">Upgrade de Hardware (Memória RAM / SSD)</option>
                    <option value="Formatação & SO">Formatação & Reinstalação de Sistema</option>
                    <option value="Auditoria & Segurança">Auditoria de Segurança & Antivírus</option>
                    <option value="Vistoria Técnica">Vistoria Presencial & Rede</option>
                    <option value="Troca de Peça / Recall">Troca de Peça / Garantia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Técnico / Responsável W3W
                  </label>
                  <input
                    type="text"
                    required
                    value={maintenanceTechnician}
                    onChange={(e) => setMaintenanceTechnician(e.target.value)}
                    placeholder="Nome do técnico responsável"
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Título do Agendamento */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título / Assunto do Agendamento
                </label>
                <input
                  type="text"
                  required
                  value={maintenanceTitle}
                  onChange={(e) => setMaintenanceTitle(e.target.value)}
                  placeholder="Ex: Preventiva Semestral - Limpeza Interna e Troca de Pasta Térmica"
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Observações / Escopo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações Técnicas / Peças Necessárias / Sintomas Relatados
                </label>
                <textarea
                  rows={2}
                  value={maintenanceNotes}
                  onChange={(e) => setMaintenanceNotes(e.target.value)}
                  placeholder="Descreva o escopo da manutenção, peças a levar, sintomas relatados pelo cliente, backup prévio..."
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Checkbox Atualizar Status do Ativo */}
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg">
                <input
                  type="checkbox"
                  id="updateMachineStatusCheck"
                  checked={updateMachineStatus}
                  onChange={(e) => setUpdateMachineStatus(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-700 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="updateMachineStatusCheck" className="text-xs text-slate-300 cursor-pointer">
                  Atualizar status do equipamento para <strong>"Em Manutenção"</strong> no inventário automaticamente
                </label>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSchedule || !selectedEquipmentId}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingSchedule ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Confirmar Agendamento</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Gestão & Cadastro de Status de Manutenção */}
      {isStatusModalOpen && (
        <StatusManagementModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onStatusesChanged={() => {
            onRefreshMachines?.();
            fetchMaintenances();
          }}
        />
      )}
    </div>
  );
};
