import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)
const FROM = 'Tactik <hello@tactik.coach>'

// Templates multilingues
const templates = {
  welcome: {
    fr: {
      subject: 'Bienvenue sur Tactik 👋',
      html: (name: string) => `
        <h2>Bonjour ${name},</h2>
        <p>Bienvenue sur <strong>Tactik</strong> — la plateforme dédiée aux entraîneurs de football amateur.</p>
        <p>Votre compte est prêt. Connectez-vous dès maintenant pour configurer votre équipe.</p>
        <p><a href="https://app.tactik.coach" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Accéder à Tactik Coach</a></p>
        <p>À très vite,<br>L'équipe Tactik</p>
      `
    },
    nl: {
      subject: 'Welkom bij Tactik 👋',
      html: (name: string) => `
        <h2>Hallo ${name},</h2>
        <p>Welkom bij <strong>Tactik</strong> — het platform voor amateurvoetbalcoaches.</p>
        <p>Uw account is klaar. Log nu in om uw team in te stellen.</p>
        <p><a href="https://app.tactik.coach" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Naar Tactik Coach</a></p>
        <p>Tot snel,<br>Het Tactik-team</p>
      `
    },
    en: {
      subject: 'Welcome to Tactik 👋',
      html: (name: string) => `
        <h2>Hello ${name},</h2>
        <p>Welcome to <strong>Tactik</strong> — the platform for amateur football coaches.</p>
        <p>Your account is ready. Log in now to set up your team.</p>
        <p><a href="https://app.tactik.coach" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Go to Tactik Coach</a></p>
        <p>See you soon,<br>The Tactik team</p>
      `
    }
  },

  invitation_fine_manager: {
    fr: {
      subject: 'Vous êtes invité à gérer les amendes de votre équipe',
      html: (name: string, teamName: string, inviteUrl: string) => `
        <h2>Bonjour ${name},</h2>
        <p>Votre entraîneur vous invite à gérer les amendes de <strong>${teamName}</strong> sur Tactik.</p>
        <p>Acceptez l'invitation pour accéder à la caisse de l'équipe.</p>
        <p><a href="${inviteUrl}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Accepter l'invitation</a></p>
        <p>L'équipe Tactik</p>
      `
    },
    nl: {
      subject: 'U bent uitgenodigd om de boetes van uw team te beheren',
      html: (name: string, teamName: string, inviteUrl: string) => `
        <h2>Hallo ${name},</h2>
        <p>Uw coach nodigt u uit om de boetes van <strong>${teamName}</strong> te beheren op Tactik.</p>
        <p>Accepteer de uitnodiging om toegang te krijgen tot de teamkas.</p>
        <p><a href="${inviteUrl}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Uitnodiging accepteren</a></p>
        <p>Het Tactik-team</p>
      `
    },
    en: {
      subject: 'You\'re invited to manage your team\'s fines',
      html: (name: string, teamName: string, inviteUrl: string) => `
        <h2>Hello ${name},</h2>
        <p>Your coach invites you to manage the fines of <strong>${teamName}</strong> on Tactik.</p>
        <p>Accept the invitation to access the team treasury.</p>
        <p><a href="${inviteUrl}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Accept invitation</a></p>
        <p>The Tactik team</p>
      `
    }
  },

  subscription_confirmed: {
    fr: {
      subject: 'Votre abonnement Tactik est actif ✅',
      html: (name: string, plan: string, renewalDate: string) => `
        <h2>Bonjour ${name},</h2>
        <p>Votre abonnement <strong>Tactik ${plan}</strong> est maintenant actif.</p>
        <p>Prochain renouvellement : <strong>${renewalDate}</strong></p>
        <p><a href="https://app.tactik.coach/admin/abonnement" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Gérer mon abonnement</a></p>
        <p>Merci pour votre confiance,<br>L'équipe Tactik</p>
      `
    },
    nl: {
      subject: 'Uw Tactik-abonnement is actief ✅',
      html: (name: string, plan: string, renewalDate: string) => `
        <h2>Hallo ${name},</h2>
        <p>Uw abonnement <strong>Tactik ${plan}</strong> is nu actief.</p>
        <p>Volgende verlenging: <strong>${renewalDate}</strong></p>
        <p><a href="https://app.tactik.coach/admin/abonnement" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Abonnement beheren</a></p>
        <p>Bedankt voor uw vertrouwen,<br>Het Tactik-team</p>
      `
    },
    en: {
      subject: 'Your Tactik subscription is active ✅',
      html: (name: string, plan: string, renewalDate: string) => `
        <h2>Hello ${name},</h2>
        <p>Your <strong>Tactik ${plan}</strong> subscription is now active.</p>
        <p>Next renewal: <strong>${renewalDate}</strong></p>
        <p><a href="https://app.tactik.coach/admin/abonnement" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Manage my subscription</a></p>
        <p>Thank you for your trust,<br>The Tactik team</p>
      `
    }
  },

  payment_failed: {
    fr: {
      subject: '⚠️ Problème de paiement — Action requise',
      html: (name: string) => `
        <h2>Bonjour ${name},</h2>
        <p>Nous n'avons pas pu encaisser votre paiement Tactik.</p>
        <p>Veuillez mettre à jour votre moyen de paiement pour conserver l'accès à votre abonnement.</p>
        <p><a href="https://app.tactik.coach/admin/abonnement" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Mettre à jour mon paiement</a></p>
        <p>L'équipe Tactik</p>
      `
    },
    nl: {
      subject: '⚠️ Betalingsprobleem — Actie vereist',
      html: (name: string) => `
        <h2>Hallo ${name},</h2>
        <p>We konden uw Tactik-betaling niet incasseren.</p>
        <p>Werk uw betaalmethode bij om toegang tot uw abonnement te behouden.</p>
        <p><a href="https://app.tactik.coach/admin/abonnement" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Betaling bijwerken</a></p>
        <p>Het Tactik-team</p>
      `
    },
    en: {
      subject: '⚠️ Payment issue — Action required',
      html: (name: string) => `
        <h2>Hello ${name},</h2>
        <p>We were unable to process your Tactik payment.</p>
        <p>Please update your payment method to keep access to your subscription.</p>
        <p><a href="https://app.tactik.coach/admin/abonnement" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Update payment</a></p>
        <p>The Tactik team</p>
      `
    }
  },

  renewal_reminder: {
    fr: {
      subject: 'Votre abonnement Tactik expire dans 7 jours',
      html: (name: string, plan: string, renewalDate: string) => `
        <h2>Bonjour ${name},</h2>
        <p>Votre abonnement <strong>Tactik ${plan}</strong> sera renouvelé le <strong>${renewalDate}</strong>.</p>
        <p>Aucune action requise — le renouvellement est automatique.</p>
        <p>Si vous souhaitez modifier ou annuler votre abonnement, faites-le avant cette date.</p>
        <p><a href="https://app.tactik.coach/admin/abonnement" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Gérer mon abonnement</a></p>
        <p>L'équipe Tactik</p>
      `
    },
    nl: {
      subject: 'Uw Tactik-abonnement verloopt over 7 dagen',
      html: (name: string, plan: string, renewalDate: string) => `
        <h2>Hallo ${name},</h2>
        <p>Uw abonnement <strong>Tactik ${plan}</strong> wordt verlengd op <strong>${renewalDate}</strong>.</p>
        <p>Geen actie vereist — verlenging is automatisch.</p>
        <p>Als u uw abonnement wilt wijzigen of annuleren, doe dit dan voor deze datum.</p>
        <p><a href="https://app.tactik.coach/admin/abonnement" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Abonnement beheren</a></p>
        <p>Het Tactik-team</p>
      `
    },
    en: {
      subject: 'Your Tactik subscription expires in 7 days',
      html: (name: string, plan: string, renewalDate: string) => `
        <h2>Hello ${name},</h2>
        <p>Your <strong>Tactik ${plan}</strong> subscription will renew on <strong>${renewalDate}</strong>.</p>
        <p>No action required — renewal is automatic.</p>
        <p>If you wish to modify or cancel your subscription, do so before this date.</p>
        <p><a href="https://app.tactik.coach/admin/abonnement" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Manage my subscription</a></p>
        <p>The Tactik team</p>
      `
    }
  }
}

// Envoie un email
async function sendEmail(
  to: string,
  templateKey: string,
  lang: 'fr' | 'nl' | 'en',
  params: Record<string, string>
) {
  const template = templates[templateKey as keyof typeof templates]
  if (!template) throw new Error(`Template ${templateKey} not found`)

  const localized = template[lang]
  if (!localized) throw new Error(`Language ${lang} not found for ${templateKey}`)

  const html = (localized.html as Function)(...Object.values(params))

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: localized.subject,
    html
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
  return data
}

// Fonction principale
Deno.serve(async (req) => {
  try {
    const body = await req.json()
    const { to, template, lang = 'fr', params = {} } = body

    if (!to || !template) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields: to, template' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const validLangs = ['fr', 'nl', 'en']
    const safeLang = validLangs.includes(lang) ? lang : 'fr'

    const data = await sendEmail(to, template, safeLang as 'fr' | 'nl' | 'en', params)

    return new Response(
      JSON.stringify({ ok: true, data }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('send-email error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
