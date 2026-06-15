import type { EventConcept } from '@/types/events';

/** Concept cards shown on the homepage to gauge interest before booking. */
export const EVENT_CONCEPTS: EventConcept[] = [
  {
    name: 'Silent Disco',
    tagline: 'Rooftop / 3 channels',
    description: 'Three DJs, three channels, one rooftop of glowing headphones. Pick your frequency.',
  },
  {
    name: 'Warehouse Rave',
    tagline: 'After-hours / BYOEnergy',
    description: 'Raw space, heavy sound system, lights for days. Doors late, ends later.',
  },
  {
    name: 'Day Party',
    tagline: 'Golden hour / open air',
    description: 'Sun, speakers, and the city skyline. The pregame that becomes the main event.',
  },
  {
    name: 'Campus Takeover',
    tagline: 'College nightlife',
    description: 'Student-run energy, big-room headliners, the night your campus talks about for weeks.',
  },
  {
    name: 'Artist Pop-Up',
    tagline: 'One night only',
    description: 'Rising ATL artists, local vendors, visuals on every wall. When it is gone, it is gone.',
  },
  {
    name: 'Rooftop Game Night',
    tagline: 'Social / chill',
    description: 'Spades, dominoes, UNO, and a DJ keeping the energy right. Bring a partner or get drafted.',
  },
];

// "Who We've Hosted" is admin-managed and loaded from Supabase
// (see components/home/WhoWeveHosted.tsx). No hardcoded/fake entries.
