import { Card } from '@tremor/react'
import ReactCountryFlag from 'react-country-flag'
import { icons } from 'lucide-react';

export default function Home() {
  console.log(icons);
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className='flex flex-col gap-3 w-75'>
        <h2 className='cursor-default duration-500 text-dark-tremor-content-strong hover:text-blue-500 text-center font-semibold text-xl'>
          Raphaël | Raxuis
        </h2>
        <p className='text-center text-tremor-default text-dark-tremor-content'>
          French Junior Full Stack Developer <ReactCountryFlag countryCode='FR' />
        </p>
        <p className='text-xl text-dark-tremor-content-strong text-center font-semibold'>
          Some of my social networks :
        </p>
        <ul className='flex justify-around text-dark-tremor-content-subtle'>
          <a target='_blank' href='https://github.com/Raxuis'><icons.Github className='duration-500 hover:text-tremor-brand-faint' /></a>
          <a target='_blank' href='https://linkedin.com/in/raphael-raclot'><icons.Linkedin className='duration-500 hover:text-tremor-brand-faint' /></a>
          <a target='_blank' href='https://X.com/I_Haruki_I'><icons.Twitter className='duration-500 hover:text-tremor-brand-faint' /></a>
          <a target='_blank' href='/analytics'><icons.Activity className='duration-500 hover:text-tremor-brand-faint' /></a>
          <a target='_blank' href='https://raphaelraclot.vercel.app'><icons.Code className='duration-500 hover:text-tremor-brand-faint' /></a>
          <a target='_blank' href='https://codepen.io/_Haruki_'><icons.Codepen className='duration-500 hover:text-tremor-brand-faint' /></a>
        </ul>
      </Card>
    </main>
  );
}
