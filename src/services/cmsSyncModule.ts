import { useSyncExternalStore } from 'react';
import { WebsiteConfig, HeroSlide, AssistanceSlide, SystemSettings } from '../types.ts';

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide_1',
    tag: '• NOC & SERVIDORES 24/7 • Goiânia & Região',
    title: 'Sustentação de TI & Servidores Corporativos em Goiânia',
    description: 'Monitoramento contínuo, clusters Proxmox em alta disponibilidade e links redundantes MikroTik para o seu negócio.',
    cta: 'Conhecer Soluções',
    bgImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80'
  },
  {
    id: 'slide_2',
    tag: '• CIBERSEGURANÇA & LGPD • Goiânia & Região',
    title: 'Proteção Anti-Ransomware & Backup Imutável em Nuvem',
    description: 'Blindagem de dados empresariais com firewalls perimetrais, auditoria contínua e planos de recuperação imediata.',
    cta: 'Avaliar Vulnerabilidades',
    bgImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1920&q=80'
  },
  {
    id: 'slide_3',
    tag: '• SUPORTE GERENCIADO MSP • SLA GARANTIDO',
    title: 'Gestão Completa de Infraestrutura & Redes Corporativas',
    description: 'Monitoramento proativo 24/7 de computadores, switches e servidores para erradicar paradas no seu negócio.',
    cta: 'Conhecer Modelos de Suporte',
    bgImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80'
  }
];

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

export const DEFAULT_WEBSITE_CONFIG: WebsiteConfig = {
  diagnostic_tag: 'DIAGNÓSTICO CORPORATIVO GRATUITO',
  diagnostic_location: 'Goiânia e Região Metropolitana',
  diagnostic_text: 'Avalie vulnerabilidades, conformidade de backup e tempos de SLA da sua empresa sem custo.',
  diagnostic_button: 'Solicitar Diagnóstico de TI',
  contact_phone: '(62) 3923 - 0404 • (62) 9 8223 - 9004',
  contact_whatsapp: '5562982239004',
  contact_email: 'comercial@w3wsolucoesti.com.br',
  slides: DEFAULT_HERO_SLIDES,
  assistance_slides: DEFAULT_ASSISTANCE_SLIDES
};

export type SyncStatus = 'connected' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  isLive: boolean;
  lastSyncedAt: string | null;
  lastSavedServerAt: string | null;
  pendingChanges: boolean;
  channelActive: boolean;
  activeClientsCount: number;
  syncCounter: number;
}

const STORAGE_KEY = 'w3w_cms_global_shared_config';
const BROADCAST_CHANNEL_NAME = 'w3w_cms_realtime_sync_channel';
const DOM_EVENT_NAME = 'w3w_cms_sync_event';

class CmsSyncManager {
  private config: WebsiteConfig;
  private syncState: SyncState;
  private listeners: Set<() => void> = new Set();
  private clientId: string;
  private broadcastChannel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private autoSaveTimer: any = null;
  private isInitialized = false;

  constructor() {
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Recupera do cache local persistente ou aplica padrão
    let initialConfig = DEFAULT_WEBSITE_CONFIG;
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            initialConfig = {
              ...DEFAULT_WEBSITE_CONFIG,
              ...parsed,
              slides: (parsed.slides && parsed.slides.length > 0) ? parsed.slides : DEFAULT_HERO_SLIDES
            };
          }
        }
      } catch (e) {
        console.warn('Erro ao ler cache do CMS:', e);
      }
    }

    this.config = initialConfig;
    this.syncState = {
      status: 'connected',
      isLive: true,
      lastSyncedAt: new Date().toLocaleTimeString('pt-BR'),
      lastSavedServerAt: null,
      pendingChanges: false,
      channelActive: false,
      activeClientsCount: 1,
      syncCounter: 0
    };

    if (typeof window !== 'undefined') {
      this.initChannels();
    }
  }

  private initChannels() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Canal BroadcastChannel para comunicação instantânea entre abas e janelas
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.syncState.channelActive = true;

        this.broadcastChannel.onmessage = (event) => {
          if (!event.data) return;
          const { type, config, senderId, timestamp, clientCount } = event.data;
          if (senderId === this.clientId) return; // ignora mensagens de si mesmo

          if (type === 'CMS_UPDATE' && config) {
            this.applyExternalUpdate(config, 'broadcast');
          } else if (type === 'PING') {
            this.broadcastChannel?.postMessage({
              type: 'PONG',
              senderId: this.clientId
            });
          } else if (type === 'PONG') {
            this.syncState = {
              ...this.syncState,
              activeClientsCount: Math.max(this.syncState.activeClientsCount, (clientCount || 2))
            };
            this.notify();
          }
        };

        // Envia ping para descobrir outras abas ativas
        this.broadcastChannel.postMessage({ type: 'PING', senderId: this.clientId });
      } catch (err) {
        console.warn('BroadcastChannel indisponível:', err);
      }
    }

    // 2. Ouvinte de evento DOM local para sincronização síncrona in-page
    window.addEventListener(DOM_EVENT_NAME, ((e: CustomEvent) => {
      if (e.detail && e.detail.senderId !== this.clientId) {
        this.applyExternalUpdate(e.detail.config, 'dom_event');
      }
    }) as EventListener);

    // 3. Ouvinte de StorageEvent caso abas não compartilhem BroadcastChannel
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          this.applyExternalUpdate(parsed, 'storage');
        } catch (err) {}
      }
    });

    // 4. Conexão SSE (Server-Sent Events) para sincronização em tempo real via servidor
    this.connectSSE();
  }

  private connectSSE() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource('/api/cms/events');

      this.eventSource.onopen = () => {
        this.syncState = {
          ...this.syncState,
          status: 'connected',
          isLive: true
        };
        this.notify();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') {
            if (data.website_config) {
              // Se tiver configuração do servidor, funde com segurança
              this.applyExternalUpdate(data.website_config, 'sse_init');
            }
            if (data.assistance_slides && Array.isArray(data.assistance_slides)) {
              this.setAssistanceSlides(data.assistance_slides, false);
            }
            if (data.activeClients) {
              this.syncState.activeClientsCount = data.activeClients;
              this.notify();
            }
          } else if (data.type === 'cms_config_updated' || data.type === 'website_config_updated') {
            if (data.website_config && data.senderId !== this.clientId) {
              this.applyExternalUpdate(data.website_config, 'sse');
            }
          } else if (data.type === 'assistance_slides_updated' && Array.isArray(data.assistance_slides)) {
            if (data.senderId !== this.clientId) {
              this.setAssistanceSlides(data.assistance_slides, false);
            }
          }
        } catch (e) {}
      };

      this.eventSource.onerror = () => {
        // Fallback gracioso em caso de desconexão pontual
        this.syncState = {
          ...this.syncState,
          status: this.syncState.channelActive ? 'connected' : 'offline'
        };
        this.notify();
      };
    } catch (err) {
      console.warn('SSE não pôde ser iniciado:', err);
    }
  }

  private applyExternalUpdate(incoming: WebsiteConfig, source: string) {
    if (!incoming || typeof incoming !== 'object') return;

    const merged: WebsiteConfig = {
      ...this.config,
      ...incoming,
      slides: (incoming.slides && incoming.slides.length > 0) ? incoming.slides : this.config.slides,
      assistance_slides: (incoming.assistance_slides && incoming.assistance_slides.length > 0)
        ? incoming.assistance_slides
        : (this.config.assistance_slides || DEFAULT_ASSISTANCE_SLIDES)
    };

    this.config = merged;
    this.syncState = {
      ...this.syncState,
      status: 'synced',
      pendingChanges: false,
      lastSyncedAt: new Date().toLocaleTimeString('pt-BR'),
      syncCounter: this.syncState.syncCounter + 1
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {}

    this.notify();
  }

  public getConfig(): WebsiteConfig {
    return this.config;
  }

  public getSyncState(): SyncState {
    return this.syncState;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Erro em ouvinte de sincronização CMS:', err);
      }
    });
  }

  /**
   * Atualiza a configuração compartilhada instantaneamente no estado global,
   * emitindo para componentes React locais, BroadcastChannel, Eventos DOM e agendando auto-sync no servidor.
   */
  public updateConfig(partial: Partial<WebsiteConfig>, notifyServer = true) {
    const updated: WebsiteConfig = {
      ...this.config,
      ...partial,
      slides: partial.slides !== undefined ? partial.slides : this.config.slides
    };

    this.config = updated;
    const nowTime = new Date().toLocaleTimeString('pt-BR');

    this.syncState = {
      ...this.syncState,
      status: 'syncing',
      pendingChanges: true,
      lastSyncedAt: nowTime,
      syncCounter: this.syncState.syncCounter + 1
    };

    // 1. Notifica todos os componentes React inscritos localmente de imediato (0ms)
    this.notify();

    // 2. Persiste no localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}

    // 3. Emite no BroadcastChannel para outras abas/janelas
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'CMS_UPDATE',
          config: updated,
          senderId: this.clientId,
          timestamp: Date.now()
        });
      } catch (e) {}
    }

    // 4. Dispara evento DOM CustomEvent
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(DOM_EVENT_NAME, {
          detail: { config: updated, senderId: this.clientId }
        })
      );
    }

    // 5. Auto-sync agendado (debounced) com o servidor para persistência e consistência
    if (notifyServer) {
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
      }
      this.autoSaveTimer = setTimeout(() => {
        this.syncWithServer(updated);
      }, 800);
    }
  }

  public updateSlide(index: number, field: keyof HeroSlide, value: string) {
    const currentSlides = [...(this.config.slides || DEFAULT_HERO_SLIDES)];
    if (index >= 0 && index < currentSlides.length) {
      currentSlides[index] = {
        ...currentSlides[index],
        [field]: value
      };
      this.updateConfig({ slides: currentSlides });
    }
  }

  public addSlide(customSlide?: Partial<HeroSlide>) {
    const currentSlides = [...(this.config.slides || DEFAULT_HERO_SLIDES)];
    const newSlide: HeroSlide = {
      id: `slide_${Date.now()}`,
      tag: customSlide?.tag || '• NOVO SERVIÇO W3W • ALTA PERFORMANCE',
      title: customSlide?.title || 'Solução Avançada de Tecnologia e Infraestrutura',
      description: customSlide?.description || 'Descrição completa da solução oferecida pela W3W Soluções em TI para empresas de Goiás.',
      cta: customSlide?.cta || 'Solicitar Proposta',
      bgImage: customSlide?.bgImage || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1920&q=80'
    };
    currentSlides.push(newSlide);
    this.updateConfig({ slides: currentSlides });
    return currentSlides.length - 1;
  }

  public removeSlide(index: number): boolean {
    const currentSlides = [...(this.config.slides || DEFAULT_HERO_SLIDES)];
    if (currentSlides.length <= 1) {
      return false;
    }
    const filtered = currentSlides.filter((_, i) => i !== index);
    this.updateConfig({ slides: filtered });
    return true;
  }

  public updateAssistanceSlide(index: number, field: keyof AssistanceSlide, value: any) {
    const current = [...(this.config.assistance_slides || DEFAULT_ASSISTANCE_SLIDES)];
    if (index >= 0 && index < current.length) {
      current[index] = {
        ...current[index],
        [field]: value
      };
      this.updateConfig({ assistance_slides: current });
    }
  }

  public addAssistanceSlide(custom?: Partial<AssistanceSlide>) {
    const current = [...(this.config.assistance_slides || DEFAULT_ASSISTANCE_SLIDES)];
    const newSlide: AssistanceSlide = {
      id: `as_slide_${Date.now()}`,
      order_index: current.length,
      focus: custom?.focus || 'Especialidade',
      badge: custom?.badge || `Foco: ${custom?.focus || 'Especialidade'}`,
      title: custom?.title || 'Novo Diferencial Técnico W3W',
      description: custom?.description || 'Descrição detalhada do diferencial de atendimento ou infraestrutura técnica em Goiânia.',
      image_url: custom?.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=80',
      cta_text: custom?.cta_text || 'Falar no WhatsApp',
      cta_link: custom?.cta_link || 'https://api.whatsapp.com/send?phone=5562982239004',
      is_active: true
    };
    current.push(newSlide);
    this.updateConfig({ assistance_slides: current });
    return current.length - 1;
  }

  public removeAssistanceSlide(index: number): boolean {
    const current = [...(this.config.assistance_slides || DEFAULT_ASSISTANCE_SLIDES)];
    if (current.length <= 1) {
      return false;
    }
    const filtered = current.filter((_, i) => i !== index);
    this.updateConfig({ assistance_slides: filtered });
    return true;
  }

  public setAssistanceSlides(slides: AssistanceSlide[], notifyServer = true) {
    this.updateConfig({ assistance_slides: slides }, notifyServer);
  }

  public resetToDefaults() {
    this.updateConfig(DEFAULT_WEBSITE_CONFIG, true);
  }

  public setFromExternal(externalConfig: WebsiteConfig) {
    if (!externalConfig) return;
    this.applyExternalUpdate(externalConfig, 'external_props');
  }

  /**
   * Envia as alterações para a API do backend
   */
  private async syncWithServer(cfg: WebsiteConfig) {
    try {
      const res = await fetch('/api/cms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_config: cfg,
          senderId: this.clientId
        })
      });

      if (res.ok) {
        const data = await res.json();
        this.syncState = {
          ...this.syncState,
          status: 'synced',
          pendingChanges: false,
          lastSavedServerAt: new Date().toLocaleTimeString('pt-BR'),
          activeClientsCount: data.activeClients || this.syncState.activeClientsCount
        };
        this.notify();
      }
    } catch (err) {
      console.warn('Aviso: Sincronização em background com o servidor adiada:', err);
    }
  }

  /**
   * Grava explicitamente no servidor e garante persistência completa
   */
  public async saveToServer(systemSettings?: SystemSettings): Promise<void> {
    this.syncState = {
      ...this.syncState,
      status: 'syncing'
    };
    this.notify();

    try {
      // 1. Sincroniza via endpoint dedicado CMS
      const cmsRes = await fetch('/api/cms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_config: this.config,
          senderId: this.clientId
        })
      });

      // 2. Se fornecido systemSettings, atualiza também a rota geral
      if (systemSettings) {
        const fullPayload = {
          ...systemSettings,
          website_config: this.config,
          senderId: this.clientId
        };
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullPayload)
        });
      }

      if (!cmsRes.ok) {
        throw new Error('Falha na resposta do servidor durante sincronização.');
      }

      this.syncState = {
        ...this.syncState,
        status: 'synced',
        pendingChanges: false,
        lastSavedServerAt: new Date().toLocaleTimeString('pt-BR'),
        lastSyncedAt: new Date().toLocaleTimeString('pt-BR')
      };
      this.notify();
    } catch (err: any) {
      this.syncState = {
        ...this.syncState,
        status: 'error'
      };
      this.notify();
      throw err;
    }
  }
}

// Instância Singleton do gerenciador de sincronização
export const cmsSyncManager = new CmsSyncManager();

/**
 * Hook React universal para sincronização em tempo real do WebsiteCMSManager e W3WSiteView
 */
export function useCMSSync() {
  const config = useSyncExternalStore(
    (callback) => cmsSyncManager.subscribe(callback),
    () => cmsSyncManager.getConfig()
  );

  const syncState = useSyncExternalStore(
    (callback) => cmsSyncManager.subscribe(callback),
    () => cmsSyncManager.getSyncState()
  );

  return {
    config,
    syncState,
    updateConfig: (partial: Partial<WebsiteConfig>, notifyServer?: boolean) =>
      cmsSyncManager.updateConfig(partial, notifyServer),
    updateSlide: (index: number, field: keyof HeroSlide, value: string) =>
      cmsSyncManager.updateSlide(index, field, value),
    addSlide: (customSlide?: Partial<HeroSlide>) =>
      cmsSyncManager.addSlide(customSlide),
    removeSlide: (index: number) =>
      cmsSyncManager.removeSlide(index),
    updateAssistanceSlide: (index: number, field: keyof AssistanceSlide, value: any) =>
      cmsSyncManager.updateAssistanceSlide(index, field, value),
    addAssistanceSlide: (custom?: Partial<AssistanceSlide>) =>
      cmsSyncManager.addAssistanceSlide(custom),
    removeAssistanceSlide: (index: number) =>
      cmsSyncManager.removeAssistanceSlide(index),
    setAssistanceSlides: (slides: AssistanceSlide[], notifyServer?: boolean) =>
      cmsSyncManager.setAssistanceSlides(slides, notifyServer),
    resetToDefaults: () =>
      cmsSyncManager.resetToDefaults(),
    saveToServer: (settings?: SystemSettings) =>
      cmsSyncManager.saveToServer(settings),
    setFromExternal: (ext: WebsiteConfig) =>
      cmsSyncManager.setFromExternal(ext)
  };
}

/**
 * Hook conveniente somente-leitura para visualizações
 */
export function useSharedCMSConfig() {
  const config = useSyncExternalStore(
    (callback) => cmsSyncManager.subscribe(callback),
    () => cmsSyncManager.getConfig()
  );

  const syncState = useSyncExternalStore(
    (callback) => cmsSyncManager.subscribe(callback),
    () => cmsSyncManager.getSyncState()
  );

  return { config, syncState };
}
