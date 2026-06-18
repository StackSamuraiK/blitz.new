import request from 'supertest';
import { app } from '../app';

describe('POST /template', () => {
  it('should return 200 with prompts for a React prompt', async () => {
    const res = await request(app)
      .post('/template')
      .send({ prompt: 'A landing page with hero section REACT' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('prompts');
    expect(res.body).toHaveProperty('uiPrompts');
    expect(Array.isArray(res.body.prompts)).toBe(true);
    expect(Array.isArray(res.body.uiPrompts)).toBe(true);
  });

  it('should detect Node when prompt ends with NODE', async () => {
    const res = await request(app)
      .post('/template')
      .send({ prompt: 'A REST API with authentication NODE' });
    expect(res.status).toBe(200);
    expect(res.body.uiPrompts[0]).toContain('Node.js backend');
  });

  it('should detect Node when prompt contains keyword "database"', async () => {
    const res = await request(app)
      .post('/template')
      .send({ prompt: 'Build a database backed API' });
    expect(res.status).toBe(200);
    expect(res.body.uiPrompts[0]).toContain('Node.js backend');
  });

  it('should default to React for ambiguous prompts', async () => {
    const res = await request(app)
      .post('/template')
      .send({ prompt: 'A beautiful landing page' });
    expect(res.status).toBe(200);
    expect(res.body.uiPrompts[0]).toContain('React');
  });

  it('should return 400 when prompt is missing', async () => {
    const res = await request(app)
      .post('/template')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Prompt is required');
  });

  it('should return 400 when prompt is empty', async () => {
    const res = await request(app)
      .post('/template')
      .send({ prompt: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Prompt is required');
  });

  it('should handle HTML injection in prompt', async () => {
    const res = await request(app)
      .post('/template')
      .send({ prompt: '<script>alert("xss")</script> Build a landing page REACT' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('prompts');
  });

  it('should handle very long prompts', async () => {
    const longPrompt = 'Build a landing page REACT ' + 'x'.repeat(5000);
    const res = await request(app)
      .post('/template')
      .send({ prompt: longPrompt });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('prompts');
    expect(res.body).toHaveProperty('uiPrompts');
  });

  it('should return 400 when prompt is only whitespace', async () => {
    const res = await request(app)
      .post('/template')
      .send({ prompt: '   \n\n   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Prompt is required');
  });

  it('should detect uppercase NODE keyword', async () => {
    const res = await request(app)
      .post('/template')
      .send({ prompt: 'REST API endpoint NODE' });
    expect(res.status).toBe(200);
    expect(res.body.uiPrompts[0]).toContain('Node.js backend');
  });
});
