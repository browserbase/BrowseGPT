'use client';

import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Markdown from 'react-markdown';
import { MarkdownWrapper } from '@/components/ui/markdown';
import remarkGfm from 'remark-gfm';
import BlurFade from "@/components/ui/blur-fade";
// import Spinner from "@/components/spinner";
import VercelLogo from "@/components/vercel";
import BrowserbaseLogo from "@/components/browserbase"
import FlickeringGrid from '@/components/ui/flickering-grid';
import FlickeringLoad from '@/components/ui/flickering-load';
import { Prompts } from '@/components/prompts';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    maxSteps: 5,
  });

  const [showAlert, setShowAlert] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const isGenerating =
    isLoading &&
    (!messages.length ||
      messages[messages.length - 1].role !== 'assistant' ||
      !messages[messages.length - 1].content);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (isGenerating) {
      setShowAlert(true);

      // Check if any tool invocation has dataCollected = true
      const dataCollected = lastMessage?.toolInvocations?.some(
        invocation => 'result' in invocation && 
        typeof invocation.result === 'object' &&
        invocation.result !== null &&
        'dataCollected' in invocation.result &&
        invocation.result.dataCollected === true
      );

      if (dataCollected && !lastMessage.content) {
        // The AI has collected data and is generating a response
        setStatusMessage('The AI has collected data and is generating a response. Please wait.');
      } else {
        // The AI is currently processing the request
        setStatusMessage('The AI is currently processing your request. Please wait.');
      }

      setSessionId(null);
    } else {
      setShowAlert(false);
    }
  }, [isGenerating, messages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.toolInvocations) {
      for (const invocation of lastMessage.toolInvocations) {
        if ('result' in invocation && invocation.result?.sessionId) {
          setSessionId(invocation.result.sessionId);
          break;
        }
      }
    }
  }, [messages]);

  const handleSubmitWrapper = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasInteracted(true); 
    handleSubmit(e, { data: { message: input } });
  };

  const handlePromptClick = (text: string) => {
    setHasInteracted(true);
    // Set the input value
    handleInputChange({ target: { value: text } } as React.ChangeEvent<HTMLInputElement>);
    // Submit the form after a short delay
    setTimeout(() => {
      const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitButton) {
        submitButton.click();
      }
    }, 100); // 100ms delay, adjust as needed
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      <FlickeringGrid className="fixed inset-0 z-0 h-full w-full" />
      <div className="relative z-10 flex flex-col min-h-screen items-center"> 
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-20">
          <div className="w-full max-w-2xl mx-auto border-x-2 border-b-2 border-[#E5E7EB] bg-white">
            <div className="px-4 py-4 flex justify-between items-center">
              <a href="https://www.alexdphan.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium underline">Made by AP</a>
              <h1 className="text-2xl font-bold flex items-center">
                <a href="https://www.browserbase.com" target="_blank" rel="noopener noreferrer" className="mr-1">
                  <BrowserbaseLogo />
                </a>
                <span className="mx-1">x</span>
                <a href="https://www.vercel.com" target="_blank" rel="noopener noreferrer">
                  <VercelLogo />
                </a>
              </h1>
            </div>
          </div>
        </div>

        {/* Chat content */}
        <div className="flex-grow flex flex-col w-full max-w-2xl mx-auto border-x-2 border-[#E5E7EB] bg-white mt-16">
          <div className="flex-grow flex flex-col w-full max-w-xl mx-auto py-4 px-4"> {/* Added px-4 */}
            {!hasInteracted && messages.length === 0 ? (
              <div className="flex-grow flex flex-col justify-start items-center text-center mt-56">
                <BlurFade>
                <h2 className="sm:text-2xl font-bold mb-2 text-xl">Welcome</h2>
              
                <p className="sm:mb-10 mb-8 sm:text-sm text-xs">What web task can I conquer for you today?</p>
                </BlurFade>
                <Prompts onPromptClick={handlePromptClick} />
              </div>
            ) : (
              messages.map((m, index) => (
                <div key={m.id} className="whitespace-pre-wrap">
                  {m.role === 'user' ? (
                    <>
                      <strong className="block mb-0 text-xl pb-2">User:</strong>
                      <p className="mt-0 pb-4 font-mono">{m.content}</p>
                    </>
                  ) : m.toolInvocations ? (
                    <BlurFade>
                      <Alert className="my-4 border-[#E5E7EB]">
                        <AlertDescription>
                          {m.toolInvocations?.map((invocation, index) => {
                            let content = '';
                            if ('result' in invocation) {
                              if (invocation.result?.sessionId) {
                                content = `Session ID: ${invocation.result.sessionId}`;
                              } else if (invocation.result?.content) {
                                content = `Content: ${invocation.result.content}`;
                              }
                            }
                            if (invocation.args?.debuggerFullscreenUrl) {
                              return (
                                <div key={index}>
                                  <iframe
                                    src={`${invocation.args.debuggerFullscreenUrl}&navBar=false`}
                                    className="w-full sm:h-72 h-52"
                                    title="Debugger"
                                    sandbox="allow-same-origin allow-scripts"
                                    allow="clipboard-read; clipboard-write"
                                  />
                                </div>
                              );
                            }
                            return content ? (
                              <div key={index} className="overflow-x-auto">
                                <pre className="whitespace-pre-wrap break-all">{content}</pre>
                              </div>
                            ) : null;
                          })}
                        </AlertDescription>
                      </Alert>
                    </BlurFade>
                  ) : (
                    <>
                      <strong className="flex items-center text-xl pb-4">
                      <a href="https://www.browserbase.com" target="_blank" rel="noopener noreferrer" >
                    <BrowserbaseLogo />
                      </a>
                        <span className="ml-1">-AI:</span>
                      </strong>
                      <div className="mb-4"></div>
                      <div
                        className={`font-mono prose prose-sm mt-0 leading-snug pb-8 ${
                          index === messages.length - 1 && m.role === 'assistant' ? 'mb-20' : ''
                        }`}
                      >
                        <MarkdownWrapper>
                          <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                        </MarkdownWrapper>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}

            {showAlert && !sessionId && (
              <BlurFade>
                <Alert className="my-4 border-[#E5E7EB] mb-20">
                  <div className="flex justify-between items-center">
                    <div>
                      <AlertTitle>
                        {messages[messages.length - 1].toolInvocations
                          ?.map((invocation) => {
                            if ('result' in invocation) {
                              return invocation.result?.toolName;
                            }
                            return invocation.args?.toolName;
                          })
                          .filter(Boolean)
                          .join(', ')}
                      </AlertTitle>
                      <AlertDescription>{statusMessage}</AlertDescription>
                    </div>
                    {/* <div role="status" className="w-[70px] h-[40px]"> */}
                      <FlickeringLoad height={50} width={60} className='p-1'/>
                    {/* </div> */}
                  </div>
                </Alert>
              </BlurFade>
            )}
          </div>
        </div>

        {/* Input form */}
        <div className="fixed bottom-0 left-0 right-0 z-20">
          <div className="w-full max-w-2xl mx-auto px-4 py-8 border-x-2 border-[#E5E7EB] ">
            <div className="w-full max-w-xl mx-auto">
              <form onSubmit={handleSubmitWrapper} className="w-full relative">
                <input
                  className="w-full p-2 pr-10 border border-[#E5E7EB] transition-all duration-200 ease-in-out shadow-md shadow-gray-300/50 focus:border-red-300 focus:shadow-lg focus:shadow-red-300/40 outline-none"
                  value={input}
                  placeholder="Ask anything..."
                  onChange={handleInputChange}
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!input.trim()}
                >
                  <span className="text-xl font-bold">&gt;</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}