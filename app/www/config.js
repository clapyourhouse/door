// Public client configuration. These values are safe to ship in the app:
// the Supabase anon key is public by design (access is limited by RLS and the edge functions),
// and the Maps Embed key must be restricted by HTTP referrer and to the Maps Embed API.
// Leave supabaseUrl empty to run the offline demo.
// stripePaymentLink (JA, ¥980) / stripePaymentLinkEn (EN, US$6.99): the Stripe Payment Link URLs for the 7-day pass. While it is empty, the paywall shows
// the "interested" button instead of a buy button.
window.DOOR_CONFIG = {
  supabaseUrl: 'https://ghhozbptwkqhrhdfcwwp.supabase.co',
  supabaseAnonKey: 'sb_publishable_-AIv6P3JcgKOpKS00zVDvA_iC52smBr',
  mapsEmbedKey: 'AIzaSyCd3WzscnSwLgMgag3jc4_ZnFdS-m3i0FE',
  stripePaymentLink: 'https://buy.stripe.com/9B67sN2PZaYp0EX1mG1gs00',
  stripePaymentLinkEn: 'https://buy.stripe.com/5kQ14p2PZ4A187p9Tc1gs01'
};
