import Groq from 'groq-sdk';
import fetch from 'node-fetch';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  // 1. Verificación del Webhook (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'paperbot123';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Verificación fallida');
  }

  // 2. Recepción de mensajes de Instagram (POST)
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'instagram') {
      for (const entry of body.entry) {
        const webhookEvent = entry.messaging?.[0];
        
        if (webhookEvent && webhookEvent.message && webhookEvent.message.text) {
          const senderId = webhookEvent.sender.id;
          const userMessage = webhookEvent.message.text;

          try {
            // Consultar a Groq con la personalidad de Paper Please
            const chatCompletion = await groq.chat.completions.create({
              messages: [
                {
                  role: "system",
                  content: "Eres el asistente virtual amigable de 'Paper Please', un emprendimiento de impresión y mercancía personalizada (posters, stickers, Polaroids, photocards, llaveros acrílicos y ropa personalizada). Responde de forma amable, clara y directa a los clientes en Instagram."
                },
                { role: "user", content: userMessage }
              ],
              model: "llama-3.3-70b-versatile",
            });

            const botReply = chatCompletion.choices[0]?.message?.content || "¡Hola! Gracias por escribirnos a Paper Please. ¿En qué podemos ayudarte hoy?";

            // Enviar la respuesta de vuelta a Instagram
            await sendInstagramMessage(senderId, botReply);

          } catch (error) {
            console.error("Error procesando con Groq o Instagram:", error);
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }

    return res.status(404).send('Not Found');
  }
}

async function sendInstagramMessage(recipientId, messageText) {
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: messageText }
    })
  });
}
