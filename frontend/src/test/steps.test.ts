import { parseXml } from '../steps';
import { StepType } from '../types';

describe('parseXml', () => {
  it('should extract file actions from valid XML', () => {
    const xml = `<boltArtifact id="test" title="Test">
      <boltAction type="file" filePath="src/App.tsx">console.log('hello');</boltAction>
    </boltArtifact>`;
    const steps = parseXml(xml);
    expect(steps.length).toBe(2); // artifact step + file step
    expect(steps[1].type).toBe(StepType.CreateFile);
    expect(steps[1].path).toBe('src/App.tsx');
    expect(steps[1].code).toContain("console.log('hello')");
  });

  it('should extract shell actions', () => {
    const xml = `<boltArtifact id="test" title="Test">
      <boltAction type="shell">npm install</boltAction>
    </boltArtifact>`;
    const steps = parseXml(xml);
    expect(steps.length).toBe(2);
    expect(steps[1].type).toBe(StepType.RunScript);
    expect(steps[1].code).toBe('npm install');
  });

  it('should handle truncated XML without closing tag', () => {
    const xml = `<boltArtifact id="test" title="Test">
      <boltAction type="file" filePath="test.txt">content</boltAction></boltArtifact>`;
    const steps = parseXml(xml);
    expect(steps.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle multiple actions', () => {
    const xml = `<boltArtifact id="test" title="Multi">
      <boltAction type="file" filePath="a.ts">// a</boltAction>
      <boltAction type="file" filePath="b.ts">// b</boltAction>
      <boltAction type="shell">echo done</boltAction>
    </boltArtifact>`;
    const steps = parseXml(xml);
    // Expected: 1 artifact step + 3 action steps = 4
    expect(steps.length).toBe(4);
  });

  it('should return a default step for completely malformed input', () => {
    const steps = parseXml('just random text without any bolt tags');
    expect(steps.length).toBe(1); // still creates a default artifact step
    expect(steps[0].title).toBe('Project Files');
  });
});
