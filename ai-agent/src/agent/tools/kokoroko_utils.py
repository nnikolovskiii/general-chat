from pathlib import Path
from openai import OpenAI

client = OpenAI(base_url="https://api.deepinfra.com/v1/openai",
                api_key="sPxZ1R0AloKPqDOHYHMiBFRrMCKIYJgN")

input = """Of course. Based on the context of your previous questions about CEO liability, here is a detailed guide on how to find the right legal professional in North Macedonia and communicate your specific situation effectively.
1. The Best Type of Legal Professional to Consult
You don't need just any lawyer; you need a specialist. In North Macedonia, the legal professional you are looking for is an "Advokat" (Адвокат) who specializes in Corporate and Commercial Law (друштвено и трговско право).
Here’s why this specialization is crucial for your situation:
Corporate Law Expertise: They are experts in the Law on Trade Companies (Закон за трговските друштва), which governs company formation, management structures, and the duties and liabilities of directors and CEOs. This is the core of your problem.
Contract Law Expertise: A key part of your solution will be drafting legally sound documents. This lawyer can create a Management Agreement or amend the company's Articles of Association to clearly define your role, limit your authority (and thus, your liability), and outline your friend's operational responsibilities.
Understanding of Liability: They will be able to give you a precise, non-theoretical assessment of your personal risks regarding financial mismanagement, tax obligations, and other statutory duties you cannot delegate, even with an agreement.
How to find one:
Referrals: If you have any business contacts in North Macedonia, ask for a referral to a reputable corporate law firm.
Bar Association: The Macedonian Bar Association (Адвокатска комора на Република Северна Македонија) is the official regulatory body. While they may not recommend specific lawyers, their directory can be a starting point.
International Business Chambers: Organizations like the American Chamber of Commerce in North Macedonia (AmCham) often have member directories that include top-tier law firms a member could consult.
2. How to Effectively Communicate Your Situation
To make your consultation efficient and get the most valuable advice, you need to prepare. Your goal is to clearly explain the unique arrangement and your specific concerns.
Step 1: Prepare a Clear, One-Paragraph Summary
Start the meeting or email with a concise summary. This immediately frames the issue for the lawyer.
Example: "I have been asked to serve as the CEO of a new Limited Liability Company (DOO) being established in North Macedonia. However, my friend, the founder, will be managing all day-to-day operations, finances, and team leadership. My primary concern is understanding and legally limiting my personal liability, given that I will not be involved in the daily running of the business."
Step 2: Create a "Roles & Responsibilities" Document
Before the meeting, outline the proposed division of labor as you understand it. A simple table is very effective. This moves the conversation from abstract to concrete.
| Area of Responsibility | My Proposed Role (CEO) | My Friend's Role (Operational Lead) |
| :--- | :--- | :--- |
| Strategy & Vision | High-level approval | Proposing and developing strategy |
| Financial Management | Reviewing quarterly reports | Day-to-day bookkeeping, budgeting, payments |
| Legal & Compliance | Ensuring a compliance system is in place | Implementing compliance (tax, labor, etc.) |
| Hiring & Firing | Final approval on key hires | All other hiring, team management |
| Banking | Co-signatory on the bank account | Primary authority for transactions |
Step 3: List Your Specific Questions and Fears
Write down exactly what you're worried about. This ensures you don't forget anything and focuses the lawyer on your priorities.
What are the absolute legal duties of a CEO that I cannot delegate?
What specific legal document(s) can we create to protect me? (e.g., Management Agreement, special clauses in the company statute).
If my friend mismanages funds or fails to pay taxes, can I still be held personally liable despite our agreement?
What happens in a worst-case scenario, like bankruptcy or a major lawsuit? What does my liability look like?
What should my process be for overseeing the company's health without getting involved in daily operations? (e.g., specific monthly reports I should demand).
The Goal of Your First Consultation:
You should walk away from this meeting with:
A clear understanding of your legal risks in this specific scenario.
A concrete plan of action, including the specific legal documents the lawyer recommends drafting.
A fee proposal for the lawyer to execute that plan.
By being prepared, you demonstrate seriousness and allow the lawyer to provide you with tailored, actionable advice far more effectively than if you were to just explain the situation verbally. This investment in legal counsel is the single most important step to protect yourself."""

speech_file_path = "/home/nnikolovskii/dev/general-chat/ai-agent/src/agent/tools/speech.mp3"
with client.audio.speech.with_streaming_response.create(
  model="hexgrad/Kokoro-82M",
  voice="af_bella",
  input=input,
  response_format="mp3",
) as response:
  response.stream_to_file(speech_file_path)
