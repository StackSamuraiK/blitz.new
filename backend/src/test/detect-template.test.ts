import { detectTemplate } from '../detect-template';

describe('detectTemplate', () => {
  it('should detect node by explicit suffix', () => {
    expect(detectTemplate('Build an API NODE')).toBe('node');
  });

  it('should detect react by default for ambiguous prompts', () => {
    expect(detectTemplate('A landing page REACT')).toBe('react');
  });

  it('should detect node by keyword', () => {
    expect(detectTemplate('Build a database backend')).toBe('node');
    expect(detectTemplate('Create a REST API')).toBe('node');
    expect(detectTemplate('Server with express')).toBe('node');
  });

  it('should default to react for ambiguous prompts', () => {
    expect(detectTemplate('A beautiful landing page')).toBe('react');
    expect(detectTemplate('Build a portfolio site')).toBe('react');
  });

  it('should be case insensitive', () => {
    expect(detectTemplate('Build an api')).toBe('node');
    expect(detectTemplate('Build an API')).toBe('node');
  });

  it('should return node for "node" keyword in middle of sentence', () => {
    expect(detectTemplate('a node.js application')).toBe('node');
  });

  it('should default to react for empty string', () => {
    expect(detectTemplate('')).toBe('react');
  });

  it('should handle very long prompts without crashing', () => {
    const longPrompt = 'node ' + 'x'.repeat(10000);
    expect(detectTemplate(longPrompt)).toBe('node');
  });

  it('should detect node from "database" keyword', () => {
    expect(detectTemplate('Build a database')).toBe('node');
  });

  it('should detect node from "api" keyword in uppercase', () => {
    expect(detectTemplate('Build a REST API server')).toBe('node');
  });
});
