import { Card } from '@tremor/react';
import ReactCountryFlag from 'react-country-flag';
import { Github, Linkedin, Activity, Code, Twitter } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className='flex flex-col items-center gap-3 w-75 duration-700 hover:scale-105'>
        <Image src='/avatar.jpg' alt='Avatar' width={75} height={75} className='rounded-full' />
        <h2 className='cursor-default duration-500  text-tremor-title text-tremor-background-emphasis dark:text-dark-tremor-content-strong hover:text-blue-500 text-center font-semibold'>
          Raphaël | Raxuis
        </h2>
        <p className='text-center text-tremor-default text-dark-tremor-content'>
          French Junior Full Stack Developer <ReactCountryFlag countryCode='FR' />
        </p>
        <p className='text-xl dark:text-dark-tremor-content-strong text-tremor-background-emphasis text-center font-semibold'>
          Some of my social networks :
        </p>
        <ul className='flex gap-5 text-dark-tremor-content-subtle'>
          <a target='_blank' href='https://github.com/Raxuis'><Github className='duration-500 dark:hover:dark:text-tremor-brand-faint hover:text-tremor-brand' /></a>
          <a target='_blank' href='https://linkedin.com/in/raphael-raclot'><Linkedin className='duration-500 dark:hover:dark:text-tremor-brand-faint hover:text-tremor-brand' /></a>
          <a target='_blank' href='https://X.com/I_Haruki_I'><Twitter className='duration-500 dark:hover:dark:text-tremor-brand-faint hover:text-tremor-brand' /></a>
          <a target='_blank' href='/analytics'><Activity className='duration-500 dark:hover:dark:text-tremor-brand-faint hover:text-tremor-brand' /></a>
          <a target='_blank' href='https://raphaelraclot.vercel.app'><Code className='duration-500 dark:hover:dark:text-tremor-brand-faint hover:text-tremor-brand' /></a>
        </ul>
      </Card>
    </main>
  );
}
