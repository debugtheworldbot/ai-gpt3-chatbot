import { Layout, Text, Page } from '@vercel/examples-ui'
import { Chat } from '../components/Chat'

function Home() {
	return (
		<div className='flex flex-col gap-12 lg:px-12 pt-10'>
			<section className='flex flex-col gap-3'>
				<Text variant='h2'>AI Chat Bot:</Text>
				<div className='lg:w-full'>
					<Chat />
				</div>
			</section>
		</div>
	)
}

Home.Layout = Layout

export default Home
