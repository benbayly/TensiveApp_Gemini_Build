import { REPAIR_KNOWLEDGE_BASE } from './knowledge_base';
import { CalculatorEngine, CALCULATOR_TYPES } from './calculator_engine';
import { SYSTEM_PROMPT, AVAILABLE_TOOLS } from './ai_config';

// This is the "Brain" that decides how to handle a user message.
// It acts as a router between the Chat UI and the specialized engines.

export class BotLogic {
  
  constructor() {
    this.context = {
      mode: 'general', // 'general', 'calculator', 'diagnosis'
      calculatorState: {},
    };
    this.history = []; // Store conversation history
  }

  clearHistory() {
    this.history = [];
    this.context = {
      mode: 'general',
      calculatorState: {},
    };
  }

  /**
   * Main entry point for processing a user message.
   * @param {string} message - The text message from the user
   * @param {string} [imageUrl] - Optional base64 or URL of an image to analyze
   */
  async processMessage(message, imageUrl = null) {
    const lowerMsg = message ? message.toLowerCase() : "";

    // 1. SEARCH KNOWLEDGE BASE (Context Retrieval)
    let contextInfo = "";
    let matchedKnowledge = null;
    
    // Improved Scoring Algorithm
    const scoredMatches = REPAIR_KNOWLEDGE_BASE.map(item => {
        let score = 0;
        // Check title matches (higher weight)
        const titleWords = item.title.toLowerCase().split(/\s+/);
        titleWords.forEach(word => {
            if (word.length > 3 && lowerMsg.includes(word)) score += 3;
        });

        // Check keyword matches
        item.keywords.forEach(k => {
            if (k.length > 3 && lowerMsg.includes(k)) score += 1;
        });

        return { item, score };
    });

    // Sort by score descending
    scoredMatches.sort((a, b) => b.score - a.score);

    // OPTIMIZATION: Only send the top 15 most relevant topics to the AI to keep the prompt small and fast.
    // Previously we sent the entire database which slowed things down.
    const topTopics = scoredMatches.slice(0, 15).map(m => `- ${m.item.title}`).join('\n');
    contextInfo += `\n\nRELEVANT TOPICS FOUND:\n${topTopics}\nIf the user's query matches one of these but you don't have the full content, ask if they want details.`;

    // Get the absolute best match for full content loading
    const bestMatch = scoredMatches[0];

    if (bestMatch && bestMatch.score >= 4) {
      matchedKnowledge = bestMatch.item;
      // Only attach assets if the score is very high (strong relevance)
      const assetsToAttach = bestMatch.score >= 6 ? bestMatch.item.assets : null;
      
      contextInfo += `\n\n*** FULL KNOWLEDGE BASE ENTRY LOADED ***:\nTitle: ${matchedKnowledge.title}\nContent: ${matchedKnowledge.content}\nSteps: ${matchedKnowledge.steps ? matchedKnowledge.steps.join(", ") : "N/A"}\nAssets Available: ${JSON.stringify(matchedKnowledge.assets)}`;
      
      if (bestMatch.score < 6) {
         matchedKnowledge = { ...matchedKnowledge, assets: null };
      }
    }

    // 2. CALL OPENAI (via Netlify Function)
    try {
      // Construct current user message
      const currentUserMsg = { role: "user", content: [] };
      
      if (message) {
          currentUserMsg.content.push({ type: "text", text: message });
      }
      
      if (imageUrl) {
          currentUserMsg.content.push({ 
              type: "image_url", 
              image_url: { url: imageUrl } 
          });
      }

      // Add to history
      this.history.push(currentUserMsg);

      // Limit history to last 10 turns to prevent token overflow
      if (this.history.length > 10) {
          this.history = this.history.slice(-10);
      }

      const messages = [
        { role: "system", content: SYSTEM_PROMPT + contextInfo }, // Inject knowledge here
        ...this.history
      ];

      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, tools: AVAILABLE_TOOLS })
      });

      if (!response.ok) {
        let errorMsg = `Status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg += `: ${errorData.error || JSON.stringify(errorData)}`;
        } catch (e) {
            errorMsg += `: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const aiMessage = await response.json();

      // Add AI response to history
      this.history.push({ role: "assistant", content: aiMessage.content || "" }); // Handle tool calls which might have null content

      // 3. HANDLE TOOL CALLS (The "Calculator" Logic)
      if (aiMessage.tool_calls) {
        const toolCall = aiMessage.tool_calls[0];
        
        if (toolCall.function.name === "calculate_spot_repair") {
          const args = JSON.parse(toolCall.function.arguments);
          
          // Execute the local calculator engine
          const result = CalculatorEngine.calculateSpotRepair(args.length, args.width, args.count || 1);
          
          return {
            type: 'calculation_result',
            text: `I've calculated the materials for a ${args.length}' x ${args.width}' patch (${args.count || 1} count).`,
            data: result
          };
        } else if (toolCall.function.name === "suggest_next_steps") {
            const args = JSON.parse(toolCall.function.arguments);
            return {
                type: 'text',
                text: args.message,
                ui: {
                    options: args.options.map(opt => ({ label: opt }))
                }
            };
        }
      }

      // 4. DEFAULT RESPONSE
      return {
        type: 'text',
        text: aiMessage.content,
        assets: matchedKnowledge ? matchedKnowledge.assets : null
      };

    } catch (error) {
      console.error("Bot Logic Error:", error);
      return {
        type: 'text',
        text: "I'm having trouble connecting to the AI service. Please check your internet connection."
      };
    }
  }

  fallbackLogic(lowerMsg, errorDetails = "") {
    // If the AI is down, we just apologize. We don't want to simulate a complex brain.
    return {
      type: 'text',
      text: `I'm having trouble connecting to my AI brain right now. (Error: ${errorDetails}). Please check your internet connection or API configuration.`
    };
  }

  handleCalculatorFlow(message) {
    this.context.mode = 'calculator';
    const lowerMsg = message.toLowerCase();

    // 1. Try to update state based on message content
    if (!this.context.calculatorState.repairType) {
        if (lowerMsg.includes('spot') || lowerMsg.includes('patch')) {
            this.context.calculatorState.repairType = CALCULATOR_TYPES.SPOT_REPAIR;
        } else if (lowerMsg.includes('full') || lowerMsg.includes('roof')) {
            this.context.calculatorState.repairType = CALCULATOR_TYPES.FULL_ROOF;
        } else if (lowerMsg.includes('linear') || lowerMsg.includes('flash')) {
            this.context.calculatorState.repairType = CALCULATOR_TYPES.LINEAR_FLASHING;
        }
    } else if (this.context.calculatorState.repairType === CALCULATOR_TYPES.SPOT_REPAIR) {
        if (!this.context.calculatorState.dimensions) {
            // Try to parse "10x10" or "10 by 10"
            const match = lowerMsg.match(/(\d+)\s*(?:x|by|\*)\s*(\d+)/);
            if (match) {
                this.context.calculatorState.dimensions = {
                    length: parseInt(match[1]),
                    width: parseInt(match[2])
                };
            }
        } else if (!this.context.calculatorState.count) {
             // Try to parse a single number
             const match = lowerMsg.match(/(\d+)/);
             if (match) {
                 this.context.calculatorState.count = parseInt(match[1]);
             }
        }
    }
    
    // Simple state machine simulation
    // In a real app, we'd parse numbers from the message
    
    const nextStep = CalculatorEngine.getNextStep(this.context.calculatorState);
    
    if (nextStep.isComplete) {
      // Run calculation
      const result = CalculatorEngine.calculateSpotRepair(
        this.context.calculatorState.dimensions.length,
        this.context.calculatorState.dimensions.width,
        this.context.calculatorState.count
      );
      
      // Reset mode
      this.context.mode = 'general';
      this.context.calculatorState = {};

      return {
        type: 'calculation_result',
        text: `Based on your inputs, here is the estimated material manifest:`,
        data: result
      };
    }

    return {
      type: 'question',
      text: nextStep.question,
      ui: nextStep // Pass UI hints to the frontend
    };
  }
  
  // Helper to update state from UI interactions (not just text)
  updateCalculatorState(key, value) {
    this.context.calculatorState[key] = value;
    return this.handleCalculatorFlow(""); // Trigger next step
  }
}
