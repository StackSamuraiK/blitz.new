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

  useEffect(() => {
    async function startDevServer() {
      try {
        // Install dependencies
        const installProcess = await webContainer.spawn('npm', ['install']);
        
        // Log installation output
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            console.log('Install output:', data);
          }
        }));

        // Wait for installation to complete
        await installProcess.exit;

        // Start dev server
        const devProcess = await webContainer.spawn('npm', ['run', 'dev']);

        // Use the 'server-ready' event handling
        webContainer.on('server-ready', (port, url) => {
          console.log('Server ready:', url, port);
          setUrl(url);
          setIsLoading(false);
        });

        // Log dev server output
        devProcess.output.pipeTo(new WritableStream({
          write(data) {
            console.log('Dev server output:', data);
          }
        }));

      } catch (error) {
        console.error('Error setting up preview:', error);
        setIsLoading(false);
      }
    }

    if (webContainer) {
      startDevServer();
    }
  }, [webContainer]);

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