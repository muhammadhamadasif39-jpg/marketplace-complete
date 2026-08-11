const crypto = require("crypto");

// Easypaisa hosted checkout integration.
//
// IMPORTANT: Easypaisa has a few different integration products (Open API, Instant Pay,
// hosted checkout) and field names vary between them more than JazzCash's. The fields below
// follow the commonly-used hosted-checkout pattern (storeId + HMAC hash). Confirm the exact
// field names and hashing rule against the PDF your Easypaisa relationship manager gave you -
// this is the part most likely to need small adjustments for your specific account.

const isProduction = process.env.EASYPAISA_ENV === "production";
const BASE_URL = isProduction
  ? "https://easypay.easypaisa.com.pk/easypay/Index.jsf"
  : "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf";

function formatExpiry(date) {
  // Easypaisa expects DD-MM-YYYY HH:mm:ss
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function generateHash(fields, hashKey) {
  const sortedKeys = Object.keys(fields).sort();
  const valueString = sortedKeys.map((key) => `${key}=${fields[key]}`).join("&");
  return crypto.createHmac("sha256", hashKey).update(valueString).digest("hex");
}

function buildEasypaisaPayload(order, returnUrl) {
  const storeId = process.env.EASYPAISA_STORE_ID;
  const hashKey = process.env.EASYPAISA_HASH_KEY;

  if (!storeId || !hashKey) {
    throw new Error("Easypaisa credentials are not configured (check .env)");
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + 60 * 60 * 1000);

  const fields = {
    storeId,
    amount: order.total.toFixed(2),
    postBackURL: returnUrl,
    orderRefNum: order.paymentTxnRef,
    expiryDate: formatExpiry(expiry),
    autoRedirect: "1",
    paymentMethod: "InitialRequest", // shows Easypaisa's own method picker (wallet/card/bank)
  };

  const merchantHashedReq = generateHash(fields, hashKey);

  return { url: BASE_URL, fields: { ...fields, merchantHashedReq } };
}

function verifyEasypaisaResponse(responseFields) {
  const hashKey = process.env.EASYPAISA_HASH_KEY;
  const { merchantHashedReq, ...rest } = responseFields;
  const expectedHash = generateHash(rest, hashKey);
  return expectedHash === merchantHashedReq;
}

module.exports = { buildEasypaisaPayload, verifyEasypaisaResponse };
