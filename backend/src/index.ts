import 'dotenv/config';
import { app } from './app';

// Validate API key on startup
if (!process.env.GEMINI_API_KEY) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ ERROR: GEMINI_API_KEY is not set in environment variables!');
    console.error('Please create a .env file with your Gemini API key');
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  //@ts-ignore
  console.log(`✅ Gemini API Key loaded: ${process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + "..." : "MISSING"}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
