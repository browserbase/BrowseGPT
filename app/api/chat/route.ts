import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages, tool, generateText } from 'ai';
import { z } from 'zod';
import { chromium } from 'playwright';
import {anthropic} from '@ai-sdk/anthropic'

// Helper functions (not exported)
async function getDebugUrl(id: string) {
  console.log('Requesting debug URL for session ID:', id);
  const response = await fetch(`https://www.browserbase.com/v1/sessions/${id}/debug`, {
    method: "GET",
    headers: {
      "x-bb-api-key": process.env.BROWSERBASE_API_KEY as string,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
}

async function createSession() {
  console.log('Creating new session...');
  const response = await fetch(`https://www.browserbase.com/v1/sessions`, {
    method: "POST",
    headers: {
      "x-bb-api-key": process.env.BROWSERBASE_API_KEY as string,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId: process.env.BROWSERBASE_PROJECT_ID as string,
      keepAlive: true
     }),
  });
  const data = await response.json();
  return { id: data.id, debugUrl: data.debugUrl };
}

// Main API route handler
export const runtime = 'nodejs';
export const maxDuration = 300; // Set max duration to 300 seconds (5 minutes)

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    experimental_toolCallStreaming: true,
    model: openai('gpt-4-turbo'),
    messages: convertToCoreMessages(messages),
    tools: {
      createSession: tool({
        description: 'Create a new session',
        parameters: z.object({}),
        execute: async () => {
          const session = await createSession();
          const debugUrl = await getDebugUrl(session.id);
          console.log(session.id, debugUrl.debuggerFullscreenUrl);
          return { sessionId: session.id, debugUrl: debugUrl.debuggerFullscreenUrl, toolName: 'Creating a new session'};
        },
      }),
      askForConfirmation: tool({
        description: 'Ask the user for confirmation.',
        parameters: z.object({
          message: z.string().describe('The message to ask for confirmation.'),
        }),
      }),
      googleSearch: tool({
        description: 'Search Google for a query',
        parameters: z.object({
          toolName: z.string().describe('What the tool is doing'),
          query: z.string().describe('The exact and complete search query as provided by the user. Do not modify this in any way.'),
          sessionId: z.string().describe('The session ID to use for the search. If there is no session ID, create a new session with createSession Tool.'),
          debuggerFullscreenUrl: z.string().describe('The fullscreen debug URL to use for the search. If there is no debug URL, create a new session with createSession Tool.')
        }),
        execute: async ({ query, sessionId }) => {
          try {
            console.log('Created session with ID:', sessionId);
            const debugUrl = await getDebugUrl(sessionId);
            console.log(debugUrl);
        
            const browser = await chromium.connectOverCDP(
              `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${sessionId}`
            );
            const defaultContext = browser.contexts()[0];
            const page = defaultContext.pages()[0];
          
            console.log('Google search:', query);
            await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
            await page.waitForLoadState('load', { timeout: 10000 });
            
            console.info("Success!");
            console.log('Evaluating page content');
            await page.waitForSelector('.g');

            const results = await page.evaluate(() => {
              const items = document.querySelectorAll('.g');
              return Array.from(items).map(item => {
                const title = item.querySelector('h3')?.textContent || '';
                const description = item.querySelector('.VwiC3b')?.textContent || '';
                return { title, description };
              });
            });

            console.log(JSON.stringify(results, null, 2));
            
            const text = results.map(item => `${item.title}\n${item.description}`).join('\n\n');

            console.log('Generating text');
            const response = await generateText({
              // model: openai('gpt-4-turbo'),
              model: anthropic('claude-3-5-sonnet-20240620'),
              prompt: `Evaluate the following web page content: ${text}`,
            });

            console.log("toolName: Searching Google");
            return {
              toolName: 'Searching Google',
              content: response.text,
              dataCollected: true,
            };
          } catch (error) {
            console.error('Error in googleSearch:', error);
            return {
              toolName: 'Searching Google',
              content: `Error performing Google search: ${error}`,
              dataCollected: false,
            };
          }
        },
      }),
      getPageContent: tool({
        description: 'Get the content of a page using Playwright',
        parameters: z.object({
          toolName: z.string().describe('What the tool is doing'),
          url: z.string().describe('The url to get the content of'),
          sessionId: z.string().describe('The session ID to use for the search. If there is no session ID, create a new session with createSession Tool.'),
          debuggerFullscreenUrl: z.string().describe('The fullscreen debug URL to use for the search. If there is no debug URL, create a new session with createSession Tool.')
        }),
        execute: async ({ url, sessionId }) => {
          try {
            const debugUrl = await getDebugUrl(sessionId);
            
            console.log(debugUrl);
            const browser = await chromium.connectOverCDP(
              `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${sessionId}`
            );
            const defaultContext = browser.contexts()[0];
            const page = defaultContext.pages()[0];
          
            console.log('Navigating to URL:', url);
            await page.goto(url);
          
            console.log('Evaluating page content');
            const readable: { title?: string; textContent?: string } =
              await page.evaluate(`
              import('https://cdn.skypack.dev/@mozilla/readability').then(readability => {
                return new readability.Readability(document).parse()
              })`);
            const text = `${readable.title}\n${readable.textContent}`;

            console.log('Generating text');
            const response = await generateText({
              // model: openai('gpt-4-turbo'),
              model: anthropic('claude-3-5-sonnet-20240620'),
              prompt: `Evaluate the following web page content: ${text}`,
            });

            console.log('Returning response', response);
            return {
              toolName: 'Getting page content',
              content: response.text,
            };
          } catch (error) {
            console.error('Error in getPageContent:', error);
            return {
              toolName: 'Getting page content',
              content: `Error fetching page content: ${error}`,
            };
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}