import * as dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Models:');
    if (data.models) {
      data.models.forEach((m: any) => console.log(m.name, m.supportedGenerationMethods));
    } else {
      console.log(data);
    }
  } catch (err) {
    console.error(err);
  }
}
listModels();
