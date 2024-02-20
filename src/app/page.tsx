import { Card } from '@tremor/react'
import ReactCountryFlag from 'react-country-flag'
import { icons } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className='flex flex-col gap-3 w-60'>
        <h2 className='w-full text-dark-tremor-content-strong text-center  font-semibold text-xl'>
          Raphaël | Raxuis
        </h2>
        <p className='text-center'>
          French Junior Full Stack Developer <ReactCountryFlag countryCode='FR' />
        </p>
        <p className='text-xl text-dark-tremor-content-strong text-center  font-semibold'>
          Some of my social networks :
        </p>
        <div className='flex justify-around'>
          <icons.Github href='https://github.com/Raxuis' />
          <icons.Linkedin href='https://linkedin.com/in/raphael-raclot' />
          <icons.Twitter href='https://X.com/I_Haruki_I' />
        </div>
      </Card>
    </main>
  );
}
