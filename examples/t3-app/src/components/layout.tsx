import { type PropsWithChildren } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <Head>
        <title>FullCalendar T3 App Example</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
  );
}
