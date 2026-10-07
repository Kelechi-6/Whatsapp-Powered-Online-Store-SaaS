// Plan configuration and enforcement
export type PlanId = 'free' | 'starter' | 'pro'

export type Feature =
  | 'custom_domain'
  | 'bulk_upload'
  | 'api_access'
  | 'multi_store'
  | 'white_label'
  | 'advanced_analytics'
  | 'priority_support'
  | 'remove_branding'
  | 'advanced_store_customization'
  | 'reports'

export interface PlanLimits {
  maxProducts: number | null // null = unlimited
  allowedFeatures: Feature[]
  allowsCustomDomain: boolean
  allowsBulkUpload: boolean
  allowsApiAccess: boolean
  allowsMultiStore: boolean
  allowsWhiteLabel: boolean
  allowsAdvancedAnalytics: boolean
  allowsPrioritySupport: boolean
  allowsRemoveBranding: boolean
  allowsAdvancedStoreCustomization: boolean
  allowsReports: boolean
}

export interface PlanConfig {
  id: PlanId
  name: string
  price: number
  period: string
  limits: PlanLimits
}

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    limits: {
      maxProducts: 10,
      allowedFeatures: [],
      allowsCustomDomain: false,
      allowsBulkUpload: false,
      allowsApiAccess: false,
      allowsMultiStore: false,
      allowsWhiteLabel: false,
      allowsAdvancedAnalytics: false,
      allowsPrioritySupport: false,
      allowsRemoveBranding: false,
      allowsAdvancedStoreCustomization: false,
      allowsReports: false,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 5000,
    period: 'monthly',
    limits: {
      maxProducts: 50,
      allowedFeatures: ['custom_domain', 'bulk_upload', 'advanced_analytics', 'priority_support', 'remove_branding'],
      allowsCustomDomain: true,
      allowsBulkUpload: true,
      allowsApiAccess: false,
      allowsMultiStore: false,
      allowsWhiteLabel: false,
      allowsAdvancedAnalytics: true,
      allowsPrioritySupport: true,
      allowsRemoveBranding: true,
      allowsAdvancedStoreCustomization: false,
      allowsReports: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 15000,
    period: 'monthly',
    limits: {
      maxProducts: null, // unlimited
      allowedFeatures: ['custom_domain', 'bulk_upload', 'api_access', 'multi_store', 'white_label', 'advanced_analytics', 'priority_support', 'remove_branding', 'advanced_store_customization', 'reports'],
      allowsCustomDomain: true,
      allowsBulkUpload: true,
      allowsApiAccess: true,
      allowsMultiStore: true,
      allowsWhiteLabel: true,
      allowsAdvancedAnalytics: true,
      allowsPrioritySupport: true,
      allowsRemoveBranding: true,
      allowsAdvancedStoreCustomization: true,
      allowsReports: true,
    },
  },
}

/**
 * Get plan limits for a given plan ID
 */
export function getPlanLimits(planId: PlanId): PlanLimits {
  return PLAN_CONFIGS[planId]?.limits || PLAN_CONFIGS.free.limits
}

/**
 * Check if a plan allows a specific feature
 */
export function hasFeature(planId: PlanId, feature: Feature): boolean {
  const limits = getPlanLimits(planId)
  return limits.allowedFeatures.includes(feature)
}

/**
 * Check if user can add more products based on their plan
 */
export function canAddProduct(planId: PlanId, currentProductCount: number): boolean {
  const limits = getPlanLimits(planId)
  if (limits.maxProducts === null) return true // unlimited
  return currentProductCount < limits.maxProducts
}

/**
 * Get the number of products remaining for a plan
 */
export function getRemainingProducts(planId: PlanId, currentProductCount: number): number | null {
  const limits = getPlanLimits(planId)
  if (limits.maxProducts === null) return null // unlimited
  return Math.max(0, limits.maxProducts - currentProductCount)
}

/**
 * Get plan config for UI display (derived from canonical config)
 */
export function getPlansForDisplay() {
  return Object.values(PLAN_CONFIGS).map(config => ({
    id: config.id,
    name: config.name,
    price: config.price,
    period: config.period,
    limits: config.limits,
  }))
}
