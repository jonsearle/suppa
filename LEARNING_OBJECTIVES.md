# Learning Objectives — Suppa Portfolio Project

**Goal:** Upskill to AI Product Manager role by building a real LLM product and documenting the learning journey.

**Philosophy:** Learning happens through building, not theory. Each objective is demonstrated through the Suppa implementation, with evidence captured in LEARNING_LOG.md.

---

## **Learning Objectives**

### **1. Prompt Engineering for Product**

**What I'm learning:**
- How to iterate on LLM prompts for product features
- Testing prompt variations and measuring quality
- Understanding context windows, instruction clarity, output formatting
- When to use structured prompts vs. natural language

**How I'll demonstrate it:**
- Meal suggestion prompt: iterate until suggestions feel diverse and relevant
- Inventory parsing prompt: test accuracy on various user inputs
- Recipe modification prompt: ensure context is clear and modifications work correctly
- Document prompt iterations in LEARNING_LOG

**When:** Iteration 1 (Days 5-7)

---

### **2. LLM Evaluation & Testing**

**What I'm learning:**
- How to spot-test LLM outputs for quality and relevance
- Identifying hallucinations, false suggestions, edge cases
- Creating evaluation criteria that match product goals (not just technical metrics)
- Building confidence in whether an LLM feature actually works

**How I'll demonstrate it:**
- Test meal suggestions against actual inventory (do they use only available items?)
- Test inventory parsing on messy user inputs
- Document evaluation approach and findings in LEARNING_LOG
- Build case for when LLM output is good enough vs. needs refinement

**When:** Iteration 1 (Days 5-10), ongoing

---

### **3. AI-Aware Product Design**

**What I'm learning:**
- Recognizing which product problems are right for AI (and which aren't)
- Designing UX that accounts for LLM latency, uncertainty, and edge cases
- Building user feedback loops so product improves over time
- Understanding AI-specific constraints and designing around them

**How I'll demonstrate it:**
- Design for meal suggestion latency (loading states, "Updating..." indicators)
- Handle recipe modifications gracefully (show what changed, allow user to cancel)
- Design inventory deduction flow (acknowledge user might have more than recorded)
- Document design decisions and rationale in spec and LEARNING_LOG

**When:** Iteration 1 (Days 1-3, ongoing)

---

### **4. Data Literacy in AI Context**

**What I'm learning:**
- What data does an LLM need to work well? (inventory, conversation context, recipe state)
- How data quality affects LLM output (what if inventory is incomplete? outdated?)
- Designing data flows that feed the AI loop
- Understanding where data breaks and how to handle it

**How I'll demonstrate it:**
- Design inventory data structure (items, quantities, units, timestamps)
- Identify context windows: what data does the LLM need for good suggestions?
- Test how incomplete inventory affects suggestion quality
- Document data assumptions and edge cases in LEARNING_LOG

**When:** Iteration 1 (Days 1-4)

---

### **5. Strategic/Systems Thinking**

**What I'm learning:**
- Designing feedback loops where user actions improve future suggestions
- Understanding ripple effects (inventory update → better suggestions → more cooking → fresher inventory)
- Thinking across domains: UX, data pipeline, LLM behavior, business goals
- Building systems that compound value over time

**How I'll demonstrate it:**
- Design the core loop: cook meal → deduct inventory → suggestions adapt → suggest different meals
- Identify how the system gets better with use (not static)
- Document the strategic vision in spec and LEARNING_LOG
- Plan Phase 1 enhancements (receipts, preferences, shopping) based on Iteration 1 learnings

**When:** Iteration 1 (spec + ongoing), Phase 1 planning

---

### **6. Communication & Documentation**

**What I'm learning:**
- Articulating *why* AI-specific design choices matter (not just what was built)
- Writing specs that explain LLM integration, constraints, edge cases
- Documenting the build journey so non-technical stakeholders understand decisions
- Creating portfolio artifacts that show thinking, not just code

**How I'll demonstrate it:**
- Write detailed spec covering LLM strategy, prompts, evaluation criteria
- Maintain LEARNING_LOG with insights, decisions, failures
- Commit design docs explaining AI-specific patterns
- Create a "build journey" narrative that explains the thinking

**When:** Throughout (spec, LEARNING_LOG, design docs)

---

### **7. Agent Design & Orchestration** ⭐

**What I'm learning:**
- When and why to decompose an AI system into multiple agents
- How agents communicate and pass context
- Testing agent behavior and orchestration logic
- Trade-offs: single model vs. specialized agents, complexity vs. capability

**How I'll demonstrate it:**
- **Iteration 1:** Build with a single LLM model, document why this works and where agents would help
- **Phase 1:** Refactor to use specialized agents:
  - **Inventory Agent:** Parses user input, extracts items and quantities
  - **Suggestion Agent:** Proposes meals from inventory
  - **Cooking Agent:** Handles recipe modifications mid-cooking
  - **Context Agent:** Manages conversation history and session boundaries
- Document agent design decisions in spec
- Log learnings about agent orchestration in LEARNING_LOG
- Plan agent testing strategy (what makes a good agent? how do you test orchestration?)

**When:** Phase 1 design (days 11-14), implementation (Phase 1 weeks 3-4)

---

## **Portfolio Evidence**

By the end of Suppa (Iteration 1 + Phase 1):

✅ **Code:** Working AI product with LLM integration
✅ **Specs:** Detailed design docs explaining AI-specific choices
✅ **LEARNING_LOG.md:** 20+ entries documenting discoveries, failures, insights
✅ **Commit history:** Clear progression showing iteration on prompts, evaluation, design
✅ **Agent documentation:** Design decisions for Phase 1 agent architecture
✅ **Narrative:** Clear story of "here's what I learned about AI product management"

This isn't just a shipping artifact — it's *evidence of learning* that demonstrates AI PM skills.

---

## **Success Criteria**

### Iteration 1:
- [ ] All 6 core objectives demonstrated (except agents, which come in Phase 1)
- [ ] LEARNING_LOG has 10+ entries with concrete insights
- [ ] Spec documents AI-specific design decisions clearly
- [ ] Product is usable and you discover meals you wouldn't have thought of

### Phase 1:
- [ ] Agent design documented and implemented
- [ ] Orchestration between agents working and tested
- [ ] LEARNING_LOG captures agent learnings
- [ ] Clear narrative: "Here's how I went from single-model to multi-agent architecture"

---

## **Reflection Schedule**

- **Daily (5 mins):** Note down surprises, blockers, aha moments
- **End of feature (30 mins):** Write LEARNING_LOG entry with structured insights
- **End of Iteration 1 (1 hour):** Reflection on what surprised you, what you'd do differently
- **Phase 1 planning (1 hour):** Review Iteration 1 learnings, plan how agents improve the system
