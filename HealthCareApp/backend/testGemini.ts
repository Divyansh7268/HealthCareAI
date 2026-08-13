import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

async function test() {
  try {
    const result = await model.generateContent('Hello');
    console.log('Success:', result.response.text());
  } catch (err: any) {
    console.error('Failed:', err.message);
  }
}
test();
