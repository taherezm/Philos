#  Philos: Philosophy Made Intuitive

**Philos** is an AI-powered reading companion designed to make the dense, archaic texts of the philosophical canon accessible to everyday readers, lifelong learners, and students without dumbing down the original arguments.

Built for the **CBC @ IU Claude Hackathon — Track 5: Creative Flourishing**.

---

##  The Problem
Philosophy is humanity's oldest framework for finding meaning and understanding our world. However, the cultural preservation of these great ideas is failing because reading them is isolating and inherently difficult. Readers are often locked out by impenetrable jargon, losing the opportunity to engage with transformative ideas.

##  The Solution (Context-Aware De-jargoning)
Philos doesn't just overlay an AI chatbot on top of a text. Our core innovation is a **Context-Aware De-jargon Engine**. 

When a user highlights a confusing passage, Philos doesn't just read the isolated sentence. It programmatically resolves the selection back into the structure of the source essay, assembling a "context bundle" (including nearby paragraphs, the essay's central thesis, and key argumentative moves) before querying the model. 

The AI acts as a careful guide, explaining the highlighted text as part of a *live argument* rather than a floating sentence.

##  Key Features
* **Layered De-jargoning:** Choose your depth. Explanations are provided in 'Plain', 'Conceptual', or 'Scholarly' depths to match the reader's current understanding.
* **"So What?" Engine:** Instantly bridges the gap between ancient texts and modern life by providing concrete, contemporary examples of why an idea still matters today.
* **Debate Prep:** Prepares the reader to actively argue the philosophical concept by breaking down the core thesis, strongest defenses, and best counterarguments.
* **Study Mode:** Users can paste in external texts to instantly generate structured study packages (Summaries, Argument Structures, and Critical Questions).
* **Custom Personas:** Switch between "Coffee Shop" (warm, casual analogies) and "Office Hours" (structured, academic context) explanation tones.

##  Ethical Alignment
Philos was built with deep consideration for the ethical risks of AI in education:
1.  **Anti-Flattening:** We designed the system to preserve the integrity of the original thinker. We explicitly prompt the AI to avoid turning philosophy into generic self-help or vague paraphrase.
2.  **Empowerment over Replacement:** Philos is designed to enhance critical thinking, not replace it. By providing context and structured breakdowns, we give the user the tools to interpret the text themselves, keeping the human firmly in the driver's seat.

##  Technical Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **AI Integration:** Anthropic Claude API (`claude-3-5-sonnet-20240620`)
* **Architecture:** Context-aware prompt engineering, dynamic text resolution, and custom JSON schema enforcement.

## 🛠️ How to Run Locally

1. Clone the repository:
   ```bash
   git clone [https://github.com/hbilici-droid/Philos.git](https://github.com/hbilici-droid/Philos.git)

   
