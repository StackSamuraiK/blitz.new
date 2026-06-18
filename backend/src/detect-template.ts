export type TemplateType = 'react' | 'node';

const NODE_KEYWORDS = [
  'node', 'backend', 'api', 'server', 'express',
  'database', 'mongodb', 'postgres', 'sql', 'rest',
  'graphql', 'endpoint', 'route', 'middleware',
  'authentication', 'jwt',
];

export function detectTemplate(prompt: string): TemplateType {
  const lower = prompt.toLowerCase().trim();
  if (lower.endsWith('node')) return 'node';
  if (lower.endsWith('react')) return 'react';
  for (const keyword of NODE_KEYWORDS) {
    if (lower.includes(keyword)) return 'node';
  }
  return 'react';
}
