// Template-based lyric generation. This is an honest approximation, not a real
// lyrics API — the same convention the rest of the AI screens follow. It moved out
// of the (now removed) AI Lyrics screen so the AI Song generator can produce lyrics
// automatically alongside the track.

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
};

// Mood-flavoured line pools. {t} = the song's theme (its title).
const VERSE_LINES = {
  Love: [
    'Every time I see you, {t} feels brand new',
    'Holding on to {t}, there\'s nothing I won\'t do',
    'In your eyes I found a reason to believe',
    'You and me together, that\'s all I need',
    'Whisper me your secrets in the dark',
    'Your love is the fire lighting up my heart',
  ],
  Heartbreak: [
    'Now the room is empty where {t} used to be',
    'I keep chasing shadows of a memory',
    'Every song reminds me of the words you said',
    'Tears on my pillow, echoes in my head',
    'I gave you my everything, you gave me goodbye',
    'Still I keep pretending that I\'m doing fine',
  ],
  Celebration: [
    'Turn the music up, tonight we own the {t}',
    'Hands up to the sky, we\'re never coming down',
    'Feel the rhythm moving, let the good times roll',
    'This is our moment, let the story unfold',
    'Dancing till the morning, no we won\'t stop now',
    'Living for the feeling, taking every bow',
  ],
  Hope: [
    'Through the darkest night I\'m holding on to {t}',
    'Every fallen dream can find its wings to fly',
    'One more step, I\'m stronger than before',
    'Brighter days are waiting right outside my door',
    'I won\'t let the storm decide my name',
    'From the ashes rising, lighting up the flame',
  ],
  Faith: [
    'When I lift my hands, {t} carries me',
    'In the quiet moments, that\'s where grace is free',
    'Every mountain moves when I begin to pray',
    'Light will always find me, guiding me the way',
    'I will keep believing through the highs and lows',
    'Peace beyond my understanding gently flows',
  ],
  Nostalgia: [
    'Take me back to {t}, the days we used to know',
    'Faded polaroids and the radio',
    'We were young and fearless, chasing summer rain',
    'Wish I could relive it all again',
    'Old streets and laughter, echoes of our youth',
    'Holding every memory, holding on to truth',
  ],
};

const CHORUS_LINES = [
  'Oh, {t}, you\'re the melody in me',
  'We\'re singing {t} for the world to see',
  'Hold me close, don\'t let the moment fade',
  'This is the song that {t} made',
  'Whoa-oh, we\'re rising with the sound',
  'Whoa-oh, {t} turns it all around',
];

const BRIDGE_LINES = [
  'And when the lights go low',
  'I\'ll still be here, you know',
  'No matter where we go',
  '{t} will never let me go',
];

// Keyword → mood, checked in priority order. The generator has no mood picker, so
// the mood is read from the title, description and genre instead of asked for.
const MOOD_KEYWORDS = [
  ['Faith', ['pray', 'faith', 'grace', 'lord', 'god', 'glory', 'worship', 'hallelujah', 'bless', 'holy', 'spirit', 'heaven', 'gospel']],
  ['Heartbreak', ['heartbreak', 'broke', 'lonely', 'alone', 'goodbye', 'cry', 'tears', 'lost', 'gone', 'hurt', 'pain', 'miss']],
  ['Nostalgia', ['remember', 'memory', 'memories', 'old', 'childhood', 'yesterday', 'used to', 'home', 'hometown', 'back then']],
  ['Hope', ['hope', 'dream', 'rise', 'stronger', 'believe', 'tomorrow', 'fight', 'overcome', 'shine', 'faithful']],
  ['Love', ['love', 'heart', 'baby', 'kiss', 'together', 'forever', 'hold', 'desire', 'romance']],
  ['Celebration', ['party', 'celebrate', 'dance', 'night', 'vibe', 'groove', 'enjoy', 'money', 'win', 'turn up']],
];

export function inferMood(title = '', description = '', genre = '') {
  const text = `${title} ${description}`.toLowerCase();
  for (const [mood, words] of MOOD_KEYWORDS) {
    if (words.some((w) => text.includes(w))) return mood;
  }
  // No keyword hit — lean on the genre, then a safe upbeat default.
  if (/gospel|worship|praise/i.test(genre)) return 'Faith';
  return 'Celebration';
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function generateLyrics(theme, genre, mood) {
  const t = (theme || '').trim() || 'the night';
  const pool = VERSE_LINES[mood] || VERSE_LINES.Celebration;
  const fill = (line) => line.replace(/\{t\}/g, t);

  return {
    title: cap(t),
    tag: `${mood} · ${genre}`,
    sections: [
      { label: 'Verse 1', lines: pickN(pool, 4).map(fill) },
      { label: 'Chorus', lines: pickN(CHORUS_LINES, 4).map(fill) },
      { label: 'Verse 2', lines: pickN(pool, 4).map(fill) },
      { label: 'Chorus', lines: pickN(CHORUS_LINES, 4).map(fill) },
      { label: 'Bridge', lines: BRIDGE_LINES.map(fill) },
    ],
  };
}

// Flatten to the plain-string shape the Song model and the Player's lyrics panel
// expect ("Label:\nline\nline\n\n…").
export function lyricsToText(lyrics) {
  if (!lyrics) return '';
  return lyrics.sections
    .map((s) => `${s.label}:\n${s.lines.join('\n')}`)
    .join('\n\n');
}

// One-shot helper: infer the mood and return both the structured lyrics and the
// plain-text form, so a caller can display one and store the other.
export function generateSongLyrics({ title, description, genre }) {
  const mood = inferMood(title, description, genre);
  const lyrics = generateLyrics(title, genre, mood);
  return { mood, lyrics, text: lyricsToText(lyrics) };
}
