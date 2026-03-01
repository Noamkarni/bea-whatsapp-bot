const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// Use env vars (Render) — fallback only for local testing
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "bea_verify_token";

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.sendStatus(200);

    const text = message.text?.body || "";
    const from = message.from;

    const trigger = process.env.TRIGGER_PHRASE || "BEA_TRIGGER_PHRASE";
    const normalizedText = text.trim().toLowerCase();
    const normalizedTrigger = String(trigger).trim().toLowerCase();
    if (normalizedText !== normalizedTrigger) return res.sendStatus(200);

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    const replyText =
      process.env.REPLY_TEXT ||
      "Here is the course breakdown link:\nhttps://yourlink.com";

    if (!token || !phoneNumberId) {
      console.error("Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID in env vars");
      return res.sendStatus(200);
    }

    await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: { body: replyText },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.sendStatus(200);
  } catch (err) {
    console.error(err?.response?.data || err.message);
    return res.sendStatus(200);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});