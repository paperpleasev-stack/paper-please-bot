const Groq = require('groq-sdk');
const axios = require('axios');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'paperbot123';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

module.exports = async (req, res) => {
  // 1. Verificación del Webhook (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        return res.status(200).send(challenge);
      } else {
        return res.status(403).send('Token no coincide');
      }
    }
    return res.status(400).send('Faltan parametros');
  }

  // 2. Recepción de mensajes (POST)
  if (req.method === 'POST') {
    const body = req.body;
    if (body.object === 'instagram' || body.object === 'page') {
      res.status(200).send('EVENT_RECEIVED'); // Responder rápido a Meta

      if (body.entry) {
        for (const entry of body.entry) {
          const webhook_event = entry.messaging ? entry.messaging[0] : null;
          if (webhook_event && webhook_event.message && webhook_event.message.text) {
            const senderId = webhook_event.sender.id;
            const messageText = webhook_event.message.text;

            try {
              const chatCompletion = await groq.chat.completions.create({
                messages: [
                  {
                    role: 'system',
                    content: 'Eres el asistente virtual oficial de Paper Please, una tienda de impresiones personalizadas y mercancía creativa en Barinas (posters, stickers, polaroids, cuadros, etc.). Responde de forma cordial, moderna y concisa.'
                  },
                  { role: 'user', content: messageText }
                ],
                model: 'llama-3.3-70b-versatile',
              });

              const replyText = chatCompletion.choices[0]?.message?.content || '¡Hola! Gracias por escribir a Paper Please.';

              await axios.post(
                `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                {
                  recipient: { id: senderId },
                  message: { text: replyText }
                }
              );
            } catch (err) {
              console.error('Error al procesar mensaje:', err.message);
            }
          }
        }
      }
      return;
    }
    return res.status(404).send('Not Found');
  }

  return res.status(405).send('Method Not Allowed');
};
