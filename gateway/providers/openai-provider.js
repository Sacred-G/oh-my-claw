import OpenAI from 'openai';
import { BaseProvider } from './base-provider.js';

/**
 * OpenAI Provider implementation
 * Supports streaming, tool calls, and vision
 */
export class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      baseURL: config.baseURL || process.env.OPENAI_BASE_URL
    });
    this.defaultModel = config.model || process.env.OPENAI_MODEL || 'gpt-4o';
    this.abortControllers = new Map();
  }

  get name() {
    return 'openai';
  }

  getAvailableModels() {
    return [
      { id: 'gpt-4o', label: 'GPT-4o (Vision, High Intelligence)' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast, Cost-effective)' },
      { id: 'o1-preview', label: 'o1 Preview (Reasoning)' },
      { id: 'o1-mini', label: 'o1 Mini (Fast Reasoning)' },
    ];
  }

  abort(chatId) {
    const controller = this.abortControllers.get(chatId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(chatId);
      return true;
    }
    return false;
  }

  /**
   * Execute a query using OpenAI Chat Completions API
   */
  async *query(params) {
    const {
      prompt,
      chatId,
      mcpServers = {}, // Not directly used by OpenAI API, but tools are derived from bridge
      allowedTools = [],
      maxTurns = 50,
      systemPrompt = null,
      canUseTool,
      bridge // OpenAIProvider expects an McpBridge instance to handle tool execution
    } = params;

    if (!bridge) {
      throw new Error('OpenAIProvider requires an McpBridge instance passed in params.bridge');
    }

    const modelToUse = params.model || this.currentModel || this.defaultModel;
    const abortController = new AbortController();
    if (chatId) {
      this.abortControllers.set(chatId, abortController);
    }

    try {
      // Get conversation history
      let messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      // If existing history was passed in params.messages
      if (params.messages && Array.isArray(params.messages)) {
        messages.push(...params.messages);
      }

      // Helper to convert Anthropic content to OpenAI content
      const convertContent = (content) => {
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) {
          return content.map(part => {
            if (part.type === 'text') return part;
            if (part.type === 'image' && part.source) {
              return {
                type: 'image_url',
                image_url: {
                  url: `data:${part.source.media_type};base64,${part.source.data}`
                }
              };
            }
            return part;
          });
        }
        return content;
      };

      // Handle prompt which might be an async generator (from ClaudeAgent)
      if (typeof prompt === 'string') {
        messages.push({ role: 'user', content: prompt });
      } else if (typeof prompt === 'object' && prompt[Symbol.asyncIterator]) {
        for await (const msg of prompt) {
          if (msg.type === 'user' && msg.message) {
            messages.push({ 
              role: msg.message.role, 
              content: convertContent(msg.message.content) 
            });
          }
        }
      } else if (Array.isArray(prompt)) {
        messages.push(...prompt.map(msg => ({
          ...msg,
          content: convertContent(msg.content)
        })));
      }

      const tools = bridge.getOpenAITools();
      // Filter tools to only include allowed ones if specified
      const filteredTools = allowedTools.length > 0 
        ? tools.filter(t => allowedTools.includes(t.function.name))
        : tools;

      let turnCount = 0;
      while (turnCount < maxTurns) {
        turnCount++;
        
        const stream = await this.client.chat.completions.create({
          model: modelToUse,
          messages,
          tools: filteredTools.length > 0 ? filteredTools : undefined,
          stream: true,
        }, { signal: abortController.signal });

        let currentAssistantMessage = { role: 'assistant', content: '', tool_calls: [] };
        
        for await (const chunk of stream) {
          if (abortController.signal.aborted) break;
          
          const delta = chunk.choices[0]?.delta;
          if (!delta) continue;

          // Handle text content
          if (delta.content) {
            currentAssistantMessage.content += delta.content;
            yield {
              type: 'stream_event',
              event: {
                type: 'content_block_delta',
                delta: { type: 'text_delta', text: delta.content }
              }
            };
          }

          // Handle tool calls
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.index === undefined) continue;
              if (!currentAssistantMessage.tool_calls[tc.index]) {
                currentAssistantMessage.tool_calls[tc.index] = {
                  id: tc.id,
                  type: 'function',
                  function: { name: '', arguments: '' }
                };
                
                // Yield tool use start event
                // We'll wait until we have the full name to yield the event
              }
              const target = currentAssistantMessage.tool_calls[tc.index];
              if (tc.id) target.id = tc.id;
              if (tc.function?.name) target.function.name += tc.function.name;
              if (tc.function?.arguments) target.function.arguments += tc.function.arguments;
            }
          }
        }

        if (abortController.signal.aborted) {
          yield { type: 'aborted' };
          return;
        }

        messages.push(currentAssistantMessage);

        // If no tool calls, we're done
        if (!currentAssistantMessage.tool_calls || currentAssistantMessage.tool_calls.length === 0) {
          break;
        }

        // Execute tool calls
        for (const toolCall of currentAssistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          let args = {};
          try {
            args = JSON.parse(toolCall.function.arguments || '{}');
          } catch (e) {
            console.error(`[OpenAI] Failed to parse tool arguments: ${toolCall.function.arguments}`);
          }

          // Yield tool_use event (matches Claude Agent SDK format)
          yield {
            type: 'stream_event',
            event: {
              type: 'content_block_start',
              content_block: {
                type: 'tool_use',
                name: toolName,
                input: args,
                id: toolCall.id
              }
            }
          };

          // Apply tool approval if configured
          let result;
          let behavior = 'allow';
          if (canUseTool && toolName !== 'AskUserQuestion') {
            const approval = await canUseTool(toolName, args, { decisionReason: `OpenAI wants to use ${toolName}` });
            behavior = approval.behavior;
            if (behavior === 'allow') {
              args = approval.updatedInput || args;
              result = await bridge.executeTool(toolName, args);
            } else {
              result = approval.message || 'User denied the action.';
            }
          } else {
            result = await bridge.executeTool(toolName, args);
          }

          // Yield tool result
          yield {
            type: 'tool_result',
            result: result,
            tool_use_id: toolCall.id
          };

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: typeof result === 'string' ? result : JSON.stringify(result)
          });
        }
        
        // Loop for next response after tool results
      }

      yield { type: 'done' };

    } catch (error) {
      if (error.name === 'AbortError') {
        yield { type: 'aborted' };
      } else {
        console.error('[OpenAI] Query error:', error);
        yield { type: 'error', error: error.message };
      }
    } finally {
      if (chatId) {
        this.abortControllers.delete(chatId);
      }
    }
  }
}
