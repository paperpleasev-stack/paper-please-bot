const express = require('express');
const axios = require('axios');
const Groq = require('groq-sdk');

const app = express();
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object === 'instagram') {
    res.status(200).send('EVENT_RECEIVED'); // Responder rápido a Meta
    for (let entry of body.entry) {
      for (let event of entry.messaging) {
        if (event.message && event.message.text) {
           await processMessage(event.sender.id, event.message.text);
        }
      }
    }
  } else {
    res.sendStatus(404);
  }
});

async function processMessage(senderId, userText) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Eres el asistente virtual de Paper please. Responde DMs con precios exactos e información. Anima al cliente a confirmar su pedido o enviar su diseño. Usa un tono juvenil, creativo y cercano con emojis (🖤, ✨). Si preguntan algo fuera de tu contexto, avisa amablemente que un humano los atenderá pronto. Catálogo: Pósters A4 (220g): 1x$1.50, 2x$2.80, 3x$3.80. Polaroids 7x10cm (opción holográfico): 1x$0.50, 9x$2.50, 18x$4.50. Stickers (Hoja A4 troquelada): $3.50. Rinden 3x3cm=30, 4x4cm=20, 5x5cm=12, 6x6cm=8. Tarjetas (260g, 100und): $18. Extras p/100und: Laminado +$7, Puntas redondas +$3. Entregas personales en Barinas y envíos nacionales."
        },
        { role: "user", content: userText }
      ],
      model: "llama3-8b-8192", 
    });

    const reply = chatCompletion.choices[0]?.message?.content;
    await sendMessage(senderId, reply);
  } catch (error) {
    console.error("Error en Groq:", error);
  }
}

async function sendMessage(recipientId, text) {
  try {
    await axios.post(
      `https://graph.instagram.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: recipientId },
        message: { text: text }
      }
    );
  } catch (error) {
    console.error("Error en Meta:", error);
  }
}

module.exports = app;
