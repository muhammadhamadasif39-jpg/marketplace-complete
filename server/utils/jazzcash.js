const crypto = require("crypto");

// JazzCash "Hosted Checkout Page" (HCP) integration.
// Docs pattern: merchant builds a signed form, the browser auto-submits it to JazzCash's
// hosted page, the customer pays there, then JazzCash redirects back AND calls your
// server-to-server callback URL to confirm the result.
//
// IMPORTANT: Field names below follow JazzCash's standard HCP spec used across most
// integrations, but Jazz occasionally tweaks fields per merchant tier - cross-check
// against the integration PDF in your JazzCash merchant dashboard before going live.

const isProduction = process.env.JAZZCASH_ENV === "production";
const BASE_URL = isProduction
  ? "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/"
  : "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";

// Formats a JS Date as JazzCash's required yyyyMMddHHmmss string
function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

// JazzCash's secure hash: HMAC-SHA256 over all pp_ fields (sorted alphabetically by key,
// values joined with "&"), using the Integrity Salt as both the key and a leading value.
function generateSecureHash(fields, integritySalt) {
  const sortedKeys = Object.keys(fields).sort();
  const valueString = sortedKeys.map((key) => fields[key]).join("&");
  const signedString = `${integritySalt}&${valueString}`;
  return crypto.createHmac("sha256", integritySalt).update(signedString).digest("hex").toUpperCase();
}

// Builds the full set of form fields to auto-submit to JazzCash's hosted page.
// `order` needs: _id, total, paymentTxnRef; `returnUrl` is where JazzCash sends the customer back.
function buildJazzCashPayload(order, returnUrl) {
  const merchantId = process.env.JAZZCASH_MERCHANT_ID;
  const password = process.env.JAZZCASH_PASSWORD;
  const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT;

  if (!merchantId || !password || !integritySalt) {
    throw new Error("JazzCash credentials are not configured (check .env)");
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour to complete payment

  // Amount must be in paisas (i.e. Rs. 100 -> "10000"), no decimal point
  const amountInPaisas = Math.round(order.total * 100).toString();

  const fields = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: merchantId,
    pp_Password: password,
    pp_TxnRefNo: order.paymentTxnRef,
    pp_Amount: amountInPaisas,
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: formatDateTime(now),
    pp_BillReference: order.paymentTxnRef,
    pp_Description: `Order ${order.paymentTxnRef}`,
    pp_TxnExpiryDateTime: formatDateTime(expiry),
    pp_ReturnURL: returnUrl,
  };

  const secureHash = generateSecureHash(fields, integritySalt);

  return { url: BASE_URL, fields: { ...fields, pp_SecureHash: secureHash } };
}

// Verifies the secure hash on JazzCash's callback so we know the response is genuinely
// from JazzCash and hasn't been tampered with in transit.
function verifyJazzCashResponse(responseFields) {
  const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT;
  const { pp_SecureHash, ...rest } = responseFields;
  const expectedHash = generateSecureHash(rest, integritySalt);
  return expectedHash === pp_SecureHash;
}

module.exports = { buildJazzCashPayload, verifyJazzCashResponse };
