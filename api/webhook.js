export default function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'paperbot123';

    if (mode && token === VERIFY_TOKEN && mode === 'subscribe') {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Verificación fallida');
  }

  return res.status(200).send('OK');
}
