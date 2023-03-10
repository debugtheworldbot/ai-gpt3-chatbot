import { useEffect, useRef, useState } from 'react'
import { Button } from './Button'
import { type Message, ChatLine } from './ChatLine'
import { useCookies } from 'react-cookie'

const COOKIE_NAME = 'nextjs-example-ai-chat-gpt3'

// default first message to display in UI (not necessary to define the prompt)
export const initialMessages: Message[] = [
	{
		role: 'assistant',
		message: 'Hi! I’m A friendly AI assistant. Ask me anything!',
	},
]

const InputMessage = ({ input, setInput, sendMessage }: any) => (
	<div className='mt-6 flex clear-both'>
		<input
			type='text'
			aria-label='chat input'
			required
			className='min-w-0 flex-auto appearance-none rounded-md border border-zinc-900/10 bg-white px-3 py-[calc(theme(spacing.2)-1px)] shadow-md shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 sm:text-sm'
			value={input}
			onKeyDown={(e) => {
				if (e.key === 'Enter') {
					sendMessage(input)
					setInput('')
				}
			}}
			onChange={(e) => {
				setInput(e.target.value)
			}}
		/>
		<Button
			type='submit'
			className='ml-4 flex-none'
			onClick={() => {
				sendMessage(input)
				setInput('')
			}}
		>
			Say
		</Button>
	</div>
)

export function Chat() {
	const [messages, setMessages] = useState<Message[]>(initialMessages)
	const [input, setInput] = useState('')
	const [cookie, setCookie] = useCookies([COOKIE_NAME])
	const messagesEndRef = useRef<any>(null)

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}
	useEffect(() => {
		scrollToBottom()
	}, [messages])

	useEffect(() => {
		if (!cookie[COOKIE_NAME]) {
			// generate a semi random short id
			const randomId = Math.random().toString(36).substring(7)
			setCookie(COOKIE_NAME, randomId)
		}
	}, [cookie, setCookie])

	// send message to API /api/chat endpoint
	const sendMessage = async (message: string) => {
		const newMessages = [
			...messages,
			{ message: message, role: 'user' } as Message,
		]
		setMessages(newMessages)
		const last10messages = newMessages.slice(-10)

		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				messages: last10messages,
				user: cookie[COOKIE_NAME],
			}),
		})

		const data = response.body
		if (!data) {
			return
		}
		const reader = data.getReader()
		const decoder = new TextDecoder()
		let done = false

		let currentResponse: string[] = []
		while (!done) {
			const { value, done: doneReading } = await reader.read()
			done = doneReading
			const chunkValue = decoder.decode(value)
			// currentResponse = [...currentResponse, message, chunkValue];
			currentResponse = [...currentResponse, chunkValue]
			setMessages([
				...newMessages,
				{ message: currentResponse.join(''), role: 'assistant' } as Message,
			])
		}
		// strip out white spaces from the bot message
	}

	return (
		<div className='rounded-2xl border-zinc-100  lg:border lg:p-6'>
			{messages.map(({ message, role }, index) => (
				<ChatLine key={index} role={role} message={message} />
			))}

			{messages.length < 2 && (
				<span className='mx-auto flex flex-grow text-gray-600 clear-both'>
					Type a message to start the conversation
				</span>
			)}
			<InputMessage
				input={input}
				setInput={setInput}
				sendMessage={sendMessage}
			/>
			<div ref={messagesEndRef}></div>
		</div>
	)
}
