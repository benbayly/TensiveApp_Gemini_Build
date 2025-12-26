import OpenAI from 'openai';
import 'dotenv/config';

export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log("DEBUG: API Key loaded:", apiKey ? apiKey.substring(0, 15) + "..." : "undefined");

  if (!apiKey || apiKey.includes('your-api-key-here')) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OpenAI API Key not configured correctly. Please check your .env file.' }),
    };
  }

  const openai = new OpenAI({ apiKey });

  try {
    const { messages, tools } = JSON.parse(event.body);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: tools, // Pass tools if provided (for calculator/logic)
      tool_choice: tools ? "auto" : "none", 
    });

    const responseMessage = completion.choices[0].message;

    return {
      statusCode: 200,
      body: JSON.stringify(responseMessage),
    };

  } catch (error) {
    console.error('OpenAI Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to communicate with OpenAI', details: error.message }),
    };
  }
};
