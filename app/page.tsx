import { Archive } from '@/components/sections/Archive';
import { Contact } from '@/components/sections/Contact';
import { Craft } from '@/components/sections/Craft';
import { Hero } from '@/components/sections/Hero';
import { MarqueeBand } from '@/components/sections/MarqueeBand';
import { Measures } from '@/components/sections/Measures';
import { Showcase } from '@/components/sections/Showcase';
import { Story } from '@/components/sections/Story';

/**
 * Section order is also the narrative order, and the ids here are the contract
 * the navigation's active-section indicator reads (constants/navigation.ts).
 *
 * The rhythm alternates deliberately: free-scrolling sections between the three
 * pinned ones, so the page never feels like it is fighting the scroll wheel.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <MarqueeBand />
      <Story />
      <Craft />
      <Showcase />
      <Measures />
      <Archive />
      <Contact />
    </>
  );
}
