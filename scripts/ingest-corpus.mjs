#!/usr/bin/env node
// ==========================================================
// Philos Corpus Ingestion Script
// Builds a complete, enriched philosophy library
// ==========================================================

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";

const LIB = join(process.cwd(), ":philos-data:library");
const DELAY_MS = 1500; // Rate limiting between fetches

// ==========================================================
// COMPLETE TEXT MANIFEST
// ==========================================================

const TEXTS = [

  // ========================================================
  //  EPISTEMOLOGY / THE WILL TO BELIEVE
  // ========================================================
  {
    id: "will-to-believe",
    title: "The Will to Believe",
    author: "William James",
    year: 1896,
    branch: "Epistemology",
    school: "The Will to Believe",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/26659",
    folder: "Epistemology/The Will to Believe/James",
    filename: "James_WillToBelieve",
    fetchUrl: "https://www.gutenberg.org/cache/epub/26659/pg26659.txt",
    fetchType: "gutenberg",
    introduction: "Delivered as a lecture in 1896 and published the following year, The Will to Believe is William James's defense of the right to hold religious and moral beliefs even without conclusive evidence. Writing against W.K. Clifford's demand that we never believe anything without sufficient proof, James argues that in certain forced and momentous choices, our passional nature not only may but must decide. The essay became a founding document of American Pragmatism.",
    argumentCard: {
      centralQuestion: "Is it ever rational to believe something when the evidence is not yet decisive?",
      thesis: "When we face a 'genuine option' — a choice that is living, forced, and momentous — our passional nature has the right to decide, and demanding proof before belief is itself a passionate choice, not a neutral one.",
      keyMoves: [
        "Defines a 'genuine option' as one that is living (both sides appeal to us), forced (we cannot avoid choosing), and momentous (the stakes are real and the chance won't come again)",
        "Turns Clifford's evidentialism against itself: the rule 'never believe without evidence' is itself an unproven belief, driven by the passion to avoid error at all costs",
        "Argues that in moral and religious questions, refusing to choose IS choosing — the agnostic who waits for proof has already sided against the believer",
        "Claims some truths can only be discovered by those willing to believe first — trust, friendship, and social cooperation all require faith in advance of evidence"
      ],
      strongestObjection: "James's argument may provide intellectual cover for wishful thinking: if our passional nature can justify belief without evidence, what stops anyone from believing whatever feels good, regardless of truth?"
    }
  },

  // ========================================================
  //  EPISTEMOLOGY / AMERICAN PRAGMATISM
  // ========================================================
  {
    id: "pragmatism",
    title: "Pragmatism",
    author: "William James",
    year: 1907,
    branch: "Epistemology",
    school: "American Pragmatism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/5116",
    folder: "Epistemology/American Pragmatism/James",
    filename: "James_Pragmatism",
    fetchUrl: "https://www.gutenberg.org/cache/epub/5116/pg5116.txt",
    fetchType: "gutenberg",
    introduction: "Published in 1907 based on a series of popular lectures, Pragmatism presents William James's mature philosophical method. James argues that the meaning of any idea lies in its practical consequences — that truth is not a static correspondence between thought and reality but something that happens to an idea when it proves useful in navigating experience. The work became the defining statement of American Pragmatism.",
    argumentCard: {
      centralQuestion: "What is truth, and how should we decide between competing philosophical theories?",
      thesis: "Truth is not a fixed correspondence between ideas and reality but a practical relation: an idea is 'true' insofar as it helps us navigate experience successfully. The meaning of any concept lies entirely in the practical difference it makes.",
      keyMoves: [
        "Proposes pragmatism as a method for settling metaphysical disputes by asking 'what practical difference would it make if one notion rather than the other were true?'",
        "Redefines truth as something that happens to an idea — ideas become true insofar as they help us get into satisfactory relations with other parts of our experience",
        "Positions pragmatism as a mediator between tough-minded empiricism and tender-minded rationalism",
        "Argues that abstract philosophical debates dissolve when we focus on their concrete practical consequences"
      ],
      strongestObjection: "If truth is just 'whatever works,' then a comforting lie that helps someone cope would be 'true' — which seems to abandon the very concept of truth that makes knowledge possible."
    }
  },

  // ========================================================
  //  EPISTEMOLOGY / EMPIRICISM
  // ========================================================
  {
    id: "enquiry-human-understanding",
    title: "An Enquiry Concerning Human Understanding",
    author: "David Hume",
    year: 1748,
    branch: "Epistemology",
    school: "Empiricism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/9662",
    folder: "Epistemology/Empiricism/Hume",
    filename: "Hume_Enquiry",
    fetchUrl: "https://www.gutenberg.org/cache/epub/9662/pg9662.txt",
    fetchType: "gutenberg",
    introduction: "Published in 1748, the Enquiry is David Hume's accessible restatement of the radical empiricism he first developed in A Treatise of Human Nature. Hume argues that all genuine knowledge derives from sensory experience and that many of our most fundamental beliefs — including causation and induction — cannot be rationally justified. The work remains one of the most important texts in the history of epistemology.",
    argumentCard: {
      centralQuestion: "What can human reason actually know, and what are the limits of our understanding?",
      thesis: "All ideas are copies of sensory impressions, and all reasoning about matters of fact rests on cause and effect — which is founded not on reason but on custom and habit. We believe the sun will rise tomorrow not because we can prove it, but because we are psychologically conditioned to expect it.",
      keyMoves: [
        "Divides all objects of inquiry into 'relations of ideas' (mathematics, logic) and 'matters of fact' (empirical claims) — only the first are certain",
        "Shows that our belief in causation is not rationally justified: we observe constant conjunction but never perceive any necessary connection between cause and effect",
        "Argues that induction has no logical foundation: the assumption that the future will resemble the past cannot itself be proved from experience",
        "Concludes with the famous fork: any book containing neither abstract reasoning about quantity nor experimental reasoning about fact should be 'committed to the flames'"
      ],
      strongestObjection: "Hume's skepticism about causation seems self-defeating: his own arguments rely on causal reasoning and inductive generalizations about human psychology, so if those methods are unreliable, his conclusions are too."
    }
  },
  {
    id: "principles-human-knowledge",
    title: "A Treatise Concerning the Principles of Human Knowledge",
    author: "George Berkeley",
    year: 1710,
    branch: "Epistemology",
    school: "Empiricism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/4723",
    folder: "Epistemology/Empiricism/Berkeley",
    filename: "Berkeley_PrinciplesOfHumanKnowledge",
    fetchUrl: "https://www.gutenberg.org/cache/epub/4723/pg4723.txt",
    fetchType: "gutenberg",
    introduction: "Published in 1710, Berkeley's Principles advances the startling thesis that material objects do not exist independently of being perceived. Berkeley argues that the concept of matter existing outside any mind is not just false but incoherent — 'to be is to be perceived.' Far from being a denial of common sense, Berkeley saw his idealism as the best defense against skepticism and atheism.",
    argumentCard: {
      centralQuestion: "Do material objects exist independently of being perceived by a mind?",
      thesis: "There is no such thing as matter existing outside of perception. To be is to be perceived (esse est percipi): the objects we call 'real' are ideas in minds, ultimately sustained in existence by the perception of God.",
      keyMoves: [
        "Argues that we can never compare our ideas to mind-independent objects because we only ever have access to our own ideas — the notion of 'matter' behind our perceptions is incoherent",
        "Shows that primary qualities (shape, size, motion) are just as mind-dependent as secondary qualities (color, taste, sound), undermining the materialist distinction between them",
        "Claims his idealism is actually common sense: we directly perceive real things (ideas), rather than inferring an unknowable material world behind appearances",
        "Introduces God as the guarantor of the continuity and regularity of experience — objects persist when we stop looking because God always perceives them"
      ],
      strongestObjection: "Berkeley's idealism seems to collapse the distinction between reality and hallucination: if everything is ideas in minds, what makes the tree I see more real than a tree I dream about?"
    }
  },
  {
    id: "novum-organum",
    title: "Novum Organum",
    author: "Francis Bacon",
    year: 1620,
    branch: "Epistemology",
    school: "Empiricism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/45988",
    folder: "Epistemology/Empiricism/Bacon",
    filename: "Bacon_NovumOrganum",
    fetchUrl: "https://www.gutenberg.org/cache/epub/45988/pg45988.txt",
    fetchType: "gutenberg",
    introduction: "Published in 1620, the Novum Organum ('New Instrument') is Francis Bacon's manifesto for a new method of scientific inquiry to replace the Aristotelian logic that had dominated European thought for centuries. Bacon catalogs the 'Idols' — systematic biases of the human mind — and proposes inductive reasoning from carefully observed particulars as the path to genuine knowledge of nature. The work laid the philosophical groundwork for the Scientific Revolution.",
    argumentCard: {
      centralQuestion: "How should we investigate nature to arrive at genuine knowledge, and what obstacles stand in our way?",
      thesis: "The human mind is prone to systematic errors (Idols) that distort understanding. True knowledge of nature requires a new method: patient, disciplined induction from carefully observed facts, rather than the deductive syllogisms of Aristotelian logic.",
      keyMoves: [
        "Identifies four 'Idols' that cloud human understanding: Idols of the Tribe (biases inherent in human nature), the Cave (individual prejudices), the Marketplace (confusions arising from language), and the Theatre (false philosophical systems)",
        "Argues that Aristotle's deductive syllogism can only rearrange existing knowledge, never discover new truths about nature",
        "Proposes systematic induction: gathering observations, organizing them into tables of presence, absence, and degree, and gradually eliminating false generalizations",
        "Insists that knowledge must aim at practical power over nature — the point of understanding is not contemplation but the ability to produce new effects"
      ],
      strongestObjection: "Bacon's inductive method, taken strictly, is impractical: no amount of pure observation generates scientific theories without creative hypotheses and imagination, and his own catalog of biases shows why purely mechanical induction is impossible."
    }
  },
  {
    id: "problems-of-philosophy",
    title: "The Problems of Philosophy",
    author: "Bertrand Russell",
    year: 1912,
    branch: "Epistemology",
    school: "Empiricism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/5827",
    folder: "Epistemology/Empiricism/Russell",
    filename: "Russell_ProblemsOfPhilosophy",
    fetchUrl: "https://www.gutenberg.org/cache/epub/5827/pg5827.txt",
    fetchType: "gutenberg",
    introduction: "Published in 1912, The Problems of Philosophy is Bertrand Russell's concise introduction to the central questions of philosophy. Russell examines whether we can know anything with certainty, distinguishes 'knowledge by acquaintance' from 'knowledge by description,' and defends the value of philosophy not as a provider of definite answers but as an enlarger of the mind. The book remains one of the clearest introductions to epistemology ever written.",
    argumentCard: {
      centralQuestion: "Can we know anything with certainty, and what is the value of philosophical inquiry?",
      thesis: "While we cannot prove the existence of the external world with absolute certainty, we can distinguish between appearance and reality through careful analysis. Philosophy's value lies not in providing definite answers but in enlarging our conception of what is possible and freeing us from the tyranny of custom.",
      keyMoves: [
        "Distinguishes 'knowledge by acquaintance' (direct awareness of sense-data, memories, truths of logic) from 'knowledge by description' (indirect knowledge of objects through their properties)",
        "Argues that while we cannot logically prove the external world exists, believing in it provides the simplest and most coherent explanation of our experience",
        "Defends induction as practically indispensable even though it cannot be logically guaranteed — without it, science and daily life would be impossible",
        "Claims philosophy's chief value is the greatness of the objects it contemplates: by removing 'the somewhat arrogant dogmatism of those who have never travelled into the region of liberating doubt'"
      ],
      strongestObjection: "Russell's distinction between sense-data and physical objects creates a 'veil of perception' problem: if we only ever experience sense-data, we can never verify that they correspond to real objects, making his realism an act of faith rather than a conclusion of reason."
    }
  },

  // ========================================================
  //  EPISTEMOLOGY / RATIONALISM
  // ========================================================
  {
    id: "discourse-on-method",
    title: "Discourse on the Method",
    author: "Rene Descartes",
    year: 1637,
    branch: "Epistemology",
    school: "Rationalism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/59",
    folder: "Epistemology/Rationalism/Descartes",
    filename: "Descartes_DiscourseOnMethod",
    fetchUrl: "https://www.gutenberg.org/cache/epub/59/pg59.txt",
    fetchType: "gutenberg",
    introduction: "Published in 1637, the Discourse on the Method is Descartes's autobiographical account of how he developed his philosophical method of systematic doubt. By resolving to accept nothing as true that he could possibly doubt, Descartes arrives at the one certainty that survives all skepticism: 'I think, therefore I am.' The work marks the beginning of modern Western philosophy and the rationalist tradition.",
    argumentCard: {
      centralQuestion: "How can we establish a foundation for knowledge that is absolutely certain?",
      thesis: "By systematically doubting everything that can possibly be doubted, we arrive at one indubitable truth — 'I think, therefore I am' (cogito ergo sum) — which serves as the foundation for rebuilding all knowledge through clear and distinct ideas grasped by reason alone.",
      keyMoves: [
        "Establishes four rules of method: accept nothing as true unless clearly and distinctly known; divide problems into parts; proceed from simple to complex; make enumerations so complete that nothing is omitted",
        "Applies radical doubt: the senses deceive us, mathematical reasoning might be manipulated by an evil demon, so we must reject everything uncertain",
        "Discovers the cogito: even if everything else is doubtful, the very act of doubting proves that a thinking thing exists — 'I think, therefore I am'",
        "From the certainty of the thinking self, rebuilds knowledge by proving God's existence (as guarantor of clear and distinct ideas) and the reliability of reason"
      ],
      strongestObjection: "The cogito may be circular: Descartes needs God to guarantee that clear and distinct ideas are true, but his proof of God relies on clear and distinct ideas — this 'Cartesian Circle' threatens the entire foundation."
    }
  },
  {
    id: "prolegomena",
    title: "Prolegomena to Any Future Metaphysics",
    author: "Immanuel Kant",
    year: 1783,
    branch: "Epistemology",
    school: "Rationalism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/52821",
    folder: "Epistemology/Rationalism/Kant",
    filename: "Kant_Prolegomena",
    fetchUrl: "https://www.gutenberg.org/cache/epub/52821/pg52821.txt",
    fetchType: "gutenberg",
    introduction: "Published in 1783 as an accessible summary of his Critique of Pure Reason, Kant's Prolegomena asks how synthetic a priori knowledge — knowledge that is both informative about the world and knowable independent of experience — is possible. Kant argues that the mind actively structures experience through forms of intuition (space and time) and categories of understanding (causality, substance), making objective knowledge possible but limiting it to the world as it appears to us.",
    argumentCard: {
      centralQuestion: "How is it possible to have knowledge that is both genuinely about the world and knowable prior to experience?",
      thesis: "Synthetic a priori knowledge is possible because the mind does not passively receive experience but actively structures it: space, time, and the categories of understanding are contributed by the knowing subject, making objective science possible while placing the thing-in-itself beyond our reach.",
      keyMoves: [
        "Distinguishes analytic judgments (the predicate is contained in the subject) from synthetic judgments (the predicate adds something new) and a priori knowledge (independent of experience) from a posteriori — then asks how synthetic a priori knowledge is possible",
        "Argues that mathematics is synthetic a priori because space and time are not properties of things but forms of human intuition that we impose on experience",
        "Shows that natural science is possible because the understanding applies categories like causality to experience — we do not discover causal laws in nature but legislate them",
        "Concludes that metaphysics fails when it tries to apply these categories beyond possible experience — God, freedom, and immortality cannot be objects of theoretical knowledge"
      ],
      strongestObjection: "If the categories of understanding are merely human contributions to experience, we can never know whether reality itself is causal, spatial, or temporal — Kant's solution to skepticism may just be a more sophisticated form of it."
    }
  },
  {
    id: "meno",
    title: "Meno",
    author: "Plato",
    year: -385,
    branch: "Epistemology",
    school: "Rationalism",
    source: "MIT Internet Classics Archive",
    sourceUrl: "http://classics.mit.edu/Plato/meno.html",
    folder: "Epistemology/Rationalism/Plato",
    filename: "Plato_Meno",
    fetchUrl: "http://classics.mit.edu/Plato/meno.html",
    fetchType: "mit",
    introduction: "Written around 385 BCE, the Meno begins with a deceptively simple question — can virtue be taught? — and quickly becomes one of philosophy's deepest investigations into the nature of knowledge itself. When Meno objects that inquiry is impossible (you either know something or you don't), Socrates responds with the revolutionary theory of recollection: all learning is the recovery of knowledge the soul already possesses. The famous geometry demonstration with a slave boy remains a touchstone for debates about innate knowledge.",
    argumentCard: {
      centralQuestion: "Can virtue be taught, and how is knowledge possible at all?",
      thesis: "Learning is not the acquisition of something entirely new but the recollection (anamnesis) of knowledge the soul possessed before birth. Since the soul is immortal and has already learned everything, what we call learning is really remembering — and virtue, like all genuine knowledge, must be recoverable through proper inquiry.",
      keyMoves: [
        "Poses Meno's paradox: you cannot search for what you know (you already have it) or for what you don't know (you wouldn't recognize it if you found it) — so inquiry seems impossible",
        "Resolves the paradox with the theory of recollection: the soul has learned everything in its prior existences, so learning is recovering latent knowledge through questioning",
        "Demonstrates recollection with the slave boy: through leading questions alone, an uneducated slave arrives at a geometric truth he was never taught",
        "Distinguishes true opinion from knowledge — both can guide action correctly, but only knowledge is 'tied down' by reasoning about causes"
      ],
      strongestObjection: "The slave boy demonstration may show only the power of leading questions, not innate knowledge: Socrates's questions contain implicit hints that guide the boy toward the answer, which looks less like recollection than skillful teaching."
    }
  },

  // ========================================================
  //  ETHICS / STOICISM
  // ========================================================
  {
    id: "meditations",
    title: "Meditations",
    author: "Marcus Aurelius",
    year: 180,
    branch: "Ethics",
    school: "Stoicism",
    source: "MIT Internet Classics Archive",
    sourceUrl: "http://classics.mit.edu/Antoninus/meditations.html",
    folder: "Ethics/Stoicism/Marcus Aurelius",
    filename: "MarcusAurelius_Meditations",
    fetchUrls: [
      "http://classics.mit.edu/Antoninus/meditations.2.two.html",
      "http://classics.mit.edu/Antoninus/meditations.3.three.html",
      "http://classics.mit.edu/Antoninus/meditations.4.four.html",
      "http://classics.mit.edu/Antoninus/meditations.5.five.html",
      "http://classics.mit.edu/Antoninus/meditations.6.six.html",
      "http://classics.mit.edu/Antoninus/meditations.7.seven.html",
      "http://classics.mit.edu/Antoninus/meditations.8.eight.html",
      "http://classics.mit.edu/Antoninus/meditations.9.nine.html",
      "http://classics.mit.edu/Antoninus/meditations.10.ten.html",
      "http://classics.mit.edu/Antoninus/meditations.11.eleven.html",
      "http://classics.mit.edu/Antoninus/meditations.12.twelve.html",
    ],
    fetchType: "mit-multi",
    introduction: "Written during the last decade of his life while campaigning on the Roman frontier, Marcus Aurelius's Meditations is the private philosophical journal of a Roman emperor. Never intended for publication, these twelve books of self-exhortation apply Stoic principles to the pressures of power, loss, and mortality. The work shows philosophy not as abstract theory but as a daily practice of reminding oneself what matters and what does not.",
    argumentCard: {
      centralQuestion: "How should one live when confronted with suffering, impermanence, and the demands of duty?",
      thesis: "Tranquility comes from recognizing that only our own judgments and intentions are within our control. External events — including pain, death, and the opinions of others — have no power to disturb us unless we grant them that power through our own assent.",
      keyMoves: [
        "Applies the Stoic dichotomy of control: our opinions, impulses, and desires are 'up to us,' while our bodies, reputations, and possessions are not — peace comes from focusing exclusively on the former",
        "Uses the 'view from above': by contemplating the vastness of time and space, the brevity of human life, and the endless repetition of history, personal troubles shrink to insignificance",
        "Argues that everything in nature is interconnected and rational, so even apparent evils serve the whole — we should accept fate willingly, not resentfully",
        "Insists on returning to duty regardless of inner turmoil: the philosopher-emperor must serve the common good even when tired, frustrated, or surrounded by difficult people"
      ],
      strongestObjection: "Marcus's counsel to remain indifferent to everything external — including the suffering and death of loved ones — can seem less like wisdom than emotional numbness dressed up as philosophy."
    }
  },
  {
    id: "seneca-shortness-of-life",
    title: "On the Shortness of Life",
    author: "Seneca",
    year: 49,
    branch: "Ethics",
    school: "Stoicism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/3794",
    folder: "Ethics/Stoicism/Seneca",
    filename: "Seneca_OnTheShortnessOfLife",
    fetchUrl: "https://www.gutenberg.org/cache/epub/3794/pg3794.txt",
    fetchType: "gutenberg",
    introduction: "Written around 49 CE and addressed to his father-in-law Paulinus, On the Shortness of Life is Seneca's urgent argument that life is not actually short — we just waste most of it. Seneca catalogs the ways people squander their time on trivial pursuits, social obligations, and anxious planning for a future that may never come. The essay is one of the most vivid and practical works of Stoic philosophy, as relevant today as when it was written.",
    argumentCard: {
      centralQuestion: "Is life really too short, or do we simply fail to use the time we have?",
      thesis: "Life is long enough if we use it wisely. The problem is not the quantity of time but how we spend it: we squander our lives on busyness, distraction, and the pursuit of things that don't matter, then complain that life is short when we have wasted most of it.",
      keyMoves: [
        "Reframes the complaint about life's brevity: we are not given a short life, but we make it short — 'life is long if you know how to use it'",
        "Catalogs the ways people waste time: compulsive busyness, social climbing, addiction to luxury, obsessive planning for a retirement that may never come",
        "Argues that only the philosopher truly lives, because only the philosopher is present to their own experience rather than living in anticipation or regret",
        "Draws the striking comparison that people guard their property but are profligate with time — the one thing that, once lost, can never be recovered"
      ],
      strongestObjection: "Seneca himself lived a life of extreme wealth and political ambition at the court of Nero, making his advice to abandon busyness and pursue philosophy look hypocritical — a case of 'do as I say, not as I do.'"
    }
  },

  // ========================================================
  //  ETHICS / UTILITARIANISM
  // ========================================================
  {
    id: "utilitarianism",
    title: "Utilitarianism",
    author: "John Stuart Mill",
    year: 1863,
    branch: "Ethics",
    school: "Utilitarianism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/11224",
    folder: "Ethics/Utilitarianism/Mill",
    filename: "Mill_Utilitarianism",
    fetchUrl: "https://www.gutenberg.org/cache/epub/11224/pg11224.txt",
    fetchType: "gutenberg",
    introduction: "Published in 1863, Utilitarianism is John Stuart Mill's most systematic defense of the principle that actions are right in proportion as they tend to promote happiness. Mill refines Jeremy Bentham's cruder 'greatest happiness' calculus by distinguishing higher pleasures (intellectual, aesthetic) from lower ones, famously claiming it is 'better to be Socrates dissatisfied than a fool satisfied.' The work remains the definitive statement of utilitarian ethics.",
    argumentCard: {
      centralQuestion: "What makes an action morally right or wrong?",
      thesis: "The Greatest Happiness Principle: actions are right in proportion as they tend to promote happiness (pleasure and the absence of pain), and wrong as they tend to produce the reverse — but not all pleasures are equal; intellectual and moral pleasures are qualitatively superior to merely physical ones.",
      keyMoves: [
        "Distinguishes higher pleasures from lower pleasures: competent judges who have experienced both consistently prefer intellectual and moral satisfactions over bodily ones — 'better to be Socrates dissatisfied than a fool satisfied'",
        "Argues that the standard is not the agent's own happiness but the greatest amount of happiness altogether — utilitarianism demands impartiality between one's own pleasure and that of others",
        "Derives a theory of justice from utility: rights and justice are not independent of happiness but are the most important utilitarian requirements, because they protect the security on which all other goods depend",
        "Defends utilitarianism against the charge that it is a 'pig philosophy' by showing that the cultivation of noble character is itself one of the greatest sources of happiness"
      ],
      strongestObjection: "Utilitarianism seems to permit horrific injustices — torturing one innocent person to save five, for example — because it cares only about the total balance of happiness, not how that happiness is distributed or whose rights are violated."
    }
  },
  // Mill - On Liberty: ENRICHMENT ONLY (already has .md)
  {
    id: "on-liberty",
    title: "On Liberty",
    author: "John Stuart Mill",
    year: 1859,
    branch: "Ethics",
    school: "Utilitarianism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/34901",
    folder: "Ethics/Utilitarianism/Mill",
    filename: "Mill_OnLiberty",
    fetchUrl: null,
    fetchType: null,
    introduction: "Published in 1859, On Liberty is John Stuart Mill's classic defense of individual freedom against the tyranny of both government and social opinion. Mill argues that the only legitimate reason for society to restrict a person's liberty is to prevent harm to others — never for that person's own good. The essay remains one of the most influential statements of liberal political philosophy ever written.",
    argumentCard: {
      centralQuestion: "When is society justified in limiting the freedom of the individual?",
      thesis: "The only purpose for which power can be rightfully exercised over any member of a civilized community, against his will, is to prevent harm to others. Over his own body and mind, the individual is sovereign.",
      keyMoves: [
        "Establishes the 'harm principle': society may only restrict individual liberty to prevent direct harm to others — not to enforce morality, protect people from themselves, or promote the general good",
        "Argues that suppressing any opinion is wrong, even if false, because the process of challenging ideas is how truth stays alive and meaningful",
        "Distinguishes 'self-regarding' actions (affecting only the individual) from 'other-regarding' actions, arguing society has authority only over the latter",
        "Claims that individuality and eccentricity are essential to social progress — conformity deadens the human spirit"
      ],
      strongestObjection: "The distinction between self-regarding and other-regarding actions collapses under scrutiny: virtually every action affects others indirectly, making the harm principle either trivially permissive or requiring exactly the kind of judgment Mill wants to avoid."
    }
  },

  // ========================================================
  //  ETHICS / VIRTUE ETHICS
  // ========================================================
  {
    id: "nicomachean-ethics",
    title: "Nicomachean Ethics",
    author: "Aristotle",
    year: -340,
    branch: "Ethics",
    school: "Virtue Ethics",
    source: "MIT Internet Classics Archive",
    sourceUrl: "http://classics.mit.edu/Aristotle/nicomachaen.html",
    folder: "Ethics/Virtue Ethics/Aristotle",
    filename: "Aristotle_NicomacheanEthics",
    fetchUrls: [
      "http://classics.mit.edu/Aristotle/nicomachaen.1.i.html",
      "http://classics.mit.edu/Aristotle/nicomachaen.2.ii.html",
      "http://classics.mit.edu/Aristotle/nicomachaen.3.iii.html",
      "http://classics.mit.edu/Aristotle/nicomachaen.4.iv.html",
      "http://classics.mit.edu/Aristotle/nicomachaen.5.v.html",
      "http://classics.mit.edu/Aristotle/nicomachaen.6.vi.html",
      "http://classics.mit.edu/Aristotle/nicomachaen.7.vii.html",
      "http://classics.mit.edu/Aristotle/nicomachaen.8.viii.html",
      "http://classics.mit.edu/Aristotle/nicomachaen.9.ix.html",
      "http://classics.mit.edu/Aristotle/nicomachaen.10.x.html",
    ],
    fetchType: "mit-multi",
    introduction: "Composed around 340 BCE and named after Aristotle's son Nicomachus, the Nicomachean Ethics is the foundational work of Western ethical theory. Aristotle argues that the good life consists in the exercise of virtue — understood not as following rules but as developing excellent habits of character that hit the 'mean' between extremes. The work's concepts of eudaimonia (flourishing), virtue as a habit, and practical wisdom remain central to moral philosophy.",
    argumentCard: {
      centralQuestion: "What does it mean to live a good life, and how do we achieve it?",
      thesis: "The highest human good is eudaimonia (flourishing or happiness), which consists in the active exercise of virtue over a complete life. Virtue is a stable disposition to choose the mean between excess and deficiency, guided by practical wisdom (phronesis).",
      keyMoves: [
        "Defines the good as 'that at which all things aim' and identifies eudaimonia as the supreme good — the only thing desired entirely for its own sake",
        "Argues that virtue is not natural but acquired through habit: we become courageous by doing courageous acts, just as we become builders by building",
        "Introduces the doctrine of the mean: every virtue is a balanced disposition between two vices (courage is the mean between cowardice and recklessness)",
        "Distinguishes intellectual virtues (acquired through teaching) from moral virtues (acquired through practice), and identifies practical wisdom as the master virtue that guides all others"
      ],
      strongestObjection: "The doctrine of the mean is too vague to be action-guiding: it tells us to find the right amount of anger, generosity, or courage, but gives no clear method for determining what the mean is in any particular situation."
    }
  },
  {
    id: "apology",
    title: "Apology",
    author: "Plato",
    year: -399,
    branch: "Ethics",
    school: "Virtue Ethics",
    source: "MIT Internet Classics Archive",
    sourceUrl: "http://classics.mit.edu/Plato/apology.html",
    folder: "Ethics/Virtue Ethics/Plato",
    filename: "Plato_Apology",
    fetchUrl: "http://classics.mit.edu/Plato/apology.html",
    fetchType: "mit",
    introduction: "Written shortly after Socrates's execution in 399 BCE, the Apology presents Plato's account of Socrates's trial before the Athenian jury. Charged with corrupting the youth and not believing in the city's gods, Socrates mounts a defense that is less a legal argument than a philosophical manifesto: the unexamined life is not worth living, and he would rather die than stop questioning. The dialogue shows philosophy not as an academic exercise but as a way of life worth dying for.",
    argumentCard: {
      centralQuestion: "Is the examined life worth the risk of death, and what does a philosopher owe to society?",
      thesis: "The unexamined life is not worth living. Socrates is not guilty of the charges against him; on the contrary, by questioning everyone's assumptions and exposing false wisdom, he performs the greatest service to Athens — and he will not stop, even if it costs his life.",
      keyMoves: [
        "Recounts the oracle at Delphi declaring Socrates the wisest man, which he interprets not as praise but as a mission: he is wisest only because he knows that he knows nothing",
        "Cross-examines his accuser Meletus, showing that the charges are confused and self-contradictory — Meletus cannot even explain what corrupting the youth means",
        "Argues that death is either a dreamless sleep (not bad) or a journey to another world where he can question the great figures of history (positively good) — so a philosopher has nothing to fear",
        "Refuses to beg for mercy or parade his weeping children before the jury, insisting that a philosopher must persuade through reason, not emotional manipulation"
      ],
      strongestObjection: "Socrates's refusal to compromise or show any deference to the jury looks less like philosophical courage and more like intellectual arrogance — by deliberately provoking the jury, he chose martyrdom over the possibility of continuing his philosophical mission."
    }
  },
  {
    id: "republic",
    title: "Republic",
    author: "Plato",
    year: -375,
    branch: "Ethics",
    school: "Virtue Ethics",
    source: "MIT Internet Classics Archive",
    sourceUrl: "http://classics.mit.edu/Plato/republic.html",
    folder: "Ethics/Virtue Ethics/Plato",
    filename: "Plato_Republic",
    fetchUrls: [
      "http://classics.mit.edu/Plato/republic.2.i.html",
      "http://classics.mit.edu/Plato/republic.3.ii.html",
      "http://classics.mit.edu/Plato/republic.4.iii.html",
      "http://classics.mit.edu/Plato/republic.5.iv.html",
      "http://classics.mit.edu/Plato/republic.6.v.html",
      "http://classics.mit.edu/Plato/republic.7.vi.html",
      "http://classics.mit.edu/Plato/republic.8.vii.html",
      "http://classics.mit.edu/Plato/republic.9.viii.html",
      "http://classics.mit.edu/Plato/republic.10.ix.html",
      "http://classics.mit.edu/Plato/republic.11.x.html",
    ],
    fetchType: "mit-multi",
    introduction: "Composed around 375 BCE, the Republic is Plato's most ambitious dialogue, weaving together ethics, politics, metaphysics, and epistemology into one grand argument. Beginning with the question 'What is justice?', Socrates constructs an ideal city in speech to show that justice in the state mirrors justice in the soul. The work contains some of philosophy's most famous images — the allegory of the cave, the divided line, and the philosopher-king — and remains one of the most discussed texts in the Western tradition.",
    argumentCard: {
      centralQuestion: "What is justice, and is the just person happier than the unjust person?",
      thesis: "Justice is the proper ordering of the soul's three parts — reason, spirit, and appetite — just as a just city has rulers, guardians, and producers each performing their proper function. The just person is happier than the unjust because a well-ordered soul is in harmony with itself.",
      keyMoves: [
        "Constructs the ideal city as a model for understanding the soul: just as the city has three classes (rulers, warriors, workers), the soul has three parts (reason, spirit, appetite), and justice is each part doing its proper work",
        "Introduces the Theory of Forms through the allegory of the cave: most people mistake shadows for reality; only philosophy can turn the soul from appearances to the true forms, especially the Form of the Good",
        "Argues that philosophers must rule because only they have knowledge of the Good — democracy fails because it gives equal voice to those who lack understanding",
        "Shows through the allegory of the Ring of Gyges that justice is valuable in itself, not merely for its consequences: even if an unjust person could escape detection, their disordered soul would make them miserable"
      ],
      strongestObjection: "Plato's ideal state is authoritarian: it requires philosopher-kings with absolute power, censorship of art and music, a 'noble lie' to keep citizens in their place, and the abolition of private property and family for the guardian class — making 'justice' look suspiciously like totalitarianism."
    }
  },

  // ========================================================
  //  METAPHYSICS / EXISTENTIALISM
  // ========================================================
  // Nietzsche BGE: ENRICHMENT ONLY
  {
    id: "beyond-good-and-evil",
    title: "Beyond Good and Evil",
    author: "Friedrich Nietzsche",
    year: 1886,
    branch: "Metaphysics",
    school: "Existentialism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/4363",
    folder: "Metaphysics/Existentialism/Nietzsche",
    filename: "Nietzsche_BeyondGoodAndEvil",
    fetchUrl: null,
    fetchType: null,
    introduction: "Published in 1886, Beyond Good and Evil is Nietzsche's systematic attempt to dismantle the foundations of traditional Western philosophy. He attacks the dogmatism of earlier philosophers, especially their uncritical faith in oppositions like good and evil, truth and falsehood, and argues that all philosophy has been an unconscious expression of its author's personal drives. The book prepares the ground for his famous 'revaluation of all values.'",
    argumentCard: {
      centralQuestion: "Are the moral categories of 'good' and 'evil' based on truth, or are they prejudices of philosophers?",
      thesis: "Traditional morality — especially the Christian-Platonic distinction between good and evil — is not a discovery about the world but a prejudice. True philosophers must create new values beyond this inherited framework.",
      keyMoves: [
        "Exposes how every great philosophy is 'a confession of its author and a kind of involuntary memoir' — philosophers don't find truths, they impose preferences",
        "Distinguishes 'master morality' (valuing strength and self-assertion) from 'slave morality' (valuing humility and pity), arguing the latter triumphed through Christianity",
        "Argues that the 'will to truth' is itself a form of the will to power — truth-seeking cannot be separated from the drives and interests of the seeker",
        "Calls for 'philosophers of the future' who will create new values rather than merely analyzing inherited ones"
      ],
      strongestObjection: "Nietzsche's critique seems self-undermining: if all values are expressions of will to power, then his own call for new values is equally arbitrary, leaving no ground for preferring his vision over the morality he attacks."
    }
  },
  // Dostoevsky Notes: ENRICHMENT ONLY
  {
    id: "notes-from-underground",
    title: "Notes from Underground",
    author: "Fyodor Dostoevsky",
    year: 1864,
    branch: "Metaphysics",
    school: "Existentialism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/600",
    folder: "Metaphysics/Existentialism/Dostoevsky",
    filename: "Dostoevsky_NotesFromUnderground",
    fetchUrl: null,
    fetchType: null,
    introduction: "Written in 1864, Notes from Underground is a proto-existentialist novella in which an unnamed narrator — a bitter, isolated former civil servant — rails against rationalism, utopianism, and the idea that human behavior can be reduced to rational self-interest. The first part is a philosophical monologue; the second illustrates these ideas through painful autobiographical episodes. It is widely regarded as one of the first existentialist texts.",
    argumentCard: {
      centralQuestion: "Is human nature fundamentally rational, and can a perfect society be built on the assumption that people will always act in their own best interest?",
      thesis: "Human beings are not rational calculating machines. People will deliberately act against their own interests — even choosing suffering over comfort — simply to assert their free will, and any utopian system that denies this irrational freedom denies what makes us human.",
      keyMoves: [
        "Attacks the 'crystal palace' of rational utopianism: if human behavior could be calculated like a mathematical table, we would lose our freedom and become 'piano keys'",
        "Argues that humans sometimes want to suffer, to act foolishly, or to destroy their own advantage, because caprice and free choice matter more than rational benefit",
        "Demonstrates through the narrator's own self-destructive behavior that consciousness itself can become a disease — the more aware you are, the less capable of action",
        "Shows that spite, perversity, and contradiction are not aberrations but essential features of human nature"
      ],
      strongestObjection: "The Underground Man's rebellion against reason is itself a rational argument against rationality, which makes it self-defeating. His position also risks romanticizing cruelty and dysfunction as authentic expressions of freedom."
    }
  },
  {
    id: "thus-spoke-zarathustra",
    title: "Thus Spoke Zarathustra",
    author: "Friedrich Nietzsche",
    year: 1885,
    branch: "Metaphysics",
    school: "Existentialism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/1998",
    folder: "Metaphysics/Existentialism/Nietzsche",
    filename: "Nietzsche_ThusSpakeZarathustra",
    fetchUrl: "https://www.gutenberg.org/cache/epub/1998/pg1998.txt",
    fetchType: "gutenberg",
    introduction: "Published between 1883 and 1885, Thus Spoke Zarathustra is Nietzsche's most literary and ambitious work, written in a prophetic, quasi-biblical style. Through the wanderings and speeches of the prophet Zarathustra, Nietzsche introduces his most famous ideas: the death of God, the Ubermensch (overman) who creates new values, the eternal recurrence of all things, and the will to power. Part philosophy, part poetry, the work defies easy classification.",
    argumentCard: {
      centralQuestion: "How should human beings live after the 'death of God' has destroyed the foundations of traditional morality?",
      thesis: "With the collapse of religious and metaphysical certainties, humanity faces a choice: sink into nihilism (the 'last man' who seeks only comfort) or rise to create new values through the Ubermensch — a human being who affirms life so completely that they would will its eternal recurrence.",
      keyMoves: [
        "Declares that 'God is dead' — not as an atheistic boast but as a diagnosis of modern culture, which has lost the framework that once gave life meaning",
        "Contrasts the 'last man' (who seeks only comfort, safety, and mild pleasure) with the Ubermensch (who embraces suffering, risk, and self-overcoming as the path to greatness)",
        "Introduces the eternal recurrence as the ultimate test of life-affirmation: could you will that your entire life, with every pain and joy, recur exactly as it was, forever?",
        "Argues that the will to power is not domination over others but self-overcoming — the drive to grow, create, and become more than what you are"
      ],
      strongestObjection: "Nietzsche's Ubermensch is dangerously vague: without clear moral content, the ideal of 'creating new values' and 'self-overcoming' has been co-opted by authoritarians and elitists who use it to justify domination."
    }
  },
  {
    id: "pensees",
    title: "Pensees",
    author: "Blaise Pascal",
    year: 1670,
    branch: "Metaphysics",
    school: "Existentialism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/18269",
    folder: "Metaphysics/Existentialism/Pascal",
    filename: "Pascal_Pensees",
    fetchUrl: "https://www.gutenberg.org/cache/epub/18269/pg18269.txt",
    fetchType: "gutenberg",
    introduction: "Published posthumously in 1670, the Pensees ('Thoughts') are the unfinished fragments of Pascal's planned defense of Christianity. Combining mathematical precision with psychological insight, Pascal explores the human condition — our wretchedness without God, our inability to sit quietly in a room, our terror before the 'eternal silence of infinite spaces.' The work contains his famous 'wager' argument and some of the most penetrating reflections on faith, reason, and the human heart ever written.",
    argumentCard: {
      centralQuestion: "What is the human condition, and can reason alone guide us to meaning and salvation?",
      thesis: "Human beings are caught between greatness and wretchedness — capable of knowing truth but unable to reach it through reason alone. Since reason cannot settle the question of God's existence, we must wager: betting on God is the only rational choice, because the potential gain (infinite happiness) infinitely outweighs the finite cost of belief.",
      keyMoves: [
        "Diagnoses the human condition as a paradox: we are 'thinking reeds' — infinitely small in the universe yet conscious of our smallness, which is itself a form of greatness",
        "Argues that most human activity is 'diversion' — we keep ourselves busy to avoid confronting our mortality, loneliness, and the meaninglessness that threatens when we sit quietly",
        "Presents Pascal's Wager: since reason cannot prove or disprove God, we must bet — if God exists and we believe, we gain everything; if we don't believe, we lose everything; if God doesn't exist, we lose very little by believing",
        "Claims that 'the heart has its reasons which reason does not know' — faith operates through a faculty different from and superior to discursive reason"
      ],
      strongestObjection: "Pascal's Wager is flawed: it assumes only two options (Christianity or atheism), ignoring the infinite number of possible gods; it treats belief as a choice one can simply make; and it seems to reduce faith to a cynical calculation of expected payoff."
    }
  },

  // ========================================================
  //  METAPHYSICS / IDEALISM
  // ========================================================
  {
    id: "phaedo",
    title: "Phaedo",
    author: "Plato",
    year: -360,
    branch: "Metaphysics",
    school: "Idealism",
    source: "MIT Internet Classics Archive",
    sourceUrl: "http://classics.mit.edu/Plato/phaedo.html",
    folder: "Metaphysics/Idealism/Plato",
    filename: "Plato_Phaedo",
    fetchUrl: "http://classics.mit.edu/Plato/phaedo.html",
    fetchType: "mit",
    introduction: "Set on the day of Socrates's execution in 399 BCE, the Phaedo recounts his final conversation with friends about the immortality of the soul. Socrates presents four arguments that the soul survives death, grounded in the theory of Forms: since the soul grasps eternal, unchanging realities, it must itself be eternal and unchanging. The dialogue is both a philosophical treatise on the soul and body and a deeply moving portrait of a philosopher facing death with equanimity.",
    argumentCard: {
      centralQuestion: "Does the soul survive the death of the body, and what is the relationship between soul and body?",
      thesis: "The soul is immortal and exists before and after its union with the body. Since the soul's essential nature is to grasp eternal Forms, it must itself be eternal — and the philosopher, by practicing detachment from bodily pleasures, prepares the soul for its liberation at death.",
      keyMoves: [
        "Argues from recollection: since we recognize imperfect instances of equality, beauty, and goodness, we must have known the perfect Forms before birth — proving the soul's pre-existence",
        "Argues from affinity: the soul is like the Forms (invisible, unchanging, rational) rather than like the body (visible, changing, irrational), so it should share their imperishability",
        "Introduces the theory of Forms as the only adequate explanation of why things are what they are — a beautiful thing is beautiful by participating in the Form of Beauty",
        "Argues that the soul cannot admit its opposite (death) any more than fire can admit cold — death approaches the body, and the soul withdraws intact"
      ],
      strongestObjection: "The argument from affinity is weak: the fact that the soul is LIKE the Forms (invisible, rational) does not prove it shares their immortality — similarity is not identity, and invisible things (like shadows or sounds) are perfectly capable of ceasing to exist."
    }
  },
  {
    id: "spinoza-ethics",
    title: "Ethics",
    author: "Baruch Spinoza",
    year: 1677,
    branch: "Metaphysics",
    school: "Idealism",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/3800",
    folder: "Metaphysics/Idealism/Spinoza",
    filename: "Spinoza_Ethics",
    fetchUrl: "https://www.gutenberg.org/cache/epub/3800/pg3800.txt",
    fetchType: "gutenberg",
    introduction: "Published posthumously in 1677, Spinoza's Ethics is one of the most radical works in the history of philosophy, presented in a geometric format of definitions, axioms, and theorems. Spinoza argues that God and Nature are one and the same substance, that everything that exists follows necessarily from this substance, and that human freedom consists not in free will (which is an illusion) but in understanding the necessity of all things. The work was banned for over a century.",
    argumentCard: {
      centralQuestion: "What is the nature of reality, and how can human beings achieve genuine freedom and happiness?",
      thesis: "There is only one substance — God or Nature — and everything that exists is a mode (modification) of this substance. Human freedom is not free will but the intellectual love of God: understanding the necessary order of nature frees us from the tyranny of the passions.",
      keyMoves: [
        "Proves that there can be only one substance (God/Nature) with infinite attributes, of which thought and extension are the two we know — eliminating Cartesian dualism",
        "Argues that free will is an illusion born of ignorance: we think we choose freely only because we are conscious of our desires but ignorant of the causes that determine them",
        "Classifies human emotions as either active (arising from adequate understanding) or passive (arising from confused ideas) — and shows that passive emotions enslave us while active emotions liberate us",
        "Culminates in the 'intellectual love of God' (amor Dei intellectualis): by understanding ourselves and nature as necessary expressions of the one substance, we achieve blessedness and freedom from suffering"
      ],
      strongestObjection: "If everything follows necessarily from God's nature and free will is an illusion, then moral responsibility becomes meaningless: no one can be praised for virtue or blamed for vice, since both are equally determined."
    }
  },

  // ========================================================
  //  METAPHYSICS / PHENOMENOLOGY
  // ========================================================
  {
    id: "on-the-nature-of-things",
    title: "On the Nature of Things",
    author: "Lucretius",
    year: -55,
    branch: "Metaphysics",
    school: "Phenomenology",
    source: "MIT Internet Classics Archive",
    sourceUrl: "http://classics.mit.edu/Carus/nature_things.html",
    folder: "Metaphysics/Phenomenology/Lucretius",
    filename: "Lucretius_OnTheNatureOfThings",
    fetchUrls: [
      "http://classics.mit.edu/Carus/nature_things.1.i.html",
      "http://classics.mit.edu/Carus/nature_things.2.ii.html",
      "http://classics.mit.edu/Carus/nature_things.3.iii.html",
      "http://classics.mit.edu/Carus/nature_things.4.iv.html",
      "http://classics.mit.edu/Carus/nature_things.5.v.html",
      "http://classics.mit.edu/Carus/nature_things.6.vi.html",
    ],
    fetchType: "mit-multi",
    introduction: "Written around 55 BCE, Lucretius's De Rerum Natura is a six-book philosophical poem that presents Epicurean physics and ethics in stunning Latin verse. Lucretius argues that everything in the universe is composed of atoms moving through void, that the soul is mortal, and that the gods play no role in human affairs. The poem's purpose is therapeutic: by understanding the true nature of things, we are freed from the fear of death and the fear of the gods — the two greatest sources of human misery.",
    argumentCard: {
      centralQuestion: "What is the fundamental nature of reality, and how can understanding it free us from fear and suffering?",
      thesis: "The universe consists entirely of atoms and void. The soul is material and mortal. The gods exist but have no interest in human affairs. Once we understand this, we are freed from the twin terrors of death and divine punishment — and can live in tranquil pleasure.",
      keyMoves: [
        "Argues that nothing comes from nothing and nothing is destroyed into nothing — all change is the rearrangement of eternal, indivisible atoms moving through infinite void",
        "Proves the soul is mortal: it is made of very fine atoms that disperse at death, so there is no afterlife and therefore nothing to fear in death — 'death is nothing to us'",
        "Explains all natural phenomena (weather, earthquakes, plague) as atomic processes, eliminating the need for divine intervention and the superstitious fear it breeds",
        "Introduces the 'swerve' (clinamen): atoms occasionally deviate unpredictably from their paths, which is the origin of free will and prevents the universe from being rigidly deterministic"
      ],
      strongestObjection: "The 'swerve' is an ad hoc addition that undermines the system: if atoms randomly deviate, this doesn't explain free will (randomness is not freedom) and it contradicts the otherwise deterministic atomic physics Lucretius champions."
    }
  },

  // ========================================================
  //  AESTHETICS / PHILOSOPHY OF ART
  // ========================================================
  {
    id: "poetics",
    title: "Poetics",
    author: "Aristotle",
    year: -335,
    branch: "Aesthetics",
    school: "Philosophy of Art",
    source: "MIT Internet Classics Archive",
    sourceUrl: "http://classics.mit.edu/Aristotle/poetics.html",
    folder: "Aesthetics/Philosophy of Art/Aristotle",
    filename: "Aristotle_Poetics",
    fetchUrl: "http://classics.mit.edu/Aristotle/poetics.html",
    fetchType: "mit",
    introduction: "Composed around 335 BCE, the Poetics is Aristotle's analysis of literary art, focusing especially on tragedy. Aristotle argues that art is a form of imitation (mimesis) and that tragedy achieves its distinctive effect — catharsis — by arousing pity and fear through the representation of serious human action. The work established the vocabulary and framework for literary criticism that endured for over two thousand years.",
    argumentCard: {
      centralQuestion: "What is the nature of dramatic art, and what makes a tragedy excellent?",
      thesis: "Tragedy is an imitation of a serious and complete action that, through the arousal of pity and fear, accomplishes the catharsis (purification or clarification) of such emotions. The most important element of tragedy is plot — the arrangement of incidents — not character, spectacle, or diction.",
      keyMoves: [
        "Defines tragedy through six elements ranked by importance: plot, character, thought, diction, spectacle, and song — with plot as the 'soul of tragedy'",
        "Argues that the best plots involve a reversal of fortune (peripeteia) and a moment of recognition (anagnorisis), ideally occurring simultaneously",
        "Claims the tragic hero should be neither perfectly virtuous nor thoroughly villainous, but a person of high standing who falls through a hamartia (error or flaw)",
        "Defends poetry as 'more philosophical than history' because it depicts universals (what could happen according to probability or necessity) rather than mere particulars"
      ],
      strongestObjection: "Aristotle's analysis is too narrow: it fits Greek tragedy reasonably well but struggles to account for great tragedies that violate his rules — Shakespeare's tragedies feature multiple plots, comic subplots, and heroes whose fall comes from complex circumstances rather than a single hamartia."
    }
  },
  {
    id: "what-is-art",
    title: "What is Art?",
    author: "Leo Tolstoy",
    year: 1897,
    branch: "Aesthetics",
    school: "Philosophy of Art",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/64908",
    folder: "Aesthetics/Philosophy of Art/Tolstoy",
    filename: "Tolstoy_WhatIsArt",
    fetchUrl: "https://www.gutenberg.org/cache/epub/64908/pg64908.txt",
    fetchType: "gutenberg",
    introduction: "Published in 1897, What is Art? is Tolstoy's radical critique of the art world and his attempt to redefine art's purpose. Rejecting beauty as art's defining feature, Tolstoy argues that real art is the communication of feeling from artist to audience — and that by this standard, most of what the educated classes call 'great art' (including much of his own work) is counterfeit. Good art, he insists, must be accessible to everyone and must transmit feelings that unite rather than divide humanity.",
    argumentCard: {
      centralQuestion: "What is art, and what makes some art good and other art bad?",
      thesis: "Art is not about beauty but about the communication of feeling: a work is art to the extent that it infects the audience with the emotion the artist experienced. Good art communicates feelings that promote universal human brotherhood; bad art communicates exclusive, divisive, or merely sensual feelings.",
      keyMoves: [
        "Rejects all beauty-based definitions of art as circular and class-bound — they reduce art to whatever gives pleasure to educated elites",
        "Defines art as the intentional transmission of feeling from one person to another through external signs — its defining feature is 'infectiousness,' not beauty or technical skill",
        "Argues that the entire art establishment (critics, academies, the canon) has created a counterfeit art that serves the pleasure of the wealthy while excluding ordinary people",
        "Insists that the highest art communicates feelings of universal human brotherhood arising from the religious perception of each age — in our age, this means Christian love"
      ],
      strongestObjection: "Tolstoy's theory is reductively moralistic: by judging art primarily by its social and religious effects, he dismisses enormous amounts of formally brilliant, emotionally complex art (including Shakespeare, Beethoven, and his own earlier novels) as 'counterfeit' — which suggests the theory is too narrow rather than that all great art is fraudulent."
    }
  },

  // ========================================================
  //  AESTHETICS / AESTHETIC EXPERIENCE
  // ========================================================
  {
    id: "symposium",
    title: "Symposium",
    author: "Plato",
    year: -385,
    branch: "Aesthetics",
    school: "Aesthetic Experience",
    source: "MIT Internet Classics Archive",
    sourceUrl: "http://classics.mit.edu/Plato/symposium.html",
    folder: "Aesthetics/Aesthetic Experience/Plato",
    filename: "Plato_Symposium",
    fetchUrl: "http://classics.mit.edu/Plato/symposium.html",
    fetchType: "mit",
    introduction: "Set at an Athenian drinking party around 416 BCE, the Symposium presents a series of speeches in praise of Eros (love). Each speaker offers a different theory of love's nature and purpose, culminating in Socrates's account of the 'ladder of beauty' — the ascent from love of a single beautiful body to love of Beauty itself. The dialogue is both a profound meditation on desire and transcendence and a brilliant work of dramatic art.",
    argumentCard: {
      centralQuestion: "What is love (Eros), and what is its ultimate purpose?",
      thesis: "Love is not a god but a spirit (daimon) — a restless desire born of lack that drives us from the love of individual beautiful bodies upward through an ascending 'ladder' to the contemplation of absolute Beauty itself, which is eternal, unchanging, and the source of all particular beauties.",
      keyMoves: [
        "Presents competing theories of love: Aristophanes' myth of divided souls seeking their other halves; Agathon's praise of love as young and beautiful; Pausanias's distinction between heavenly and common love",
        "Through the priestess Diotima, Socrates redefines love as lack — Eros is neither beautiful nor ugly, neither wise nor ignorant, but a spirit that mediates between the mortal and the divine",
        "Describes the 'ladder of beauty': the lover ascends from love of one beautiful body, to all beautiful bodies, to beautiful souls, to beautiful knowledge, and finally to Beauty itself — the Form that makes all beautiful things beautiful",
        "Interrupts the philosophical speeches with Alcibiades' drunken confession of his love for Socrates, showing the tension between philosophical and erotic desire"
      ],
      strongestObjection: "The ladder of beauty seems to require abandoning particular people as one ascends: genuine love involves commitment to specific individuals, and a theory that treats people as rungs on a ladder to abstract Beauty looks more like a recipe for emotional detachment than a philosophy of love."
    }
  },
  {
    id: "aesthetic-essays",
    title: "Letters on the Aesthetic Education of Man",
    author: "Friedrich Schiller",
    year: 1795,
    branch: "Aesthetics",
    school: "Aesthetic Experience",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/6798",
    folder: "Aesthetics/Aesthetic Experience/Schiller",
    filename: "Schiller_AestheticEducation",
    fetchUrl: "https://www.gutenberg.org/cache/epub/6798/pg6798.txt",
    fetchType: "gutenberg",
    introduction: "Published in 1795, Schiller's Letters on the Aesthetic Education of Man argue that beauty is not a luxury but a necessity for human freedom. Writing in the aftermath of the French Revolution's descent into terror, Schiller contends that political freedom cannot be achieved through force but only through the aesthetic education of the whole person. By harmonizing our rational and sensuous natures through the 'play drive,' beauty makes genuine freedom possible.",
    argumentCard: {
      centralQuestion: "How can human beings achieve genuine political and moral freedom?",
      thesis: "Freedom cannot be achieved through political revolution alone but requires the aesthetic education of the whole person. Beauty harmonizes our two fundamental drives — the form drive (reason, order) and the sense drive (feeling, impulse) — through a third 'play drive' that makes us fully human and genuinely free.",
      keyMoves: [
        "Diagnoses the failure of the French Revolution: political freedom was attempted before people were ready for it, because modern civilization has fragmented the whole person into specialized, one-sided functions",
        "Identifies two fundamental drives: the sense drive (Stofftrieb), which demands sensory experience and change, and the form drive (Formtrieb), which demands rational order and permanence",
        "Introduces the play drive (Spieltrieb) as the synthesis: when we experience beauty, both drives are satisfied simultaneously — we are neither passively determined by sensation nor rigidly bound by duty, but freely at play",
        "Argues that beauty is 'living form' — the sensuous appearance of freedom — and that the aesthetic state is the precondition for both moral autonomy and political liberty"
      ],
      strongestObjection: "Schiller's claim that aesthetic education must precede political freedom is dangerously conservative in practice: it can be used to justify indefinitely postponing justice and equality on the grounds that 'the people are not yet ready.'"
    }
  },

  // ========================================================
  //  AESTHETICS / BEAUTY AND THE SUBLIME — ENRICHMENT
  // ========================================================
  {
    id: "sublime-and-beautiful",
    title: "A Philosophical Enquiry into the Sublime and Beautiful",
    author: "Edmund Burke",
    year: 1757,
    branch: "Aesthetics",
    school: "Beauty and the Sublime",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/15043",
    folder: "Aesthetics/Beauty and the Sublime/Burke",
    filename: "Burke_SublimeAndBeautiful",
    fetchUrl: null,
    fetchType: null,
    introduction: "Published in 1757, Edmund Burke's Philosophical Enquiry is one of the founding texts of modern aesthetics. Burke argues that beauty and sublimity are fundamentally different experiences: beauty is associated with smallness, smoothness, and social affection, while the sublime arises from terror, vastness, and the confrontation with what overwhelms us. The work profoundly influenced Romantic art and Kant's later aesthetic theory.",
    argumentCard: {
      centralQuestion: "What are the origins of our ideas of beauty and sublimity, and why do they affect us so powerfully?",
      thesis: "The sublime and the beautiful are distinct passions with different causes: the sublime originates in whatever excites ideas of pain, danger, or terror (producing the strongest emotion the mind is capable of), while beauty arises from qualities like smallness, smoothness, and delicacy that inspire love and social affection.",
      keyMoves: [
        "Distinguishes self-preservation (the source of the sublime) from social passions (the source of beauty) — terror at a safe distance produces 'delightful horror,' the hallmark of sublimity",
        "Identifies specific physical properties that cause beauty: smallness, smoothness, gradual variation, delicacy — and argues these work physiologically, not through rational judgment",
        "Argues that obscurity enhances the sublime (what we cannot fully see or comprehend terrifies and awes us more), while clarity enhances beauty",
        "Grounds aesthetic experience in bodily sensation rather than abstract ideas, making aesthetics an empirical rather than metaphysical inquiry"
      ],
      strongestObjection: "Burke's sharp separation between the sublime and the beautiful is too rigid: many aesthetic experiences blend both qualities, and his reduction of aesthetic response to physiological sensation ignores the role of culture and personal meaning."
    }
  },

  // ========================================================
  //  LOGIC / FORMAL LOGIC
  // ========================================================
  {
    id: "categories",
    title: "Categories",
    author: "Aristotle",
    year: -350,
    branch: "Logic",
    school: "Formal Logic",
    source: "MIT Internet Classics Archive",
    sourceUrl: "http://classics.mit.edu/Aristotle/categories.html",
    folder: "Logic/Formal Logic/Aristotle",
    filename: "Aristotle_Categories",
    fetchUrl: "http://classics.mit.edu/Aristotle/categories.html",
    fetchType: "mit",
    introduction: "Written around 350 BCE, the Categories is the opening work of Aristotle's logical writings (the Organon) and one of the most influential texts in the history of philosophy. Aristotle classifies everything that can be said about anything into ten fundamental categories — substance, quantity, quality, relation, and six others — establishing the basic framework for Western logic, metaphysics, and language analysis for two millennia.",
    argumentCard: {
      centralQuestion: "What are the most fundamental kinds of things that can be said about anything that exists?",
      thesis: "Everything that is said 'without combination' falls into one of ten categories, of which substance is primary: substances are the subjects of which everything else (qualities, quantities, relations) is predicated, but they themselves are not predicated of anything else.",
      keyMoves: [
        "Distinguishes things said 'with combination' (propositions like 'Socrates is wise') from things said 'without combination' (single terms like 'Socrates' or 'wise') — the Categories classifies only the latter",
        "Identifies ten categories: substance, quantity, quality, relation, place, time, position, state, action, and affection — these are the most general kinds of predication",
        "Argues that primary substance (this particular horse, this individual person) is the most fundamental reality — everything else either is said of a substance or is present in a substance",
        "Distinguishes 'said of' a subject (universal predication: 'Socrates is a man') from 'present in' a subject (inherence: 'whiteness is in Socrates') — creating the foundation for later debates about universals"
      ],
      strongestObjection: "The ten categories seem arbitrary: Aristotle provides no argument for why there should be exactly ten, and later philosophers have proposed very different lists, suggesting the categories may reflect Greek grammar rather than the structure of reality."
    }
  },
  {
    id: "on-interpretation",
    title: "On Interpretation",
    author: "Aristotle",
    year: -350,
    branch: "Logic",
    school: "Formal Logic",
    source: "MIT Internet Classics Archive",
    sourceUrl: "http://classics.mit.edu/Aristotle/interpretation.html",
    folder: "Logic/Formal Logic/Aristotle",
    filename: "Aristotle_OnInterpretation",
    fetchUrl: "http://classics.mit.edu/Aristotle/interpretation.html",
    fetchType: "mit",
    introduction: "Written around 350 BCE, On Interpretation (De Interpretatione) is Aristotle's treatise on the logic of propositions — how words combine into statements that are true or false. The work introduces the square of opposition (the logical relationships between universal and particular, affirmative and negative statements) and raises the famous 'sea-battle' problem about future contingent propositions, which remains a live issue in logic and philosophy of language.",
    argumentCard: {
      centralQuestion: "How do words combine into propositions, and can statements about the future be true or false now?",
      thesis: "A proposition is a statement that asserts or denies a predicate of a subject and is therefore either true or false. However, statements about future contingent events (like 'there will be a sea-battle tomorrow') present a special problem: if they are already true or false, then the future seems determined; but if they are neither, the law of excluded middle seems violated.",
      keyMoves: [
        "Distinguishes propositions (which are true or false) from other forms of speech (prayers, commands, questions) which are neither",
        "Maps out the logical relations between propositions: contradictories (cannot both be true or both false), contraries (cannot both be true but can both be false), and subcontraries (cannot both be false but can both be true)",
        "Introduces the sea-battle problem: 'Either there will be a sea-battle tomorrow or there will not' seems necessarily true, but if one disjunct is already true, the future is determined — threatening both contingency and free will",
        "Suggests (though scholars debate the interpretation) that future contingent propositions may be indeterminate — neither true nor false until the event occurs"
      ],
      strongestObjection: "Denying that future contingent propositions have present truth-values seems to require abandoning the law of excluded middle — one of the most fundamental principles of logic — which many logicians consider too high a price to pay."
    }
  },

  // ========================================================
  //  LOGIC / MODAL LOGIC
  // ========================================================
  {
    id: "consolation-of-philosophy",
    title: "The Consolation of Philosophy",
    author: "Boethius",
    year: 524,
    branch: "Logic",
    school: "Modal Logic",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/14328",
    folder: "Logic/Modal Logic/Boethius",
    filename: "Boethius_ConsolationOfPhilosophy",
    fetchUrl: "https://www.gutenberg.org/cache/epub/14328/pg14328.txt",
    fetchType: "gutenberg",
    introduction: "Written in 524 CE while Boethius awaited execution in prison, The Consolation of Philosophy is a dialogue between the imprisoned author and the personified figure of Lady Philosophy. Through alternating prose and verse, Philosophy consoles Boethius by leading him from despair to understanding: fortune is fickle but irrelevant to true happiness, and God's foreknowledge is compatible with human free will because God sees all of time in a single eternal present.",
    argumentCard: {
      centralQuestion: "If God foreknows everything that will happen, can human beings have free will — and where is true happiness found?",
      thesis: "True happiness is found not in fortune's gifts (wealth, power, fame) but in the Good itself, which is God. God's foreknowledge does not destroy free will because God exists outside of time: what is 'foreknowledge' from our temporal perspective is simply 'knowledge' for an eternal being who sees past, present, and future simultaneously.",
      keyMoves: [
        "Shows that fortune's wheel is inherently unstable: wealth, power, and fame can be taken away at any moment, so basing happiness on them guarantees eventual misery",
        "Argues that true happiness is self-sufficient and lies in the highest Good, which is God — all lesser goods (money, pleasure, honor) are fragments of this one perfect Good",
        "Poses the problem of divine foreknowledge: if God knows in advance what I will do, it seems I cannot do otherwise — but then rewards and punishments are unjust and prayer is pointless",
        "Resolves the problem by distinguishing temporal knowledge (which implies necessity) from eternal knowledge: God sees all events in an eternal present, the way you see someone walking — your seeing it doesn't cause or necessitate it"
      ],
      strongestObjection: "Boethius's solution may be verbal rather than real: saying God 'sees' all events eternally rather than 'foreknowing' them may change the language but not the logical problem — if what God sees is certain, the outcome is still fixed regardless of what we call it."
    }
  },

  // ========================================================
  //  LOGIC / DIALECTICS
  // ========================================================
  {
    id: "sophist",
    title: "Sophist",
    author: "Plato",
    year: -360,
    branch: "Logic",
    school: "Dialectics",
    source: "MIT Internet Classics Archive",
    sourceUrl: "http://classics.mit.edu/Plato/sophist.html",
    folder: "Logic/Dialectics/Plato",
    filename: "Plato_Sophist",
    fetchUrl: "http://classics.mit.edu/Plato/sophist.html",
    fetchType: "mit",
    introduction: "Written around 360 BCE, the Sophist is Plato's most technically demanding dialogue and a landmark in the history of logic. An unnamed Eleatic Stranger attempts to define 'the sophist' through the method of dialectical division, but the inquiry leads to a profound puzzle: how can false speech exist if falsehood means 'saying what is not'? Plato's solution — that 'not-being' is not nothingness but difference — represents a revolution in metaphysics and the philosophy of language.",
    argumentCard: {
      centralQuestion: "What is a sophist, and how is false speech possible if saying what is false means 'saying what is not'?",
      thesis: "False speech is possible because 'not-being' does not mean absolute nothingness but rather difference or otherness: to say what is not the case is to say something that is different from what is, not to speak of nothing at all. This revision of Parmenides makes falsehood, error, and the very enterprise of philosophy logically coherent.",
      keyMoves: [
        "Uses the method of division (diairesis) to progressively narrow the definition of the sophist, revealing him as an imitator who produces false appearances of wisdom",
        "Encounters a paradox: defining the sophist requires saying he 'makes false appearances,' but Parmenides showed that 'what is not' cannot be thought or spoken — so falsehood seems impossible",
        "Commits 'patricide' against Parmenides by arguing that not-being must exist in some sense: 'the different' or 'the other' is a real Form that allows us to say things are not identical to other things",
        "Shows that five 'greatest kinds' — Being, Rest, Motion, Sameness, and Difference — interweave through all discourse, making both true and false speech possible"
      ],
      strongestObjection: "Plato's solution only explains how statements can be about things that are 'other' than the facts — it may not fully explain how someone can genuinely believe what is false, which requires not just saying what is different but mistaking the different for the same."
    }
  },
  {
    id: "the-prince",
    title: "The Prince",
    author: "Niccolo Machiavelli",
    year: 1532,
    branch: "Logic",
    school: "Dialectics",
    source: "Project Gutenberg",
    sourceUrl: "https://www.gutenberg.org/ebooks/1232",
    folder: "Logic/Dialectics/Machiavelli",
    filename: "Machiavelli_ThePrince",
    fetchUrl: "https://www.gutenberg.org/cache/epub/1232/pg1232.txt",
    fetchType: "gutenberg",
    introduction: "Written in 1513 and published posthumously in 1532, The Prince is Machiavelli's handbook for acquiring and maintaining political power. Breaking decisively with the tradition of idealistic political philosophy, Machiavelli argues that effective rulers must learn 'how not to be good' — using deception, force, and calculated cruelty when necessary. The work inaugurated modern political realism and made 'Machiavellian' a byword for cunning pragmatism.",
    argumentCard: {
      centralQuestion: "How should a ruler acquire and maintain political power in a world where people are not good?",
      thesis: "A prince who wishes to maintain his state must learn how not to be good and use this knowledge as necessity dictates. Since people are 'ungrateful, fickle, liars, and deceivers,' the effective ruler must be willing to act against faith, charity, humanity, and religion when circumstances demand it.",
      keyMoves: [
        "Rejects the tradition of imagining ideal republics and insists on dealing with 'the effectual truth of the thing' — how politics actually works, not how it should work in theory",
        "Argues that it is better for a prince to be feared than loved, because love depends on the people's will but fear depends on the prince's — and fear is more reliable",
        "Uses the metaphor of the fox and the lion: the prince must combine cunning (to detect traps) with force (to frighten wolves), and must be a 'great pretender and dissembler'",
        "Claims that Fortuna (chance) controls half of human affairs, but the other half is ours to shape through virtu — decisive, adaptable, bold action"
      ],
      strongestObjection: "Machiavelli's separation of politics from morality is dangerous: by treating cruelty, deception, and the violation of promises as legitimate tools of statecraft, he provides a manual that every tyrant in history has been happy to follow."
    }
  },
];


// ==========================================================
// HELPER FUNCTIONS
// ==========================================================

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanGutenbergText(raw) {
  // Find start and end markers
  const startPatterns = [
    /\*\*\*\s*START OF (?:THE |THIS )?PROJECT GUTENBERG/i,
    /\*\*\* START OF THE PROJECT/i,
    /\*\*\*START OF/i,
  ];
  const endPatterns = [
    /\*\*\*\s*END OF (?:THE |THIS )?PROJECT GUTENBERG/i,
    /\*\*\* END OF THE PROJECT/i,
    /\*\*\*END OF/i,
    /End of (?:the )?Project Gutenberg/i,
  ];

  let text = raw;

  for (const pat of startPatterns) {
    const match = text.match(pat);
    if (match) {
      text = text.slice(text.indexOf(match[0]) + match[0].length);
      // Skip past the rest of the line
      const nlIdx = text.indexOf("\n");
      if (nlIdx !== -1) text = text.slice(nlIdx + 1);
      break;
    }
  }

  for (const pat of endPatterns) {
    const match = text.match(pat);
    if (match) {
      text = text.slice(0, text.indexOf(match[0]));
      break;
    }
  }

  // Clean up
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Rejoin lines within paragraphs (Gutenberg wraps at 72 chars)
  // A paragraph break is a blank line
  const paragraphs = text.split(/\n\s*\n/);
  const cleaned = paragraphs
    .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0)
    .join("\n\n");

  return cleaned;
}

function cleanMITClassicsHTML(html) {
  let text = html;

  // Remove scripts, styles, head
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");

  // Try to extract the main content area
  // MIT Classics typically has content in <body> after navigation tables
  const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) text = bodyMatch[1];

  // Remove navigation elements (typically in tables at top/bottom)
  text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, "");
  text = text.replace(/<hr[^>]*>/gi, "\n---\n");
  text = text.replace(/<address[^>]*>[\s\S]*?<\/address>/gi, "");

  // Convert <br> to newlines
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Convert <p> to double newlines
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<p[^>]*>/gi, "");
  // Convert headings
  text = text.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n## $1\n");
  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, " — ")
    .replace(/&ndash;/g, " - ");

  // Normalize whitespace
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  // Remove common MIT Classics footer text
  text = text.replace(/Provided by The Internet Classics Archive[\s\S]*/i, "").trim();
  text = text.replace(/------+\s*$/g, "").trim();

  return text;
}

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "PhilosApp/1.0 (educational; philosophy reader)" },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      // Try UTF-8 first, fall back to Latin-1
      let text;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      } catch {
        text = new TextDecoder("latin1").decode(buffer);
      }
      return text;
    } catch (err) {
      if (i < retries) {
        console.log(`    Retry ${i + 1} for ${url}...`);
        await sleep(2000);
      } else {
        throw err;
      }
    }
  }
}

// ==========================================================
// MAIN EXECUTION
// ==========================================================

async function main() {
  console.log("=== Philos Corpus Ingestion ===\n");
  console.log(`Library root: ${LIB}`);
  console.log(`Texts to process: ${TEXTS.length}\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  const failures = [];

  for (const t of TEXTS) {
    console.log(`\n[${t.id}] ${t.title} by ${t.author}`);
    console.log(`  → ${t.branch} / ${t.school}`);

    // Ensure directory exists
    const dir = join(LIB, t.folder);
    mkdirSync(dir, { recursive: true });

    const mdPath = join(dir, `${t.filename}.md`);
    const metaPath = join(dir, `${t.filename}.meta.json`);

    // Write .meta.json
    const meta = {
      id: t.id,
      title: t.title,
      author: t.author,
      year: t.year,
      branch: t.branch,
      school: t.school,
      source: t.source,
      sourceUrl: t.sourceUrl,
      introduction: t.introduction,
      argumentCard: t.argumentCard,
      conceptDNA: null,
      conceptHighlights: null,
      guidedPaths: null,
      debates: null,
    };
    writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    console.log(`  ✓ Wrote .meta.json`);

    // Fetch and write .md (if URL provided and file doesn't exist or is small)
    const existingMd = existsSync(mdPath);
    const existingSize = existingMd
      ? readFileSync(mdPath).length
      : 0;

    if (!t.fetchUrl && !t.fetchUrls) {
      if (existingMd) {
        console.log(`  → Skipping .md (enrichment only, file exists: ${(existingSize / 1024).toFixed(0)}KB)`);
        skipCount++;
      } else {
        console.log(`  ⚠ No fetch URL and no existing .md`);
        failCount++;
        failures.push(`${t.id}: no source URL`);
      }
      continue;
    }

    if (existingMd && existingSize > 10000) {
      console.log(`  → Skipping .md (already exists: ${(existingSize / 1024).toFixed(0)}KB)`);
      skipCount++;
      continue;
    }

    try {
      await sleep(DELAY_MS);
      let content = "";

      if (t.fetchType === "mit-multi" && t.fetchUrls) {
        // Fetch multiple pages and combine
        console.log(`  ↓ Fetching ${t.fetchUrls.length} pages from MIT Classics...`);
        const sections = [];
        for (let i = 0; i < t.fetchUrls.length; i++) {
          try {
            const raw = await fetchWithRetry(t.fetchUrls[i]);
            const cleaned = cleanMITClassicsHTML(raw);
            if (cleaned.length > 100) {
              sections.push(cleaned);
              process.stdout.write(`    Page ${i + 1}/${t.fetchUrls.length} ✓ (${cleaned.length} chars)  \n`);
            } else {
              process.stdout.write(`    Page ${i + 1}/${t.fetchUrls.length} ✗ (too short)  \n`);
            }
            await sleep(800);
          } catch (err) {
            process.stdout.write(`    Page ${i + 1}/${t.fetchUrls.length} ✗ (${err.message})  \n`);
          }
        }
        content = sections.join("\n\n---\n\n");
      } else if (t.fetchType === "mit") {
        console.log(`  ↓ Fetching from MIT Classics...`);
        const raw = await fetchWithRetry(t.fetchUrl);
        content = cleanMITClassicsHTML(raw);
      } else if (t.fetchType === "gutenberg") {
        console.log(`  ↓ Fetching from Project Gutenberg...`);
        const raw = await fetchWithRetry(t.fetchUrl);
        content = cleanGutenbergText(raw);
      }

      if (content.length < 500) {
        throw new Error(`Content too short (${content.length} chars) — likely a bad source`);
      }

      // Add title header
      const mdContent = `# ${t.title}\n\n**${t.author}**\n\n${content}`;
      writeFileSync(mdPath, mdContent);
      console.log(`  ✓ Wrote .md (${(mdContent.length / 1024).toFixed(0)}KB)`);
      successCount++;
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      failCount++;
      failures.push(`${t.id}: ${err.message}`);
    }
  }

  // ==========================================================
  // FINAL REPORT
  // ==========================================================
  console.log("\n\n========================================");
  console.log("         INGESTION REPORT");
  console.log("========================================\n");

  // Count by category
  const byCat = {};
  const bySub = {};
  for (const t of TEXTS) {
    byCat[t.branch] = (byCat[t.branch] || 0) + 1;
    const key = `${t.branch} / ${t.school}`;
    bySub[key] = (bySub[key] || 0) + 1;
  }

  console.log(`Total texts in manifest: ${TEXTS.length}`);
  console.log(`  Fetched:  ${successCount}`);
  console.log(`  Skipped:  ${skipCount} (existing files)`);
  console.log(`  Failed:   ${failCount}\n`);

  console.log("BY CATEGORY:");
  for (const [cat, count] of Object.entries(byCat).sort()) {
    console.log(`  ${cat}: ${count}`);
  }

  console.log("\nBY SUBCATEGORY:");
  for (const [sub, count] of Object.entries(bySub).sort()) {
    console.log(`  ${sub}: ${count}`);
  }

  if (failures.length > 0) {
    console.log("\nFAILURES:");
    for (const f of failures) {
      console.log(`  ✗ ${f}`);
    }
  }

  console.log("\n========================================\n");
}

main().catch(console.error);
