import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StepsList } from '../components/StepsList';
import { FileExplorer } from '../components/FileExplorer';
import { TabView } from '../components/TabView';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import { Step, FileItem, StepType } from '../types';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import { Loader } from '../components/Loader';
import { Wand2, Send, Sparkles, Code2, Eye, FolderOpen, Layers3, Bot, User, Zap, AlertCircle } from 'lucide-react';

export function Builder() {
  const location = useLocation();
  const navigate = useNavigate();
  const { prompt } = (location.state as { prompt: string }) || { prompt: '' };
  const [userPrompt, setPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string;}[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  // Update files when steps change
  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    
    steps.filter(({status}) => status === "pending").map(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/") ?? [];
        let currentFileStructure = [...originalFiles];
        let finalAnswerRef = currentFileStructure;
  
        let currentFolder = ""
        while(parsedPath.length) {
          currentFolder =  `${currentFolder}/${parsedPath[0]}`;
          let currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);
  
          if (!parsedPath.length) {
            // final file
            let file = currentFileStructure.find(x => x.path === currentFolder)
            if (!file) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code
              })
            } else {
              file.content = step.code;
            }
          } else {
            // in a folder
            let folder = currentFileStructure.find(x => x.path === currentFolder)
            if (!folder) {
              // create the folder
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: []
              })
            }
  
            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
          }
        }
        originalFiles = finalAnswerRef;
      }
    })

    if (updateHappened) {
      console.log('Updating files from steps...');
      setFiles(originalFiles)
      setSteps(steps => steps.map((s: Step) => {
        return {
          ...s,
          status: "completed"
        }
      }))
    }
  }, [steps, files]);

  // Mount files to WebContainer
  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};
  
      const processFile = (file: FileItem, isRootFolder: boolean) => {  
        if (file.type === 'folder') {
          mountStructure[file.name] = {
            directory: file.children ? 
              Object.fromEntries(
                file.children.map(child => [child.name, processFile(child, false)])
              ) 
              : {}
          };
        } else if (file.type === 'file') {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || ''
              }
            };
          } else {
            return {
              file: {
                contents: file.content || ''
              }
            };
          }
        }
  
        return mountStructure[file.name];
      };
  
      files.forEach(file => processFile(file, true));
      return mountStructure;
    };
  
    const mountStructure = createMountStructure(files);
    console.log('Mounting to WebContainer:', mountStructure);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  async function init() {
    if (!prompt || !prompt.trim()) {
      setError('No prompt provided. Please go back and enter a prompt.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      console.log('=== INIT START ===');
      console.log('BACKEND_URL:', BACKEND_URL);
      console.log('Prompt:', prompt.trim());
      
      // Step 1: Get template
      console.log('Step 1: Getting template...');
      const response = await axios.post(`${BACKEND_URL}/template`, {
        prompt: prompt.trim()
      });

      console.log('Template response:', response.data);
      
      if (!response.data.prompts || !response.data.uiPrompts) {
        throw new Error('Invalid template response format');
      }

      setTemplateSet(true);
      
      const {prompts, uiPrompts} = response.data;

      // Step 2: Parse initial UI prompts
      console.log('Step 2: Parsing UI prompts...');
      console.log('UI Prompt:', uiPrompts[0]);
      const initialSteps = parseXml(uiPrompts[0]);
      console.log('Parsed initial steps:', initialSteps.length, 'steps');

      setSteps(initialSteps.map((x: Step) => ({
        ...x,
        status: "pending"
      })));

      // Step 3: Get AI response
      console.log('Step 3: Generating code with AI...');
      const chatMessages = [...prompts, prompt].map(content => ({
        role: "user",
        content
      }));

      console.log('Sending', chatMessages.length, 'messages to /chat');

      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: chatMessages
      });

      console.log('=== AI RESPONSE RECEIVED ===');
      console.log('Response type:', typeof stepsResponse.data.response);
      console.log('Response length:', stepsResponse.data.response?.length);
      console.log('First 500 chars:', stepsResponse.data.response?.substring(0, 500));
      console.log('Contains boltArtifact:', stepsResponse.data.response?.includes('boltArtifact'));
      console.log('Contains boltAction:', stepsResponse.data.response?.includes('boltAction'));

      if (!stepsResponse.data.response) {
        throw new Error('AI response is empty or undefined');
      }

      // Step 4: Parse AI response
      console.log('Step 4: Parsing AI response...');
      const aiSteps = parseXml(stepsResponse.data.response);
      console.log('Parsed AI steps:', aiSteps.length, 'steps');

      if (aiSteps.length === 0) {
        console.warn('⚠️ WARNING: parseXml returned 0 steps!');
        console.log('Raw AI response:', stepsResponse.data.response);
        setError('AI generated a response but no files were created. The response format may be incorrect. Please try again with a different prompt.');
        return;
      }

      // Log first step for debugging
      if (aiSteps.length > 0) {
        console.log('First AI step sample:', {
          title: aiSteps[0].title,
          path: aiSteps[0].path,
          codeLength: aiSteps[0].code?.length
        });
      }

      setSteps(s => {
        const newSteps = [...s, ...aiSteps.map(x => ({
          ...x,
          status: "pending" as "pending"
        }))];
        console.log('Total steps now:', newSteps.length);
        return newSteps;
      });

      //@ts-ignore
      setLlmMessages(chatMessages);
      setLlmMessages(x => [...x, {
        role: "assistant",
        content: stepsResponse.data.response
      }]);

      console.log('=== INIT COMPLETE ===');
      
    } catch (err) {
      console.error('=== ERROR IN INIT ===');
      console.error('Error:', err);
      
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to initialize builder';
        console.error('Axios error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
          url: err.config?.url
        });
        setError(`Error: ${errorMessage}\n\nCheck the browser console for more details.`);
      } else {
        setError('An unexpected error occurred: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, []);

  // Handle sending new messages
  async function handleSendMessage() {
    if (!userPrompt.trim()) return;

    const newMessage = {
      role: "user" as "user",
      content: userPrompt
    };

    try {
      setLoading(true);
      console.log('Sending new message to AI...');
      
      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...llmMessages, newMessage]
      });

      console.log('New AI response received, length:', stepsResponse.data.response?.length);

      if (!stepsResponse.data.response) {
        throw new Error('Empty response from AI');
      }
      
      const newSteps = parseXml(stepsResponse.data.response);
      console.log('Parsed', newSteps.length, 'new steps');

      setLlmMessages(x => [...x, newMessage]);
      setLlmMessages(x => [...x, {
        role: "assistant",
        content: stepsResponse.data.response
      }]);
      
      setSteps(s => [...s, ...newSteps.map(x => ({
        ...x,
        status: "pending" as "pending"
      }))]);

      setPrompt("");
    } catch (err) {
      console.error('Error sending message:', err);
      if (axios.isAxiosError(err)) {
        alert(`Error: ${err.response?.data?.error || err.message}`);
      } else {
        alert('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  // Error state display
  if (error) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-black to-red-900/10"></div>
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="relative z-10 max-w-2xl w-full mx-4">
          <div className="bg-red-900/20 backdrop-blur-xl border border-red-500/50 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <h2 className="text-red-400 text-2xl font-bold">Error</h2>
            </div>
            <div className="bg-black/30 rounded-lg p-4 mb-6">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {error}
              </pre>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => navigate('/')}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium flex items-center justify-center space-x-2"
              >
                <span>Go Back Home</span>
              </button>
              <button 
                onClick={() => {
                  setError(null);
                  init();
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium flex items-center justify-center space-x-2"
              >
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-black to-purple-900/10"></div>
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      
      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-gray-900/50 border-b border-gray-800/50 px-6 py-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-md"></div>
                <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Blitz.new
                  </span>
                  <span className="text-gray-400 text-lg">Builder</span>
                </h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700/50">
              <div className={`w-2 h-2 rounded-full animate-pulse ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span className={`text-sm font-medium ${loading ? 'text-yellow-400' : 'text-green-400'}`}>
                {loading ? 'Building...' : 'Ready'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Prompt display */}
        <div className="mt-3 bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30">
          <div className="flex items-start space-x-3">
            <User className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-300 font-medium mb-1">Your Request:</p>
              <p className="text-gray-100 leading-relaxed">{prompt}</p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="relative z-10 flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-6 p-6">
          {/* Steps Panel */}
          <div className="col-span-3 space-y-6 overflow-auto">
            <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 px-6 py-4 border-b border-gray-800/50">
                <div className="flex items-center space-x-3">
                  <Layers3 className="w-5 h-5 text-blue-400" />
                  <h2 className="font-semibold text-white">Build Steps</h2>
                  <div className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">
                    {steps.length}
                  </div>
                </div>
              </div>
              
              <div className="max-h-[60vh] overflow-auto p-4">
                {steps.length === 0 && loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-3">
                      <Loader />
                      <span className="text-gray-400 text-sm">Loading steps...</span>
                    </div>
                  </div>
                )}
                {steps.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">No steps yet</p>
                  </div>
                )}
                {steps.length > 0 && (
                  <StepsList
                    steps={steps}
                    currentStep={currentStep}
                    onStepClick={setCurrentStep}
                  />
                )}
              </div>
            </div>

            {/* Chat Input */}
            <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 px-6 py-4 border-b border-gray-800/50">
                <div className="flex items-center space-x-3">
                  <Bot className="w-5 h-5 text-purple-400" />
                  <h2 className="font-semibold text-white">AI Assistant</h2>
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                </div>
              </div>
              
              <div className="p-4">
                {(loading || !templateSet) ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-3">
                      <Loader />
                      <span className="text-gray-400 text-sm">AI is thinking...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea 
                      value={userPrompt} 
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask me to modify the website, add features, or fix issues... (Ctrl+Enter to send)"
                      className="w-full h-24 p-4 bg-gray-800/50 text-gray-100 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none placeholder-gray-500 backdrop-blur-sm transition-all duration-300"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!userPrompt.trim() || loading}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/25"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Request</span>
                      <Zap className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File Explorer */}
          <div className="col-span-3">
            <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden h-full">
              <div className="bg-gradient-to-r from-green-600/10 to-blue-600/10 px-6 py-4 border-b border-gray-800/50">
                <div className="flex items-center space-x-3">
                  <FolderOpen className="w-5 h-5 text-green-400" />
                  <h2 className="font-semibold text-white">Project Files</h2>
                  <div className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">
                    {files.length}
                  </div>
                </div>
              </div>
              
              <div className="p-4 overflow-auto h-[calc(100%-4rem)]">
                {files.length === 0 && loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-3">
                      <Loader />
                      <span className="text-gray-400 text-sm">Generating files...</span>
                    </div>
                  </div>
                )}
                {files.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No files yet</p>
                  </div>
                )}
                {files.length > 0 && (
                  <FileExplorer 
                    files={files} 
                    onFileSelect={setSelectedFile}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Code Editor & Preview */}
          <div className="col-span-6">
            <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden h-[calc(100vh-8rem)]">
              <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 bg-gray-700/30 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('code')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        activeTab === 'code' 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                      }`}
                    >
                      <Code2 className="w-4 h-4" />
                      <span>Code</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        activeTab === 'preview' 
                          ? 'bg-green-600 text-white shadow-lg' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center space-x-2 bg-gray-700/30 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-300 text-sm font-medium">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-[calc(100%-5rem)] bg-black/20">
                {activeTab === 'code' ? (
                  <div className="h-full relative">
                    {!selectedFile ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <Code2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400 text-lg mb-2">No file selected</p>
                          <p className="text-gray-600 text-sm">Choose a file from the explorer to view its code</p>
                        </div>
                      </div>
                    ) : (
                      <CodeEditor file={selectedFile} />
                    )}
                  </div>
                ) : (
                  <div className="h-full relative">
                    <div className="absolute inset-0 bg-gray-800/20 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center mb-4">
                        <Eye className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg mb-2">Live Preview</p>
                        <p className="text-gray-600 text-sm">Your website will appear here</p>
                      </div>
                    </div>
                    {/* @ts-ignore */}
                    <PreviewFrame webContainer={webcontainer} files={files} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}