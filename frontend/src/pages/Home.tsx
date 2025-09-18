import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Code2, Palette, Sparkles, Wand2, Zap } from 'lucide-react';


export function Home() {
  const [prompt, setPrompt] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt } });
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-black to-purple-900/20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl animate-pulse delay-700"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }}></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-12">
          {/* Enhanced logo section */}
          <div className="flex justify-center mb-8 relative">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 rounded-3xl shadow-2xl transform hover:scale-110 hover:rotate-6 transition-all duration-500">
                  <Wand2 className="w-10 h-10 text-white" />
                </div>
                {/* Floating sparkles */}
                <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-blue-400 animate-bounce delay-300" />
                <Sparkles className="absolute -bottom-1 -left-1 w-4 h-4 text-purple-400 animate-bounce delay-700" />
                <Sparkles className="absolute top-1/2 -right-4 w-3 h-3 text-pink-400 animate-bounce delay-1000" />
              </div>
            </div>
          </div>

          {/* Enhanced title with better gradient */}
          <h1 className="text-7xl font-black mb-6 relative">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent drop-shadow-2xl">
              Blitz
            </span>
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              .new
            </span>
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl -z-10"></div>
          </h1>

          <p className="text-xl text-gray-300 mb-8 font-light leading-relaxed max-w-2xl mx-auto">
            Transform your ideas into stunning websites with AI-powered development.
            <span className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-medium"> Describe, Generate, Deploy.</span>
          </p>

          {/* Enhanced feature indicators */}
          <div className="flex justify-center items-center space-x-8 mb-8">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-green-400 group-hover:text-green-300 transition-colors" />
                <span className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm font-medium">AI-Powered</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-200"></div>
                <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20 delay-200"></div>
              </div>
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                <span className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm font-medium">Real-time Build</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-400"></div>
                <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-20 delay-400"></div>
              </div>
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
                <span className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm font-medium">No-code Design</span>
              </div>
            </div>
          </div>
        </div>

        <div onSubmit={handleSubmit} className="space-y-8">
          <div className="relative group">
            {/* Enhanced glowing border effect */}
            <div className={`absolute -inset-1 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all duration-500 ${isFocused ? 'opacity-100' : ''}`}></div>

            <div className="relative bg-gray-900/90 backdrop-blur-2xl border border-gray-800/50 rounded-3xl shadow-2xl p-8 hover:border-gray-700/50 transition-all duration-500 hover:shadow-blue-500/10">
              {/* Textarea with enhanced styling */}
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="✨ Describe your dream website...

At the end of the prompt add the word REACT so that LLM could Understand its a webpage if you want to build your backend add NODE at the end

Examples:
• A modern portfolio site for a photographer with dark theme and smooth animations
• An e-commerce store for handmade jewelry with payment integration
• A landing page for a SaaS product with pricing tiers and testimonials"
                  className="w-full h-48 p-6 bg-black/60 text-gray-100 border border-gray-800/50 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none placeholder-gray-500 text-lg leading-relaxed backdrop-blur-sm transition-all duration-500 focus:bg-black/80 focus:shadow-2xl"
                />

                {/* Enhanced character counter */}
                <div className="absolute bottom-4 right-6 flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${prompt.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
                  <span className="text-xs text-gray-500 font-medium">
                    {prompt.length}/1000
                  </span>
                </div>
              </div>

              {/* Enhanced submit button */}
              <button
                type="button"
                onClick={handleSubmit}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={!prompt.trim()}
                className="w-full mt-8 relative group/button overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-5 px-8 rounded-2xl font-bold text-lg transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
              >
                {/* Button background animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover/button:opacity-100 transition-opacity duration-500"></div>

                {/* Button content */}
                <div className="relative flex items-center justify-center space-x-4">
                  <Zap className="w-6 h-6" />
                  <span className="text-xl">Generate Website Plan</span>
                  <ArrowRight
                    className={`w-6 h-6 transition-all duration-300 ${isHovered ? 'translate-x-2 rotate-12' : ''
                      }`}
                  />
                </div>

                {/* Button glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-xl opacity-0 group-hover/button:opacity-100 transition-opacity duration-500"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced bottom section */}
        <div className="mt-16 text-center">
          <div className="flex justify-center items-center space-x-2 text-gray-500 text-sm mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gray-600"></div>
            <span className="px-4 font-medium">Trusted by creators worldwide</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gray-600"></div>
          </div>

          <div className="flex justify-center items-center space-x-8 text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500/50 rounded-full"></div>
              <span>Advanced AI Technology</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500/50 rounded-full"></div>
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500/50 rounded-full"></div>
              <span>Start Building in Seconds</span>
            </div>
          </div>

          {/* Subtle call to action */}
          <div className="mt-8 text-gray-400 text-sm">
            <p>Join thousands of creators who've built their dream websites with Blitz.new</p>
          </div>
        </div>
      </div>
    </div>
  );
}