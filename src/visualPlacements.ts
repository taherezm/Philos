// Inline visual aid placement data — one entry per text in the catalog

export type VisualType = "argument_map" | "spectrum" | "analogy";

export interface SpectrumPosition {
  name: string;
  position: number; // 0–1
  highlighted: boolean;
}

export interface SpectrumData {
  leftEndpoint: string;
  rightEndpoint: string;
  positions: SpectrumPosition[];
}

export interface ArgMapNode {
  id: string;
  label: string;
  type: "question" | "move" | "thesis" | "objection";
}

export interface ArgMapEdge {
  from: string;
  to: string;
  style?: "dashed";
  label?: string;
}

export interface ArgumentMapData {
  nodes: ArgMapNode[];
  edges: ArgMapEdge[];
}

export interface AnalogyData {
  illustrationId: string; // key for picking the SVG component
  caption: string;
}

export interface VisualPlacement {
  afterParagraph: number; // matches para.id (1-indexed, after parser front-matter skip)
  type: VisualType;
  label: string;
  data: SpectrumData | ArgumentMapData | AnalogyData;
}

export interface TextVisuals {
  textId: string;
  visuals: VisualPlacement[];
}

export const VISUAL_PLACEMENTS: TextVisuals[] = [

  // ─────────────────────────────────────────────
  // EUTHYPHRO  (254 rendered paragraphs)
  // ─────────────────────────────────────────────
  {
    textId: "euthyphro",
    visuals: [
      {
        afterParagraph: 17,
        type: "argument_map",
        label: "See: The three definitions Euthyphro proposes — and why each fails",
        data: {
          nodes: [
            { id: "q", label: "What is piety? Socrates needs a definition that works in all cases — not just examples.", type: "question" },
            { id: "m1", label: "Definition 1: Piety is what I am doing now — prosecuting wrongdoers, even relatives. Socrates: that's an example, not a definition.", type: "move" },
            { id: "m2", label: "Definition 2: Piety is what is dear to the gods. Socrates: but the gods disagree — so the same act is both pious and impious.", type: "move" },
            { id: "m3", label: "Definition 3: Piety is a part of justice — the service we render to the gods. Socrates: but what exactly does this service accomplish?", type: "move" },
            { id: "t", label: "No definition survives. The dialogue ends without a conclusion — but the Euthyphro Dilemma has been raised.", type: "thesis" },
            { id: "o", label: "Objection: Maybe Socrates' standards are too strict. Ordinary working definitions are good enough for everyday life.", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "m1", to: "m2" },
            { from: "m2", to: "m3" },
            { from: "m3", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
      {
        afterParagraph: 75,
        type: "analogy",
        label: "See: Why 'the gods love it' is a circular answer",
        data: {
          illustrationId: "forced_choice_fork",
          caption: "When Euthyphro says piety is 'what the gods love,' Socrates presses him: do the gods love it because it IS good — or is it good because they love it? Either path leads to trouble: the first makes morality independent of the gods; the second makes it arbitrary.",
        },
      },
      {
        afterParagraph: 128,
        type: "argument_map",
        label: "See: The Euthyphro Dilemma — philosophy's most famous fork in the road",
        data: {
          nodes: [
            { id: "q", label: "Is something pious/good because the gods love it — or do the gods love it because it is already pious/good?", type: "question" },
            { id: "m1", label: "Horn 1: Good because gods command it (Divine Command Theory). Then God could command cruelty — and cruelty would become good. Morality is arbitrary.", type: "move" },
            { id: "m2", label: "Horn 2: Gods love it because it is already good. Then goodness exists independently of God — and God is no longer the source of morality.", type: "move" },
            { id: "t", label: "Either morality is arbitrary, or it is independent of God. You must choose — and Euthyphro cannot.", type: "thesis" },
            { id: "o", label: "Third option: God's nature — not God's will — is the moral standard. God commands good things because God is goodness itself (Aquinas's solution).", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "q", to: "m2" },
            { from: "m1", to: "t" },
            { from: "m2", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
      {
        afterParagraph: 200,
        type: "spectrum",
        label: "See: Where thinkers fall on the question of divine command vs. independent morality",
        data: {
          leftEndpoint: "Morality is entirely grounded in God's will (Divine Command)",
          rightEndpoint: "Morality is entirely independent of God (Natural Law / Reason)",
          positions: [
            { name: "William of Ockham", position: 0.08, highlighted: false },
            { name: "Aquinas", position: 0.35, highlighted: false },
            { name: "Plato / Socrates", position: 0.72, highlighted: true },
            { name: "Kant", position: 0.88, highlighted: false },
          ],
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // CRITO  (114 rendered paragraphs)
  // ─────────────────────────────────────────────
  {
    textId: "crito",
    visuals: [
      {
        afterParagraph: 8,
        type: "argument_map",
        label: "See: Socrates' argument for why he must stay and accept the verdict",
        data: {
          nodes: [
            { id: "q", label: "Should Socrates escape from prison and avoid execution?", type: "question" },
            { id: "m1", label: "We must never do wrong, even in return for wrong done to us. (Established first as the common principle.)", type: "move" },
            { id: "m2", label: "Escaping would mean breaking the laws of Athens — the very laws Socrates has benefited from his whole life.", type: "move" },
            { id: "m3", label: "By living in Athens 70 years and raising children here, Socrates implicitly agreed to obey its laws.", type: "move" },
            { id: "t", label: "Therefore Socrates must stay. To escape would be to do wrong — the very thing his life's philosophy opposes.", type: "thesis" },
            { id: "o", label: "Thoreau's reply: An unjust law forfeits its claim to obedience. Consent to live under laws does not mean consent to every injustice.", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "m1", to: "m2" },
            { from: "m2", to: "m3" },
            { from: "m3", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
      {
        afterParagraph: 42,
        type: "spectrum",
        label: "See: Whose opinion should we follow — the many, or the expert?",
        data: {
          leftEndpoint: "Follow the majority opinion — they have the power to harm you",
          rightEndpoint: "Follow only the expert's opinion — only they understand justice",
          positions: [
            { name: "Crito's view", position: 0.2, highlighted: false },
            { name: "Socrates", position: 0.9, highlighted: true },
            { name: "Mill (later)", position: 0.55, highlighted: false },
          ],
        },
      },
      {
        afterParagraph: 100,
        type: "analogy",
        label: "See: The 'Laws of Athens' as a social contract you were born into",
        data: {
          illustrationId: "scales_of_justice",
          caption: "Socrates imagines the Laws of Athens speaking directly to him: 'Did we not give you birth, education, and a share in all good things? And now you would destroy us?' The city is like a parent — and even when a parent is wrong, you cannot simply destroy the relationship.",
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // ENCHIRIDION  (160 rendered paragraphs; content from 35)
  // ─────────────────────────────────────────────
  {
    textId: "enchiridion",
    visuals: [
      {
        afterParagraph: 35,
        type: "analogy",
        label: "See: What Epictetus means by 'things in our power' vs. things outside it",
        data: {
          illustrationId: "circles_of_control",
          caption: "Epictetus divides all of reality into two circles. The inner circle — your opinions, desires, intentions, responses — is entirely yours. The outer circle — health, wealth, reputation, other people — can always be taken away. Stoic freedom means investing everything in the inner circle.",
        },
      },
      {
        afterParagraph: 42,
        type: "argument_map",
        label: "See: Why Epictetus says even death is not a problem — only our view of it is",
        data: {
          nodes: [
            { id: "q", label: "Why are people unhappy, anxious, and disturbed — even when nothing terrible is happening to them?", type: "question" },
            { id: "m1", label: "People are disturbed not by events, but by their judgments about events. Death is not terrible — it only appears so.", type: "move" },
            { id: "m2", label: "What is in our power (our views, intentions) is naturally free. What is outside our power (outcomes, others' actions) is not ours to control.", type: "move" },
            { id: "m3", label: "Therefore: adjust your desires to reality, not reality to your desires. Wish for what happens, not for what you want to happen.", type: "move" },
            { id: "t", label: "Inner freedom is always available — the sage is undisturbed not because the world is kind, but because nothing outside can touch the will.", type: "thesis" },
            { id: "o", label: "Objection: This can become passive resignation. Does accepting what we cannot control mean we should never try to change the world?", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "m1", to: "m2" },
            { from: "m2", to: "m3" },
            { from: "m3", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
      {
        afterParagraph: 65,
        type: "spectrum",
        label: "See: Stoicism vs. Epicureanism — two ancient answers to the same question",
        data: {
          leftEndpoint: "The good life comes from within: master your will, want nothing external",
          rightEndpoint: "The good life is pleasure: choose wisely, cultivate stable satisfactions",
          positions: [
            { name: "Epictetus", position: 0.05, highlighted: true },
            { name: "Marcus Aurelius", position: 0.12, highlighted: false },
            { name: "Aristotle", position: 0.48, highlighted: false },
            { name: "Epicurus", position: 0.82, highlighted: false },
            { name: "Bentham", position: 0.95, highlighted: false },
          ],
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // ION  (189 rendered paragraphs)
  // ─────────────────────────────────────────────
  {
    textId: "plato-ion",
    visuals: [
      {
        afterParagraph: 65,
        type: "argument_map",
        label: "See: Socrates' proof that Ion has inspiration, not skill",
        data: {
          nodes: [
            { id: "q", label: "Does Ion possess a genuine art (techne) of interpretation — or something else?", type: "question" },
            { id: "m1", label: "If Ion had real skill at Homer, that skill would extend to all poets who cover the same topics — just as a physician knows medicine in all books.", type: "move" },
            { id: "m2", label: "But Ion goes blank with every poet except Homer. His skill is selective and cannot be explained by knowledge.", type: "move" },
            { id: "m3", label: "Therefore, Ion doesn't possess an art — he is divinely inspired, like a magnet energized by an external source.", type: "move" },
            { id: "t", label: "Great poetry and performance don't come from knowledge or craft, but from divine madness — inspiration that bypasses reason entirely.", type: "thesis" },
            { id: "o", label: "Aristotle's reply: Poetry is a rational craft (techne). Homer's greatness lies in his mastery of plot, character, and catharsis — not in divine possession.", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "m1", to: "m2" },
            { from: "m2", to: "m3" },
            { from: "m3", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
      {
        afterParagraph: 82,
        type: "analogy",
        label: "See: The magnet chain — how divine inspiration flows from Muse to audience",
        data: {
          illustrationId: "magnet_chain",
          caption: "Socrates describes a magnet that attracts iron rings, which then attract more rings in a chain. The Muse inspires the poet, who inspires the rhapsode, who inspires the audience. None of the links 'knows' anything — they simply transmit a power that originated elsewhere.",
        },
      },
      {
        afterParagraph: 120,
        type: "spectrum",
        label: "See: Art as divine madness vs. rational craft — where different thinkers fall",
        data: {
          leftEndpoint: "Art is divine inspiration — irrational, unteachable, beyond knowledge",
          rightEndpoint: "Art is rational craft (techne) — learnable, analyzable, rule-governed",
          positions: [
            { name: "Plato (Ion)", position: 0.08, highlighted: true },
            { name: "Longinus", position: 0.28, highlighted: false },
            { name: "Horace", position: 0.55, highlighted: false },
            { name: "Aristotle", position: 0.82, highlighted: false },
            { name: "Boileau", position: 0.93, highlighted: false },
          ],
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // TAO TE CHING  (284 rendered paragraphs)
  // ─────────────────────────────────────────────
  {
    textId: "tao-te-ching",
    visuals: [
      {
        afterParagraph: 7,
        type: "spectrum",
        label: "See: How Taoism and Confucianism differ on governing and the good life",
        data: {
          leftEndpoint: "Wu wei: the sage governs by doing nothing; natural order produces harmony",
          rightEndpoint: "Active cultivation: virtue, ritual, and education build a good society",
          positions: [
            { name: "Lao Tzu", position: 0.05, highlighted: true },
            { name: "Zhuangzi", position: 0.15, highlighted: false },
            { name: "Mencius", position: 0.6, highlighted: false },
            { name: "Confucius", position: 0.82, highlighted: false },
            { name: "Xunzi", position: 0.93, highlighted: false },
          ],
        },
      },
      {
        afterParagraph: 24,
        type: "analogy",
        label: "See: Why Lao Tzu says water is the model for the highest excellence",
        data: {
          illustrationId: "water_flow",
          caption: "Water is Lao Tzu's supreme metaphor for the Tao: it benefits all things without striving, occupies the lowest places that others disdain, yields around obstacles rather than forcing through them — and yet it carves canyons. The weak overcomes the strong not by fighting, but by persisting.",
        },
      },
      {
        afterParagraph: 32,
        type: "analogy",
        label: "See: The wheel's empty hub — how emptiness makes things useful",
        data: {
          illustrationId: "wheel_emptiness",
          caption: "Thirty spokes converge on a hub — but it is the empty space at the center that makes the wheel work. Clay is shaped into a vessel — but it is the hollow inside that holds water. A room is defined by its walls — but it is the empty space within that you actually inhabit. The Tao teaches: non-being makes being useful.",
        },
      },
      {
        afterParagraph: 50,
        type: "argument_map",
        label: "See: Lao Tzu's four levels of rulership — from invisible to despised",
        data: {
          nodes: [
            { id: "q", label: "What makes a ruler truly great? Lao Tzu ranks four types of government from best to worst.", type: "question" },
            { id: "m1", label: "Best: The ruler the people barely know exists. Everything gets done; the people say 'we did it ourselves.' (Wu wei in action.)", type: "move" },
            { id: "m2", label: "Second: The ruler who is loved and praised. This requires effort and virtue — good, but already less than natural.", type: "move" },
            { id: "m3", label: "Third: The ruler who governs through fear. The people obey, but resentment builds. Fourth: The ruler who is despised and mocked.", type: "move" },
            { id: "t", label: "The best government leaves no trace of itself. The more a ruler must impose order, the further they have fallen from the Tao.", type: "thesis" },
            { id: "o", label: "Confucius replies: A ruler who does nothing is abdicating responsibility. Leadership requires setting a moral example that others consciously follow.", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "m1", to: "m2" },
            { from: "m2", to: "m3" },
            { from: "m3", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // ON THE BEAUTIFUL  (63 rendered paragraphs)
  // ─────────────────────────────────────────────
  {
    textId: "on-the-beautiful",
    visuals: [
      {
        afterParagraph: 22,
        type: "argument_map",
        label: "See: Why Plotinus rejects symmetry as the definition of beauty",
        data: {
          nodes: [
            { id: "q", label: "What makes a thing beautiful? The traditional answer: symmetry of parts and pleasing color.", type: "question" },
            { id: "m1", label: "If beauty were symmetry, simple things (a single note, a flash of lightning) could not be beautiful — but they are.", type: "move" },
            { id: "m2", label: "We respond to beauty immediately, before we analyze symmetry. The soul recognizes beauty like a flash — it must already know what it is looking for.", type: "move" },
            { id: "m3", label: "Material things are beautiful because they participate in Form — the soul perceives this Form, which it dimly remembers from its pre-corporeal existence.", type: "move" },
            { id: "t", label: "Beauty is the soul's recognition of its own origin. The beautiful calls the soul home to the realm of Forms and ultimately to the One.", type: "thesis" },
            { id: "o", label: "Hume replies: This recognition is simply a feeling produced by certain sensory combinations — there is no Form to 'remember,' only a nervous response.", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "m1", to: "m2" },
            { from: "m2", to: "m3" },
            { from: "m3", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
      {
        afterParagraph: 25,
        type: "spectrum",
        label: "See: Plotinus's hierarchy — from sensory beauty to divine beauty",
        data: {
          leftEndpoint: "Lowest: Physical beauty — beautiful bodies, colors, shapes",
          rightEndpoint: "Highest: The One — pure beauty, the source of all other beauty",
          positions: [
            { name: "Physical beauty", position: 0.08, highlighted: false },
            { name: "Beautiful souls / virtues", position: 0.38, highlighted: false },
            { name: "Beautiful knowledge", position: 0.62, highlighted: false },
            { name: "Intellectual beauty (Forms)", position: 0.82, highlighted: false },
            { name: "The One (the Good)", position: 0.97, highlighted: true },
          ],
        },
      },
      {
        afterParagraph: 28,
        type: "analogy",
        label: "See: The soul's ascent toward the beautiful — Plotinus's ladder",
        data: {
          illustrationId: "soul_ascent",
          caption: "Plotinus describes the soul as a traveler who has forgotten its homeland. The ascent toward true beauty begins with beautiful bodies, rises through beautiful souls and knowledge, and ends with a direct union with Beauty itself — the One — which is beyond description. The ladder is carved not by logic but by love.",
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // COMMUNIST MANIFESTO  (217 rendered paragraphs)
  // ─────────────────────────────────────────────
  {
    textId: "marx-communist-manifesto",
    visuals: [
      {
        afterParagraph: 8,
        type: "argument_map",
        label: "See: Marx's theory of history as a single driving engine — class struggle",
        data: {
          nodes: [
            { id: "q", label: "What force drives historical change? What pattern does history follow?", type: "question" },
            { id: "m1", label: "All history is the history of class struggles: oppressor vs. oppressed in every era (master/slave, lord/serf, bourgeois/proletarian).", type: "move" },
            { id: "m2", label: "The bourgeoisie won the last round: it destroyed feudalism and built capitalism, the most revolutionary economic system in history.", type: "move" },
            { id: "m3", label: "But capitalism creates its own gravedigger: the proletariat. As capital concentrates, the working class grows, organizes, and develops class consciousness.", type: "move" },
            { id: "t", label: "The proletarian revolution is not just possible — it is the inevitable next step in the dialectical logic of history.", type: "thesis" },
            { id: "o", label: "Objection: History is not a clean dialectic. Class consciousness didn't develop as predicted; middle classes expanded rather than disappearing.", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "m1", to: "m2" },
            { from: "m2", to: "m3" },
            { from: "m3", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
      {
        afterParagraph: 35,
        type: "spectrum",
        label: "See: Where each class stands in Marx's picture of bourgeois society",
        data: {
          leftEndpoint: "Owns means of production — extracts surplus value from labor",
          rightEndpoint: "Owns only labor power — must sell it to survive",
          positions: [
            { name: "Finance capital", position: 0.05, highlighted: false },
            { name: "Bourgeoisie (industrialists)", position: 0.15, highlighted: false },
            { name: "Petty bourgeoisie", position: 0.42, highlighted: false },
            { name: "Skilled labor", position: 0.65, highlighted: false },
            { name: "Proletariat", position: 0.88, highlighted: true },
            { name: "Lumpenproletariat", position: 0.97, highlighted: false },
          ],
        },
      },
      {
        afterParagraph: 52,
        type: "analogy",
        label: "See: How the bourgeoisie becomes its own gravedigger",
        data: {
          illustrationId: "gravedigger",
          caption: "Marx's most vivid image: the bourgeoisie, in building capitalism, forges the weapons that will destroy it and calls into existence the workers who will wield those weapons. The factory system concentrates workers, teaches them solidarity, and creates the very class that will expropriate the expropriators.",
        },
      },
      {
        afterParagraph: 70,
        type: "argument_map",
        label: "See: Why Marx says abolishing private property is the key move",
        data: {
          nodes: [
            { id: "q", label: "What is the single most essential demand of the Communist program?", type: "question" },
            { id: "m1", label: "Private property is not personal possessions — it is capital, the power to exploit the labor of others for profit.", type: "move" },
            { id: "m2", label: "Wage labor does not create property for workers — it creates capital, which then exploits more workers. The system perpetuates itself.", type: "move" },
            { id: "t", label: "Abolish private property (capital), and you abolish the class relation itself. This is not the abolition of freedom — it is its realization.", type: "thesis" },
            { id: "o", label: "Objection: Who decides what counts as capital vs. personal property? And without private ownership of production, who provides the incentive to invest and innovate?", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "m1", to: "m2" },
            { from: "m2", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // BEYOND GOOD AND EVIL  (362 rendered paragraphs)
  // ─────────────────────────────────────────────
  {
    textId: "beyond-good-and-evil",
    visuals: [
      {
        afterParagraph: 4,
        type: "argument_map",
        label: "See: Nietzsche's opening attack — the Will to Truth as a philosophical problem",
        data: {
          nodes: [
            { id: "q", label: "Why have philosophers assumed that Truth is always the highest value? Is this assumption itself examined?", type: "question" },
            { id: "m1", label: "Dogmatic philosophers have all built their systems on unexamined assumptions ('immediate certainties'). Their 'love of truth' conceals deeper drives.", type: "move" },
            { id: "m2", label: "Every great philosophy is the autobiography of its author — a confession of drives, temperament, and will disguised as objective argument.", type: "move" },
            { id: "m3", label: "The value of truth itself must be questioned. Sometimes falsehood, simplification, or 'untruth' may be more life-enhancing than truth.", type: "move" },
            { id: "t", label: "Philosophy begins when we stop asking 'Is this true?' and start asking 'What kind of person needs this to be true?' Perspective is unavoidable.", type: "thesis" },
            { id: "o", label: "Objection: If all views are perspectival, Nietzsche's own critique is too. Can he claim to see through dogmatism without claiming a perspective-transcending truth?", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "m1", to: "m2" },
            { from: "m2", to: "m3" },
            { from: "m3", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
      {
        afterParagraph: 14,
        type: "spectrum",
        label: "See: Where philosophers fall on the question of objective vs. perspectival truth",
        data: {
          leftEndpoint: "Objective truth is possible and is philosophy's main goal",
          rightEndpoint: "All truth is perspectival — there are no facts, only interpretations",
          positions: [
            { name: "Plato", position: 0.05, highlighted: false },
            { name: "Kant", position: 0.25, highlighted: false },
            { name: "Hegel", position: 0.42, highlighted: false },
            { name: "James (Pragmatism)", position: 0.65, highlighted: false },
            { name: "Nietzsche", position: 0.88, highlighted: true },
            { name: "Derrida", position: 0.97, highlighted: false },
          ],
        },
      },
      {
        afterParagraph: 292,
        type: "argument_map",
        label: "See: Master morality vs. slave morality — Nietzsche's genealogy of good and evil",
        data: {
          nodes: [
            { id: "q", label: "Where did our current moral concepts 'good' and 'evil' come from? Are they timeless truths, or historical products?", type: "question" },
            { id: "m1", label: "Master morality: the noble create values from strength. 'Good' = what I am (strong, generous, self-affirming). 'Bad' = what the weak are. Contempt, not hatred.", type: "move" },
            { id: "m2", label: "Slave morality: the weak define values through resentment. 'Evil' = the strong oppressors. 'Good' = the suffering, the humble, the meek. A reactive, inverted system.", type: "move" },
            { id: "t", label: "Modern Western morality is overwhelmingly slave morality — Christianity and democracy both glorify weakness as virtue. This is the great revaluation Nietzsche calls for reversing.", type: "thesis" },
            { id: "o", label: "Objection: 'Slave morality' has produced human rights, medicine, and relief of suffering. If Nietzsche's noble types historically meant conquest and cruelty, perhaps slave morality's 'inversion' was progress.", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "m1", to: "m2" },
            { from: "m2", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // NOTES FROM UNDERGROUND  (518 rendered paragraphs)
  // ─────────────────────────────────────────────
  {
    textId: "notes-from-underground",
    visuals: [
      {
        afterParagraph: 4,
        type: "argument_map",
        label: "See: The Underground Man's core claim — why he can't be anything at all",
        data: {
          nodes: [
            { id: "q", label: "Why is the Underground Man paralyzed — unable to become a person of action, revenge, or even a clear identity?", type: "question" },
            { id: "m1", label: "Too much consciousness destroys the ability to act. A 'direct man' acts because he is sure; the Underground Man always sees too many sides.", type: "move" },
            { id: "m2", label: "Every action collapses under analysis. Even revenge would be meaningless — because he sees that the offender acted from the same natural laws as he would.", type: "move" },
            { id: "t", label: "Hyper-consciousness is its own prison. The Underground Man is not lazy or cowardly — he is trapped by the very intelligence that makes him interesting.", type: "thesis" },
            { id: "o", label: "Mill's reply: This paralysis is a product of social alienation, not of consciousness itself. Proper education and social conditions produce people who can act and think.", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "m1", to: "m2" },
            { from: "m2", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
      {
        afterParagraph: 21,
        type: "spectrum",
        label: "See: The 'direct man' vs. the Underground Man — two models of human nature",
        data: {
          leftEndpoint: "The 'direct man': acts from instinct, sure of himself, doesn't overthink",
          rightEndpoint: "The Underground Man: over-conscious, paralyzed, sees too many sides",
          positions: [
            { name: "Mill's rational actor", position: 0.12, highlighted: false },
            { name: "Bentham's utility-maximizer", position: 0.08, highlighted: false },
            { name: "Dostoevsky's 'normal man'", position: 0.2, highlighted: false },
            { name: "Underground Man", position: 0.95, highlighted: true },
          ],
        },
      },
      {
        afterParagraph: 50,
        type: "analogy",
        label: "See: Why the Underground Man refuses to live in the Crystal Palace",
        data: {
          illustrationId: "crystal_palace",
          caption: "The utilitarian dream: a Crystal Palace where everything is rationally ordered, needs are met, and everyone is happy. The Underground Man's response: he would rather stick out his tongue at it. A place where you can't even be unhappy on purpose is not a home — it's a cage. Freedom requires the right to choose badly.",
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // ON LIBERTY  (143 rendered paragraphs)
  // ─────────────────────────────────────────────
  {
    textId: "on-liberty",
    visuals: [
      {
        afterParagraph: 4,
        type: "argument_map",
        label: "See: Mill's Harm Principle — the one rule that governs all the rest",
        data: {
          nodes: [
            { id: "q", label: "When does society have the right to restrict what an individual thinks, says, or does?", type: "question" },
            { id: "m1", label: "The only legitimate reason to restrict individual freedom is to prevent harm to others. Self-regarding actions — things that affect only yourself — cannot be coerced.", type: "move" },
            { id: "m2", label: "Free speech is essential: both true and false opinions have value. True opinions kept alive; false opinions challenge truth and force us to understand it better.", type: "move" },
            { id: "m3", label: "Experiments in living — diverse lifestyles — are how societies discover better ways of being human. Conformity kills this discovery process.", type: "move" },
            { id: "t", label: "A society that suppresses individual liberty in the name of the majority's comfort or opinion is not liberal — it is the tyranny of the majority in a new form.", type: "thesis" },
            { id: "o", label: "Tocqueville's reply: The real enemy of liberty in democracy is not law but social conformity — and Mill's focus on legal harm misses the deeper threat.", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "m1", to: "m2" },
            { from: "m2", to: "m3" },
            { from: "m3", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
      {
        afterParagraph: 15,
        type: "spectrum",
        label: "See: Where thinkers fall on individual freedom vs. the authority of society",
        data: {
          leftEndpoint: "Society has wide authority to restrict behavior for the common good",
          rightEndpoint: "Individual liberty is near-absolute — only harm to others justifies restriction",
          positions: [
            { name: "Plato (Republic)", position: 0.08, highlighted: false },
            { name: "Rousseau", position: 0.3, highlighted: false },
            { name: "Tocqueville", position: 0.5, highlighted: false },
            { name: "Mill", position: 0.88, highlighted: true },
            { name: "Thoreau", position: 0.95, highlighted: false },
          ],
        },
      },
      {
        afterParagraph: 30,
        type: "analogy",
        label: "See: Mill on living beliefs vs. dead dogma — why silencing even wrong opinions is dangerous",
        data: {
          illustrationId: "living_belief",
          caption: "Mill argues that an unchallenged truth becomes a dead letter — recited but not felt, known by rote but never tested. A belief kept alive by opposition stays vital, understood from the inside. Silence the opposition, and the 'truth' becomes a shell. The candle of genuine understanding only stays lit in the wind of real debate.",
        },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // A PHILOSOPHICAL ENQUIRY INTO THE SUBLIME AND BEAUTIFUL  (343 rendered paragraphs)
  // ─────────────────────────────────────────────
  {
    textId: "sublime-and-beautiful",
    visuals: [
      {
        afterParagraph: 47,
        type: "argument_map",
        label: "See: Burke's theory of the sublime — how terror becomes delight",
        data: {
          nodes: [
            { id: "q", label: "What makes something sublime? What is happening in the mind and body when we experience awe before great natural forces?", type: "question" },
            { id: "m1", label: "The sublime originates in terror: whatever excites the idea of pain and danger is a source of the sublime. Fear is its foundation.", type: "move" },
            { id: "m2", label: "But the pleasure of the sublime ('delight') is the relief of terror at a safe distance — the astonishment of a danger that cannot reach us.", type: "move" },
            { id: "m3", label: "This is a physiological response: the nerves are strongly stimulated, producing an exertion that has the character of pleasure precisely because of the tension.", type: "move" },
            { id: "t", label: "The sublime is not a spiritual or moral experience — it is the body's response to overwhelming power at a safe remove. Obscurity, vastness, and darkness are its chief causes.", type: "thesis" },
            { id: "o", label: "Kant's reply: The sublime humiliates the senses but reveals the moral dignity of reason. It is not the body responding to danger — it is the mind recognizing its own superiority to nature.", type: "objection" },
          ],
          edges: [
            { from: "q", to: "m1" },
            { from: "m1", to: "m2" },
            { from: "m2", to: "m3" },
            { from: "m3", to: "t" },
            { from: "t", to: "o", style: "dashed" },
          ],
        },
      },
      {
        afterParagraph: 71,
        type: "spectrum",
        label: "See: Beautiful vs. Sublime — Burke's systematic contrast between the two",
        data: {
          leftEndpoint: "Beautiful: small, smooth, gradual, delicate, light, social — causes love",
          rightEndpoint: "Sublime: vast, rough, sudden, powerful, dark, solitary — causes astonishment",
          positions: [
            { name: "A rose", position: 0.08, highlighted: false },
            { name: "A classical sonata", position: 0.2, highlighted: false },
            { name: "A rolling landscape", position: 0.38, highlighted: false },
            { name: "A storm at sea", position: 0.72, highlighted: false },
            { name: "Milton's Satan", position: 0.85, highlighted: false },
            { name: "Infinity itself", position: 0.97, highlighted: true },
          ],
        },
      },
      {
        afterParagraph: 116,
        type: "analogy",
        label: "See: Why Burke says infinity is a source of the sublime",
        data: {
          illustrationId: "sublime_mountain",
          caption: "Burke describes how we cannot see the end of a vast colonnade — and the mind, unable to find a stopping point, is filled with a kind of 'artificial infinity.' The same effect occurs with darkness, repetition, and scale in nature: the mind is overwhelmed, all its motions suspended, and this very astonishment becomes its own form of delight.",
        },
      },
    ],
  },
];

/** Look up visuals for a given text ID */
export function getVisualsForText(textId: string): VisualPlacement[] {
  const entry = VISUAL_PLACEMENTS.find((t) => t.textId === textId);
  return entry?.visuals ?? [];
}
