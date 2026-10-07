import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { PlanId, Feature, getPlanLimits, hasFeature, canAddProduct } from './plans'

/**
 * Get user's subscription plan from database
 */
export async function getUserPlan(businessId: string): Promise<PlanId> {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('business_id', businessId)
    .maybeSingle()

  return (subscription?.plan as PlanId) || 'free'
}

/**
 * Get user's current product count
 */
export async function getProductCount(businessId: string): Promise<number> {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)

  return count || 0
}

/**
 * Check if user can add a product (server-side)
 */
export async function checkProductLimit(businessId: string): Promise<{ canAdd: boolean; remaining: number | null; plan: PlanId }> {
  const plan = await getUserPlan(businessId)
  const currentCount = await getProductCount(businessId)
  
  const limits = getPlanLimits(plan)
  const canAdd = canAddProduct(plan, currentCount)
  const remaining = limits.maxProducts === null ? null : Math.max(0, limits.maxProducts - currentCount)

  return { canAdd, remaining, plan }
}

/**
 * Check if user has access to a feature (server-side)
 */
export async function checkFeatureAccess(businessId: string, feature: Feature): Promise<{ hasAccess: boolean; plan: PlanId }> {
  const plan = await getUserPlan(businessId)
  const hasAccess = hasFeature(plan, feature)

  return { hasAccess, plan }
}

/**
 * Error codes for plan restrictions
 */
export enum PlanError {
  PRODUCT_LIMIT_REACHED = 'PRODUCT_LIMIT_REACHED',
  FEATURE_NOT_ALLOWED = 'FEATURE_NOT_ALLOWED',
  PLAN_REQUIRED = 'PLAN_REQUIRED',
}

/**
 * Create a standardized error response for plan restrictions
 */
export function createPlanErrorResponse(error: PlanError, plan: PlanId, message?: string) {
  const messages: Record<PlanError, string> = {
    [PlanError.PRODUCT_LIMIT_REACHED]: `You've reached your ${plan} plan's product limit. Upgrade to add more products.`,
    [PlanError.FEATURE_NOT_ALLOWED]: `This feature is not available on your ${plan} plan. Upgrade to access it.`,
    [PlanError.PLAN_REQUIRED]: `A subscription is required to access this feature.`,
  }

  return {
    error: error,
    message: message || messages[error],
    currentPlan: plan,
  }
}
