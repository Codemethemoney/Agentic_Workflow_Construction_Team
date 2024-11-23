import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LLMProvider = 'openai' | 'anthropic' | 'ollama' | 'qwen';
export type LLMModel = 'gpt-4' | 'claude-3-opus' | 'claude-3-sonnet' | 'ollama-3.2' | 'qwen-2.5';

interface EndpointConfig {
  url: string;
  validated: boolean;
  deployedToCloud: boolean;
}

interface LLMState {
  configs: Record<LLMProvider, string>; // API Keys
  endpoints: Record<string, EndpointConfig>; // Endpoint configurations
  activeModels: LLMModel[];
  setConfig: (provider: LLMProvider, apiKey: string) => void;
  setEndpoint: (model: string, url: string) => void;
  validateEndpoint: (model: string) => Promise<void>;
  deployToCloud: (model: string) => Promise<void>;
  addActiveModel: (model: LLMModel) => void;
  removeActiveModel: (model: LLMModel) => void;
  getConfig: (provider: LLMProvider) => string | null;
}

export const useLLMStore = create<LLMState>()(
  persist(
    (set, get) => ({
      configs: {
        openai: '',
        anthropic: '',
        ollama: '',
        qwen: '',
      },
      endpoints: {
        ollama: {
          url: '',
          validated: false,
          deployedToCloud: false,
        },
        qwen: {
          url: '',
          validated: false,
          deployedToCloud: false,
        },
      },
      activeModels: ['gpt-4'],

      setConfig: (provider, apiKey) =>
        set((state) => ({
          configs: {
            ...state.configs,
            [provider]: apiKey,
          },
        })),

      setEndpoint: (model, url) =>
        set((state) => ({
          endpoints: {
            ...state.endpoints,
            [model]: {
              ...state.endpoints[model],
              url,
              validated: false,
              deployedToCloud: false,
            },
          },
        })),

      validateEndpoint: async (model) => {
        const endpoint = get().endpoints[model];
        if (!endpoint?.url) return;

        try {
          const response = await fetch(endpoint.url, {
            method: 'HEAD',
            timeout: 5000,
          });

          set((state) => ({
            endpoints: {
              ...state.endpoints,
              [model]: {
                ...state.endpoints[model],
                validated: response.ok,
              },
            },
          }));
        } catch {
          set((state) => ({
            endpoints: {
              ...state.endpoints,
              [model]: {
                ...state.endpoints[model],
                validated: false,
              },
            },
          }));
        }
      },

      deployToCloud: async (model) => {
        const endpoint = get().endpoints[model];
        if (!endpoint?.url || !endpoint.validated) return;

        try {
          // Implementation of cloud deployment logic
          set((state) => ({
            endpoints: {
              ...state.endpoints,
              [model]: {
                ...state.endpoints[model],
                deployedToCloud: true,
              },
            },
          }));
        } catch (error) {
          console.error('Failed to deploy to cloud:', error);
        }
      },

      addActiveModel: (model) =>
        set((state) => {
          const provider = getProviderFromModel(model);
          const hasProviderModel = state.activeModels.some(m => 
            getProviderFromModel(m) === provider
          );

          if (hasProviderModel) {
            return {
              activeModels: [
                ...state.activeModels.filter(m => 
                  getProviderFromModel(m) !== provider
                ),
                model
              ]
            };
          }

          return {
            activeModels: [...state.activeModels, model]
          };
        }),

      removeActiveModel: (model) =>
        set((state) => ({
          activeModels: state.activeModels.filter(m => m !== model)
        })),

      getConfig: (provider) => get().configs[provider],
    }),
    {
      name: 'llm-storage',
      partialize: (state) => ({
        activeModels: state.activeModels,
        endpoints: state.endpoints,
      }),
    }
  )
);

function getProviderFromModel(model: LLMModel): LLMProvider {
  if (model.startsWith('gpt')) return 'openai';
  if (model.startsWith('claude')) return 'anthropic';
  if (model.startsWith('ollama')) return 'ollama';
  if (model.startsWith('qwen')) return 'qwen';
  throw new Error(`Unknown model provider: ${model}`);
}