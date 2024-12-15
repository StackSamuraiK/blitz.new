import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function main() {
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

      // Use the 'server-ready' event handling as originally implemented
      webContainer.on('server-ready', (port, url) => {
        console.log('Server ready:', url, port);
        setUrl(url);
        setIsLoading(false);
      });

      // Optional: Log any errors from dev process
      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.error('Dev server output:', data);
        }
      }));

    } catch (error) {
      console.error('Error setting up preview:', error);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    main();
  }, []);

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {isLoading && (
        <div className="text-center">
          <p className="mb-2">Loading...</p>
        </div>
      )}
      {url && (
  <iframe 
    width="100%" 
    height="100%" 
    src={url} 
    title="Web Container Preview"
    // Add these for debugging
    onLoad={() => console.log('Iframe loaded')}
    onError={(e) => console.error('Iframe error:', e)}
  />
)}
    </div>
  );
}