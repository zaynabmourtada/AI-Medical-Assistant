import { NextResponse } from "next/server"
import OpenAI from 'openai'

const systemPrompt = "You are an expert medical assistant. Provide accurate and detailed medical advice, while keeping the explanations simple and easy to understand for patients.";
 
// Handle incoming requests
export async function POST(req){
    const openai = new OpenAI()
    const data = await req.json()

    // Chat completion request
    const completion = await openai.chat.completions.create({
        messages: [{role: 'system', content: systemPrompt}, ...data],
        model: 'gpt-4o',
        stream: true,
    })

    // Handle the streaming response
    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await (const chunk of completion){
                    const content = chunk.choices[0]?.delta?.content 
                    if(content) {
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch(err){
                controller.error(err)
            } finally {
                controller.close()
            }
        },
    })
    
    return new NextResponse(stream)
}