const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "bea_verify_token";

// Webhook verification (Meta requirement)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Incoming messages
app.post("/webhook", async (req, res) => {
  const message =
    req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) return res.sendStatus(200);

  const text = message.text?.body || "";
  const from = message.from;

  // 🔥 Replace with your exact trigger phrase
  if (text.includes("BEA_TRIGGER_PHRASE")) {
    await axios.post(
      `https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: {
          body: "Here is the course breakdown link:\nhttps://yourlink.com"
        }
      },
      {
        headers: {
          Authorization: `Bearer YOUR_ACCESS_TOKEN`,
          "Content-Type": "application/json"
        }
      }
    );
  }

  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});