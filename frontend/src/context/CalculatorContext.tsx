import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  CashFlowAssumptions,
  EmployeeRole,
  FinancingStructure,
  FixedAsset,
  MenuItem,
  OperatingExpenseCategory,
  OperatingExpenseItem,
  ProjectSettings,
  SupplierItem,
} from '@shared/types';
import type { Language } from '@i18n/index';
import { useProjectSync, type CloudSaveStatus } from '../hooks/useProjectSync';
import {
  createFixedAsset,
  createInitialState,
  createMenuItem,
  createOperatingExpense,
  createStaffingRole,
  createSupplierItem,
  DEFAULT_RAMP_UP,
  formatPackageLabel,
  normalizeCustomCategories,
  STORAGE_KEY,
} from '../lib/defaults';
import {
  ASSET_PRESETS,
  EXPENSE_PRESETS,
  MENU_PRESETS,
  requiredSupplierPresets,
  resolvePresetIngredients,
  STAFFING_PRESETS,
  SUPPLIER_PRESETS,
  type SupplierPreset,
} from '../lib/presets';
import type { AppState, AppTab } from '../types/app';
import { convertWorkspaceCurrency } from '../lib/currencyConversion';

export type SaveStatus = 'saving' | 'saved' | 'error';
export type { CloudSaveStatus } from '../hooks/useProjectSync';

interface CalculatorContextValue {
  state: AppState;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  cloudSaveStatus: CloudSaveStatus;
  lastCloudSavedAt: number | null;
  saveToCloud: () => Promise<void>;
  setTab: (tab: AppTab) => void;
  setLanguage: (language: Language) => void;
  updateSettings: (patch: Partial<ProjectSettings>) => void;
  /** Switches currency and converts every monetary field at the new rate. */
  changeCurrency: (code: string, symbol: string, rate: number) => void;
  resetWorkspace: () => void;
  quickCalculate: () => void;

  addSupplier: (category?: string) => string;
  updateSupplier: (id: string, patch: Partial<Omit<SupplierItem, 'id'>>) => void;
  removeSupplier: (id: string) => void;
  loadSupplierPresets: () => void;
  addCustomSupplierCategory: (name: string) => string | null;

  addMenuItem: (category?: string) => string;
  updateMenuItem: (id: string, patch: Partial<Omit<MenuItem, 'id'>>) => void;
  removeMenuItem: (id: string) => void;
  loadMenuPresets: () => void;
  addCustomMenuCategory: (name: string) => string | null;

  addExpense: (category?: OperatingExpenseCategory) => string;
  updateExpense: (
    id: string,
    patch: Partial<Omit<OperatingExpenseItem, 'id'>>,
  ) => void;
  removeExpense: (id: string) => void;
  loadExpensePresets: () => void;

  addStaffingRole: () => string;
  updateStaffingRole: (
    id: string,
    patch: Partial<Omit<EmployeeRole, 'id'>>,
  ) => void;
  removeStaffingRole: (id: string) => void;
  loadStaffingPresets: () => void;

  addAsset: () => string;
  updateAsset: (id: string, patch: Partial<Omit<FixedAsset, 'id'>>) => void;
  removeAsset: (id: string) => void;
  loadAssetPresets: () => void;

  updateFinancing: (patch: Partial<FinancingStructure>) => void;
  updateCashFlow: (patch: Partial<CashFlowAssumptions>) => void;
  updateRampUpMonth: (index: number, percent: number) => void;
}

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

const TABS: readonly AppTab[] = [
  'general',
  'menu',
  'suppliers',
  'expenses',
  'staff',
  'assets',
  'summary',
];

function clampTab(tab: unknown): AppTab {
  return TABS.includes(tab as AppTab) ? (tab as AppTab) : 'general';
}

function normalizeRampUp(value: unknown): number[] {
  if (!Array.isArray(value)) return [...DEFAULT_RAMP_UP];
  return Array.from({ length: 12 }, (_, index) => {
    const entry = Number(value[index]);
    return Number.isFinite(entry) ? Math.max(0, Math.min(100, entry)) : 100;
  });
}

function hydrateState(parsed: Partial<AppState> | null): AppState {
  const base = createInitialState();
  if (!parsed || typeof parsed !== 'object') return base;

  /* v2 workspaces predate the rename from "cups" to "customers". */
  const legacyCashFlow = parsed.cashFlow as
    | (Partial<CashFlowAssumptions> & { dailyTargetCups?: number })
    | undefined;
  const dailyTargetCustomers =
    legacyCashFlow?.dailyTargetCustomers ??
    legacyCashFlow?.dailyTargetCups ??
    base.cashFlow.dailyTargetCustomers;

  /* Persisted v2 workspaces predate the fixed target ratio. Keep their saved
     settings, but always restore a valid 0–100 policy value. */
  const settings = { ...base.settings, ...(parsed.settings ?? {}) };
  settings.TargetMaterialCostRatio = Number.isFinite(
    settings.TargetMaterialCostRatio,
  )
    ? Math.min(100, Math.max(0, settings.TargetMaterialCostRatio))
    : base.settings.TargetMaterialCostRatio;

  return {
    ...base,
    settings,
    suppliers: Array.isArray(parsed.suppliers)
      ? parsed.suppliers.map((item) => createSupplierItem(item))
      : [],
    menu: Array.isArray(parsed.menu)
      ? parsed.menu.map((item) => createMenuItem(item))
      : [],
    customMenuCategories: normalizeCustomCategories(
      parsed.customMenuCategories,
    ),
    customSupplierCategories: normalizeCustomCategories(
      parsed.customSupplierCategories,
    ),
    expenses: Array.isArray(parsed.expenses)
      ? parsed.expenses.map((item) => createOperatingExpense(item))
      : [],
    staffing: Array.isArray(parsed.staffing)
      ? parsed.staffing.map((item) => createStaffingRole(item))
      : [],
    assets: Array.isArray(parsed.assets)
      ? parsed.assets.map((item) => createFixedAsset(item))
      : [],
    financing: { ...base.financing, ...(parsed.financing ?? {}) },
    cashFlow: {
      ...base.cashFlow,
      openingLiquidCash:
        legacyCashFlow?.openingLiquidCash ?? base.cashFlow.openingLiquidCash,
      dailyTargetCustomers,
      rampUpPercent: normalizeRampUp(legacyCashFlow?.rampUpPercent),
    },
    tab: clampTab(parsed.tab),
    language: parsed.language === 'ar' ? 'ar' : 'en',
  };
}

function hydrate(): AppState {
  if (typeof window === 'undefined') return createInitialState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<AppState> | null;
    return hydrateState(parsed);
  } catch {
    return createInitialState();
  }
}

function mergeByName<T extends { name: string }>(
  current: T[],
  incoming: T[],
): T[] {
  const existing = new Set(
    current.map((item) => item.name.trim().toLowerCase()),
  );
  return [
    ...current,
    ...incoming.filter(
      (item) => !existing.has(item.name.trim().toLowerCase()),
    ),
  ];
}

function mergeRolesByName(
  current: EmployeeRole[],
  incoming: EmployeeRole[],
): EmployeeRole[] {
  const existing = new Set(
    current.map((role) => role.roleName.trim().toLowerCase()),
  );
  return [
    ...current,
    ...incoming.filter(
      (role) => !existing.has(role.roleName.trim().toLowerCase()),
    ),
  ];
}

function uniqueSupplierPresets(
  presets: readonly SupplierPreset[],
): SupplierPreset[] {
  const seen = new Set<string>();
  return presets.filter((preset) => {
    if (seen.has(preset.id)) return false;
    seen.add(preset.id);
    return true;
  });
}

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(hydrate);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const firstSave = useRef(true);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = state.language;
    root.dir = state.language === 'ar' ? 'rtl' : 'ltr';
  }, [state.language]);

  /* Debounced localStorage autosave. */
  useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
    } else {
      setSaveStatus('saving');
    }

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setSaveStatus('saved');
        setLastSavedAt(Date.now());
      } catch {
        setSaveStatus('error');
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [state]);

  const loadProject = useCallback((projectData: unknown) => {
    setState(hydrateState(projectData as Partial<AppState> | null));
  }, []);

  const markLocalSave = useCallback(() => {
    setSaveStatus('saved');
    setLastSavedAt(Date.now());
  }, []);

  const { cloudSaveStatus, lastCloudSavedAt, saveToCloud } = useProjectSync({
    projectData: state,
    onProjectLoaded: loadProject,
    onLocalSave: markLocalSave,
  });

  const setTab = useCallback((tab: AppTab) => {
    setState((current) => ({ ...current, tab }));
  }, []);

  const setLanguage = useCallback((language: Language) => {
    setState((current) => ({ ...current, language }));
  }, []);

  const updateSettings = useCallback((patch: Partial<ProjectSettings>) => {
    setState((current) => ({
      ...current,
      settings: { ...current.settings, ...patch },
    }));
  }, []);

  /**
   * Currency switches must move the money, not only the symbol.
   *
   * A non-positive rate is rejected: there is no meaningful way to convert at
   * zero, and silently keeping the old numbers would mislabel every amount.
   */
  const changeCurrency = useCallback(
    (code: string, symbol: string, rate: number) => {
      if (!Number.isFinite(rate) || rate <= 0) return;

      setState((current) => {
        const fromRate = current.settings.exchangeRateToUSD;
        const converted =
          Number.isFinite(fromRate) && fromRate > 0 && fromRate !== rate
            ? convertWorkspaceCurrency(current, fromRate, rate)
            : current;

        return {
          ...converted,
          settings: {
            ...converted.settings,
            currencyCode: code,
            currencySymbol: symbol,
            exchangeRateToUSD: rate,
          },
        };
      });
    },
    [],
  );

  const resetWorkspace = useCallback(() => {
    setState((current) => ({
      ...createInitialState(),
      language: current.language,
    }));
  }, []);

  const quickCalculate = useCallback(() => {
    setState((current) => {
      const baseSuppliers =
        current.suppliers.length > 0
          ? current.suppliers
          : SUPPLIER_PRESETS.map((preset) => createSupplierItem(preset));

      const required = uniqueSupplierPresets(
        MENU_PRESETS.flatMap((preset) =>
          requiredSupplierPresets(preset, baseSuppliers),
        ),
      );

      const suppliers = mergeByName(
        baseSuppliers,
        required.map((preset) => createSupplierItem(preset)),
      );

      return {
        ...current,
        suppliers,
        menu:
          current.menu.length > 0
            ? current.menu
            : MENU_PRESETS.map((preset) =>
                createMenuItem({
                  ...preset,
                  ingredients: resolvePresetIngredients(preset, suppliers),
                }),
              ),
        expenses:
          current.expenses.length > 0
            ? current.expenses
            : EXPENSE_PRESETS.map((preset) =>
                createOperatingExpense(preset),
              ),
        staffing:
          current.staffing.length > 0
            ? current.staffing
            : STAFFING_PRESETS.map((preset) =>
                createStaffingRole(preset),
              ),
        assets:
          current.assets.length > 0
            ? current.assets
            : ASSET_PRESETS.map((preset) => createFixedAsset(preset)),
        tab: 'summary',
      };
    });
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Suppliers                                                              */
  /* ---------------------------------------------------------------------- */

  const addSupplier = useCallback((category?: string) => {
    const supplier = createSupplierItem(category ? { category } : {});
    setState((current) => ({
      ...current,
      suppliers: [...current.suppliers, supplier],
    }));
    return supplier.id;
  }, []);

  const addCustomSupplierCategory = useCallback((rawName: string) => {
    const name = rawName.trim();
    if (!name) return null;

    setState((current) => {
      const exists = current.customSupplierCategories.some(
        (category) => category.toLowerCase() === name.toLowerCase(),
      );
      if (exists) return current;
      return {
        ...current,
        customSupplierCategories: [
          ...current.customSupplierCategories,
          name,
        ],
      };
    });

    return name;
  }, []);

  const updateSupplier = useCallback(
    (id: string, patch: Partial<Omit<SupplierItem, 'id'>>) => {
      setState((current) => {
        const suppliers = current.suppliers.map((supplier) => {
          if (supplier.id !== id) return supplier;

          const next = { ...supplier, ...patch };
          if (
            patch.packageQuantity !== undefined ||
            patch.packageUnit !== undefined
          ) {
            next.packageLabel = formatPackageLabel(
              next.packageQuantity,
              next.packageUnit,
            );
          }
          return next;
        });

        /* Moving a supplier out of the coffee category invalidates any menu
           rows that explicitly selected it as their bean. */
        const clearsBeanSelection =
          patch.category !== undefined && patch.category !== 'coffee';

        return {
          ...current,
          suppliers,
          menu: clearsBeanSelection
            ? current.menu.map((item) =>
                item.selectedBeanId === id
                  ? { ...item, selectedBeanId: undefined }
                  : item,
              )
            : current.menu,
        };
      });
    },
    [],
  );

  const removeSupplier = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      suppliers: current.suppliers.filter((supplier) => supplier.id !== id),
      menu: current.menu.map((item) => ({
        ...item,
        selectedBeanId:
          item.selectedBeanId === id ? undefined : item.selectedBeanId,
        ingredients: item.ingredients.filter(
          (ingredient) => ingredient.supplierId !== id,
        ),
      })),
    }));
  }, []);

  const loadSupplierPresets = useCallback(() => {
    setState((current) => ({
      ...current,
      suppliers: mergeByName(
        current.suppliers,
        SUPPLIER_PRESETS.map((preset) => createSupplierItem(preset)),
      ),
    }));
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Menu                                                                   */
  /* ---------------------------------------------------------------------- */

  const addMenuItem = useCallback((category?: string) => {
    const item = createMenuItem(category ? { category } : {});
    setState((current) => ({ ...current, menu: [...current.menu, item] }));
    return item.id;
  }, []);

  const addCustomMenuCategory = useCallback((rawName: string) => {
    const name = rawName.trim();
    if (!name) return null;

    setState((current) => {
      const exists = current.customMenuCategories.some(
        (category) => category.toLowerCase() === name.toLowerCase(),
      );
      if (exists) return current;
      return {
        ...current,
        customMenuCategories: [...current.customMenuCategories, name],
      };
    });

    return name;
  }, []);

  const updateMenuItem = useCallback(
    (id: string, patch: Partial<Omit<MenuItem, 'id'>>) => {
      setState((current) => ({
        ...current,
        menu: current.menu.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      }));
    },
    [],
  );

  const removeMenuItem = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      menu: current.menu.filter((item) => item.id !== id),
    }));
  }, []);

  const loadMenuPresets = useCallback(() => {
    setState((current) => {
      const required = uniqueSupplierPresets(
        MENU_PRESETS.flatMap((preset) =>
          requiredSupplierPresets(preset, current.suppliers),
        ),
      );
      const suppliers = mergeByName(
        current.suppliers,
        required.map((preset) => createSupplierItem(preset)),
      );

      return {
        ...current,
        suppliers,
        menu: mergeByName(
          current.menu,
          MENU_PRESETS.map((preset) =>
            createMenuItem({
              ...preset,
              ingredients: resolvePresetIngredients(preset, suppliers),
            }),
          ),
        ),
      };
    });
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Expenses & staffing                                                    */
  /* ---------------------------------------------------------------------- */

  const addExpense = useCallback((category?: OperatingExpenseCategory) => {
    const expense = createOperatingExpense(category ? { category } : {});
    setState((current) => ({
      ...current,
      expenses: [...current.expenses, expense],
    }));
    return expense.id;
  }, []);

  const updateExpense = useCallback(
    (id: string, patch: Partial<Omit<OperatingExpenseItem, 'id'>>) => {
      setState((current) => ({
        ...current,
        expenses: current.expenses.map((expense) =>
          expense.id === id ? { ...expense, ...patch } : expense,
        ),
      }));
    },
    [],
  );

  const removeExpense = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      expenses: current.expenses.filter((expense) => expense.id !== id),
    }));
  }, []);

  const loadExpensePresets = useCallback(() => {
    setState((current) => ({
      ...current,
      expenses: mergeByName(
        current.expenses,
        EXPENSE_PRESETS.map((preset) => createOperatingExpense(preset)),
      ),
    }));
  }, []);

  const addStaffingRole = useCallback(() => {
    const role = createStaffingRole();
    setState((current) => ({
      ...current,
      staffing: [...current.staffing, role],
    }));
    return role.id;
  }, []);

  const updateStaffingRole = useCallback(
    (id: string, patch: Partial<Omit<EmployeeRole, 'id'>>) => {
      setState((current) => ({
        ...current,
        staffing: current.staffing.map((role) =>
          role.id === id ? { ...role, ...patch } : role,
        ),
      }));
    },
    [],
  );

  const removeStaffingRole = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      staffing: current.staffing.filter((role) => role.id !== id),
    }));
  }, []);

  const loadStaffingPresets = useCallback(() => {
    setState((current) => ({
      ...current,
      staffing: mergeRolesByName(
        current.staffing,
        STAFFING_PRESETS.map((preset) => createStaffingRole(preset)),
      ),
    }));
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Fixed assets                                                           */
  /* ---------------------------------------------------------------------- */

  const addAsset = useCallback(() => {
    const asset = createFixedAsset();
    setState((current) => ({
      ...current,
      assets: [...current.assets, asset],
    }));
    return asset.id;
  }, []);

  const updateAsset = useCallback(
    (id: string, patch: Partial<Omit<FixedAsset, 'id'>>) => {
      setState((current) => ({
        ...current,
        assets: current.assets.map((asset) =>
          asset.id === id ? { ...asset, ...patch } : asset,
        ),
      }));
    },
    [],
  );

  const removeAsset = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      assets: current.assets.filter((asset) => asset.id !== id),
    }));
  }, []);

  const loadAssetPresets = useCallback(() => {
    setState((current) => ({
      ...current,
      assets: mergeByName(
        current.assets,
        ASSET_PRESETS.map((preset) => createFixedAsset(preset)),
      ),
    }));
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Financing & demand                                                     */
  /* ---------------------------------------------------------------------- */

  const updateFinancing = useCallback((patch: Partial<FinancingStructure>) => {
    setState((current) => ({
      ...current,
      financing: { ...current.financing, ...patch },
    }));
  }, []);

  const updateCashFlow = useCallback((patch: Partial<CashFlowAssumptions>) => {
    setState((current) => ({
      ...current,
      cashFlow: {
        ...current.cashFlow,
        ...patch,
        rampUpPercent:
          patch.rampUpPercent !== undefined
            ? normalizeRampUp(patch.rampUpPercent)
            : current.cashFlow.rampUpPercent,
      },
    }));
  }, []);

  const updateRampUpMonth = useCallback((index: number, percent: number) => {
    setState((current) => ({
      ...current,
      cashFlow: {
        ...current.cashFlow,
        rampUpPercent: current.cashFlow.rampUpPercent.map((value, position) =>
          position === index ? Math.max(0, Math.min(100, percent)) : value,
        ),
      },
    }));
  }, []);

  const value = useMemo<CalculatorContextValue>(
    () => ({
      state,
      saveStatus,
      lastSavedAt,
      cloudSaveStatus,
      lastCloudSavedAt,
      saveToCloud,
      setTab,
      setLanguage,
      updateSettings,
      changeCurrency,
      resetWorkspace,
      quickCalculate,
      addSupplier,
      updateSupplier,
      removeSupplier,
      loadSupplierPresets,
      addCustomSupplierCategory,
      addMenuItem,
      updateMenuItem,
      removeMenuItem,
      loadMenuPresets,
      addCustomMenuCategory,
      addExpense,
      updateExpense,
      removeExpense,
      loadExpensePresets,
      addStaffingRole,
      updateStaffingRole,
      removeStaffingRole,
      loadStaffingPresets,
      addAsset,
      updateAsset,
      removeAsset,
      loadAssetPresets,
      updateFinancing,
      updateCashFlow,
      updateRampUpMonth,
    }),
    [
      state,
      saveStatus,
      lastSavedAt,
      cloudSaveStatus,
      lastCloudSavedAt,
      saveToCloud,
      setTab,
      setLanguage,
      updateSettings,
      changeCurrency,
      resetWorkspace,
      quickCalculate,
      addSupplier,
      updateSupplier,
      removeSupplier,
      loadSupplierPresets,
      addCustomSupplierCategory,
      addMenuItem,
      updateMenuItem,
      removeMenuItem,
      loadMenuPresets,
      addCustomMenuCategory,
      addExpense,
      updateExpense,
      removeExpense,
      loadExpensePresets,
      addStaffingRole,
      updateStaffingRole,
      removeStaffingRole,
      loadStaffingPresets,
      addAsset,
      updateAsset,
      removeAsset,
      loadAssetPresets,
      updateFinancing,
      updateCashFlow,
      updateRampUpMonth,
    ],
  );

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculator(): CalculatorContextValue {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error('useCalculator must be used inside CalculatorProvider');
  }
  return context;
}
