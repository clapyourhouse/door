// Public client configuration. These values are safe to ship in the app:
// the Supabase anon key is public by design (access is limited by RLS and the edge functions),
// and the Maps Embed key must be restricted by HTTP referrer and to the Maps Embed API.
// Leave supabaseUrl empty to run the offline demo.
// stripePaymentLink: the Stripe Payment Link URL for the 7-day pass. While it is empty, the paywall shows
// the "interested" button instead of a buy button.
window.DOOR_CONFIG = {
  supabaseUrl: 'https://ghhozbptwkqhrhdfcwwp.supabase.co',
  supabaseAnonKey: 'sb_publishable_-AIv6P3JcgKOpKS00zVDvA_iC52smBr',
  mapsEmbedKey: 'AIzaSyCd3WzscnSwLgMgag3jc4_ZnFdS-m3i0FE',
  stripePaymentLink: ''
};
