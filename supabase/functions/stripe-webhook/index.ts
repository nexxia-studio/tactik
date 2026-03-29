import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20'
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

// Détermine le nombre de licences selon le price_id Stripe
function getLicenseCount(priceId: string): number {
  const licenseMap: Record<string, number> = {
    'price_solo_monthly': 1,
    'price_solo_yearly': 1,
    'price_solo_plus_monthly': 1,
    'price_solo_plus_yearly': 1,
    'price_club_2_monthly': 2,
    'price_club_2_yearly': 2,
    'price_club_3_monthly': 3,
    'price_club_3_yearly': 3,
    'price_club_5_monthly': 5,
    'price_club_5_yearly': 5,
    'price_club_8_monthly': 8,
    'price_club_8_yearly': 8,
    'price_club_10_monthly': 10,
    'price_club_10_yearly': 10,
  }
  return licenseMap[priceId] ?? 1
}

// Détermine le plan selon le price_id
function getPlan(priceId: string): 'solo' | 'club' {
  return priceId.includes('club') ? 'club' : 'solo'
}

// Upsert subscription dans Supabase
async function upsertSubscription(
  organizationId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  status: string,
  priceId: string,
  currentPeriodStart: number,
  currentPeriodEnd: number
) {
  const licenseCount = getLicenseCount(priceId)
  const plan = getPlan(priceId)

  await supabase
    .from('subscriptions')
    .upsert({
      organization_id: organizationId,
      plan,
      status,
      license_count: licenseCount,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'organization_id' })
}

// Récupère l'organization_id depuis les metadata Stripe
function getOrganizationId(obj: { metadata?: Record<string, string> }): string | null {
  return obj.metadata?.organization_id ?? null
}

// Handlers par événement
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = getOrganizationId(session)
  if (!organizationId) throw new Error('Missing organization_id in session metadata')

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  const priceId = subscription.items.data[0]?.price.id ?? ''

  await upsertSubscription(
    organizationId,
    session.customer as string,
    subscription.id,
    'active',
    priceId,
    subscription.current_period_start,
    subscription.current_period_end
  )
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const organizationId = getOrganizationId(subscription)
  if (!organizationId) return

  const priceId = subscription.items.data[0]?.price.id ?? ''

  await upsertSubscription(
    organizationId,
    subscription.customer as string,
    subscription.id,
    subscription.status,
    priceId,
    subscription.current_period_start,
    subscription.current_period_end
  )
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const organizationId = getOrganizationId(subscription)
  if (!organizationId) return

  const priceId = subscription.items.data[0]?.price.id ?? ''

  await upsertSubscription(
    organizationId,
    subscription.customer as string,
    subscription.id,
    subscription.status,
    priceId,
    subscription.current_period_start,
    subscription.current_period_end
  )
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organizationId = getOrganizationId(subscription)
  if (!organizationId) return

  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', invoice.subscription as string)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
  const priceId = subscription.items.data[0]?.price.id ?? ''

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      license_count: getLicenseCount(priceId),
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', invoice.subscription as string)
}

// Fonction principale
Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error(`Error handling ${event.type}:`, error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
