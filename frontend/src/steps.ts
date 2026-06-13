import { Step, StepType } from './types';

/*
 * Parse input XML and convert it into steps.
 * Eg: Input -
 * <boltArtifact id="project-import" title="Project Files">
 *  <boltAction type="file" filePath="eslint.config.js">
 *      import js from '@eslint/js';\nimport globals from 'globals';\n
 *  </boltAction>
 * <boltAction type="shell">
 *      node index.js
 * </boltAction>
 * </boltArtifact>
 *
 * Output -
 * [{
 *      title: "Project Files",
 *      status: "Pending"
 * }, {
 *      title: "Create eslint.config.js",
 *      type: StepType.CreateFile,
 *      code: "import js from '@eslint/js';\nimport globals from 'globals';\n"
 * }, {
 *      title: "Run command",
 *      code: "node index.js",
 *      type: StepType.RunScript
 * }]
 *
 * The input can have strings in the middle they need to be ignored
 */

// Known attribute names on <boltAction>. Some prompt templates emit `path`
// instead of `filePath`; we accept both.
const ATTR_TYPE = 'type';
const ATTR_PATH_KEYS = new Set(['filepath', 'filePath', 'path', 'file']);

interface ExtractedAction {
  type: string;
  filePath: string | undefined;
  content: string;
}

// Extract every <boltAction ...>...</boltAction> from a chunk of text, even
// when the wrapper tags are missing, malformed, or the closing tag is absent
// (truncated stream). Tolerant of attribute order, missing type, and missing
// filePath.
function extractActions(xmlContent: string): ExtractedAction[] {
  const actions: ExtractedAction[] = [];

  // Find every opening <boltAction ...> tag, then take everything from there
  // up to the next </boltAction> — or to the end of the string if no closing
  // tag is present (truncation case).
  const openTagRegex = /<boltAction\b([^>]*)>/g;
  const closeTag = '</boltAction>';

  let openMatch: RegExpExecArray | null;
  while ((openMatch = openTagRegex.exec(xmlContent)) !== null) {
    const attrString = openMatch[1];
    const contentStart = openMatch.index + openMatch[0].length;
    const closeIdx = xmlContent.indexOf(closeTag, contentStart);
    const contentEnd = closeIdx === -1 ? xmlContent.length : closeIdx;
    const content = xmlContent.slice(contentStart, contentEnd);
    // If there was a real </boltAction>, jump past it. If not, bail out:
    // any further opening tags would be inside truncated content and
    // indistinguishable from data, so we'd rather return what we have than
    // fabricate steps from noise.
    if (closeIdx === -1) {
      const attrs = parseAttrs(attrString);
      if (attrs) actions.push({ ...attrs, content });
      break;
    }
    openTagRegex.lastIndex = closeIdx + closeTag.length;
    const attrs = parseAttrs(attrString);
    if (attrs) actions.push({ ...attrs, content });
  }

  return actions;
}

// Parse the attribute string of a <boltAction> tag. Returns null if the tag
// is so malformed we can't determine a path (for file actions) or a type.
function parseAttrs(attrString: string): { type: string; filePath: string | undefined } | null {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z_][a-zA-Z0-9_-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = attrRegex.exec(attrString)) !== null) {
    attrs[m[1].toLowerCase()] = m[3] ?? m[4] ?? '';
  }

  // Resolve filePath from any of the known key variants.
  let filePath: string | undefined;
  for (const key of ATTR_PATH_KEYS) {
    if (typeof attrs[key] === 'string' && attrs[key].length > 0) {
      filePath = attrs[key];
      break;
    }
  }

  const type = attrs[ATTR_TYPE] ?? 'file';
  return { type, filePath };
}

// Pick the slice of the response that should be scanned for actions.
// Tries: (1) full <boltArtifact>...</boltArtifact> wrapper; (2) just an
// opening <boltArtifact> with no closing tag (truncated); (3) the whole
// response as a last resort.
function selectScanTarget(response: string): {
  content: string;
  artifactTitle: string | null;
  hadWrapper: boolean;
  hadClosingTag: boolean;
} {
  const openMatch = response.match(/<boltArtifact\b[^>]*>/);
  if (!openMatch) {
    return { content: response, artifactTitle: null, hadWrapper: false, hadClosingTag: false };
  }
  const openIdx = openMatch.index ?? 0;
  const openEnd = openIdx + openMatch[0].length;
  const closeIdx = response.indexOf('</boltArtifact>', openEnd);
  const titleMatch = openMatch[0].match(/title\s*=\s*("([^"]*)"|'([^']*)')/);
  const artifactTitle = titleMatch ? (titleMatch[2] ?? titleMatch[3] ?? null) : null;

  if (closeIdx === -1) {
    return {
      content: response.slice(openEnd),
      artifactTitle,
      hadWrapper: true,
      hadClosingTag: false,
    };
  }
  return {
    content: response.slice(openEnd, closeIdx),
    artifactTitle,
    hadWrapper: true,
    hadClosingTag: true,
  };
}

export function parseXml(response: string, startingId: number = 1): Step[] {
  // Remove code-block fences (```tsx, ```jsx, etc.) that may wrap the whole
  // response or sections of it.
  const cleanedResponse = response.replace(/```(tsx|jsx|typescript|javascript)?/g, '').trim();

  const { content: scanTarget, artifactTitle, hadClosingTag } = selectScanTarget(cleanedResponse);
  const extracted = extractActions(scanTarget);

  const steps: Step[] = [];
  let stepId = startingId;

  steps.push({
    id: stepId++,
    title: artifactTitle ?? 'Project Files',
    description: hadClosingTag ? '' : 'Response was truncated before the closing </boltArtifact> tag.',
    type: StepType.CreateFolder,
    status: 'pending'
  });

  for (const action of extracted) {
    if (action.type === 'file') {
      steps.push({
        id: stepId++,
        title: `Create ${action.filePath || 'file'}`,
        description: '',
        type: StepType.CreateFile,
        status: 'pending',
        code: action.content.trim(),
        path: action.filePath
      });
    } else if (action.type === 'shell') {
      steps.push({
        id: stepId++,
        title: 'Run command',
        description: '',
        type: StepType.RunScript,
        status: 'pending',
        code: action.content.trim()
      });
    }
  }

  return steps;
}
