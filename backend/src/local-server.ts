import 'dotenv/config';
import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 EventMate AI Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Bedrock Model: ${process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0'}`);
  console.log(`===============================================`);
});
