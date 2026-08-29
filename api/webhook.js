export default function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Imprimir en los logs de Vercel lo que llegó exactamente
    console.log("MODO RECIBIDO:", mode);
    console.log("TOKEN RECIBIDO:", token);
    console.log("CHALLENGE RECIBIDO:", challenge);

    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'paperbot123';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED EXITOSO');
      return res.status(200).send(challenge);
    }
    
    console.log('Fallo de validación. Token esperado:', VERIFY_TOKEN, 'Token recibido:', token);
    return res.status(403).send(`Verificación fallida. Recibido token: ${token}`);
  }

  return res.status(200).send('OK');
}
