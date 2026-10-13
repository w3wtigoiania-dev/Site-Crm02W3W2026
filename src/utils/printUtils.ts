import { Machine, FilterState, SystemSettings, ClientCompany } from '../types.ts';
import { CalendarEvent } from '../components/MaintenanceCalendar.tsx';

/**
 * Utilitário profissional de impressão direta com formatação A4 para Inventário, Calendário e Financeiro PJ.
 * Utiliza iframe oculto com auto-impressão sem desconfigurar o layout ou acionar bloqueadores de popup.
 */
export function printDocument(title: string, htmlBody: string, orientation: 'portrait' | 'landscape' = 'portrait') {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  const css = `
    @page {
      size: A4 ${orientation};
      margin: 10mm 10mm 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.35;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header h1 {
      margin: 0 0 2px 0;
      font-size: 16px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .header .subtitle {
      font-size: 10px;
      color: #475569;
      font-weight: 600;
    }
    .meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 10px;
    }
    .meta-item strong {
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 9.5px;
    }
    th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #0f172a;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.3px;
    }
    td {
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 8.5px;
      text-transform: uppercase;
    }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-info { background: #e0f2fe; color: #075985; }
    .badge-purple { background: #f3e8ff; color: #6b21a8; }
    .footer {
      margin-top: 20px;
      border-top: 1px solid #cbd5e1;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #64748b;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 28px;
      padding-top: 10px;
    }
    .sign-line {
      width: 44%;
      border-top: 1px solid #94a3b8;
      text-align: center;
      font-size: 9px;
      padding-top: 4px;
      color: #334155;
    }
    .kpi-row {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
    }
    .kpi-box {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: center;
    }
    .kpi-num {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-label {
      font-size: 8.5px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  `;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>${css}</style>
    </head>
    <body>
      ${htmlBody}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
            setTimeout(function() {
              if (window.frameElement) window.frameElement.remove();
            }, 1000);
          }, 250);
        };
      <\/script>
    </body>
    </html>
  `);
  doc.close();
}

/**
 * 1. IMPRESSÃO DE INVENTÁRIO (MachineList)
 */
export function printInventoryReport(
  machines: Machine[],
  filters?: FilterState,
  settings?: SystemSettings
) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const companyName = settings?.company_name || 'W3W SOLUÇÕES EM TI • INFRA ASSET MANAGER';

  const selectedCompany = filters?.company && filters.company !== 'all' ? filters.company : 'Todas as Empresas (Visão Consolidada MSP)';
  const totalCost = machines.reduce((acc, m) => acc + (Number(m.cost) || 0), 0);
  const totalInMaintenance = machines.filter(m => m.status === 'Em Manutenção').length;
  const totalActive = machines.filter(m => m.status === 'Ativo' || !m.status).length;

  const rowsHtml = machines.map((m, idx) => {
    let statusClass = 'badge-success';
    if (m.status === 'Em Manutenção') statusClass = 'badge-warning';
    else if (m.status === 'Desativado' || (m.status as string) === 'Inativo' || (m.status as string) === 'Descarte') statusClass = 'badge-danger';
    else if (m.status === 'Reserva') statusClass = 'badge-info';

    return `
      <tr>
        <td class="text-center font-bold">${idx + 1}</td>
        <td><strong>${m.hostname}</strong></td>
        <td>${m.client_company || 'Cliente Geral'}</td>
        <td class="mono">${m.asset_tag || '-'}</td>
        <td style="text-transform: uppercase;">${m.machine_type || 'Desktop'}</td>
        <td>${m.os_name} ${m.os_arch || ''}</td>
        <td>${m.cpu_model ? m.cpu_model.slice(0, 24) : '-'}</td>
        <td class="text-center">${m.ram_total_gb ? m.ram_total_gb + ' GB' : '-'}</td>
        <td class="mono text-center">${m.primary_ip || '-'}</td>
        <td>${m.sector || 'Geral'}</td>
        <td>${m.logged_user || m.responsible_person || '-'}</td>
        <td class="text-center"><span class="badge ${statusClass}">${m.status || 'Ativo'}</span></td>
        <td class="text-center">${m.warranty_end || '-'}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <div class="header">
      <div>
        <h1>${companyName}</h1>
        <div class="subtitle">RELATÓRIO OFICIAL DE INVENTÁRIO & AUDITORIA DE ATIVOS DE TI</div>
      </div>
      <div class="text-right" style="font-size: 9.5px; color: #475569;">
        <div><strong>Emissão:</strong> ${dateStr} às ${timeStr}</div>
        <div><strong>Origem:</strong> Painel CRM Corporativo W3W</div>
      </div>
    </div>

    <div class="meta-card">
      <div class="meta-item"><strong>Empresa Cliente:</strong> ${selectedCompany}</div>
      <div class="meta-item"><strong>Setor:</strong> ${filters?.sector && filters.sector !== 'all' ? filters.sector : 'Todos os Setores'}</div>
      <div class="meta-item"><strong>Status:</strong> ${filters?.status && filters.status !== 'all' ? filters.status : 'Todos Status'}</div>
      <div class="meta-item"><strong>Total Listado:</strong> ${machines.length} ativos</div>
    </div>

    <div class="kpi-row">
      <div class="kpi-box">
        <div class="kpi-num">${machines.length}</div>
        <div class="kpi-label">Total de Equipamentos</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-num" style="color: #16a34a;">${totalActive}</div>
        <div class="kpi-label">Equipamentos Ativos</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-num" style="color: #d97706;">${totalInMaintenance}</div>
        <div class="kpi-label">Em Manutenção</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-num" style="color: #2563eb;">R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        <div class="kpi-label">Valor Patrimonial Declarado</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 25px;">#</th>
          <th>Hostname</th>
          <th>Empresa Cliente</th>
          <th>Patrimônio</th>
          <th>Tipo</th>
          <th>Sistema Operacional</th>
          <th>Processador</th>
          <th>RAM</th>
          <th>IP Local</th>
          <th>Setor</th>
          <th>Responsável</th>
          <th>Status</th>
          <th>Garantia</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="signatures">
      <div class="sign-line">
        Responsável Técnico de TI (W3W Soluções)
      </div>
      <div class="sign-line">
        Representante / Gestor da Empresa Cliente
      </div>
    </div>

    <div class="footer">
      <span>W3W Soluções em TI • Suporte Gerenciado & Sustentação de Infraestrutura • Goiânia - GO</span>
      <span>Página 1 de 1 • Documento Oficial Confidencial</span>
    </div>
  `;

  printDocument(`Inventario_${selectedCompany.replace(/\s+/g, '_')}_${dateStr}`, html, 'landscape');
}

/**
 * 2. IMPRESSÃO DE CALENDÁRIO (MaintenanceCalendar)
 */
export function printCalendarReport(
  events: CalendarEvent[],
  monthName: string,
  year: number,
  companyName: string = 'Todas as Empresas (MSP)',
  scheduledMaintenancesList?: any[]
) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Agrupar eventos ordenados por data
  const sortedEvents = [...events].sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  const countWarranties = events.filter(e => e.type === 'warranty_expiry').length;
  const countMaintenances = events.filter(e => e.type === 'maintenance').length;
  const countRenewals = events.filter(e => e.type === 'support_renewal').length;
  const countLifecycle = events.filter(e => e.type === 'lifecycle_refresh').length;

  const rowsHtml = sortedEvents.map((ev, idx) => {
    let typeBadge = '<span class="badge badge-info">Evento</span>';
    if (ev.type === 'warranty_expiry') typeBadge = '<span class="badge badge-danger">Fim de Garantia</span>';
    else if (ev.type === 'maintenance') typeBadge = '<span class="badge badge-warning">Manutenção Técnica</span>';
    else if (ev.type === 'support_renewal') typeBadge = '<span class="badge badge-purple">Renovação Suporte</span>';
    else if (ev.type === 'lifecycle_refresh') typeBadge = '<span class="badge badge-info">Ciclo de Vida</span>';

    const formattedDate = ev.dateStr.split('-').reverse().join('/');

    return `
      <tr>
        <td class="text-center font-bold">${idx + 1}</td>
        <td class="mono font-bold text-center" style="white-space: nowrap;">${formattedDate}</td>
        <td class="text-center">${typeBadge}</td>
        <td><strong>${ev.machine.hostname}</strong> <span class="mono" style="color: #64748b;">(${ev.machine.asset_tag || 'S/ Pat.'})</span></td>
        <td>${ev.machine.client_company || 'Cliente Geral'}</td>
        <td>${ev.machine.sector || 'Geral'}</td>
        <td>${ev.title}</td>
        <td style="color: #334155;">${ev.description}</td>
        <td>${ev.machine.logged_user || ev.machine.responsible_person || '-'}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <div class="header">
      <div>
        <h1>W3W SOLUÇÕES EM TI • CRONOGRAMA DE MANUTENÇÃO & GARANTIAS</h1>
        <div class="subtitle">CALENDÁRIO EXECUTIVO DE TI - COMPETÊNCIA: ${monthName.toUpperCase()} / ${year}</div>
      </div>
      <div class="text-right" style="font-size: 9.5px; color: #475569;">
        <div><strong>Emissão:</strong> ${dateStr} às ${timeStr}</div>
        <div><strong>Filtro Empresa:</strong> ${companyName}</div>
      </div>
    </div>

    <div class="meta-card">
      <div class="meta-item"><strong>Mês / Ano:</strong> ${monthName} de ${year}</div>
      <div class="meta-item"><strong>Empresa Cliente:</strong> ${companyName}</div>
      <div class="meta-item"><strong>Total de Ocorrências Programadas:</strong> ${events.length}</div>
      <div class="meta-item"><strong>Status:</strong> Cronograma Ativo</div>
    </div>

    <div class="kpi-row">
      <div class="kpi-box">
        <div class="kpi-num" style="color: #d97706;">${countMaintenances}</div>
        <div class="kpi-label">Manutenções Agendadas</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-num" style="color: #dc2626;">${countWarranties}</div>
        <div class="kpi-label">Vencimentos de Garantia</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-num" style="color: #7c3aed;">${countRenewals}</div>
        <div class="kpi-label">Lembretes de Suporte (30d)</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-num" style="color: #2563eb;">${countLifecycle}</div>
        <div class="kpi-label">Renovação de Ciclo de Vida</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 25px;">#</th>
          <th style="width: 75px;">Data</th>
          <th style="width: 110px;">Tipo de Evento</th>
          <th>Equipamento (Hostname)</th>
          <th>Empresa Cliente</th>
          <th>Setor</th>
          <th>Assunto / Título</th>
          <th>Descrição Técnica</th>
          <th>Responsável</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="9" class="text-center" style="padding: 18px; color: #64748b;">Nenhum evento de manutenção ou garantia agendado para o período selecionado.</td></tr>'}
      </tbody>
    </table>

    <div class="signatures">
      <div class="sign-line">
        Supervisor de Operações de TI (W3W)
      </div>
      <div class="sign-line">
        Aprovação de Cronograma (Gestor do Cliente)
      </div>
    </div>

    <div class="footer">
      <span>W3W Soluções em TI • Controle Preventivo e Ciclo de Vida de Ativos • Goiânia - GO</span>
      <span>Página 1 de 1 • Cronograma Corporativo de TI</span>
    </div>
  `;

  printDocument(`Calendario_Manutencao_${monthName}_${year}`, html, 'landscape');
}

/**
 * 3. IMPRESSÃO DE FINANCEIRO PJ (FinancialModule)
 */
export function printFinancialReport(data: {
  competenceMonth: number;
  competenceYear: number;
  monthName: string;
  activeCompany: string;
  summary: any;
  cardsList: any[];
  expenses: any[];
  payables: any[];
  receivables: any[];
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const formatBRL = (val?: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const activeExpenses = data.expenses.filter(e => e.is_active_in_competence);
  const totalExpensesMonth = activeExpenses.reduce((acc, e) => acc + (Number(e.installment_value) || 0), 0);
  const totalPayablesMonth = data.payables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const totalReceivablesMonth = data.receivables.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  // Cartão despesas
  const cardExpensesRows = activeExpenses.map((e, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong>${e.description}</strong></td>
      <td>${e.supplier || '-'}</td>
      <td>${e.category || 'Geral'}</td>
      <td>${e.card_name || 'Cartão Corporativo'}</td>
      <td class="text-center font-bold">${e.current_installment} / ${e.installments_count}</td>
      <td class="text-right mono font-bold" style="color: #7c3aed;">${formatBRL(e.installment_value)}</td>
      <td class="text-right mono">${formatBRL(e.total_amount)}</td>
    </tr>
  `).join('');

  // Contas a pagar
  const payablesRows = data.payables.map((p, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong>${p.description}</strong></td>
      <td>${p.supplier || '-'}</td>
      <td>${p.category || 'Geral'}</td>
      <td class="text-center mono">${p.due_date ? p.due_date.split('-').reverse().join('/') : '-'}</td>
      <td class="text-center font-bold">${p.installment_number || 1} / ${p.total_installments || 1}</td>
      <td class="text-center"><span class="badge ${p.status === 'paid' ? 'badge-success' : 'badge-danger'}">${p.status === 'paid' ? 'PAGO' : 'PENDENTE'}</span></td>
      <td class="text-right mono font-bold" style="color: #dc2626;">${formatBRL(p.amount)}</td>
    </tr>
  `).join('');

  // Contas a receber
  const receivablesRows = data.receivables.map((r, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong>${r.client_name || r.description}</strong></td>
      <td>${r.category || 'Serviços'}</td>
      <td class="text-center mono">${r.due_date ? r.due_date.split('-').reverse().join('/') : '-'}</td>
      <td class="text-center"><span class="badge ${r.status === 'received' ? 'badge-success' : 'badge-warning'}">${r.status === 'received' ? 'RECEBIDO' : 'PREVISTO'}</span></td>
      <td class="text-right mono font-bold" style="color: #16a34a;">${formatBRL(r.amount)}</td>
    </tr>
  `).join('');

  const html = `
    <div class="header">
      <div>
        <h1>W3W SOLUÇÕES EM TI • GESTÃO FINANCEIRA CORPORATIVA PJ</h1>
        <div class="subtitle">DEMONSTRATIVO FINANCEIRO CONSOLIDADO - COMPETÊNCIA: ${data.monthName.toUpperCase()} / ${data.competenceYear}</div>
      </div>
      <div class="text-right" style="font-size: 9.5px; color: #475569;">
        <div><strong>Emissão:</strong> ${dateStr} às ${timeStr}</div>
        <div><strong>Empresa:</strong> ${data.activeCompany || 'Consolidado Geral'}</div>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-box">
        <div class="kpi-num" style="color: #7c3aed;">${formatBRL(data.summary?.totalSaldoDevedor)}</div>
        <div class="kpi-label">Saldo Devedor Contratual</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-num" style="color: #9333ea;">${formatBRL(totalExpensesMonth)}</div>
        <div class="kpi-label">Fatura Cartões no Mês</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-num" style="color: #dc2626;">${formatBRL(totalPayablesMonth)}</div>
        <div class="kpi-label">Contas a Pagar no Mês</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-num" style="color: #16a34a;">${formatBRL(totalReceivablesMonth)}</div>
        <div class="kpi-label">Contas a Receber no Mês</div>
      </div>
    </div>

    <!-- SEÇÃO 1: FATURA E GASTOS DO CARTÃO DE CRÉDITO -->
    <div style="margin-top: 14px; margin-bottom: 6px; font-weight: 800; font-size: 11px; text-transform: uppercase; color: #6b21a8; border-bottom: 1px solid #e9d5ff; padding-bottom: 2px;">
      1. Lançamentos e Parcelamentos de Cartões Corporativos (${activeExpenses.length} itens)
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 25px;">#</th>
          <th>Descrição da Compra</th>
          <th>Fornecedor</th>
          <th>Categoria</th>
          <th>Cartão Utilizado</th>
          <th style="width: 60px;">Parcela</th>
          <th style="width: 90px;" class="text-right">Valor no Mês</th>
          <th style="width: 90px;" class="text-right">Total Contrato</th>
        </tr>
      </thead>
      <tbody>
        ${cardExpensesRows.length > 0 ? cardExpensesRows : '<tr><td colspan="8" class="text-center" style="padding: 10px; color: #64748b;">Nenhuma compra de cartão ativa para esta competência.</td></tr>'}
      </tbody>
    </table>

    <!-- SEÇÃO 2: CONTAS A PAGAR -->
    <div style="margin-top: 14px; margin-bottom: 6px; font-weight: 800; font-size: 11px; text-transform: uppercase; color: #991b1b; border-bottom: 1px solid #fecaca; padding-bottom: 2px;">
      2. Contas a Pagar e Compromissos Fixos (${data.payables.length} itens)
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 25px;">#</th>
          <th>Título / Despesa</th>
          <th>Favorecido / Fornecedor</th>
          <th>Categoria</th>
          <th style="width: 75px;">Vencimento</th>
          <th style="width: 60px;">Parcela</th>
          <th style="width: 75px;" class="text-center">Status</th>
          <th style="width: 90px;" class="text-right">Valor da Parcela</th>
        </tr>
      </thead>
      <tbody>
        ${payablesRows.length > 0 ? payablesRows : '<tr><td colspan="8" class="text-center" style="padding: 10px; color: #64748b;">Nenhuma conta a pagar cadastrada para esta competência.</td></tr>'}
      </tbody>
    </table>

    <!-- SEÇÃO 3: CONTAS A RECEBER -->
    <div style="margin-top: 14px; margin-bottom: 6px; font-weight: 800; font-size: 11px; text-transform: uppercase; color: #166534; border-bottom: 1px solid #bbf7d0; padding-bottom: 2px;">
      3. Contas a Receber e Faturamento de Clientes (${data.receivables.length} itens)
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 25px;">#</th>
          <th>Cliente / Contrato</th>
          <th>Categoria de Serviço</th>
          <th style="width: 75px;">Previsão</th>
          <th style="width: 75px;" class="text-center">Status</th>
          <th style="width: 90px;" class="text-right">Valor Previsto</th>
        </tr>
      </thead>
      <tbody>
        ${receivablesRows.length > 0 ? receivablesRows : '<tr><td colspan="6" class="text-center" style="padding: 10px; color: #64748b;">Nenhuma conta a receber cadastrada para esta competência.</td></tr>'}
      </tbody>
    </table>

    <div class="signatures">
      <div class="sign-line">
        Controle Financeiro / Contabilidade PJ
      </div>
      <div class="sign-line">
        Diretoria de Operações & Infraestrutura
      </div>
    </div>

    <div class="footer">
      <span>W3W Soluções em TI • Gestão Financeira Empresarial • Sigilo Comercial</span>
      <span>Página 1 de 1 • Relatório Gerencial Emitido em ${dateStr}</span>
    </div>
  `;

  printDocument(`Financeiro_PJ_${data.monthName}_${data.competenceYear}`, html, 'portrait');
}
