import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser'
import { type NextRequest, NextResponse } from 'next/server'
import { initialMessages } from '../../components/Chat'
import { type Message } from '../../components/ChatLine'

// break the app if the API key is missing
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY')
}

const botName = 'AI'
const userName = 'News reporter' // TODO: move to ENV var
const firstMessge = initialMessages[0].message

// @TODO: unit test this. good case for unit testing
const generatePromptFromMessages = (messages: Message[]) => {
  console.log('== INITIAL messages ==', messages)

  return messages.map(m => ({
    role: m.role,
    content: m.message
  }))
  let prompt = ''

  // add first user message to prompt
  prompt += messages[1].message

  // remove first conversaiton (first 2 messages)
  const messagesWithoutFirstConvo = messages.slice(2)
  console.log(' == messagesWithoutFirstConvo', messagesWithoutFirstConvo)

  // early return if no messages
  if (messagesWithoutFirstConvo.length == 0) {
    return prompt
  }

  messagesWithoutFirstConvo.forEach((message: Message) => {
    const name = message.role === 'user' ? userName : botName
    prompt += `\n${name}: ${message.message}`
  })
  return prompt
}

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  // read body from request
  console.log('req', req)
  const body = await req.json()

  // const messages = req.body.messages
  const messagesPrompt = generatePromptFromMessages(body.messages)

  console.log('messagesPrompt', messagesPrompt)

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
    // stream: true
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
  console.log(response)

  return response
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
          console.log('after', json)

          // try {
          //   // const json = {
          //   //   id: 'chatcmpl-6pqVJi7eNrAmZ2jdkGkp4DYisDu6K',
          //   //   object: 'chat.completion.chunk',
          //   //   created: 1677814573,
          //   //   model: 'gpt-3.5-turbo-0301',
          //   //   choices: [ { delta: { content: ' I' }, index: 0, finish_reason: null } ]
          //   // }


          //   const text = json.choices[0].delta?.content
          //   if (!!text) {

          //     const queue = encoder.encode(text)
          //     controller.enqueue(queue)

          //   }
          // } catch (e) {
          //   console.log('error' + e)
          // }
        }
      }

      // const parser = createParser(streamParser)
      // response.body!.pipeTo(new WritableStream({
      //   write(chunk) {
      //     const data = decoder.decode(chunk)

      //     parser.feed(data)
      //   }
      // }))
    },
  })
  const res = NextResponse.json(stream)
  console.log('res', res)
  return res

  const data = await response.json()

  console.log('data', data)
  if (data.error) {
    console.error('OpenAI API error: ', data.error)
    return NextResponse.json({
      text: `ERROR with API integration. ${data.error.message}`,
    })
  }

  // return response with 200 and stringify json text
  return NextResponse.json({ text: data.choices[0].message })
}
