import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser'
import { type NextRequest } from 'next/server'
import { type Message } from '../../components/ChatLine'

// break the app if the API key is missing
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY')
}

const botName = 'AI'
const userName = 'News reporter' // TODO: move to ENV var

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  // read body from request
  const body = await req.json()


  const payload = {
    model: 'gpt-3.5-turbo',
    // prompt: finalPrompt,
    messages: body.messages.map((m: Message) => ({ role: m.role, content: m.message })),
    temperature: 0.7,
    max_tokens: 200,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: [`${botName}:`, `${userName}:`],
    user: body?.user,
    stream: true
  }

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  }

  if (process.env.OPENAI_API_ORG) {
    requestHeaders['OpenAI-Organization'] = process.env.OPENAI_API_ORG
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: requestHeaders,
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const streamParser = (event: ParsedEvent | ReconnectInterval) => {

        if (event.type === 'event') {
          const data = event.data
          if (data === '[DONE]') {
            controller.close()
            return
          }
          const json = JSON.parse(data)
          try {
            // const json = {
            //   id: 'chatcmpl-6pqVJi7eNrAmZ2jdkGkp4DYisDu6K',
            //   object: 'chat.completion.chunk',
            //   created: 1677814573,
            //   model: 'gpt-3.5-turbo-0301',
            //   choices: [ { delta: { content: ' I' }, index: 0, finish_reason: null } ]
            // }


            const text = json.choices[0].delta?.content
            const queue = encoder.encode(text)
            controller.enqueue(queue)

          } catch (e) {
            console.log('error' + e)
          }
        }

      }
      const parser = createParser(streamParser)
      for await (const chunk of response.body as any) {
        parser.feed(decoder.decode(chunk))
      }
    },
  })
  const res = new Response(stream)
  return res

  // return NextResponse.json(stream)


  // console.log('data', data)
  // if (data.error) {
  //   console.error('OpenAI API error: ', data.error)
  //   return NextResponse.json({
  //     text: `ERROR with API integration. ${data.error.message}`,
  //   })
  // }

  // // return response with 200 and stringify json text
  // return NextResponse.json({ text: data.choices[0].message })
}
