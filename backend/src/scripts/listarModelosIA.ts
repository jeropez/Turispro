// Uso: npm run modelos-ia
// Lista los modelos que tu cuenta de GroqCloud puede usar, para elegir el valor de GROQ_MODELO.
import 'dotenv/config';
import Groq from 'groq-sdk';

(async () => {
  if (!process.env.GROQ_API_KEY) { console.error('Falta GROQ_API_KEY en backend/.env'); process.exit(1); }
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const modelos = await groq.models.list();
  modelos.data.map((m) => m.id).sort().forEach((id) => console.log(id));
  console.log(`\nModelo actual en .env: ${process.env.GROQ_MODELO ?? '(por defecto: llama-3.3-70b-versatile)'}`);
})().catch((e) => { console.error('No se pudo consultar Groq:', e.status ?? '', e.message); process.exit(1); });
