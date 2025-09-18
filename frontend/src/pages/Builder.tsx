import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
import { Wand2, Send, Sparkles, Code2, Eye, FolderOpen, Layers3, Bot, User, Zap } from 'lucide-react';

const MOCK_FILE_CONTENT = `// This is a sample file content
import React from 'react';

function Component() {
  return <div>Hello World</div>;
}

export default Component;`;

export function Builder() {
  const location = useLocation();
  const { prompt } = location.state as { prompt: string };
  const [userPrompt, setPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string;}[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  const [steps, setSteps] = useState<Step[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps.filter(({status}) => status === "pending").map(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
        let currentFileStructure = [...originalFiles]; // {}
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
            /// in a folder
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

      setFiles(originalFiles)
      setSteps(steps => steps.map((s: Step) => {
        return {
          ...s,
          status: "completed"
        }
        
      }))
    }
    console.log(files);
  }, [steps, files]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};
  
      const processFile = (file: FileItem, isRootFolder: boolean) => {  
        if (file.type === 'folder') {
          // For folders, create a directory entry
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
            // For files, create a file entry with contents
            return {
              file: {
                contents: file.content || ''
              }
            };
          }
        }
  
        return mountStructure[file.name];
      };
  
      // Process each top-level file/folder
      files.forEach(file => processFile(file, true));
  
      return mountStructure;
    };
  
    const mountStructure = createMountStructure(files);
  
    // Mount the structure if WebContainer is available
    console.log(mountStructure);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  async function init() {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt.trim()
    });
    setTemplateSet(true);
    
    const {prompts, uiPrompts} = response.data;

    setSteps(parseXml(uiPrompts[0]).map((x: Step) => ({
      ...x,
      status: "pending"
    })));

    setLoading(true);
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      messages: [...prompts, prompt].map(content => ({
        role: "user",
        content
      }))
    })

    setLoading(false);

    setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
      ...x,
      status: "pending" as "pending"
    }))]);

    setLlmMessages([...prompts, prompt].map(content => ({
      role: "user",
      content
    })));

    setLlmMessages(x => [...x, {role: "assistant", content: stepsResponse.data.response}])
  }

  useEffect(() => {
    init();
  }, [])

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
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Building</span>
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
              {/* Steps Header */}
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
                <StepsList
                  steps={steps}
                  currentStep={currentStep}
                  onStepClick={setCurrentStep}
                />
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
                      placeholder="Ask me to modify the website, add features, or fix issues..."
                      className="w-full h-24 p-4 bg-gray-800/50 text-gray-100 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none placeholder-gray-500 backdrop-blur-sm transition-all duration-300"
                    />
                    <button 
                      onClick={async () => {
                        const newMessage = {
                          role: "user" as "user",
                          content: userPrompt
                        };

                        setLoading(true);
                        const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
                          messages: [...llmMessages, newMessage]
                        });
                        setLoading(false);

                        setLlmMessages(x => [...x, newMessage]);
                        setLlmMessages(x => [...x, {
                          role: "assistant",
                          content: stepsResponse.data.response
                        }]);
                        
                        setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
                          ...x,
                          status: "pending" as "pending"
                        }))]);
                      }}
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
                <FileExplorer 
                  files={files} 
                  onFileSelect={setSelectedFile}
                />
              </div>
            </div>
          </div>

          {/* Code Editor & Preview */}
          <div className="col-span-6">
            <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden h-[calc(100vh-8rem)]">
              {/* Enhanced Tab View */}
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

              {/* Content Area */}
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