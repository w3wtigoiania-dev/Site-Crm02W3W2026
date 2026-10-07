import React, { useState } from 'react';
import { Machine, FilterState, SystemSettings } from '../types.ts';
import { exportMachinesToPDF } from '../utils/exportUtils.ts';
import {
  X,
  Printer,
  Download,
  ClipboardCheck,
  Building,
  Calendar,
  UserCheck,
  ShieldCheck,
  CheckSquare,
  FileType
} from 'lucide-react';

interface PhysicalAuditModalProps {
  machines: Machine[];
  filters: FilterState;
  settings?: SystemSettings;
  onClose: () => void;
  onExportCsv: () => void;
}

export const PhysicalAuditModal: React.FC<PhysicalAuditModalProps> = ({
  machines,
  filters,
  settings,
  onClose,
  onExportCsv
}) => {
  const [auditorName, setAuditorName] = useState('Administrador de TI');
  const [auditDate, setAuditDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    exportMachinesToPDF(machines, filters, {
      auditorName,
      title: settings?.report_header || 'LAUDO E TERMO DE AUDITORIA FÍSICA DE TI',
      settings
    });
  };

  const checkedCount = Object.values(checkedIds).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:bg-white print:text-black">
        {/* Header - Non-printable controls */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Relatório de Auditoria Física de Ativos de TI
                </h2>
                <span className="text-[11px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-semibold border border-emerald-500/30">
                  {machines.length} equipamentos na visão atual
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Formulário para vistoria presencial, conferência de plaquetas de patrimônio e exportação PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onExportCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileType className="w-3.5 h-3.5 text-rose-400" />
              <span>Baixar PDF (jsPDF)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir A4 / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 print:p-0 print:overflow-visible text-slate-200 print:text-black print:bg-white">
          {/* Print Letterhead / Title Block */}
          <div className="border-b border-slate-800 print:border-black/30 pb-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                {settings?.logo_url && (
                  <div className="p-1.5 bg-white rounded-lg border border-slate-700 print:border-gray-300 max-w-[150px] shadow-sm">
                    <img
                      src={settings.logo_url}
                      alt={settings.company_name || 'Logo'}
                      className="max-h-12 max-w-[130px] object-contain"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white print:text-black">
                    {settings?.report_header || 'LAUDO & TERMO DE AUDITORIA FÍSICA DE INVENTÁRIO TI'}
                  </h1>
                  <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
                    {settings?.company_name || 'InfraAsset IT Solutions'} • {settings?.department || 'Departamento de Infraestrutura & Governança de TI'}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs">
                <span className="font-mono text-slate-400 print:text-gray-600 block">
                  Documento Ref: AUD-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}
                </span>
                <span className="text-[11px] text-slate-500 print:text-gray-500">
                  Emitido em: {new Date().toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Audit Parameters Form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs bg-slate-950/60 print:bg-gray-100 p-3 rounded-lg border border-slate-800 print:border-gray-300">
              <div>
                <label className="text-slate-400 print:text-gray-700 block text-[10px] font-semibold uppercase">
                  Auditor Responsável:
                </label>
                <input
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-700 print:border-black py-0.5 font-medium text-white print:text-black focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 print:text-gray-700 block text-[10px] font-semibold uppercase">
                  Data da Realização:
                </label>
                <input
                  type="date"
                  value={auditDate}
                  onChange={(e) => setAuditDate(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-700 print:border-black py-0.5 font-medium text-white print:text-black focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 print:text-gray-700 block text-[10px] font-semibold uppercase">
                  Escopo / Filtro Ativo:
                </label>
                <span className="font-medium text-blue-400 print:text-black truncate block mt-0.5">
                  {filters.sector !== 'all' ? `Setor: ${filters.sector}` : 'Todos os Setores'} •{' '}
                  {filters.os !== 'all' ? filters.os : 'Todos SO'} •{' '}
                  {filters.type !== 'all' ? filters.type : 'Todos Tipos'}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Progress in UI */}
          <div className="flex items-center justify-between text-xs print:hidden bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800">
            <span className="text-slate-400">
              Conferência digital em tela: <strong className="text-white">{checkedCount} de {machines.length}</strong> equipamentos marcados como inspecionados.
            </span>
            <button
              onClick={() => {
                const all: Record<string, boolean> = {};
                machines.forEach(m => { all[m.id] = true; });
                setCheckedIds(all);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
            >
              Marcar todos como conferidos
            </button>
          </div>

          {/* Equipment Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs print:text-[10px]">
              <thead>
                <tr className="bg-slate-950/80 print:bg-gray-200 text-slate-300 print:text-black border-y border-slate-800 print:border-black font-semibold text-[11px] print:text-[9px] uppercase">
                  <th className="py-2.5 px-2 text-center w-10">Conf.</th>
                  <th className="py-2.5 px-2">Patrimônio</th>
                  <th className="py-2.5 px-3">Hostname / Ativo</th>
                  <th className="py-2.5 px-3">Usuário / Responsável</th>
                  <th className="py-2.5 px-3">Setor / Localização</th>
                  <th className="py-2.5 px-3">Especificação (SO, CPU, RAM)</th>
                  <th className="py-2.5 px-3">IP / MAC Address</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-3 print:table-cell hidden sm:table-cell">Rubrica / Obs.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                {machines.map((m, idx) => {
                  const isChecked = Boolean(checkedIds[m.id]);
                  return (
                    <tr
                      key={m.id}
                      onClick={() => toggleCheck(m.id)}
                      className={`cursor-pointer transition-colors print:cursor-default ${
                        isChecked ? 'bg-blue-950/20 print:bg-transparent' : 'hover:bg-slate-800/30 print:hover:bg-transparent'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="inline-flex items-center justify-center w-4 h-4 rounded border border-slate-600 print:border-black print:w-3.5 print:h-3.5">
                          {isChecked ? (
                            <span className="text-blue-400 print:text-black font-bold text-xs">✓</span>
                          ) : (
                            <span className="print:hidden text-transparent">.</span>
                          )}
                        </div>
                      </td>

                      {/* Patrimônio */}
                      <td className="py-2.5 px-2 font-mono font-bold text-blue-400 print:text-black">
                        {m.asset_tag || <span className="text-slate-500 italic font-normal">[Sem Tag]</span>}
                      </td>

                      {/* Hostname */}
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white print:text-black">{m.hostname}</span>
                        <span className="block text-[10px] text-slate-400 print:text-gray-600 capitalize">
                          {m.machine_type} • {m.vendor || 'Padrão'}
                        </span>
                      </td>

                      {/* Usuário */}
                      <td className="py-2.5 px-3 text-slate-300 print:text-black">
                        <span className="font-medium block">{m.logged_user || '-'}</span>
                        <span className="text-[10px] text-slate-400 print:text-gray-600 truncate max-w-[120px] block">
                          {m.responsible_person || 'Não atribuído'}
                        </span>
                      </td>

                      {/* Setor & Localização */}
                      <td className="py-2.5 px-3 text-slate-300 print:text-black">
                        <span className="font-semibold block">{m.sector || 'Geral'}</span>
                        <span className="text-[10px] text-slate-400 print:text-gray-600 block">
                          {m.location || 'Matriz'}
                        </span>
                      </td>

                      {/* Especificação */}
                      <td className="py-2.5 px-3 text-slate-300 print:text-black">
                        <span className="font-medium block">{m.os_name} {m.os_version}</span>
                        <span className="text-[10px] text-slate-400 print:text-gray-600 block truncate max-w-[140px]">
                          {m.ram_total_gb}GB RAM • {m.cpu_cores_logical} cores
                        </span>
                      </td>

                      {/* IP & MAC */}
                      <td className="py-2.5 px-3 font-mono text-[11px] print:text-[9px] text-slate-300 print:text-black">
                        <span>{m.primary_ip || '-'}</span>
                        <span className="block text-[10px] text-slate-500 print:text-gray-600">{m.primary_mac}</span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-700 print:border-black print:text-black">
                          {m.status}
                        </span>
                      </td>

                      {/* Linha de Rubrica / Vistoria para impressão */}
                      <td className="py-2.5 px-3 text-slate-500 print:text-black border-b border-dotted border-slate-700 print:border-gray-400 min-w-[100px] text-[10px]">
                        {m.notes ? m.notes.slice(0, 30) : '________________'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signature & Audit Closing Block */}
          <div className="pt-8 border-t border-slate-800 print:border-black/40 space-y-6">
            <div className="text-xs text-slate-400 print:text-gray-700">
              <p>
                <strong>Termo de Constatação:</strong> Declaramos que os equipamentos listados acima foram auditados fisicamente na presente data, confirmando a existência do hardware, estado de funcionamento e confrontação dos dados de rede e patrimônio.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-4 text-center text-xs">
              <div>
                <div className="border-b border-slate-700 print:border-black h-8 mb-2" />
                <span className="font-bold text-white print:text-black block">{auditorName}</span>
                <span className="text-[11px] text-slate-400 print:text-gray-600">Auditor / Técnico de TI</span>
              </div>

              <div>
                <div className="border-b border-slate-700 print:border-black h-8 mb-2" />
                <span className="font-bold text-white print:text-black block">Gestor da Área / Setor</span>
                <span className="text-[11px] text-slate-400 print:text-gray-600">Responsável pelo Departamento</span>
              </div>

              <div className="hidden sm:block">
                <div className="border-b border-slate-700 print:border-black h-8 mb-2" />
                <span className="font-bold text-white print:text-black block">Controle Patrimonial</span>
                <span className="text-[11px] text-slate-400 print:text-gray-600">Controladoria / Auditoria Interna</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer in Modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-400">
            Dica: No diálogo de impressão, escolha <em>"Salvar como PDF"</em> para arquivar o relatório digitalmente.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Fechar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};
