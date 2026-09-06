/**
 * Safepay Client — card-based (Visa/Mastercard) subscription payments
 * =====================================================================
 * Kyun Safepay: Asif ne khud manga tha ke JazzCash/Easypaisa jaisa koi
 * "personal wallet number dikha kar khud payment lena" wala tareeqa NA ho
 * (log complain kar ke wallet account block karwa dete hain — ye ek asal,
 * jaana-mana masla hai). Iske bajaye asal card-based payment gateway
 * chahiye — jaisa India mein Razorpay/Cashfree jaisi companies card/UPI
 * payments collect karti hain, Pakistan mein iske barabar Safepay (YC-backed)
 * aur PayFast jaisi SBP-regulated companies hain.
 *
 * Safepay is liye chuna gaya (research se confirm hua, guess nahi):
 *   - Visa/Mastercard cards accept karta hai, hosted checkout ke zariye —
 *     card number kabhi Zaicha ke server se nahi guzarta (Safepay khud
 *     PCI-DSS compliant hai), is liye humein card data handle/store karne
 *     ki bilkul zaroorat nahi.
 *   - Onboarding individual/sole-proprietor (sirf CNIC + bank certificate)
 *     ke liye bhi khula hai — PayFast jaisi "enterprise-paced" company ki
 *     tarah registered company maangna zaroori nahi
 *     (safepay.helpscoutdocs.com/article/102).
 *
 * SECURITY NOTE (Prokerala/DATABASE_URL/JWT_SECRET wala usool yahan bhi):
 * asal SAFEPAY_API_KEY/SAFEPAY_WEBHOOK_SECRET sirf .env se aate hain, kabhi
 * is file mein hardcode nahi hue, na Claude ne kabhi asal values dekhi/type
 * ki hain. In credentials ke liye khud Safepay (getsafepay.pk) par sign up
 * karna, apna CNIC/bank details submit karna, aur milne wali keys apne
 * hath se .env mein daalna zaroori hai — README mein poora tareeqa hai.
 */

'use strict';

function isSafepayConfigured() {
  return !!process.env.SAFEPAY_API_KEY;
}

let safepayInstance = null;
function getClient() {
  if (!isSafepayConfigured()) {
    throw new Error('SAFEPAY_API_KEY .env mein nahi mili — .env.example dekhein aur pehle Safepay par sign up karein.');
  }
  if (!safepayInstance) {
    // `@sfpy/node-sdk` package.json mein add ki gayi hai — pehli baar
    // `npm install` chalane par apne aap aa jayegi.
    const { Safepay } = require('@sfpy/node-sdk');
    safepayInstance = new Safepay({
      environment: process.env.SAFEPAY_ENVIRONMENT || 'sandbox', // 'production' jab live jana ho
      apiKey: process.env.SAFEPAY_API_KEY,
      webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET || undefined,
    });
  }
  return safepayInstance;
}

/**
 * createCheckoutUrl — ek naya payment token bana kar Safepay ka hosted
 * checkout page ka URL wapas karta hai. Frontend user ko seedha isi URL par
 * bhej deta hai (redirect) — card number waghera sab kuch Safepay ke apne
 * page par bharta hai, hamare server tak kabhi nahi aata.
 *
 * amount: PAISE/CENTS mein (jaise Safepay docs mein 10000 = PKR 100.00) —
 * caller (server.js) hamesha rupees ko *100 kar ke bheje.
 */
async function createCheckoutUrl({ amount, currency, orderId, redirectUrl, cancelUrl }) {
  const safepay = getClient();
  const { token } = await safepay.payments.create({ amount, currency: currency || 'PKR' });
  const url = safepay.checkout.create({
    token,
    orderId,
    redirectUrl,
    cancelUrl,
    source: 'custom',
    webhooks: true,
  });
  return url;
}

/**
 * verifyWebhook — Safepay jab payment complete/fail hone par hamare
 * SAFEPAY_WEBHOOK_URL ko call karta hai, us request ki signature verify
 * karta hai (taake koi bhi khud se fake "payment ho gayi" request na bhej
 * sake). Sirf tab true aaye ga jab SAFEPAY_WEBHOOK_SECRET sahi set ho.
 */
async function verifyWebhook(req) {
  const safepay = getClient();
  return safepay.verify.webhook(req);
}

module.exports = {
  isSafepayConfigured,
  createCheckoutUrl,
  verifyWebhook,
};
