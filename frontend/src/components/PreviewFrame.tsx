import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';
import { FileItem } from '../types';

interface PreviewFrameProps {
  files: FileItem[];
  webContainer: WebContainer;
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const serverStarted = React.useRef(false);

  // Effect to handle server startup
  useEffect(() => {
    async function startDevServer() {
      if (!webContainer || serverStarted.current) return;

      // Check if package.json exists in the files structure
      const hasPackageJson = (function checkFiles(items: FileItem[]): boolean {
        for (const item of items) {
          if (item.name === 'package.json' && item.type === 'file') return true;
          if (item.type === 'folder' && item.children && checkFiles(item.children)) return true;
        }
        return false;
      })(files);

      if (!hasPackageJson) {
        console.log('Waiting for package.json before starting server...');
        return;
      }

      serverStarted.current = true;

      try {
        console.log('Starting WebContainer setup...');

        // Mount initial files
        const createMountStructure = (items: FileItem[]): Record<string, any> => {
          const structure: Record<string, any> = {};
          for (const item of items) {
            if (item.type === 'file') {
              structure[item.name] = { file: { contents: item.content || '' } };
            } else {
              structure[item.name] = { directory: createMountStructure(item.children || []) };
            }
          }
          return structure;
        };

        const mountStructure = createMountStructure(files);
        await webContainer.mount(mountStructure);
        
        // Install dependencies
        console.log('Running npm install...');
        const installProcess = await webContainer.spawn('npm', ['install']);
        
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            console.log('Install output:', data);
          }
        }));

        await installProcess.exit;

        // Start dev server
        console.log('Running npm run dev...');
        await webContainer.spawn('npm', ['run', 'dev']);

        webContainer.on('server-ready', (port, url) => {
          console.log(`Server ready on port ${port}: ${url}`);
          setUrl(url);
          setIsLoading(false);
        });

      } catch (error) {
        console.error('Error setting up preview:', error);
        setIsLoading(false);
        serverStarted.current = false;
      }
    }

    startDevServer();
  }, [webContainer]);

  // Effect to handle file updates
  useEffect(() => {
    if (!webContainer || !serverStarted.current) return;

    async function updateFiles() {
      console.log('Updating files in WebContainer...');
      
      const createMountStructure = (items: FileItem[]): Record<string, any> => {
        const structure: Record<string, any> = {};
        for (const item of items) {
          if (item.type === 'file') {
            structure[item.name] = { file: { contents: item.content || '' } };
          } else {
            structure[item.name] = { directory: createMountStructure(item.children || []) };
          }
        }
        return structure;
      };

      const mountStructure = createMountStructure(files);
      await webContainer.mount(mountStructure);
    }

    updateFiles();
  }, [files]);

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {isLoading && (
        <div className="text-center">
          <p className="mb-2">Loading preview...</p>
        </div>
      )}
      {url && (
        <iframe 
          className="w-full h-full border-0"
          src={url} 
          title="Web Container Preview"
          onLoad={() => console.log('Iframe loaded')}
          onError={(e) => console.error('Iframe error:', e)}
        />
      )}
    </div>
  );
}