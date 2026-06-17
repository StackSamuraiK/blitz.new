import request from 'supertest';
import { app } from '../app';

describe('GET /health', () => {
  it('should return 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should include timestamp as ISO string', async () => {
    const res = await request(app).get('/health');
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it('should indicate whether API key is configured', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('apiKeyConfigured');
    expect(typeof res.body.apiKeyConfigured).toBe('boolean');
  });

  it('should include CORS headers when Origin is provided', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  it('should respond to OPTIONS preflight with CORS headers', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');
    // May return 204 or 200 depending on cors middleware config
    expect([200, 204]).toContain(res.status);
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});
