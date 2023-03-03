import clsx from 'clsx'
import { marked } from 'marked'

export type Message = {
	role: 'bot' | 'user' | 'assistant' | undefined
	message?: string
}

// util helper to convert new lines to <br /> tags
const convertNewLines = (text: string) =>
	text.split('\n').map((line, i) => (
		<span key={i}>
			{line}
			<br />
		</span>
	))

export function ChatLine({ role = 'assistant', message }: Message) {
	if (!message) {
		return null
	}
	const formatteMessage = convertNewLines(message)

	return (
		<div
			className={
				role != 'assistant'
					? 'float-right clear-both'
					: 'float-left clear-both w-full'
			}
		>
			<div className='w-full flex'>
				<div className='float-right w-full mb-5 rounded-lg bg-white px-4 py-5 shadow-lg ring-1 ring-zinc-100 sm:px-6'>
					<div className='flex space-x-3'>
						<div className='flex-1 gap-4'>
							<p className='font-large text-xxl text-gray-900'>
								<a href='#' className='hover:underline'>
									{role == 'assistant' ? 'AI' : 'You'}
								</a>
							</p>
							<article
								className={clsx(
									'my-2 w-full break-all prose dark:prose-invert',
									role == 'assistant' ? 'font-semibold ' : 'text-gray-400'
								)}
								dangerouslySetInnerHTML={{ __html: marked(message) }}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
