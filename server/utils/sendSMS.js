// Sends an SMS via Twilio. If Twilio isn't configured (common during local dev),
// logs the message to the console instead of throwing - so the rest of the app
// keeps working before you've set up an SMS provider.
const sendSMS = async ({ to, body }) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log("\n📱 [DEV MODE] SMS provider not configured. SMS would have been sent:");
    console.log(`To: ${to}\nMessage: ${body}\n`);
    return { devMode: true };
  }

  // Lazily require twilio only when actually configured, so the package doesn't
  // need to be installed/loaded at all for people who never set up SMS.
  const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  await twilio.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
};

module.exports = sendSMS;
