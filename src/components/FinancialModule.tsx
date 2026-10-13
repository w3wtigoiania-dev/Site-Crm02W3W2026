import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCardExpense,
  CreditCardInfo,
  FinancialInstitution,
  FinancialCategory,
  AccountsPayableItem,
  AccountsReceivableItem,
  FinancialCompetenceSummary,
  ClientCompany
} from '../types.ts';
import { printFinancialReport } from '../utils/printUtils.ts';
import {
  CreditCard,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Pencil,
  Eye,
  Download,
  Database,
  Settings2,
  Tag,
  Printer,
  Smartphone
} from 'lucide-react';
import { PayablesMobileSimulatorModal } from './PayablesMobileSimulatorModal.tsx';

interface FinancialModuleProps {
  companies: ClientCompany[];
  selectedCompany?: string;
  userRole?: string;
  userCompany?: string;
  onRefreshData?: () => void;
}

export const FinancialModule: React.FC<FinancialModuleProps> = ({
  companies,
  selectedCompany = 'all',
  userRole,
  userCompany
}) => {
  const isSuperAdmin = userRole === 'SuperAdmin';
  // Restrict company to userCompany if not SuperAdmin
  const activeCompany = !isSuperAdmin && userCompany ? userCompany : selectedCompany;

  // Competence Date State (Default: October 2026 per current system date)
  const [competenceMonth, setCompetenceMonth] = useState<number>(10);
  const [competenceYear, setCompetenceYear] = useState<number>(2026);

  // Sub-tab: 'card' | 'payables' | 'receivables' | 'forecast'
  const [activeSubTab, setActiveSubTab] = useState<'card' | 'payables' | 'receivables' | 'forecast'>('card');

  // Data states
  const [cardsList, setCardsList] = useState<CreditCardInfo[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('all');
  const [cardInfo, setCardInfo] = useState<CreditCardInfo | null>(null);
  const [expenses, setExpenses] = useState<CreditCardExpense[]>([]);
  const [payables, setPayables] = useState<AccountsPayableItem[]>([]);
  const [receivables, setReceivables] = useState<AccountsReceivableItem[]>([]);
  const [summary, setSummary] = useState<FinancialCompetenceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Search & Filters for Contas a Pagar
  const [payableSearch, setPayableSearch] = useState<string>('');
  const [payableStatusFilter, setPayableStatusFilter] = useState<string>('all');

  // Modal State for new card transaction (Despesas de Cartão)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<CreditCardExpense | null>(null);
  const [newExpenseForm, setNewExpenseForm] = useState({
    card_id: 'card_nubank_pj',
    description: '',
    supplier: '',
    total_amount: '',
    installments_count: 1,
    installment_value: '',
    purchase_date: new Date().toISOString().split('T')[0],
    first_due_month: 10,
    first_due_year: 2026,
    category: 'Infraestrutura & Serviços',
    company_name: activeCompany && activeCompany !== 'all' ? activeCompany : 'Hospital São Lucas'
  });

  // Modal State for new payable (IMAGEM 01: com parcelamento e recálculo automático)
  const [isPayableModalOpen, setIsPayableModalOpen] = useState(false);
  const [isMobileSimulatorOpen, setIsMobileSimulatorOpen] = useState(false);
  const [editingPayable, setEditingPayable] = useState<AccountsPayableItem | null>(null);
  const [viewingPayable, setViewingPayable] = useState<AccountsPayableItem | null>(null);
  const [newPayableForm, setNewPayableForm] = useState({
    description: '',
    category: 'Telecom & Internet',
    supplier: '',
    total_amount: '',
    installments_count: 1,
    installment_value: '',
    due_date: `${competenceYear}-${String(competenceMonth).padStart(2, '0')}-15`,
    company_name: activeCompany && activeCompany !== 'all' ? activeCompany : 'Hospital São Lucas',
    notes: ''
  });

  // Modal State for Cartões Diversos (IMAGEM 03: CRUD de Cartões de Crédito)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
  const [cardFormData, setCardFormData] = useState({
    card_name: '',
    bank_brand: 'Nubank PJ',
    last_digits: '',
    holder_name: 'InfraAsset Tecnologia PJ',
    closing_day: 25,
    due_day: 5,
    credit_limit: '25000',
    company_name: activeCompany && activeCompany !== 'all' ? activeCompany : 'Hospital São Lucas',
    color_gradient: 'from-purple-600 via-indigo-600 to-blue-600'
  });

  // Modal State para Cadastrar Nova Instituição Financeira / Banco
  const [institutionsList, setInstitutionsList] = useState<FinancialInstitution[]>([]);
  const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState(false);
  const [isManagingInstitutions, setIsManagingInstitutions] = useState(false);
  const [newInstitutionForm, setNewInstitutionForm] = useState({
    name: '',
    code: '',
    color_gradient: 'from-purple-600 via-indigo-600 to-blue-600'
  });

  // Modal State para Cadastrar Nova Categoria Financeira (IMAGEM 03)
  const [categoriesList, setCategoriesList] = useState<FinancialCategory[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    color: 'text-purple-400'
  });

  // Modal State for MySQL Export
  const [isMySqlModalOpen, setIsMySqlModalOpen] = useState(false);
  const [mySqlExportContent, setMySqlExportContent] = useState<string>('');
  const [isExportingSql, setIsExportingSql] = useState(false);

  // Modal State for new receivable
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);
  const [newReceivableForm, setNewReceivableForm] = useState({
    description: '',
    client_name: '',
    amount: '',
    due_date: `${competenceYear}-${String(competenceMonth).padStart(2, '0')}-10`,
    company_name: activeCompany && activeCompany !== 'all' ? activeCompany : 'Hospital São Lucas'
  });

  const monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  // Fetch all financial data for current competence and company
  const fetchFinancialData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const companyParam = activeCompany && activeCompany !== 'all' ? `&company=${encodeURIComponent(activeCompany)}` : '';
      const cardParam = selectedCardId && selectedCardId !== 'all' ? `&cardId=${encodeURIComponent(selectedCardId)}` : '';
      const compParams = `month=${competenceMonth}&year=${competenceYear}${companyParam}${cardParam}`;

      const [cardsRes, expensesRes, payablesRes, receivablesRes, summaryRes, instRes, catRes] = await Promise.all([
        fetch(`/api/financial/cards?${companyParam}`),
        fetch(`/api/financial/credit-card-expenses?${compParams}`),
        fetch(`/api/financial/accounts-payable?month=${competenceMonth}&year=${competenceYear}${companyParam}`),
        fetch(`/api/financial/accounts-receivable?month=${competenceMonth}&year=${competenceYear}${companyParam}`),
        fetch(`/api/financial/summary?${compParams}`),
        fetch('/api/financial/institutions'),
        fetch('/api/financial/categories')
      ]);

      if (catRes.ok) {
        const cData = await catRes.json();
        setCategoriesList(cData.categories || []);
      }

      if (instRes.ok) {
        const data = await instRes.json();
        setInstitutionsList(data.institutions || []);
      }

      if (cardsRes.ok) {
        const data = await cardsRes.json();
        const list = data.cards || [];
        setCardsList(list);
        if (selectedCardId && selectedCardId !== 'all') {
          const match = list.find((c: any) => c.id === selectedCardId);
          setCardInfo(match || list[0] || null);
        } else {
          setCardInfo(list[0] || null);
        }
      }
      if (expensesRes.ok) {
        const data = await expensesRes.json();
        setExpenses(data.expenses || []);
      }
      if (payablesRes.ok) {
        const data = await payablesRes.json();
        setPayables(data.payables || []);
      }
      if (receivablesRes.ok) {
        const data = await receivablesRes.json();
        setReceivables(data.receivables || []);
      }
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [competenceMonth, competenceYear, activeCompany, selectedCardId]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  // Navigate competence
  const handlePrevMonth = () => {
    if (competenceMonth === 1) {
      setCompetenceMonth(12);
      setCompetenceYear(prev => prev - 1);
    } else {
      setCompetenceMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (competenceMonth === 12) {
      setCompetenceMonth(1);
      setCompetenceYear(prev => prev + 1);
    } else {
      setCompetenceMonth(prev => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    setCompetenceMonth(10);
    setCompetenceYear(2026);
  };

  // Recalculate automatic installment value on total or count change for Card Expense
  const handleExpenseTotalChange = (valStr: string) => {
    const total = parseFloat(valStr) || 0;
    const count = newExpenseForm.installments_count || 1;
    const computed = count > 0 ? (total / count).toFixed(2) : '0.00';
    setNewExpenseForm(prev => ({
      ...prev,
      total_amount: valStr,
      installment_value: computed
    }));
  };

  const handleExpenseCountChange = (countNum: number) => {
    const total = parseFloat(newExpenseForm.total_amount) || 0;
    const computed = countNum > 0 ? (total / countNum).toFixed(2) : '0.00';
    setNewExpenseForm(prev => ({
      ...prev,
      installments_count: countNum,
      installment_value: computed
    }));
  };

  // IMAGEM 01: Recálculo automático bidirecional para Contas a Pagar
  // Se digitar Valor Total -> calcula Valor da Parcela
  const handlePayableTotalChange = (valStr: string) => {
    const total = parseFloat(valStr) || 0;
    const count = newPayableForm.installments_count || 1;
    const computed = count > 0 ? (total / count).toFixed(2) : '0.00';
    setNewPayableForm(prev => ({
      ...prev,
      total_amount: valStr,
      installment_value: computed
    }));
  };

  // Se digitar Quantidade de Parcelas -> recalcula parcela
  const handlePayableCountChange = (countNum: number) => {
    const validCount = Math.max(1, countNum);
    const total = parseFloat(newPayableForm.total_amount) || 0;
    const computed = validCount > 0 ? (total / validCount).toFixed(2) : '0.00';
    setNewPayableForm(prev => ({
      ...prev,
      installments_count: validCount,
      installment_value: computed
    }));
  };

  // Se digitar Valor da Parcela -> calcula Valor Total
  const handlePayableInstallmentChange = (instStr: string) => {
    const inst = parseFloat(instStr) || 0;
    const count = newPayableForm.installments_count || 1;
    const computed = (inst * count).toFixed(2);
    setNewPayableForm(prev => ({
      ...prev,
      installment_value: instStr,
      total_amount: computed
    }));
  };

  // IMAGEM 03: CRUD de Cartões de Crédito
  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardFormData.card_name) return;
    try {
      const res = await fetch('/api/financial/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cardFormData,
          credit_limit: parseFloat(cardFormData.credit_limit) || 10000
        })
      });
      if (res.ok) {
        setIsCardModalOpen(false);
        setCardFormData({
          card_name: '',
          bank_brand: 'Nubank',
          last_digits: '',
          holder_name: 'InfraAsset Tecnologia PJ',
          closing_day: 25,
          due_day: 5,
          credit_limit: '25000',
          company_name: activeCompany && activeCompany !== 'all' ? activeCompany : 'Hospital São Lucas',
          color_gradient: 'from-purple-600 via-indigo-600 to-blue-600'
        });
        fetchFinancialData(true);
      }
    } catch (err) {
      console.error('Erro ao cadastrar cartão de crédito:', err);
    }
  };

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardInfo?.id) return;
    try {
      const res = await fetch(`/api/financial/cards/${cardInfo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cardFormData,
          credit_limit: parseFloat(cardFormData.credit_limit) || cardInfo.credit_limit
        })
      });
      if (res.ok) {
        setIsEditCardModalOpen(false);
        fetchFinancialData(true);
      }
    } catch (err) {
      console.error('Erro ao atualizar cartão:', err);
    }
  };

  const handleDeleteCard = async (cardId: string, cardName: string) => {
    if (!window.confirm(`ATENÇÃO: Deseja realmente excluir o cartão "${cardName}"? Todas as compras associadas a este cartão e suas parcelas no Contas a Pagar também serão removidas do banco de dados!`)) return;
    try {
      const res = await fetch(`/api/financial/cards/${cardId}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedCardId === cardId) setSelectedCardId('all');
        fetchFinancialData(true);
      }
    } catch (err) {
      console.error('Erro ao excluir cartão:', err);
    }
  };

  // Cadastrar Nova Instituição Financeira / Banco (SQL INSERT)
  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    const instName = newInstitutionForm.name.trim();
    if (!instName) return;

    try {
      const res = await fetch('/api/financial/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: instName,
          code: newInstitutionForm.code.trim(),
          color_gradient: newInstitutionForm.color_gradient
        })
      });

      if (res.ok) {
        const data = await res.json();
        const created = data.institution;
        setIsInstitutionModalOpen(false);

        // Vincula e seleciona a instituição automaticamente no formulário ativo do cartão
        setCardFormData(prev => ({
          ...prev,
          bank_brand: created.name,
          color_gradient: created.color_gradient || prev.color_gradient
        }));

        setNewInstitutionForm({
          name: '',
          code: '',
          color_gradient: 'from-purple-600 via-indigo-600 to-blue-600'
        });

        // Recarrega lista atualizada de instituições financeiras
        const listRes = await fetch('/api/financial/institutions');
        if (listRes.ok) {
          const d = await listRes.json();
          setInstitutionsList(d.institutions || []);
        }
      }
    } catch (err) {
      console.error('Erro ao cadastrar instituição financeira:', err);
    }
  };

  // Excluir Instituição Financeira Customizada (SQL DELETE)
  const handleDeleteInstitution = async (id: string, name: string) => {
    if (!window.confirm(`Deseja realmente excluir a instituição financeira "${name}" do banco de dados?`)) return;
    try {
      const res = await fetch(`/api/financial/institutions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const listRes = await fetch('/api/financial/institutions');
        if (listRes.ok) {
          const d = await listRes.json();
          setInstitutionsList(d.institutions || []);
        }
      }
    } catch (err) {
      console.error('Erro ao remover instituição financeira:', err);
    }
  };

  // Cadastrar Nova Categoria Financeira (IMAGEM 03: SQL INSERT)
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const catName = newCategoryForm.name.trim();
    if (!catName) return;

    try {
      const res = await fetch('/api/financial/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: catName,
          color: newCategoryForm.color
        })
      });

      if (res.ok) {
        const data = await res.json();
        const created = data.category;
        setIsCategoryModalOpen(false);

        // Define a nova categoria como a selecionada nos formulários ativos
        setNewExpenseForm(prev => ({ ...prev, category: created.name }));
        setNewPayableForm(prev => ({ ...prev, category: created.name }));
        if (editingExpense) setEditingExpense(prev => prev ? ({ ...prev, category: created.name }) : null);
        if (editingPayable) setEditingPayable(prev => prev ? ({ ...prev, category: created.name }) : null);

        setNewCategoryForm({
          name: '',
          color: 'text-purple-400'
        });

        // Recarrega lista atualizada de categorias
        const catRes = await fetch('/api/financial/categories');
        if (catRes.ok) {
          const d = await catRes.json();
          setCategoriesList(d.categories || []);
        }
      }
    } catch (err) {
      console.error('Erro ao cadastrar categoria financeira:', err);
    }
  };

  // Excluir Categoria Personalizada (SQL DELETE)
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Deseja realmente remover a categoria "${name}" do banco de dados?`)) return;
    try {
      const res = await fetch(`/api/financial/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const catRes = await fetch('/api/financial/categories');
        if (catRes.ok) {
          const d = await catRes.json();
          setCategoriesList(d.categories || []);
        }
      }
    } catch (err) {
      console.error('Erro ao excluir categoria:', err);
    }
  };

  // Submit new credit card purchase
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseForm.description || !newExpenseForm.total_amount) return;

    try {
      const targetCardId = newExpenseForm.card_id || (selectedCardId !== 'all' ? selectedCardId : (cardInfo?.id || 'card_nubank_pj'));
      const res = await fetch('/api/financial/credit-card-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newExpenseForm,
          card_id: targetCardId,
          total_amount: parseFloat(newExpenseForm.total_amount),
          installment_value: parseFloat(newExpenseForm.installment_value)
        })
      });

      if (res.ok) {
        setIsExpenseModalOpen(false);
        setNewExpenseForm({
          card_id: targetCardId,
          description: '',
          supplier: '',
          total_amount: '',
          installments_count: 1,
          installment_value: '',
          purchase_date: new Date().toISOString().split('T')[0],
          first_due_month: competenceMonth,
          first_due_year: competenceYear,
          category: 'Infraestrutura & Serviços',
          company_name: activeCompany && activeCompany !== 'all' ? activeCompany : 'Hospital São Lucas'
        });
        fetchFinancialData(true);
      }
    } catch (err) {
      console.error('Erro ao adicionar lançamento do cartão:', err);
    }
  };

  // IMAGEM 03: Update expense
  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    try {
      const res = await fetch(`/api/financial/credit-card-expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editingExpense.description,
          supplier: editingExpense.supplier,
          total_amount: Number(editingExpense.total_amount),
          installments_count: Number(editingExpense.installments_count),
          installment_value: Number(editingExpense.installment_value),
          category: editingExpense.category,
          company_name: editingExpense.company_name,
          card_id: editingExpense.card_id
        })
      });
      if (res.ok) {
        setEditingExpense(null);
        fetchFinancialData(true);
      }
    } catch (err) {
      console.error('Erro ao atualizar lançamento:', err);
    }
  };

  // IMAGEM 01 & 02: Criar Conta a Pagar com suporte a parcelas automáticas
  const handleCreatePayable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayableForm.description || !newPayableForm.total_amount) return;

    try {
      const res = await fetch('/api/financial/accounts-payable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newPayableForm.description,
          category: newPayableForm.category,
          supplier: newPayableForm.supplier,
          amount: parseFloat(newPayableForm.total_amount),
          total_installments: newPayableForm.installments_count || 1,
          installment_value: parseFloat(newPayableForm.installment_value) || (parseFloat(newPayableForm.total_amount) / (newPayableForm.installments_count || 1)),
          due_date: newPayableForm.due_date,
          competence_month: competenceMonth,
          competence_year: competenceYear,
          company_name: newPayableForm.company_name,
          notes: newPayableForm.notes
        })
      });

      if (res.ok) {
        setIsPayableModalOpen(false);
        setNewPayableForm({
          description: '',
          category: 'Telecom & Internet',
          supplier: '',
          total_amount: '',
          installments_count: 1,
          installment_value: '',
          due_date: `${competenceYear}-${String(competenceMonth).padStart(2, '0')}-15`,
          company_name: activeCompany && activeCompany !== 'all' ? activeCompany : 'Hospital São Lucas',
          notes: ''
        });
        fetchFinancialData(true);
      }
    } catch (err) {
      console.error('Erro ao criar conta a pagar:', err);
    }
  };

  // IMAGEM 02: Update Conta a Pagar
  const handleUpdatePayable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayable) return;
    try {
      const res = await fetch(`/api/financial/accounts-payable/${editingPayable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editingPayable.description,
          supplier: editingPayable.supplier,
          category: editingPayable.category,
          amount: Number(editingPayable.amount),
          due_date: editingPayable.due_date,
          status: editingPayable.status,
          company_name: editingPayable.company_name,
          notes: editingPayable.notes
        })
      });
      if (res.ok) {
        setEditingPayable(null);
        fetchFinancialData(true);
      }
    } catch (err) {
      console.error('Erro ao atualizar conta a pagar:', err);
    }
  };

  // IMAGEM 02: Delete Conta a Pagar
  const handleDeletePayable = async (id: string, desc: string) => {
    if (!window.confirm(`Deseja realmente remover a conta a pagar "${desc}" do banco de dados?`)) return;
    try {
      const res = await fetch(`/api/financial/accounts-payable/${id}`, { method: 'DELETE' });
      if (res.ok) fetchFinancialData(true);
    } catch (err) {
      console.error('Erro ao excluir conta a pagar:', err);
    }
  };

  // Exportar para MySQL
  const handleExportMySql = async () => {
    setIsExportingSql(true);
    try {
      const res = await fetch('/api/database/mysql-export');
      if (res.ok) {
        const text = await res.text();
        setMySqlExportContent(text);
        setIsMySqlModalOpen(true);
      }
    } catch (err) {
      console.error('Erro ao exportar MySQL:', err);
    } finally {
      setIsExportingSql(false);
    }
  };

  // Delete card purchase
  const handleDeleteExpense = async (id: number, desc: string) => {
    if (!window.confirm(`Deseja remover o lançamento "${desc}" e todas as suas parcelas do Contas a Pagar?`)) return;
    try {
      const res = await fetch(`/api/financial/credit-card-expenses/${id}`, { method: 'DELETE' });
      if (res.ok) fetchFinancialData(true);
    } catch (err) {
      console.error('Erro ao excluir lançamento:', err);
    }
  };

  // Toggle Payable Status (Pendente / Pago)
  const handleTogglePayableStatus = async (item: AccountsPayableItem) => {
    const nextStatus = item.status === 'Pago' ? 'Pendente' : 'Pago';
    try {
      const res = await fetch(`/api/financial/accounts-payable/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          paid_amount: nextStatus === 'Pago' ? item.amount : 0
        })
      });
      if (res.ok) fetchFinancialData(true);
    } catch (err) {
      console.error('Erro ao atualizar status da conta a pagar:', err);
    }
  };

  // Toggle Receivable Status (Pendente / Recebido)
  const handleToggleReceivableStatus = async (item: AccountsReceivableItem) => {
    const nextStatus = item.status === 'Recebido' ? 'Pendente' : 'Recebido';
    try {
      const res = await fetch(`/api/financial/accounts-receivable/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          received_amount: nextStatus === 'Recebido' ? item.amount : 0
        })
      });
      if (res.ok) fetchFinancialData(true);
    } catch (err) {
      console.error('Erro ao atualizar status da conta a receber:', err);
    }
  };

  const handleDeleteReceivable = async (id: string, desc: string) => {
    if (!window.confirm(`Deseja realmente remover a receita "${desc}" do banco de dados?`)) return;
    try {
      const res = await fetch(`/api/financial/accounts-receivable/${id}`, { method: 'DELETE' });
      if (res.ok) fetchFinancialData(true);
    } catch (err) {
      console.error('Erro ao excluir conta a receber:', err);
    }
  };

  const filteredPayables = payables.filter(item => {
    const term = payableSearch.toLowerCase().trim();
    const matchesSearch = !term || 
      item.description.toLowerCase().includes(term) ||
      (item.supplier && item.supplier.toLowerCase().includes(term)) ||
      (item.category && item.category.toLowerCase().includes(term));
    const matchesStatus = payableStatusFilter === 'all' || item.status === payableStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || isNaN(val) || val === 0) return 'R$ -';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getCardBadge = (cardId: string) => {
    const card = cardsList.find(c => c.id === cardId);
    if (!card) return null;
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-purple-300 border border-slate-700/80 shadow-xs">
        <span className={`w-2 h-2 rounded-full bg-gradient-to-tr ${card.color_gradient || 'from-purple-500 to-blue-500'}`} />
        <span>{card.card_name}</span>
        <span className="font-mono text-slate-400">• {card.last_digits}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card: Credit Card Selector & Competence Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          {/* Card Branding */}
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${selectedCardId === 'all' ? 'from-purple-600 via-indigo-600 to-blue-600' : (cardInfo?.color_gradient || 'from-purple-600 to-blue-600')} flex items-center justify-center shadow-lg shadow-purple-600/25 border border-purple-400/30 flex-shrink-0`}>
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Controlador de Cartão de Crédito PJ & Finanças
                </h1>
                {selectedCardId === 'all' ? (
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-full flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Visão Consolidada ({cardsList.length} Cartões)</span>
                  </span>
                ) : cardInfo ? (
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-full flex items-center gap-1">
                    <span>{cardInfo.card_name}</span>
                    <span className="font-mono text-purple-400">• Final {cardInfo.last_digits}</span>
                  </span>
                ) : null}
                {activeCompany && activeCompany !== 'all' && (
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-full flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-400" />
                    <span>{activeCompany}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Controle multi-cartão individual, despesas parceladas, sincronização com Contas a Pagar e exportação MySQL
              </p>
            </div>
          </div>

          {/* Action Buttons: MySQL Export, Print & Competence Selector */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Botão de Impressão do Financeiro PJ */}
            <button
              onClick={() => printFinancialReport({
                competenceMonth,
                competenceYear,
                monthName: monthNames[competenceMonth - 1] || 'Outubro',
                activeCompany: activeCompany || 'Todas as Empresas',
                summary,
                cardsList,
                expenses,
                payables,
                receivables
              })}
              title="Imprimir relatório financeiro consolidado da competência formatado para impressora ou PDF"
              className="px-3 py-2 text-xs font-semibold text-purple-200 hover:text-white bg-purple-950/80 hover:bg-purple-900/80 border border-purple-700/60 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-purple-400" />
              <span>Imprimir Financeiro PJ</span>
            </button>

            {/* MySQL Export Button */}
            <button
              onClick={handleExportMySql}
              disabled={isExportingSql}
              title="Exportar estrutura e dados para MySQL / MariaDB (.sql)"
              className="px-3 py-2 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-700/60 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Database className={`w-3.5 h-3.5 ${isExportingSql ? 'animate-spin' : 'text-emerald-400'}`} />
              <span>Exportar MySQL (.sql)</span>
            </button>

            {/* Competence Selector Bar (Dynamic Month/Year Filter) */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-inner">
              <button
                onClick={handlePrevMonth}
                title="Mês anterior"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">
                    Mês de Competência
                  </span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {monthNames[competenceMonth - 1]} / {competenceYear}
                  </span>
                </div>
              </div>

              <button
                onClick={handleNextMonth}
                title="Próximo mês"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleCurrentMonth}
                title="Voltar para Outubro de 2026"
                className="ml-1 px-2.5 py-1 text-[11px] font-semibold text-purple-300 hover:text-white bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-all cursor-pointer"
              >
                Hoje
              </button>
            </div>
          </div>
        </div>

        {/* IMAGEM 03: Cartões de Crédito Diversos - Seletor e Gestão Individual */}
        <div className="pt-4 border-b border-slate-800/60 pb-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Cartões Corporativos Cadastrados ({cardsList.length})
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                • Clique em um cartão para visualizar e gerenciar despesas individuais
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                title="Cadastrar ou gerenciar categorias financeiras (MySQL)"
                className="px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>Categorias ({categoriesList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setIsInstitutionModalOpen(true)}
                title="Cadastrar ou gerenciar instituições financeiras e bancos (MySQL)"
                className="px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Instituições / Bancos ({institutionsList.length})</span>
              </button>
              <button
                onClick={() => setIsCardModalOpen(true)}
                className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white text-xs font-semibold rounded-lg border border-purple-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Cartão</span>
              </button>
            </div>
          </div>

          {/* Cards Grid / Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Botão de Visão Consolidada de Todos os Cartões */}
            <div
              onClick={() => {
                setSelectedCardId('all');
                setCardInfo(cardsList[0] || null);
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedCardId === 'all'
                  ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Todos os Cartões
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                  Consolidado
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Visualizar fatura e compras de todos os {cardsList.length} cartões juntos
              </div>
            </div>

            {/* Cartões Individuais Cadastrados */}
            {cardsList.map((card) => {
              const isSelected = selectedCardId === card.id;
              const limit = Number(card.credit_limit) || 10000;
              const used = Number(card.used_limit) || 0;
              const available = Math.max(0, limit - used);
              const percentUsed = Math.min(100, Math.round((used / limit) * 100));

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    setSelectedCardId(card.id);
                    setCardInfo(card);
                    setNewExpenseForm(prev => ({ ...prev, card_id: card.id }));
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-purple-500 ring-2 ring-purple-500/20 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${card.color_gradient || 'from-purple-500 to-indigo-500'} flex-shrink-0`} />
                      <span className="text-xs font-bold text-white truncate" title={card.card_name}>
                        {card.card_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-1 rounded">
                        •• {card.last_digits}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardInfo(card);
                          setCardFormData({
                            card_name: card.card_name,
                            bank_brand: card.bank_brand || 'Nubank',
                            last_digits: card.last_digits || '',
                            holder_name: card.holder_name || '',
                            closing_day: card.closing_day || 25,
                            due_day: card.due_day || 5,
                            credit_limit: String(card.credit_limit || 20000),
                            company_name: card.company_name || 'Hospital São Lucas',
                            color_gradient: card.color_gradient || 'from-purple-600 to-blue-600'
                          });
                          setIsEditCardModalOpen(true);
                        }}
                        title="Editar Cartão"
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      {cardsList.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(card.id, card.card_name);
                          }}
                          title="Excluir Cartão"
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Limite: {formatCurrency(limit)}</span>
                    <span className="text-purple-300 font-mono">Disp: {formatCurrency(available)}</span>
                  </div>

                  {/* Barra de Limite */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentUsed > 80 ? 'bg-rose-500' : percentUsed > 50 ? 'bg-amber-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>

                  <div className="mt-2 text-[9px] text-slate-400 flex items-center justify-between border-t border-slate-800/40 pt-1">
                    <span>Fecha dia {card.closing_day}</span>
                    <span>Vence dia {card.due_day}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center justify-between gap-2 pt-4 overflow-x-auto flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('card')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'card'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Fatura & Gastos do Cartão</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/30 text-white">
                {expenses.filter(e => e.is_active_in_competence).length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('payables')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'payables'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Contas a Pagar</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/30 text-white">
                {payables.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('receivables')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'receivables'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Contas a Receber</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/30 text-white">
                {receivables.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('forecast')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'forecast'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Projeção Multi-Mês (Cronograma)</span>
            </button>
          </div>

          {/* Botão de Atalho Rápido para Visualizar Contas a Pagar pelo Celular (IMAGEM 01 E 02) */}
          <button
            onClick={() => {
              setActiveSubTab('payables');
              setIsMobileSimulatorOpen(true);
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm shadow-purple-600/25 flex items-center gap-1.5 transition-all cursor-pointer ring-1 ring-purple-400/30 whitespace-nowrap ml-auto"
            title="Visualizar Contas a Pagar pelo Celular: Telas Médias (6,1'-6,5') e Grandes (6,7'-6,8')"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Visualizar pelo Celular</span>
          </button>
        </div>
      </div>


      {/* KPI Cards: TOTAL GERAL - SALDO DEVEDOR and VT PRESTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL GERAL - SALDO DEVEDOR */}
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-xl pointer-events-none group-hover:bg-purple-600/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300">
              Total Geral - Saldo Devedor
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(summary?.totalSaldoDevedor)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Somatória de contratos vigentes em</span>
            <span className="text-purple-300 font-semibold">{monthNames[competenceMonth - 1]}</span>
          </p>
        </div>

        {/* VT PRESTA (Valor Total das Prestações da Fatura) */}
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-xl pointer-events-none group-hover:bg-blue-600/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300">
              VT Presta (Fatura do Mês)
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight text-blue-400">
            {formatCurrency(summary?.vtPresta)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            {selectedCardId === 'all' ? (
              <span>Parcelas somadas de todos os cartões corporativos</span>
            ) : (
              <span>
                Fatura do cartão <strong className="text-blue-300">{cardInfo?.card_name || 'Selecionado'}</strong> com vencimento dia <strong className="text-white font-mono">{String(cardInfo?.due_day || 5).padStart(2, '0')}</strong>
              </span>
            )}
          </p>
        </div>

        {/* Total Contas a Pagar do Mês */}
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-600/10 rounded-full blur-xl pointer-events-none group-hover:bg-rose-600/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300">
              Total Contas a Pagar
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight">
            {formatCurrency(summary?.totalAccountsPayable)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Cartão de crédito + Fornecedores e despesas operacionais
          </p>
        </div>

        {/* Saldo Líquido Previsto */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-600/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
              Resultado Previsto (Receitas - Despesas)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
            (summary?.netCashFlowForecast || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {formatCurrency(summary?.netCashFlowForecast)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Receitas: {formatCurrency(summary?.totalAccountsReceivable)}
          </p>
        </div>
      </div>

      {/* SUB-TAB 1: CONTROLADOR DE CARTÃO DE CRÉDITO PJ */}
      {activeSubTab === 'card' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Action Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                {selectedCardId === 'all'
                  ? `Planilha Geral Consolidada • Todos os ${cardsList.length} Cartões PJ`
                  : `Fatura & Despesas • ${cardInfo?.card_name || 'Cartão PJ'}`}
                <span className="text-xs font-mono px-2 py-0.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded">
                  {expenses.filter(e => e.is_active_in_competence).length} Compras Ativas
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedCardId === 'all'
                  ? 'Exibindo compras individuais vinculadas a cada cartão corporativo'
                  : `Exibindo somente compras e parcelas deste cartão (Vencimento dia ${cardInfo?.due_day || 5})`}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fetchFinancialData(false)}
                disabled={isRefreshing}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
                <span>Atualizar</span>
              </button>

              <button
                onClick={() => {
                  if (selectedCardId && selectedCardId !== 'all') {
                    setNewExpenseForm(prev => ({ ...prev, card_id: selectedCardId }));
                  }
                  setIsExpenseModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-purple-500/25 flex items-center gap-1.5 transition-all cursor-pointer border border-purple-400/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lançar Gasto no Cartão</span>
              </button>
            </div>
          </div>

          {/* Spreadsheet Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">ID</th>
                  <th className="py-3 px-3 text-center">Cartão</th>
                  <th className="py-3 px-4">Descrição / Fornecedor</th>
                  <th className="py-3 px-3 text-right">V. Total (R$)</th>
                  <th className="py-3 px-3 text-center">Qtd Parc</th>
                  <th className="py-3 px-3 text-center">Parc. no Mês</th>
                  <th className="py-3 px-3 text-right">Valor Parc (R$)</th>
                  <th className="py-3 px-3 text-right">Saldo Devedor</th>
                  <th className="py-3 px-3 text-center">Status no Mês</th>
                  <th className="py-3 px-3 text-center w-14">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      Nenhum lançamento no cartão registrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  expenses.map((item) => {
                    const isActive = item.is_active_in_competence;
                    const card = cardsList.find(c => c.id === item.card_id);
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isActive
                            ? 'hover:bg-slate-800/40 bg-slate-900/30'
                            : 'opacity-40 hover:opacity-75 bg-slate-950/40'
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-mono text-purple-400 font-semibold">
                          #{item.id}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-200 border border-slate-700/80 whitespace-nowrap">
                            <span className={`w-2 h-2 rounded-full bg-gradient-to-tr ${card?.color_gradient || 'from-purple-500 to-blue-500'}`} />
                            <span className="truncate max-w-[85px]">{card ? (card.bank_brand || card.card_name) : 'Cartão PJ'}</span>
                            <span className="text-purple-300 font-mono">••{card?.last_digits || '0000'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white tracking-tight flex items-center gap-1.5">
                            <span>{item.description}</span>
                            {item.company_name && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                • {item.company_name}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{item.supplier || item.description}</span>
                            <span>•</span>
                            <span className="text-purple-300/80">{item.category}</span>
                            <span>•</span>
                            <span>Início: {monthNames[item.first_due_month - 1]}/{item.first_due_year}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                          {formatCurrency(item.total_amount)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded text-[11px]">
                            {item.installments_count}x
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {isActive ? (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-semibold text-[11px]">
                              {item.current_installment_index} / {item.installments_count}
                            </span>
                          ) : item.remaining_installments === 0 ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px]">
                              Quitado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]">
                              Futuro
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-blue-400">
                          {isActive ? formatCurrency(item.installment_value) : 'R$ -'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-purple-300">
                          {isActive ? formatCurrency(item.remaining_debt) : 'R$ -'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isActive ? (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                              Na Fatura
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] text-slate-500 bg-slate-900 rounded">
                              Fora da Comp.
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingExpense(item)}
                              title="Editar Lançamento (UPDATE)"
                              className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-md transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(item.id, item.description)}
                              title="Remover despesa e suas parcelas (DELETE)"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* Spreadsheet Consolidated Footer */}
              <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-700 text-white">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    Totais da Competência ({monthNames[competenceMonth - 1]}/{competenceYear}):
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-purple-300">
                    {formatCurrency(summary?.totalSaldoDevedor)}
                  </td>
                  <td colSpan={2} className="text-center text-[11px] text-slate-400 font-normal">
                    {summary?.activeExpensesCount} Contratos Ativos
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-blue-400 font-black">
                    {formatCurrency(summary?.vtPresta)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs text-purple-300">
                    {formatCurrency(summary?.totalRemainingDebt)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CONTAS A PAGAR DO CRM */}
      {activeSubTab === 'payables' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  Contas a Pagar do CRM • Vencimentos em {monthNames[competenceMonth - 1]}/{competenceYear}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded">
                  {payables.length} Obrigações
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold border border-slate-700">
                  CRUD Completo (SQL INSERT, SELECT, UPDATE, DELETE)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Consolidação de faturas de cartão de crédito projetadas e compromissos operacionais do mês
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search input (READ / SELECT) */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar despesa / fornecedor..."
                  value={payableSearch}
                  onChange={(e) => setPayableSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 w-44 sm:w-52"
                />
              </div>

              {/* Status filter (READ / SELECT) */}
              <select
                value={payableStatusFilter}
                onChange={(e) => setPayableStatusFilter(e.target.value)}
                className="py-1.5 px-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">Status: Todos</option>
                <option value="Pendente">Pendentes</option>
                <option value="Pago">Pagos</option>
              </select>

              {/* Visualizar pelo Celular Button (IMAGEM 01 E 02: TELAS MÉDIAS E GRANDES) */}
              <button
                onClick={() => setIsMobileSimulatorOpen(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer ring-1 ring-purple-400/30"
                title="Visualizar Contas a Pagar pelo Celular: Médias (6,1'-6,5') e Grandes (6,7'-6,8')"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Visualizar pelo Celular</span>
              </button>

              {/* INSERT Button */}
              <button
                onClick={() => setIsPayableModalOpen(true)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-rose-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Conta a Pagar</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center">Código</th>
                  <th className="py-3 px-4">Descrição da Despesa</th>
                  <th className="py-3 px-3">Fornecedor</th>
                  <th className="py-3 px-3">Categoria</th>
                  <th className="py-3 px-3 text-center">Vencimento</th>
                  <th className="py-3 px-3 text-right">Valor (R$)</th>
                  <th className="py-3 px-3 text-center">Parcela</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center w-36">Ações (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredPayables.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      Nenhuma conta a pagar encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredPayables.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        #{item.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center gap-1.5">
                          {item.credit_card_expense_id && (
                            <CreditCard className="w-3 h-3 text-purple-400 flex-shrink-0" />
                          )}
                          <span>{item.description}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {item.supplier || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {item.due_date}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {item.installment_number}/{item.total_installments}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                          item.status === 'Pago'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleTogglePayableStatus(item)}
                            title={item.status === 'Pago' ? 'Marcar como Pendente' : 'Dar Baixa / Quitar'}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                              item.status === 'Pago'
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                            }`}
                          >
                            {item.status === 'Pago' ? 'Desfazer' : 'Baixa'}
                          </button>
                          <button
                            onClick={() => setViewingPayable(item)}
                            title="Visualizar Detalhes (SELECT)"
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPayable(item)}
                            title="Editar Conta a Pagar (UPDATE)"
                            className="p-1 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePayable(item.id, item.description)}
                            title="Excluir Conta a Pagar (DELETE)"
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-950 font-bold border-t border-slate-800 text-white">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    Total a Pagar no Mês:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-rose-400">
                    {formatCurrency(summary?.totalAccountsPayable)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CONTAS A RECEBER DO CRM */}
      {activeSubTab === 'receivables' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Contas a Receber do CRM • Previsões em {monthNames[competenceMonth - 1]}/{competenceYear}
                <span className="text-xs font-mono px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded">
                  {receivables.length} Faturamentos
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Receitas recorrentes de contratos MSP, serviços pontuais e consultorias
              </p>
            </div>

            <button
              onClick={() => setIsReceivableModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Conta a Receber</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center">Código</th>
                  <th className="py-3 px-4">Descrição do Faturamento</th>
                  <th className="py-3 px-3">Cliente / Contratante</th>
                  <th className="py-3 px-3 text-center">Vencimento</th>
                  <th className="py-3 px-3 text-right">Valor Previsto (R$)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {receivables.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Nenhuma receita cadastrada para este mês.
                    </td>
                  </tr>
                ) : (
                  receivables.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        #{item.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {item.client_name}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {item.due_date}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                          item.status === 'Recebido'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleToggleReceivableStatus(item)}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                              item.status === 'Recebido'
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                            }`}
                          >
                            {item.status === 'Recebido' ? 'Desfazer' : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => handleDeleteReceivable(item.id, item.description)}
                            title="Excluir Conta a Receber (DELETE)"
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-950 font-bold border-t border-slate-800 text-white">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    Total a Receber no Mês:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-emerald-400">
                    {formatCurrency(summary?.totalAccountsReceivable)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CRONOGRAMA MULTI-MÊS (12 MESES) */}
      {activeSubTab === 'forecast' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              Projeção Futura do Cartão de Crédito (Evolução das Parcelas)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Visualize como os parcelamentos de 5x, 9x e 11x reduzem mensalmente a fatura até zerar o saldo devedor
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((offset) => {
              let m = competenceMonth + offset;
              let y = competenceYear;
              while (m > 12) {
                m -= 12;
                y += 1;
              }

              // Compute projection for month m, year y
              const activeItems = expenses.map(exp => {
                const elapsed = (y - exp.first_due_year) * 12 + (m - exp.first_due_month);
                const isActive = elapsed >= 0 && elapsed < exp.installments_count;
                return isActive ? exp.installment_value : 0;
              });
              const monthFatura = activeItems.reduce((acc, v) => acc + v, 0);

              const isCurrent = offset === 0;

              return (
                <div
                  key={offset}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-purple-600/15 border-purple-500 shadow-sm shadow-purple-500/20'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                    {monthNames[m - 1].slice(0, 3)} / {y}
                  </span>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {formatCurrency(monthFatura)}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {activeItems.filter(v => v > 0).length} parcelas ativas
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: LANÇAR GASTO NO CARTÃO PJ (SELEÇÃO DE CARTÃO E CATEGORIA) */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span>
                    {(() => {
                      const curCard = cardsList.find(c => c.id === (newExpenseForm.card_id || (selectedCardId !== 'all' ? selectedCardId : cardsList[0]?.id)));
                      return curCard ? `Lançar Gasto no Cartão • ${curCard.card_name}` : 'Lançar Gasto no Cartão Corporativo';
                    })()}
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Lançamento individual vinculado ao cartão correspondente
                </span>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4 text-xs">
              {/* Seletor de Cartão de Crédito Corporativo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-medium">Cartão de Crédito Corporativo *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpenseModalOpen(false);
                      setIsCardModalOpen(true);
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold cursor-pointer hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    Novo Cartão
                  </button>
                </div>
                <select
                  value={newExpenseForm.card_id || (selectedCardId !== 'all' ? selectedCardId : cardsList[0]?.id)}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, card_id: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-950 border border-purple-500/50 rounded-lg text-white font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                >
                  {cardsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      💳 {c.card_name} (•• {c.last_digits}) — {c.bank_brand || 'Banco'} | Disp: {formatCurrency(c.available_limit !== undefined ? c.available_limit : (c.credit_limit - (c.used_limit ?? 0)))}
                    </option>
                  ))}
                </select>
                {(() => {
                  const targetCard = cardsList.find(c => c.id === (newExpenseForm.card_id || (selectedCardId !== 'all' ? selectedCardId : cardsList[0]?.id)));
                  if (!targetCard) return null;
                  return (
                    <div className="mt-1.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${targetCard.color_gradient || 'from-purple-500 to-blue-500'}`} />
                        <span className="text-white font-medium">{targetCard.card_name}</span>
                        <span>•</span>
                        <span className="font-mono text-purple-300">•• {targetCard.last_digits}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Fecha dia <strong className="text-slate-200">{targetCard.closing_day}</strong></span>
                        <span>•</span>
                        <span>Vence dia <strong className="text-purple-300 font-semibold">{targetCard.due_day}</strong></span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Descrição / Identificador da Compra *
                </label>
                <input
                  type="text"
                  required
                  value={newExpenseForm.description}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, description: e.target.value })}
                  placeholder="Ex: HOSTGATOR, CASA CHINA, CURSO..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Fornecedor / Estabelecimento</label>
                  <input
                    type="text"
                    value={newExpenseForm.supplier}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, supplier: e.target.value })}
                    placeholder="Ex: Hostgator Brasil"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-medium">Categoria</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold cursor-pointer hover:underline"
                    >
                      <Plus className="w-3 h-3" />
                      Nova Categoria
                    </button>
                  </div>
                  <select
                    value={newExpenseForm.category}
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW__') {
                        setIsCategoryModalOpen(true);
                      } else {
                        setNewExpenseForm({ ...newExpenseForm, category: e.target.value });
                      }
                    }}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    {categoriesList.length === 0 && (
                      <>
                        <option value="Infraestrutura & Serviços">Infraestrutura & Serviços</option>
                        <option value="Materiais & Suprimentos">Materiais & Suprimentos</option>
                        <option value="Transporte & Frotas">Transporte & Frotas</option>
                        <option value="Treinamento & Capacitação">Treinamento & Capacitação</option>
                        <option value="Empréstimos & Financiamentos">Empréstimos & Financiamentos</option>
                        <option value="Manutenção & Reparos">Manutenção & Reparos</option>
                        <option value="Geral">Geral</option>
                      </>
                    )}
                    <option value="__ADD_NEW__" className="text-purple-400 font-semibold bg-purple-950">
                      + Cadastrar Nova Categoria...
                    </option>
                  </select>
                </div>
              </div>

              {/* Total and Installments Calculation */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Valor Total (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={newExpenseForm.total_amount}
                    onChange={(e) => handleExpenseTotalChange(e.target.value)}
                    placeholder="194.49"
                    className="w-full py-2 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Qtd Parcelas *</label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    required
                    value={newExpenseForm.installments_count}
                    onChange={(e) => handleExpenseCountChange(parseInt(e.target.value, 10) || 1)}
                    className="w-full py-2 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-purple-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Valor da Parcela (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newExpenseForm.installment_value}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, installment_value: e.target.value })}
                    placeholder="64.83"
                    className="w-full py-2 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-blue-400 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data da Compra</label>
                  <input
                    type="date"
                    value={newExpenseForm.purchase_date}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, purchase_date: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mês 1ª Parcela (Competência)</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={newExpenseForm.first_due_month}
                      onChange={(e) => setNewExpenseForm({ ...newExpenseForm, first_due_month: parseInt(e.target.value, 10) })}
                      className="py-2 px-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                    >
                      {monthNames.map((m, idx) => (
                        <option key={idx} value={idx + 1}>{m.slice(0, 3)}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={newExpenseForm.first_due_year}
                      onChange={(e) => setNewExpenseForm({ ...newExpenseForm, first_due_year: parseInt(e.target.value, 10) })}
                      className="py-2 px-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Company Selection */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Empresa Vinculada *</label>
                <select
                  disabled={!isSuperAdmin && !!userCompany}
                  value={newExpenseForm.company_name}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, company_name: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-2 text-purple-300 text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>
                  O CRM gerará automaticamente <strong>{newExpenseForm.installments_count} lançamentos</strong> mensais no módulo de Contas a Pagar com vencimento todo dia 05.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-md shadow-purple-600/25 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Gravar Compra no Cartão</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: CADASTRAR NOVA CONTA A PAGAR (IMAGEM 01 & 02: INSERT COM PARCELAMENTO AUTOMÁTICO) */}
      {isPayableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  Cadastrar Conta a Pagar • SQL INSERT
                </h3>
                <span className="text-[11px] text-slate-400">
                  Cálculo automático de parcelamento bidirecional (Total / Parcela)
                </span>
              </div>
              <button
                onClick={() => setIsPayableModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePayable} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Descrição da Despesa / Obrigação *</label>
                <input
                  type="text"
                  required
                  value={newPayableForm.description}
                  onChange={(e) => setNewPayableForm({ ...newPayableForm, description: e.target.value })}
                  placeholder="Ex: Licenciamento Microsoft 365, Link Dedicado Vivo, Manutenção Ar"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Fornecedor / Favorecido</label>
                  <input
                    type="text"
                    value={newPayableForm.supplier}
                    onChange={(e) => setNewPayableForm({ ...newPayableForm, supplier: e.target.value })}
                    placeholder="Ex: Microsoft do Brasil, Vivo S.A."
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-medium">Categoria de Custo</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold cursor-pointer hover:underline"
                    >
                      <Plus className="w-3 h-3" />
                      Nova Categoria
                    </button>
                  </div>
                  <select
                    value={newPayableForm.category}
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW__') {
                        setIsCategoryModalOpen(true);
                      } else {
                        setNewPayableForm({ ...newPayableForm, category: e.target.value });
                      }
                    }}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="__ADD_NEW__" className="text-purple-400 font-semibold bg-purple-950">
                      + Cadastrar Nova Categoria...
                    </option>
                  </select>
                </div>
              </div>

              {/* IMAGEM 01: Box de Parcelamento e Cálculo Automático */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-rose-400">
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Inteligência de Parcelamento Automático (IMAGEM 01)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Recálculo bidirecional instantâneo
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Valor Total (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={newPayableForm.total_amount}
                      onChange={(e) => handlePayableTotalChange(e.target.value)}
                      placeholder="1200.00"
                      className="w-full py-2 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Qtd Parcelas *</label>
                    <input
                      type="number"
                      min="1"
                      max="48"
                      required
                      value={newPayableForm.installments_count}
                      onChange={(e) => handlePayableCountChange(parseInt(e.target.value, 10) || 1)}
                      className="w-full py-2 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Valor da Parcela (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newPayableForm.installment_value}
                      onChange={(e) => handlePayableInstallmentChange(e.target.value)}
                      placeholder="100.00"
                      className="w-full py-2 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-rose-400 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    Serão gerados <strong>{newPayableForm.installments_count} lançamentos</strong> automáticos de <strong>{formatCurrency(parseFloat(newPayableForm.installment_value) || 0)}</strong> no Contas a Pagar a cada mês subsequente!
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">1º Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={newPayableForm.due_date}
                    onChange={(e) => setNewPayableForm({ ...newPayableForm, due_date: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Empresa Vinculada</label>
                  <select
                    disabled={!isSuperAdmin && !!userCompany}
                    value={newPayableForm.company_name}
                    onChange={(e) => setNewPayableForm({ ...newPayableForm, company_name: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Observações / Centro de Custo</label>
                <input
                  type="text"
                  value={newPayableForm.notes}
                  onChange={(e) => setNewPayableForm({ ...newPayableForm, notes: e.target.value })}
                  placeholder="Número de contrato, NF-e, departamento..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayableModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg cursor-pointer hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow-md shadow-rose-600/25 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Gravar no Banco de Dados (INSERT)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR CONTA A PAGAR (IMAGEM 02: SQL UPDATE) */}
      {editingPayable && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-purple-400" />
                  Editar Conta a Pagar • SQL UPDATE
                </h3>
                <span className="text-[11px] text-slate-400">
                  Lançamento #{editingPayable.code} (ID: {editingPayable.id})
                </span>
              </div>
              <button
                onClick={() => setEditingPayable(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePayable} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={editingPayable.description}
                  onChange={(e) => setEditingPayable({ ...editingPayable, description: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Fornecedor</label>
                  <input
                    type="text"
                    value={editingPayable.supplier || ''}
                    onChange={(e) => setEditingPayable({ ...editingPayable, supplier: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Categoria</label>
                  <input
                    type="text"
                    value={editingPayable.category || ''}
                    onChange={(e) => setEditingPayable({ ...editingPayable, category: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingPayable.amount}
                    onChange={(e) => setEditingPayable({ ...editingPayable, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-rose-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Vencimento</label>
                  <input
                    type="date"
                    required
                    value={editingPayable.due_date}
                    onChange={(e) => setEditingPayable({ ...editingPayable, due_date: e.target.value })}
                    className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status</label>
                  <select
                    value={editingPayable.status}
                    onChange={(e) => setEditingPayable({ ...editingPayable, status: e.target.value as 'Pendente' | 'Pago' })}
                    className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Observações / Notas</label>
                <input
                  type="text"
                  value={editingPayable.notes || ''}
                  onChange={(e) => setEditingPayable({ ...editingPayable, notes: e.target.value })}
                  placeholder="Informações adicionais..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPayable(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações (UPDATE)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VISUALIZAR DETALHES (IMAGEM 02: SQL SELECT / READ) */}
      {viewingPayable && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-sm">
                  Consulta de Registro • SQL SELECT
                </h3>
              </div>
              <button
                onClick={() => setViewingPayable(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Identificador Único</span>
                  <span className="font-mono text-purple-400 font-bold">#{viewingPayable.code} • {viewingPayable.id}</span>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                  viewingPayable.status === 'Pago'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>
                  {viewingPayable.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Descrição</span>
                  <span className="font-bold text-white">{viewingPayable.description}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Fornecedor / Origem</span>
                  <span className="text-slate-200">{viewingPayable.supplier || 'Não especificado'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Valor Nominal</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {formatCurrency(viewingPayable.amount)}
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Vencimento</span>
                  <span className="font-mono text-white">{viewingPayable.due_date}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Cronograma</span>
                  <span className="font-mono text-blue-400 font-bold">
                    {viewingPayable.installment_number} de {viewingPayable.total_installments}
                  </span>
                </div>
              </div>

              {viewingPayable.credit_card_expense_id && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>
                    Origem: Fatura vinculada ao <strong>Controlador de Cartão PJ</strong> (Lançamento #{viewingPayable.credit_card_expense_id})
                  </span>
                </div>
              )}

              {viewingPayable.notes && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Observações</span>
                  <span className="text-slate-300">{viewingPayable.notes}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewingPayable(null)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 cursor-pointer"
                >
                  Fechar Consulta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDITAR LANÇAMENTO DO CARTÃO (UPDATE) */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-purple-400" />
                  Editar Lançamento do Cartão • SQL UPDATE
                </h3>
                <span className="text-[11px] text-slate-400">ID #{editingExpense.id}</span>
              </div>
              <button
                onClick={() => setEditingExpense(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Fornecedor</label>
                  <input
                    type="text"
                    value={editingExpense.supplier || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, supplier: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-medium">Categoria</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold cursor-pointer hover:underline"
                    >
                      <Plus className="w-3 h-3" />
                      Nova Categoria
                    </button>
                  </div>
                  <select
                    value={editingExpense.category || 'Geral'}
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW__') {
                        setIsCategoryModalOpen(true);
                      } else {
                        setEditingExpense({ ...editingExpense, category: e.target.value });
                      }
                    }}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white cursor-pointer"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="__ADD_NEW__" className="text-purple-400 font-semibold bg-purple-950">
                      + Cadastrar Nova Categoria...
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingExpense.total_amount}
                    onChange={(e) => {
                      const total = parseFloat(e.target.value) || 0;
                      const count = editingExpense.installments_count || 1;
                      setEditingExpense({
                        ...editingExpense,
                        total_amount: total,
                        installment_value: Number((total / count).toFixed(2))
                      });
                    }}
                    className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Qtd Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    required
                    value={editingExpense.installments_count}
                    onChange={(e) => {
                      const count = Math.max(1, parseInt(e.target.value, 10) || 1);
                      const total = editingExpense.total_amount || 0;
                      setEditingExpense({
                        ...editingExpense,
                        installments_count: count,
                        installment_value: Number((total / count).toFixed(2))
                      });
                    }}
                    className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Valor Parcela</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingExpense.installment_value}
                    onChange={(e) => setEditingExpense({ ...editingExpense, installment_value: parseFloat(e.target.value) || 0 })}
                    className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-blue-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Cartão Vinculado</label>
                <select
                  value={editingExpense.card_id}
                  onChange={(e) => setEditingExpense({ ...editingExpense, card_id: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  {cardsList.map(card => (
                    <option key={card.id} value={card.id}>{card.card_name} (•• {card.last_digits})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CADASTRAR NOVO CARTÃO DE CRÉDITO (IMAGEM 03: CREATE / INSERT) */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  Cadastrar Cartão de Crédito Diversos (IMAGEM 03)
                </h3>
                <span className="text-[11px] text-slate-400">
                  SQL INSERT INTO financial_credit_cards
                </span>
              </div>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nome de Identificação *</label>
                  <input
                    type="text"
                    required
                    value={cardFormData.card_name}
                    onChange={(e) => setCardFormData({ ...cardFormData, card_name: e.target.value })}
                    placeholder="Ex: Itaú Corporate PJ, Inter Black"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-medium">Instituição / Banco *</label>
                    <button
                      type="button"
                      onClick={() => setIsInstitutionModalOpen(true)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Cadastrar nova instituição financeira no MySQL"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nova Instituição</span>
                    </button>
                  </div>
                  <select
                    value={cardFormData.bank_brand}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (selectedVal === '__ADD_NEW__') {
                        setIsInstitutionModalOpen(true);
                        return;
                      }
                      const matched = institutionsList.find(i => i.name === selectedVal);
                      setCardFormData({
                        ...cardFormData,
                        bank_brand: selectedVal,
                        color_gradient: matched?.color_gradient || cardFormData.color_gradient
                      });
                    }}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    {institutionsList.map(inst => (
                      <option key={inst.id} value={inst.name}>
                        {inst.name} {inst.code ? `(Cód ${inst.code})` : ''} {inst.is_custom ? '★ (Custom)' : ''}
                      </option>
                    ))}
                    {institutionsList.length === 0 && (
                      <>
                        <option value="Nubank PJ">Nubank PJ</option>
                        <option value="Banco Inter Empresas">Banco Inter Empresas</option>
                        <option value="Bradesco Prime / PJ">Bradesco Prime / PJ</option>
                        <option value="Itaú Personnalité / PJ">Itaú Personnalité / PJ</option>
                      </>
                    )}
                    <option value="__ADD_NEW__" className="text-purple-400 font-semibold bg-purple-950">
                      + Cadastrar Nova Opção de Instituição...
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Últimos 4 Dígitos *</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={cardFormData.last_digits}
                    onChange={(e) => setCardFormData({ ...cardFormData, last_digits: e.target.value.replace(/\D/g, '') })}
                    placeholder="9942"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-center tracking-widest font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Titular Impresso</label>
                  <input
                    type="text"
                    value={cardFormData.holder_name}
                    onChange={(e) => setCardFormData({ ...cardFormData, holder_name: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Limite (R$) *</label>
                  <input
                    type="number"
                    step="100"
                    required
                    value={cardFormData.credit_limit}
                    onChange={(e) => setCardFormData({ ...cardFormData, credit_limit: e.target.value })}
                    className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Dia Fechamento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cardFormData.closing_day}
                    onChange={(e) => setCardFormData({ ...cardFormData, closing_day: parseInt(e.target.value, 10) || 25 })}
                    className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Dia Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cardFormData.due_day}
                    onChange={(e) => setCardFormData({ ...cardFormData, due_day: parseInt(e.target.value, 10) || 5 })}
                    className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Empresa Vinculada</label>
                <select
                  disabled={!isSuperAdmin && !!userCompany}
                  value={cardFormData.company_name}
                  onChange={(e) => setCardFormData({ ...cardFormData, company_name: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-md shadow-purple-600/25 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Cadastrar Cartão (INSERT)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: EDITAR CARTÃO DE CRÉDITO (IMAGEM 03: UPDATE) */}
      {isEditCardModalOpen && cardInfo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-purple-400" />
                  Editar Cartão de Crédito • SQL UPDATE
                </h3>
                <span className="text-[11px] text-slate-400">Cartão: {cardInfo.card_name}</span>
              </div>
              <button
                onClick={() => setIsEditCardModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCard} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nome do Cartão</label>
                  <input
                    type="text"
                    required
                    value={cardFormData.card_name}
                    onChange={(e) => setCardFormData({ ...cardFormData, card_name: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Últimos 4 Dígitos</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardFormData.last_digits}
                    onChange={(e) => setCardFormData({ ...cardFormData, last_digits: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-medium">Instituição / Banco</label>
                    <button
                      type="button"
                      onClick={() => setIsInstitutionModalOpen(true)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Cadastrar nova instituição financeira no MySQL"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nova Instituição</span>
                    </button>
                  </div>
                  <select
                    value={cardFormData.bank_brand}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (selectedVal === '__ADD_NEW__') {
                        setIsInstitutionModalOpen(true);
                        return;
                      }
                      const matched = institutionsList.find(i => i.name === selectedVal);
                      setCardFormData({
                        ...cardFormData,
                        bank_brand: selectedVal,
                        color_gradient: matched?.color_gradient || cardFormData.color_gradient
                      });
                    }}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    {institutionsList.map(inst => (
                      <option key={inst.id} value={inst.name}>
                        {inst.name} {inst.code ? `(Cód ${inst.code})` : ''} {inst.is_custom ? '★ (Custom)' : ''}
                      </option>
                    ))}
                    <option value="__ADD_NEW__" className="text-purple-400 font-semibold bg-purple-950">
                      + Cadastrar Nova Opção de Instituição...
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Titular Impresso</label>
                  <input
                    type="text"
                    value={cardFormData.holder_name}
                    onChange={(e) => setCardFormData({ ...cardFormData, holder_name: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Limite Total (R$)</label>
                  <input
                    type="number"
                    step="100"
                    required
                    value={cardFormData.credit_limit}
                    onChange={(e) => setCardFormData({ ...cardFormData, credit_limit: e.target.value })}
                    className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Dia Fechamento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cardFormData.closing_day}
                    onChange={(e) => setCardFormData({ ...cardFormData, closing_day: parseInt(e.target.value, 10) || 25 })}
                    className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Dia Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cardFormData.due_day}
                    onChange={(e) => setCardFormData({ ...cardFormData, due_day: parseInt(e.target.value, 10) || 5 })}
                    className="w-full py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditCardModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações (UPDATE)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR NOVA INSTITUIÇÃO FINANCEIRA / BANCO (SQL INSERT NO MYSQL) */}
      {isInstitutionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header do Modal */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Cadastrar Nova Opção de Instituição Financeira
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    SQL INSERT INTO financial_institutions • MySQL / SQLite
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInstitutionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Formulário de Cadastro */}
              <form onSubmit={handleCreateInstitution} className="space-y-4">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                    1. Dados da Nova Instituição / Banco
                  </span>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Nome da Instituição Financeira / Banco *
                    </label>
                    <input
                      type="text"
                      required
                      value={newInstitutionForm.name}
                      onChange={(e) => setNewInstitutionForm({ ...newInstitutionForm, name: e.target.value })}
                      placeholder="Ex: Banco Safra, XP Empresas, C6 PJ, PagBank, Daycoval, etc."
                      className="w-full py-2.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Código de Compensação (COMPE / ISPB)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={newInstitutionForm.code}
                        onChange={(e) => setNewInstitutionForm({ ...newInstitutionForm, code: e.target.value })}
                        placeholder="Ex: 422, 336, 655 (Opcional)"
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Origem no Banco de Dados
                      </label>
                      <div className="py-2 px-3 bg-slate-900/60 border border-slate-800 rounded-lg text-purple-300 font-mono text-center flex items-center justify-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-purple-400" />
                        <span>is_custom = 1</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seletor Visual de Gradiente de Cores */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                    2. Estilo Visual & Gradiente do Cartão
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { name: 'Roxo / Nubank', grad: 'from-purple-600 via-indigo-600 to-blue-600' },
                      { name: 'Laranja / Itaú & Inter', grad: 'from-orange-500 via-amber-500 to-yellow-500' },
                      { name: 'Vermelho / Bradesco', grad: 'from-red-600 via-rose-600 to-rose-700' },
                      { name: 'Azul / Caixa & BB', grad: 'from-blue-600 via-cyan-600 to-sky-600' },
                      { name: 'Verde / Cooperativa', grad: 'from-emerald-600 via-teal-600 to-green-600' },
                      { name: 'Black / Carbon BTG', grad: 'from-slate-900 via-zinc-800 to-black' },
                      { name: 'Dourado / Ouro VIP', grad: 'from-amber-600 via-yellow-500 to-amber-700' },
                      { name: 'Magenta / FinTech', grad: 'from-fuchsia-600 via-pink-600 to-rose-600' }
                    ].map(style => (
                      <button
                        key={style.grad}
                        type="button"
                        onClick={() => setNewInstitutionForm({ ...newInstitutionForm, color_gradient: style.grad })}
                        className={`p-2 rounded-xl border text-left flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          newInstitutionForm.color_gradient === style.grad
                            ? 'border-purple-400 ring-2 ring-purple-500/30 bg-purple-950/30'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
                        }`}
                      >
                        <div className={`w-full h-5 rounded-md bg-gradient-to-r ${style.grad}`} />
                        <span className="text-[10px] text-slate-300 font-medium text-center truncate w-full">
                          {style.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview do Cartão */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pré-visualização do Cartão com Esta Instituição
                  </span>
                  <div className={`p-4 rounded-2xl bg-gradient-to-tr ${newInstitutionForm.color_gradient} text-white shadow-lg relative overflow-hidden`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-white/90" />
                        <span className="font-bold text-sm tracking-wide">
                          {newInstitutionForm.name || 'Nome da Instituição / Banco'}
                        </span>
                      </div>
                      {newInstitutionForm.code && (
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-black/30 border border-white/20 rounded-md">
                          COMPE {newInstitutionForm.code}
                        </span>
                      )}
                    </div>
                    <div className="my-3 flex items-center justify-between">
                      <div className="w-8 h-6 bg-amber-400/80 rounded-md border border-amber-300/40 shadow-inner" />
                      <span className="text-[10px] text-white/70 font-mono tracking-widest">PJ CORPORATE</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="tracking-widest">•••• •••• •••• 0000</span>
                      <span className="text-[10px] uppercase font-bold text-white/90">CORPORATIVO</span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação do Form */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsInstitutionModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Gravar no Banco de Dados (SQL INSERT)</span>
                  </button>
                </div>
              </form>

              {/* Seção 3: Instituições Financeiras Atualmente Cadastradas */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-slate-200 text-xs">
                      Instituições Financeiras Cadastradas ({institutionsList.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Disponíveis para seleção em qualquer cartão
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {institutionsList.map(inst => (
                    <div
                      key={inst.id}
                      className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${inst.color_gradient || 'from-purple-500 to-indigo-500'} flex-shrink-0`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs">{inst.name}</span>
                            {inst.code && (
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                Cód {inst.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {inst.is_custom ? (
                          <>
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full">
                              Personalizada
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteInstitution(inst.id, inst.name)}
                              title="Excluir instituição financeira do banco de dados (SQL DELETE)"
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-400 rounded-full">
                            Padrão
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR NOVA CATEGORIA FINANCEIRA (SQL INSERT EM financial_categories) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Cadastrar Nova Categoria Financeira
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    SQL INSERT INTO financial_categories (MySQL / MariaDB / SQLite)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                    1. Nome da Categoria
                  </span>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Identificador da Categoria *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCategoryForm.name}
                      onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
                      placeholder="Ex: Consultoria Jurídica, Marketing Digital, Combustível & Viagens..."
                      className="w-full py-2.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Seletor Visual de Cores / Badges */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                    2. Cor de Destaque da Categoria
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { name: 'Roxo', color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/30' },
                      { name: 'Azul', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30' },
                      { name: 'Verde', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
                      { name: 'Laranja', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30' },
                      { name: 'Rosa', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/30' },
                      { name: 'Âmbar', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
                      { name: 'Ciano', color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/30' },
                      { name: 'Índigo', color: 'text-indigo-400', bg: 'bg-indigo-500/20 border-indigo-500/30' }
                    ].map(style => (
                      <button
                        key={style.color}
                        type="button"
                        onClick={() => setNewCategoryForm({ ...newCategoryForm, color: style.color })}
                        className={`p-2 rounded-xl border text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          newCategoryForm.color === style.color
                            ? 'border-purple-400 ring-2 ring-purple-500/30 bg-purple-950/40'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${style.bg}`} />
                        <span className={`text-[11px] font-semibold ${style.color}`}>
                          {style.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pré-visualização da Categoria */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Prévia do badge:</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900 border border-slate-800 ${newCategoryForm.color}`}>
                    <Tag className="w-3 h-3 inline mr-1" />
                    {newCategoryForm.name || 'Nova Categoria'}
                  </span>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-md shadow-purple-600/25 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Gravar Categoria (SQL INSERT)</span>
                  </button>
                </div>
              </form>

              {/* Seção 2: Categorias Existentes */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-slate-200 text-xs">
                      Categorias Cadastradas ({categoriesList.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Disponíveis para despesas e contas
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {categoriesList.map(cat => (
                    <div
                      key={cat.id}
                      className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className={`w-3.5 h-3.5 ${cat.color || 'text-purple-400'}`} />
                        <span className="font-semibold text-white text-xs">{cat.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {cat.is_custom ? (
                          <>
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full">
                              Personalizada
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              title="Excluir categoria do banco de dados (SQL DELETE)"
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-400 rounded-full">
                            Padrão
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: EXPORTAR BACKUP SQL COMPLETO PARA MYSQL / MARIADB */}
      {isMySqlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Exportação Completa para Banco de Dados MySQL / MariaDB
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Compatível com MySQL 8.0+, MariaDB 10.4+, phpMyAdmin, DBeaver e Workbench
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMySqlModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-950">
              <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  O script abaixo contém a estrutura de tabelas relacionais com DDL completo e todos os registros atuais do sistema convertidos em comandos <code>INSERT INTO</code>.
                </span>
              </div>
              <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed select-all">
                {mySqlExportContent}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                {mySqlExportContent.split('\n').length} linhas geradas
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(mySqlExportContent);
                    alert('Código SQL copiado para a área de transferência!');
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  Copiar SQL
                </button>
                <a
                  href="/api/database/mysql-export"
                  download="infra_crm_mysql_backup.sql"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo .sql</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: NOVA CONTA A RECEBER */}
      {isReceivableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Cadastrar Nova Conta a Receber • SQL INSERT
              </h3>
              <button
                onClick={() => setIsReceivableModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await fetch('/api/financial/accounts-receivable', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...newReceivableForm,
                    amount: parseFloat(newReceivableForm.amount),
                    competence_month: competenceMonth,
                    competence_year: competenceYear
                  })
                });
                setIsReceivableModalOpen(false);
                fetchFinancialData(true);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-medium mb-1">Descrição do Faturamento *</label>
                <input
                  type="text"
                  required
                  value={newReceivableForm.description}
                  onChange={(e) => setNewReceivableForm({ ...newReceivableForm, description: e.target.value })}
                  placeholder="Ex: Contrato Mensal TI MSP Outubro"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cliente / Pagador</label>
                  <input
                    type="text"
                    required
                    value={newReceivableForm.client_name}
                    onChange={(e) => setNewReceivableForm({ ...newReceivableForm, client_name: e.target.value })}
                    placeholder="Hospital São Lucas, etc."
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newReceivableForm.amount}
                    onChange={(e) => setNewReceivableForm({ ...newReceivableForm, amount: e.target.value })}
                    placeholder="14500.00"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    required
                    value={newReceivableForm.due_date}
                    onChange={(e) => setNewReceivableForm({ ...newReceivableForm, due_date: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Empresa Vinculada</label>
                  <select
                    disabled={!isSuperAdmin && !!userCompany}
                    value={newReceivableForm.company_name}
                    onChange={(e) => setNewReceivableForm({ ...newReceivableForm, company_name: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReceivableModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md cursor-pointer"
                >
                  Salvar Conta a Receber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SIMULADOR: VISUALIZAR CONTAS A PAGAR PELO CELULAR (TELAS MÉDIAS E GRANDES) */}
      <PayablesMobileSimulatorModal
        isOpen={isMobileSimulatorOpen}
        onClose={() => setIsMobileSimulatorOpen(false)}
        payables={payables}
        summary={summary}
        competenceMonth={competenceMonth}
        competenceYear={competenceYear}
        monthName={monthNames[competenceMonth - 1]}
        onToggleStatus={handleTogglePayableStatus}
        onViewDetails={setViewingPayable}
        onEditPayable={setEditingPayable}
        onDeletePayable={handleDeletePayable}
        onAddNew={() => {
          setIsMobileSimulatorOpen(false);
          setIsPayableModalOpen(true);
        }}
      />
    </div>
  );
};

