'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

const vendor = 'https://d35aaqx5ub95lt.cloudfront.net/vendor/';
const languages = [
  ['English', 'bbe17e16aa4a106032d8e3521eaed13e.svg'],
  ['Spanish', '59a90a2cedd48b751a8fd22014768fd7.svg'],
  ['French', '482fda142ee4abd728ebf4ccce5d3307.svg'],
  ['German', 'c71db846ffab7e0a74bc6971e34ad82e.svg'],
  ['Italian', '635a09df9323279d39934a991edd4510.svg'],
  ['Portuguese', '27d253ae1272917fc9f4a79459aacd53.svg'],
  ['Math', '395c8a6ee9783610b578b02fda405e85.svg'],
  ['Japanese', 'edea4fa18ff3e7d8c0282de3f102aaed.svg'],
  ['Arabic', '9ab6930a263c981b57f9d578ac97cae7.svg'],
  ['Korean', 'ec5835ac9f465ff3dad4b1b8725d4314.svg'],
  ['Hindi', '73837fa39dbf1bcc4c95a17a58ed0ffb.svg'],
  ['Chinese', '9905aa3a86fcb9e351b0b3bfaf04d8b9.svg'],
] as const;

export default function LanguageNav() {
  const ref = useRef<HTMLDivElement>(null);
  const shift = (amount: number) => ref.current?.scrollBy({ left: amount, behavior: 'smooth' });

  return (
    <div className="flex h-[74px] w-full items-center border-y-2 border-[#e5e5e5] bg-white">
      <div className="mx-auto grid h-full w-full max-w-[1056px] grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-4 px-4 sm:gap-7">
        <button className="grid h-10 w-7 place-items-center rounded-full hover:bg-[#f7f7f7]" aria-label="Previous languages" onClick={() => shift(-320)}>
          <ChevronLeft className="h-6 w-6 text-[#afafaf]" />
        </button>
        <div ref={ref} className="flex min-w-0 items-center gap-5 overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {languages.map(([name, asset]) => (
            <button className="flex shrink-0 items-center gap-2 rounded-lg px-1 py-2 text-[16px] font-bold uppercase leading-none text-[#777] transition-colors hover:bg-black/5 hover:text-[#4b4b4b]" key={name}>
              <img src={vendor + asset} alt="" className="block h-7 w-9 shrink-0 object-contain" />
              <span className="block">{name}</span>
            </button>
          ))}
        </div>
        <button className="grid h-10 w-7 place-items-center rounded-full hover:bg-[#f7f7f7]" aria-label="Next languages" onClick={() => shift(320)}>
          <ChevronRight className="h-6 w-6 text-[#afafaf]" />
        </button>
      </div>
    </div>
  );
}
