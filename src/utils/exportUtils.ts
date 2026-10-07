import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Machine, FilterState, SystemSettings } from '../types.ts';

/**
 * Utilitário para exportar a lista de máquinas em formato CSV compatível com Excel
 */
export function exportMachinesToCSV(machines: Machine[], filenamePrefix = 'inventario_ti'): void {
  if (!machines || machines.length === 0) {
    alert('Nenhum equipamento disponível para exportação.');
    return;
  }

  const headers = [
    'Empresa Cliente',
    'Patrimônio',
    'Hostname',
    'Usuário Logado',
    'Tipo',
    'Sistema Operacional',
    'Versão SO',
    'Processador',
    'Núcleos (Threads)',
    'Clock (GHz)',
    'RAM Total (GB)',
    'RAM Usada (GB)',
    'RAM Usada (%)',
    'IP Local',
    'IP Público',
    'MAC Address',
    'Uptime (Horas)',
    'Setor',
    'Localização',
    'Status',
    'Responsável',
    'Fabricante/Modelo',
    'Data Compra',
    'Garantia Até',
    'Custo (R$)',
    'Observações',
    'Último Reporte'
  ];

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = machines.map(m => {
    const uptimeHours = m.uptime_seconds ? Math.round(m.uptime_seconds / 3600) : 0;
    return [
      escapeCSV(m.client_company || 'Cliente Geral'),
      escapeCSV(m.asset_tag || ''),
      escapeCSV(m.hostname),
      escapeCSV(m.logged_user || ''),
      escapeCSV(m.machine_type),
      escapeCSV(m.os_name),
      escapeCSV(m.os_version || ''),
      escapeCSV(m.cpu_model || ''),
      m.cpu_cores_logical || 1,
      m.cpu_freq_ghz || 0,
      m.ram_total_gb || 0,
      m.ram_used_gb || 0,
      m.ram_percent || 0,
      escapeCSV(m.primary_ip || ''),
      escapeCSV(m.public_ip || ''),
      escapeCSV(m.primary_mac || ''),
      uptimeHours,
      escapeCSV(m.sector || 'Geral'),
      escapeCSV(m.location || 'Matriz'),
      escapeCSV(m.status || 'Ativo'),
      escapeCSV(m.responsible_person || ''),
      escapeCSV(m.vendor || ''),
      escapeCSV(m.purchase_date || ''),
      escapeCSV(m.warranty_end || ''),
      m.cost || 0,
      escapeCSV(m.notes || ''),
      escapeCSV(m.last_seen || '')
    ].join(';');
  });

  // \uFEFF adiciona o BOM UTF-8 para o Excel reconhecer acentos em português
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const today = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Utilitário para gerar Relatório em PDF corporativo utilizando jsPDF e jspdf-autotable
 */
export function exportMachinesToPDF(
  machines: Machine[],
  filters?: FilterState,
  options: {
    auditorName?: string;
    title?: string;
    settings?: SystemSettings;
    includeSignatures?: boolean;
  } = {}
): void {
  if (!machines || machines.length === 0) {
    alert('Nenhum equipamento disponível para gerar o relatório PDF.');
    return;
  }

  // Orientação em modo paisagem (landscape) para caber todas as colunas técnicas
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const settings = options.settings;
  const companyName = settings?.company_name || 'INFRAASSET IT SOLUTIONS';
  const systemTitle = settings?.system_title || 'SISTEMA DE GESTÃO DE ATIVOS';
  const reportHeader = options.title || settings?.report_header || 'RELATÓRIO DE INVENTÁRIO E AUDITORIA DE ATIVOS DE TI';
  const auditor = options.auditorName || 'Administrador de Infraestrutura';
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR');
  const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // 1. Cabeçalho Corporativo
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 26, 'F');

  // Desenhar Logo no Cabeçalho se disponível
  if (settings?.logo_url) {
    try {
      doc.addImage(settings.logo_url, 'PNG', 242, 4, 42, 18, undefined, 'FAST');
    } catch (e) {
      console.warn('Could not draw logo on PDF:', e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`${companyName.toUpperCase()} • ${systemTitle.toUpperCase()}`, 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`${reportHeader} | Emissão: ${dateFormatted} às ${timeFormatted}`, 14, 19);

  // 2. Quadro de Metadados da Auditoria
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(14, 30, 269, 14, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(14, 30, 269, 14, 'S');

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont('helvetica', 'bold');
  doc.text('Total de Equipamentos:', 18, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(`${machines.length} ativos`, 58, 37);

  doc.setFont('helvetica', 'bold');
  doc.text('Auditor / Emissor:', 95, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(auditor, 126, 37);

  doc.setFont('helvetica', 'bold');
  doc.text('Filtros Aplicados:', 185, 37);
  doc.setFont('helvetica', 'normal');

  const filterText = [
    filters?.company && filters.company !== 'all' ? `Cliente: ${filters.company}` : 'Todos os Clientes',
    filters?.sector && filters.sector !== 'all' ? `Setor: ${filters.sector}` : 'Todos os Setores',
    filters?.status && filters.status !== 'all' ? `Status: ${filters.status}` : 'Todos Status'
  ].join(' | ');

  doc.text(filterText, 215, 37, { maxWidth: 65 });

  // 3. Montagem dos dados da Tabela
  const tableHeaders = [
    ['Patrimônio', 'Hostname', 'Empresa Cliente / Setor', 'Tipo', 'Sistema Operacional', 'Processador', 'RAM', 'IP / MAC', 'Status']
  ];

  const tableRows = machines.map(m => {
    return [
      m.asset_tag || '[Sem Tag]',
      m.hostname,
      `${m.client_company || 'Cliente Geral'}\n${m.sector || 'Geral'}`,
      m.machine_type.toUpperCase(),
      `${m.os_name} ${m.os_version}`,
      `${m.cpu_model ? m.cpu_model.slice(0, 26) : 'N/A'}\n(${m.cpu_cores_logical || 1}c)`,
      `${m.ram_total_gb} GB\n(${m.ram_percent}%)`,
      `${m.primary_ip || '-'}\n${m.primary_mac || '-'}`,
      m.status || 'Ativo'
    ];
  });

  // 4. Invocação do AutoTable
  autoTable(doc, {
    head: tableHeaders,
    body: tableRows,
    startY: 48,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [30, 58, 138], // blue-900 corporativo
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // zebra effect
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 26 }, // Patrimônio
      1: { fontStyle: 'bold', cellWidth: 32 }, // Hostname
      2: { cellWidth: 22 },                    // Tipo
      3: { cellWidth: 40 },                    // Usuário/Setor
      4: { cellWidth: 42 },                    // SO
      5: { cellWidth: 38 },                    // CPU
      6: { cellWidth: 20 },                    // RAM
      7: { font: 'courier', fontSize: 7.5, cellWidth: 32 }, // IP/MAC
      8: { fontStyle: 'bold', cellWidth: 17 }  // Status
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${settings?.footer_text || 'InfraAsset IT - Documento de Inventário Patrimonial'} | Página ${data.pageNumber} de ${pageCount}`,
        14,
        202
      );
      doc.text(
        `Confidencial - Uso Interno TI`,
        250,
        202
      );
    }
  });

  // 5. Bloco de Assinaturas na última página (se houver espaço)
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  if (finalY < 165) {
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Termo de Conformidade Física: Os equipamentos acima foram inspecionados quanto à integridade física e localização.', 14, finalY + 10);

    const sigY = finalY + 24;
    // Assinatura 1
    doc.line(20, sigY, 95, sigY);
    doc.setFont('helvetica', 'bold');
    doc.text(auditor, 25, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text('Auditor / Técnico de TI', 25, sigY + 8);

    // Assinatura 2
    doc.line(115, sigY, 190, sigY);
    doc.setFont('helvetica', 'bold');
    doc.text('Gestor do Setor / Departamento', 120, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text('Responsável pela Área Auditada', 120, sigY + 8);

    // Assinatura 3
    doc.line(210, sigY, 280, sigY);
    doc.setFont('helvetica', 'bold');
    doc.text('Controladoria de Ativos', 215, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text('Auditoria Patrimonial Interna', 215, sigY + 8);
  }

  // 6. Download do PDF
  const today = now.toISOString().slice(0, 10);
  doc.save(`relatorio_inventario_ti_${today}.pdf`);
}

