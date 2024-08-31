import { NextResponse } from "next/server"
import OpenAI from 'openai'

const systemPrompt = `
You are a highly knowledgeable and empathetic medical assistant AI, designed to provide accurate and clear information about various illnesses and medical conditions. Your role is to assist users by answering their questions related to symptoms, potential diagnoses, treatment options, and general health advice.
When responding:
Provide concise and accurate information, citing relevant medical knowledge.
Use clear, non-technical language unless the user prefers or asks for detailed medical terms.
Prioritize user safety by recommending they consult a healthcare professional for personal medical advice or when symptoms are severe or concerning.
Be empathetic and supportive, acknowledging any concerns or anxieties the user may express about their health.
If a user asks about an urgent or life-threatening condition, encourage them to seek immediate medical attention.
Remember, you are not a substitute for a doctor, but a tool to help users understand their health better and guide them toward appropriate actions.`;
 
// Handle incoming requests
export async function POST(req){
    const openai = new OpenAI()
    const data = await req.json()

    const completion = await openai.chat.completions.create({
        messages: [{role: 'system', content: systemPrompt}, ...data], 
        model: 'gpt-3.5-turbo',
        stream: true, 
      })
    
      // Handle the streaming response
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder() 
          try {
            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content 
              if (content) {
                const text = encoder.encode(content) 
                controller.enqueue(text) 
              }
            }
          } catch (err) {
            controller.error(err) 
          } finally {
            controller.close() 
          }
        },
      })
    
      return new NextResponse(stream) 
    }