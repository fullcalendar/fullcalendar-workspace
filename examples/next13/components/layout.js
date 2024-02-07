import Head from 'next/head'
import Link from 'next/link'

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>FullCalendar Next.js 13 Example</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="favicon" href="/favicon.ico" />
      </Head>
      <div className='navbar'>
        <Link prefetch={false} href='/'>Home</Link>
        <Link prefetch={false} href='/calendar'>Calendar</Link>
        <Link prefetch={false} href='/about'>About</Link>
      </div>
      <div>
        {children}
      </div>
    </>
  )
}
