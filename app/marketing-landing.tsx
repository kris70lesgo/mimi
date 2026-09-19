'use client';

import Link from 'next/link';
import {ChevronDown, ChevronLeft, ChevronRight, Play, Sparkles, Stethoscope} from 'lucide-react';
import HlsVideo from '../components/HlsVideo';
import './marketing-landing.css';

const streams = {
  anywhere: 'https://stream.mux.com/6xLBelbJrZGw00K2jPsZtGm8pkftvfezQ8rdAmHL9HoM.m3u8',
};

const systems = [
  ['Heart', '/study/anatomy/heart/organ.webp'], ['Brain', '/study/anatomy/brain/organ.webp'],
  ['Lungs', '/study/anatomy/lungs/organ.webp'], ['Bones', '/mimi/learn.svg'], ['Muscles', '/mimi/mascot.svg'],
  ['Eyes', '/study/anatomy/eyeball/organ.webp'], ['Skin', '/study/anatomy/skin/organ.webp'],
  ['Kidneys', '/study/anatomy/kidneys/organ.webp'], ['Liver', '/study/anatomy/liver/organ.webp'],
];

const footerGroups = [
  ['Mimi', 'About us', 'Our approach', 'For educators', 'Research', 'Careers'],
  ['Explore', 'Learning paths', '3D atlas', 'Practice lab', 'Study sets', 'Daily challenge'],
  ['Support', 'Help center', 'Contact us', 'Community', 'Accessibility'],
  ['Legal', 'Privacy', 'Terms', 'Data policy', 'Cookie policy'],
];

function MimiMark() {
  return <span className="landing-mark"><span>m</span>Mimi</span>;
}

function Action({href, children, tone = 'green'}: {href: string; children: React.ReactNode; tone?: 'green' | 'outline' | 'white'}) {
  return <Link href={href} className={`landing-action landing-action-${tone}`}>{children}</Link>;
}

export default function MarketingLanding() {
  function moveLanguages(direction: number) {
    document.querySelector('.landing-system-scroll')?.scrollBy({left: direction * 310, behavior: 'smooth'});
  }

  return <main className="mimi-landing-page" id="top">
    <nav className="landing-nav" aria-label="Main navigation">
      <Link href="#top" className="landing-brand" aria-label="Mimi home"><MimiMark /></Link>
      <div className="landing-nav-right">
        <button className="landing-language" type="button">SITE LANGUAGE: ENGLISH <ChevronDown size={15} /></button>
        <Action href="/login" tone="outline">Log in</Action>
      </div>
    </nav>

    <header className="landing-hero">
      <div className="landing-illustration-shell hero-video landing-community-art"><img src="/mimi/landing/community.png" alt="A lively community of learners" /></div>
      <div className="landing-hero-copy">
        <p className="landing-eyebrow"><Sparkles size={17} /> INTERACTIVE HUMAN ANATOMY</p>
        <h1><span>The visual, playful way to</span><strong>learn anatomy.</strong></h1>
        <p>Build a working map of the human body with quick lessons, real 3D models, and practice that sticks.</p>
        <div className="landing-actions">
          <Action href="/login">Get started</Action>
          <Action href="/login" tone="outline">I already have an account</Action>
        </div>
      </div>
    </header>

    <section className="landing-systems" aria-label="Explore anatomy systems">
      <button aria-label="Previous systems" onClick={() => moveLanguages(-1)}><ChevronLeft /></button>
      <div className="landing-system-scroll">
        {systems.map(([name, image]) => <Link href="/login" key={name}><img src={image} alt="" /><span>{name}</span></Link>)}
      </div>
      <button aria-label="Next systems" onClick={() => moveLanguages(1)}><ChevronRight /></button>
    </section>

    <section className="landing-feature landing-feature-light">
      <div className="landing-feature-copy">
        <p className="landing-eyebrow landing-green"><Sparkles size={17} /> DESIGNED FOR CURIOSITY</p>
        <h2>free. fun. effective.</h2>
        <p>Learning anatomy with Mimi is visual and active. Rotate a structure, test your recall, and learn why each part matters in the system around it.</p>
        <Link href="/login" className="landing-text-link">Explore how Mimi works <ChevronRight size={19} /></Link>
      </div>
      <div className="landing-illustration-shell feature-video landing-learning-art"><img src="/mimi/landing/learning-path.png" alt="A learner progressing through practice cards" /></div>
    </section>

    <section className="landing-anywhere">
      <HlsVideo src={streams.anywhere} className="landing-anywhere-video" />
      <div className="landing-anywhere-content">
        <p className="landing-eyebrow landing-blue"><Stethoscope size={17} /> YOUR STUDY, YOUR PACE</p>
        <h2>learn anytime,<br />anywhere</h2>
        <p>Take a two-minute challenge between classes, explore the atlas on a larger screen, and return whenever you want another angle.</p>
        <div className="landing-store-links">
          <Link href="/login"><Play size={23} fill="currentColor" /><span><small>START ON THE</small>Web app</span></Link>
          <Link href="/atlas"><Stethoscope size={23} /><span><small>EXPLORE THE</small>3D atlas</span></Link>
        </div>
      </div>
    </section>

    <section className="landing-feature landing-plus">
      <div className="landing-illustration-shell feature-video landing-plus-art"><img src="/mimi/landing/mimi-plus.png" alt="Mimi relaxing with unlimited learning" /></div>
      <div className="landing-feature-copy">
        <p className="landing-eyebrow landing-mint"><Sparkles size={17} /> MIMI PLUS</p>
        <h2>Make your study time go further.</h2>
        <p>Unlock unlimited review and focused practice sessions, with a clear picture of what to study next.</p>
        <Action href="/login" tone="white">Try Mimi Plus</Action>
      </div>
    </section>

    <section className="landing-feature landing-feature-light landing-practice">
      <div className="landing-feature-copy">
        <p className="landing-eyebrow landing-green"><Stethoscope size={17} /> PRACTICE WITH PURPOSE</p>
        <h2>See what you know.</h2>
        <p>Practice with different systems, not recycled diagrams. Identify real structures, build spatial understanding, and revisit the concepts that need another look.</p>
        <Link href="/login" className="landing-text-link">Try a quick challenge <ChevronRight size={19} /></Link>
      </div>
      <div className="landing-illustration-shell feature-video landing-milestone-art"><img src="/mimi/landing/milestone.png" alt="A learner reaching a new learning milestone" /></div>
    </section>

    <section className="landing-cta">
      <div className="landing-cta-copy">
        <p className="landing-eyebrow landing-green">YOUR BODY, YOUR MAP</p>
        <h2>Learn anatomy with Mimi.</h2>
        <Action href="/login">Get started</Action>
      </div>
      <div className="landing-illustration-shell landing-cta-video landing-rewards-art"><img src="/mimi/landing/rewards.png" alt="Mimi celebrating learning rewards" /></div>
    </section>

    <footer className="landing-footer">
      <div className="landing-footer-grid">
        <div className="landing-footer-intro"><MimiMark /><p>Interactive anatomy learning for everyone who wants to understand the body, not just memorize it.</p><Link href="/login">Try the public demo <ChevronRight size={16} /></Link></div>
        {footerGroups.map(([title, ...items]) => <div key={title}><h3>{title}</h3>{items.map(item => <a href="#top" key={item}>{item}</a>)}</div>)}
      </div>
      <div className="landing-footer-bottom"><span>© 2026 Mimi</span><span>Made for anatomy curiosity</span><Link href="/login">Log in</Link></div>
    </footer>
  </main>;
}
