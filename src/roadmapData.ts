export interface RoadmapStop {
  id: string;
  catalogId: string;
  title: string;
  author: string;
  tier: number;
  order: number;
  hook: string;
  why: string;
  estimatedMinutes: number;
}

export interface RoadmapTier {
  tier: number;
  name: string;
  subtitle: string;
  transitionText: string;
  stops: RoadmapStop[];
}

export const ROADMAP_TIERS: RoadmapTier[] = [
  {
    tier: 1,
    name: "First Steps",
    subtitle: "Accessible entry points into philosophical thinking",
    transitionText:
      "You've tasted the big questions. Now let's go deeper.",
    stops: [
      {
        id: "stop-1",
        catalogId: "euthyphro",
        title: "Euthyphro",
        author: "Plato",
        tier: 1,
        order: 1,
        hook: "Is something good because God says so — or does God say so because it's good?",
        why: "Plato's Euthyphro introduces you to the Socratic method in action. In just a few pages, Socrates dismantles every definition of piety his opponent offers, revealing one of philosophy's most enduring dilemmas about the relationship between religion and morality.",
        estimatedMinutes: 15,
      },
      {
        id: "stop-2",
        catalogId: "crito",
        title: "Crito",
        author: "Plato",
        tier: 1,
        order: 2,
        hook: "When is it right to break the law — even if the law is wrong?",
        why: "After seeing Socrates question definitions, Crito shows him putting philosophy to the ultimate test: his own death. This short dialogue on civil disobedience connects ancient Athens to modern debates about justice, obligation, and protest.",
        estimatedMinutes: 15,
      },
      {
        id: "stop-3",
        catalogId: "enchiridion",
        title: "Enchiridion",
        author: "Epictetus",
        tier: 1,
        order: 3,
        hook: "A pocket guide to what you can (and can't) control",
        why: "After seeing Socrates model philosophical courage, Epictetus gives you a practical toolkit. This short manual shows that philosophy isn't just about thinking — it's about how you handle everyday life.",
        estimatedMinutes: 15,
      },
    ],
  },
  {
    tier: 2,
    name: "Expanding Horizons",
    subtitle: "Diverse traditions and deeper questions",
    transitionText:
      "You've built a foundation. Now let's see how different traditions approach the big questions.",
    stops: [
      {
        id: "stop-4",
        catalogId: "plato-ion",
        title: "Ion",
        author: "Plato",
        tier: 2,
        order: 1,
        hook: "Does the artist possess real knowledge — or is creativity a kind of madness?",
        why: "Ion shifts from ethics to aesthetics, raising questions about the nature of artistic inspiration and expertise. Socrates' magnetic chain metaphor offers a surprisingly modern take on what it means to be creative.",
        estimatedMinutes: 15,
      },
      {
        id: "stop-5",
        catalogId: "tao-te-ching",
        title: "Tao Te Ching",
        author: "Lao Tzu",
        tier: 2,
        order: 2,
        hook: "The way that can be told is not the eternal Way",
        why: "Moving beyond the Western tradition entirely, the Tao Te Ching offers a radically different approach to wisdom — one that values paradox, yielding, and effortless action over argument and analysis.",
        estimatedMinutes: 20,
      },
      {
        id: "stop-6",
        catalogId: "on-the-beautiful",
        title: "On the Beautiful",
        author: "Plotinus",
        tier: 2,
        order: 3,
        hook: "Why does beauty move the soul so powerfully?",
        why: "Plotinus bridges Plato's ideas about forms with a mystical vision of beauty as the soul's recognition of its own divine origin. This treatise shaped how art and beauty were understood for over a thousand years.",
        estimatedMinutes: 20,
      },
      {
        id: "stop-7",
        catalogId: "marx-communist-manifesto",
        title: "The Communist Manifesto",
        author: "Karl Marx",
        tier: 2,
        order: 4,
        hook: "All history is the history of class struggles",
        why: "Marx takes philosophical ideas about justice, history, and human nature and forges them into the most influential political pamphlet ever written. Whether you agree or not, understanding this argument is essential to understanding the modern world.",
        estimatedMinutes: 25,
      },
    ],
  },
];
