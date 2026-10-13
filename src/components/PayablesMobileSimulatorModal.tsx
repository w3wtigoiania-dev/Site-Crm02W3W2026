import React, { useState } from 'react';
import { AccountsPayableItem, FinancialCompetenceSummary } from '../types.ts';
import {
  Smartphone,
  X,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Maximize2,
  QrCode,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  CreditCard,
  Building2,
  Sparkles,
  Info
} from 'lucide-react';

export interface MobileDevicePreset {
  id: string;
  name: string;
  brand: string;
  category: 'medium' | 'large';
  categoryLabel: string;
  screenInches: string;
  width: number;
  height: number;
  aspectRatio: string;
  description: string;
  bezelRadius: string;
  islandType: 'punchhole' | 'dynamic_island' | 'waterdrop';
}

const DEVICE_PRESETS: MobileDevicePreset[] = [
  // 1. TELAS MÉDIAS (ENTRE 6,1 E 6,5 POLEGADAS)
  {
    id: 'galaxy_s23',
    name: 'Samsung Galaxy S23',
    brand: 'Samsung',
    category: 'medium',
    categoryLabel: 'Médias (6,1" - 6,5")',
    screenInches: '6,1 polegadas',
    width: 390,
    height: 844,
    aspectRatio: '19.5:9',
    description: 'Equilíbrio ideal entre conforto ergonômico com uma mão e área de visualização nítida.',
    bezelRadius: 'rounded-[46px]',
    islandType: 'punchhole'
  },
  {
    id: 'poco_x8_pro',
    name: 'Poco X8 Pro',
    brand: 'Xiaomi Poco',
    category: 'medium',
    categoryLabel: 'Médias (6,1" - 6,5")',
    screenInches: '6,5 polegadas',
    width: 412,
    height: 915,
    aspectRatio: '20:9',
    description: 'Área expandida de alta fluidez, ótima densidade de informações financeiras.',
    bezelRadius: 'rounded-[48px]',
    islandType: 'punchhole'
  },

  // 2. TELAS GRANDES (ENTRE 6,7 E 6,8 POLEGADAS)
  {
    id: 'pro_max_ultra',
    name: 'Linha Pro Max / Galaxy Ultra',
    brand: 'Apple & Samsung',
    category: 'large',
    categoryLabel: 'Grandes (6,7" - 6,8")',
    screenInches: '6,7 polegadas',
    width: 430,
    height: 932,
    aspectRatio: '19.5:9',
    description: 'Excelente para leitura executiva de planilhas e auditoria de contratos corporativos.',
    bezelRadius: 'rounded-[52px]',
    islandType: 'dynamic_island'
  },
  {
    id: 'tcl_60_nxtpaper',
    name: 'TCL 60 NXTPAPER',
    brand: 'TCL',
    category: 'large',
    categoryLabel: 'Grandes (6,7" - 6,8")',
    screenInches: '6,8 polegadas',
    width: 440,
    height: 956,
    aspectRatio: '20.5:9',
    description: 'Display gigante de 6,8 polegadas com máxima visibilidade e conforto visual prolongado.',
    bezelRadius: 'rounded-[50px]',
    islandType: 'punchhole'
  }
];

interface PayablesMobileSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  payables: AccountsPayableItem[];
  summary: FinancialCompetenceSummary | null;
  competenceMonth: number;
  competenceYear: number;
  monthName: string;
  onToggleStatus: (item: AccountsPayableItem) => void;
  onViewDetails: (item: AccountsPayableItem) => void;
  onEditPayable: (item: AccountsPayableItem) => void;
  onDeletePayable: (id: string, description: string) => void;
  onAddNew: () => void;
}

export const PayablesMobileSimulatorModal: React.FC<PayablesMobileSimulatorModalProps> = ({
  isOpen,
  onClose,
  payables,
  summary,
  competenceMonth,
  competenceYear,
  monthName,
  onToggleStatus,
  onViewDetails,
  onEditPayable,
  onDeletePayable,
  onAddNew
}) => {
  const [selectedDevice, setSelectedDevice] = useState<MobileDevicePreset>(DEVICE_PRESETS[0]);
  const [activeCategory, setActiveCategory] = useState<'medium' | 'large'>('medium');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [scaleMode, setScaleMode] = useState<number>(0.85); // Default comfortable scale for desktop screens
  const [mobileSearch, setMobileSearch] = useState<string>('');
  const [mobileFilter, setMobileFilter] = useState<'all' | 'Pendente' | 'Pago'>('all');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  if (!isOpen) return null;

  // Format currency in BRL
  const formatBRL = (val: number | string | undefined | null) => {
    const num = Number(val) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Filter payables based on mobile search and status
  const filteredPayables = payables.filter(item => {
    const matchesSearch =
      item.description.toLowerCase().includes(mobileSearch.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(mobileSearch.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(mobileSearch.toLowerCase())) ||
      String(item.code || '').toLowerCase().includes(mobileSearch.toLowerCase());

    const matchesStatus = mobileFilter === 'all' || item.status === mobileFilter;
    return matchesSearch && matchesStatus;
  });

  const totalFilteredAmount = filteredPayables.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const pendingCount = payables.filter(p => p.status !== 'Pago').length;
  const paidCount = payables.filter(p => p.status === 'Pago').length;

  // Viewport dimensions based on orientation
  const viewportWidth = orientation === 'portrait' ? selectedDevice.width : selectedDevice.height;
  const viewportHeight = orientation === 'portrait' ? selectedDevice.height : selectedDevice.width;

  // Current system time for phone status bar
  const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[96vh] flex flex-col bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* ========================================================================= */}
        {/* TOP TOOLBAR DO SIMULADOR (CATEGORIAS DE TELAS E CONTROLES) */}
        {/* ========================================================================= */}
        <div className="px-4 py-3 sm:px-6 bg-slate-900/90 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Visualizador Mobile de Contas a Pagar</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Live Simulator
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Teste de responsividade em smartphones reais • Competência {monthName}/{competenceYear}
              </p>
            </div>
          </div>

          {/* Categoria Selector: Médias vs Grandes */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  setActiveCategory('medium');
                  const found = DEVICE_PRESETS.find(d => d.category === 'medium');
                  if (found) setSelectedDevice(found);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === 'medium'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Telas Médias (entre 6,1 e 6,5 polegadas): Galaxy S23 e Poco X8 Pro"
              >
                <span>Médias (6,1" - 6,5")</span>
              </button>

              <button
                onClick={() => {
                  setActiveCategory('large');
                  const found = DEVICE_PRESETS.find(d => d.category === 'large');
                  if (found) setSelectedDevice(found);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === 'large'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Telas Grandes (entre 6,7 e 6,8 polegadas): Pro Max, Ultra e TCL 60 NXTPAPER"
              >
                <span>Grandes (6,7" - 6,8")</span>
              </button>
            </div>

            {/* Orientação (Retrato / Paisagem) */}
            <button
              onClick={() => setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')}
              className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Girar Orientação (Retrato / Paisagem)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{orientation === 'portrait' ? 'Retrato' : 'Paisagem'}</span>
            </button>

            {/* Escala / Zoom */}
            <select
              value={scaleMode}
              onChange={(e) => setScaleMode(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
              title="Zoom de visualização do simulador"
            >
              <option value={0.75}>Escala 75%</option>
              <option value={0.85}>Escala 85% (Ideal)</option>
              <option value={0.95}>Escala 95%</option>
              <option value={1.0}>Escala 100% (Real)</option>
            </select>

            {/* QR Code para abrir no celular físico */}
            <button
              onClick={() => setShowQrModal(true)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              title="Abrir no celular real via QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">QR Code</span>
            </button>

            {/* Fechar */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Fechar Simulador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUB-BARRA DE DISPOSITIVOS ESPECÍFICOS DA CATEGORIA SELECIONADA */}
        {/* ========================================================================= */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Dispositivo:
            </span>

            {DEVICE_PRESETS.filter(d => d.category === activeCategory).map(preset => {
              const isSelected = selectedDevice.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedDevice(preset)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-semibold text-white">{preset.name}</span>
                  <span className="text-[10px] font-mono opacity-80">({preset.screenInches})</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 font-mono text-slate-300">
                    {preset.width}x{preset.height}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Banner de Especificação do Tamanho */}
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="italic max-w-md truncate">
              {selectedDevice.description}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PALCO CENTRAL: SMARTPHONE CHASSIS & SCREEN */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-[#070b14] relative">
          {/* Background grid décor */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

          {/* Smartphone Frame Outer Bezel */}
          <div
            style={{
              width: `${viewportWidth + 24}px`,
              height: `${viewportHeight + 24}px`,
              transform: `scale(${scaleMode})`,
              transformOrigin: 'center center'
            }}
            className={`relative p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-[0_25px_70px_rgba(0,0,0,0.85)] border-4 border-slate-700/80 transition-all duration-300 ${selectedDevice.bezelRadius} flex-shrink-0`}
          >
            {/* Phone Hardware Buttons Deco */}
            <div className="absolute -left-[7px] top-28 w-[3px] h-12 bg-slate-600 rounded-l-md" title="Volume +" />
            <div className="absolute -left-[7px] top-44 w-[3px] h-12 bg-slate-600 rounded-l-md" title="Volume -" />
            <div className="absolute -right-[7px] top-32 w-[3px] h-16 bg-slate-600 rounded-r-md" title="Power / Lock" />

            {/* Inner Screen Container */}
            <div
              style={{
                width: `${viewportWidth}px`,
                height: `${viewportHeight}px`
              }}
              className="relative w-full h-full bg-[#080d1a] overflow-hidden rounded-[38px] flex flex-col border border-slate-900 select-none text-slate-100"
            >
              {/* =================================================================== */}
              {/* SMARTPHONE TOP BAR (STATUS BAR & CAMERA NOTCH) */}
              {/* =================================================================== */}
              <div className="w-full h-11 bg-[#060a14] px-6 flex items-center justify-between text-xs font-medium text-slate-300 flex-shrink-0 z-30 select-none border-b border-slate-800/40">
                {/* Clock */}
                <span className="font-semibold text-[13px] tracking-tight">{currentTime}</span>

                {/* Camera Notch / Dynamic Island */}
                {selectedDevice.islandType === 'dynamic_island' ? (
                  <div className="w-28 h-6 bg-black rounded-full flex items-center justify-between px-2.5 mx-auto -mt-1 shadow-inner border border-slate-900">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-blue-500/50" />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-3.5 h-3.5 bg-black rounded-full mx-auto -mt-1 border border-slate-800 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
                  </div>
                )}

                {/* Status Icons: 5G, Wi-Fi, Battery */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="font-mono text-[10px] font-bold text-slate-400">5G</span>
                  {/* Wi-Fi Icon */}
                  <svg className="w-3.5 h-3.5 fill-current text-slate-300" viewBox="0 0 24 24">
                    <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.78 0 7.2 1.5 9.71 3.96L12 19.34 2.29 11.46C4.8 9 8.22 7.5 12 7.5z"/>
                  </svg>
                  {/* Battery */}
                  <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
                    <div className="w-3.5 h-1.5 bg-emerald-400 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* =================================================================== */}
              {/* MOBILE APP HEADER: W3W FINANÇAS PJ */}
              {/* =================================================================== */}
              <div className="px-4 py-3 bg-[#0a1122] border-b border-slate-800 flex items-center justify-between flex-shrink-0 z-20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-sm shadow-rose-600/30">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="text-xs font-bold text-white tracking-tight leading-tight">
                      Contas a Pagar PJ
                    </h1>
                    <span className="text-[10px] font-mono text-rose-400">
                      {monthName} • {competenceYear}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                    {filteredPayables.length}/{payables.length}
                  </span>
                  <button
                    onClick={onAddNew}
                    className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer shadow-sm"
                    title="Adicionar Nova Conta"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* =================================================================== */}
              {/* MOBILE SCROLLABLE CONTENT BODY */}
              {/* =================================================================== */}
              <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
                {/* 1. Mobile Financial Summary Banner */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0f172a] border border-rose-500/25 shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Total a Pagar no Mês</span>
                    <span className="text-rose-400 font-semibold">{monthName}/{competenceYear}</span>
                  </div>

                  <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight">
                    {formatBRL(summary?.totalAccountsPayable || totalFilteredAmount)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px]">
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Pendentes</span>
                      <span className="font-bold font-mono text-amber-400">
                        {pendingCount} contas
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Baixadas/Pagas</span>
                      <span className="font-bold font-mono text-emerald-400">
                        {paidCount} contas
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Mobile Quick Search & Status Chips */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar conta ou fornecedor..."
                      value={mobileSearch}
                      onChange={(e) => setMobileSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    {mobileSearch && (
                      <button
                        onClick={() => setMobileSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Filter Chips: 1-Tap Filter */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setMobileFilter('all')}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        mobileFilter === 'all'
                          ? 'bg-slate-200 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Todas ({payables.length})
                    </button>
                    <button
                      onClick={() => setMobileFilter('Pendente')}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        mobileFilter === 'Pendente'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Pendentes ({pendingCount})
                    </button>
                    <button
                      onClick={() => setMobileFilter('Pago')}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        mobileFilter === 'Pago'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Pagas ({paidCount})
                    </button>
                  </div>
                </div>

                {/* 3. Mobile Payables Cards List */}
                <div className="space-y-2.5 pt-1">
                  {filteredPayables.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 p-4">
                      <p className="text-xs">Nenhuma conta encontrada com estes filtros.</p>
                      <button
                        onClick={() => { setMobileSearch(''); setMobileFilter('all'); }}
                        className="mt-2 text-rose-400 text-[11px] underline cursor-pointer"
                      >
                        Limpar busca e filtros
                      </button>
                    </div>
                  ) : (
                    filteredPayables.map((item) => {
                      const isPaid = item.status === 'Pago';
                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-2xl bg-slate-900/90 border transition-all shadow-sm ${
                            isPaid
                              ? 'border-emerald-500/20 bg-emerald-950/10'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Card Top: Code, Due Date & Status */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-slate-400 font-bold">
                                #{item.code}
                              </span>
                              <span className="text-slate-600 text-xs">•</span>
                              <span className="text-[10px] font-mono text-slate-300 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-rose-400" />
                                {item.due_date}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                                isPaid
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>

                          {/* Card Title & Supplier */}
                          <div className="mb-2">
                            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 line-clamp-2">
                              {item.credit_card_expense_id && (
                                <span title="Cartão PJ" className="inline-flex items-center">
                                  <CreditCard className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                </span>
                              )}
                              <span>{item.description}</span>
                            </h3>

                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                              <span className="text-slate-300">{item.supplier || 'Fornecedor n/d'}</span>
                              <span className="text-slate-700">•</span>
                              <span className="px-1.5 py-0.2 bg-slate-950 text-slate-400 rounded text-[9px] border border-slate-800">
                                {item.category}
                              </span>
                            </div>
                          </div>

                          {/* Card Amount & Installment */}
                          <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 mb-2.5">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Valor da Parcela</span>
                              <span className="text-sm font-black font-mono text-rose-400">
                                {formatBRL(item.amount)}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 block">Parcelamento</span>
                              <span className="text-xs font-mono font-bold text-slate-300">
                                {item.installment_number}/{item.total_installments}
                              </span>
                            </div>
                          </div>

                          {/* Card Mobile Quick Actions Bar */}
                          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/60">
                            {/* Toggle Pay / Unpay button */}
                            <button
                              onClick={() => onToggleStatus(item)}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                                isPaid
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isPaid ? 'Desfazer' : 'Dar Baixa'}</span>
                            </button>

                            {/* View Details */}
                            <button
                              onClick={() => onViewDetails(item)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                              title="Visualizar Detalhes"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => onEditPayable(item)}
                              className="p-1.5 bg-slate-800 hover:bg-purple-900/40 text-slate-300 hover:text-purple-300 rounded-lg transition-colors cursor-pointer"
                              title="Editar Conta"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => onDeletePayable(item.id, item.description)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Conta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom padding so content doesn't hit home bar */}
                <div className="h-10" />
              </div>

              {/* =================================================================== */}
              {/* SMARTPHONE BOTTOM GESTURE BAR */}
              {/* =================================================================== */}
              <div className="w-full h-5 bg-[#060a14] flex items-center justify-center flex-shrink-0 z-30 select-none">
                <div className="w-32 h-1 bg-slate-600 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER INFO BAR DO SIMULADOR */}
        {/* ========================================================================= */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">{selectedDevice.name}</span>
            <span>•</span>
            <span>{selectedDevice.screenInches}</span>
            <span>•</span>
            <span className="font-mono text-purple-400">{viewportWidth}x{viewportHeight} px ({selectedDevice.aspectRatio})</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">
              Interface 100% interativa: clique para Dar Baixa, Visualizar, Editar ou Adicionar
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE QR CODE PARA ABRIR NO CELULAR FÍSICO */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-3 top-3 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-3 text-purple-400">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              Abrir no seu Celular Real
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Aponte a câmera do seu smartphone (Galaxy S23, Poco X8 Pro, Pro Max ou TCL) para o QR Code abaixo:
            </p>

            {/* Simulated Clean High-Res QR Code Representation */}
            <div className="p-4 bg-white rounded-xl w-48 h-48 mx-auto flex items-center justify-center shadow-lg border-2 border-slate-700 mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}&color=0b1120`}
                alt="QR Code W3W Financeiro"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800 truncate mb-4 select-all">
              {window.location.href}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
