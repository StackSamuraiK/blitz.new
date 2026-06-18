import request from 'supertest';
import { app } from '../app';

// Mock Google Generative AI so tests never call the real API
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn().mockResolvedValue({
    response: {
      text: () => '<boltArtifact><boltAction type="file" filePath="test.txt">content</boltAction></boltArtifact>',
    },
  });
  const mockGetGenerativeModel = jest.fn().mockReturnValue({
    generateContent: mockGenerateContent,
  });
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
  };
});

describe('POST /chat', () => {
  it('should return 200 with AI response for valid messages', async () => {
    const res = await request(app)
      .post('/chat')
      .send({
        messages: [
          { role: 'user', content: 'Build a React app' },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('response');
    expect(typeof res.body.response).toBe('string');
  });

  it('should return 400 when messages is missing', async () => {
    const res = await request(app)
      .post('/chat')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Messages array is required');
  });

  it('should return 400 when messages is an empty array', async () => {
    const res = await request(app)
      .post('/chat')
      .send({ messages: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Messages array is required');
  });

  it('should return 400 when messages is not an array', async () => {
    const res = await request(app)
      .post('/chat')
      .send({ messages: 'not-an-array' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Messages array is required');
  });

  it('should return 500 when Gemini API call fails', async () => {
    // Override the mock for this test only
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const mockInstance = GoogleGenerativeAI();
    mockInstance.getGenerativeModel().generateContent.mockRejectedValueOnce(
      new Error('API quota exceeded')
    );

    const res = await request(app)
      .post('/chat')
      .send({
        messages: [{ role: 'user', content: 'test' }],
      });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('API quota exceeded');
  });
});
