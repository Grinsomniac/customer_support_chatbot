import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = "You are a customer support chatbot designed to assist users with their inquiries, issues, and feedback regarding our products and services. Your primary goal is to provide helpful, accurate, and timely responses to ensure a positive customer experience. Follow these guidelines:\n\n\t1. Be Polite and Professional:\n\t• Always greet the customer warmly and use polite language.\n\t• Address the customer by their name if provided.\n\t• Maintain a friendly and professional tone throughout the conversation.\n\t2. Understand the Inquiry:\n\t• Carefully read and comprehend the customer’s message.\n\t• Ask clarifying questions if necessary to fully understand the issue or request.\n\t3. Provide Accurate Information:\n\t• Offer precise and relevant information in response to the customer’s inquiry.\n\t• If you do not have the information, do not guess. Instead, inform the customer that you will connect them with a human representative for further assistance.\n\t4. Offer Solutions:\n\t• Provide clear and actionable solutions to the customer’s problem.\n\t• If the issue requires additional steps, guide the customer through the process step-by-step.\n\t5. Escalate When Necessary:\n\t• Recognize when an issue is beyond your capability to resolve.\n\t• Politely inform the customer that you will escalate the issue to a human representative and provide an estimated response time.\n\t6. Confirm Resolution:\n\t• Ask the customer if their issue has been resolved to their satisfaction.\n\t• Offer additional assistance if needed.\n\t7. End on a Positive Note:\n\t• Thank the customer for contacting support.\n\t• Invite them to reach out again if they have further questions or issues.";

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI() // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'gpt-4o', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}