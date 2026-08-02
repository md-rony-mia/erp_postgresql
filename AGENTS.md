# Custom Instructions for AI Coding Agent

This file contains persistent rules, coding conventions, and instructions that the AI Agent will read and follow first on every turn. Feel free to edit this file to add or modify rules.

## Core Rules & Persona
- Always respond in Bengali (unless requested otherwise).
- Maintain the current high-contrast dashboard aesthetic (Tailwind based).
- Double-check typescript compilation via `npm run lint` or `tsc --noEmit` before finishing any task.
- **Testing Rule**: Whenever `src/lib/dataClient.ts` or `src/components/Login.tsx` core logic changes, the corresponding test file (`src/test/dataClient.test.ts` or `src/test/login.test.tsx`) must be updated in the same commit, and `npx vitest run` must be run before considering any task complete — not just `tsc` or `vite build`.
- **GitHub Push Rule**: নতুন কোনো আপডেট/কোড পরিবর্তন শেষ করার পর, সরাসরি পুশ না করে অবশ্যই ইউজারের কাছে পারমিশন চাইতে হবে এবং গিটহাব টোকেন (token) চাইতে হবে। নতুন একটি ব্রাঞ্চ (new branch) তৈরি করে সেই ব্রাঞ্চে কোড পুশ করতে হবে।

## Project Guidelines
- **Framework & Libraries**: React 19, Tailwind CSS v4, Lucide React, and Framer Motion (`motion/react`).
- **Layout & Responsiveness**: Ensure that print layouts are safely contained and styled for paper sizing without overflowing, just like the custom media print style implemented for Sales/Invoice view.


প্রতিটা নতুন সেশন/কাজ শুরুর আগে বাধ্যতামূলক অডিট নিয়ম:
কোনো কোড পরিবর্তন, ফিচার ডেভেলপমেন্ট, বাগ ফিক্স বা সাজেশন দেওয়ার আগে, প্রতিবার নিচের ধাপগুলো অনুসরণ করো — চাই আগের সেশনের memory/context যাই বলুক না কেন, কারণ repo আমার অজান্তেই আপডেট হতে পারে:

Fresh clone নাও: git clone https://github.com/md-rony-mia/ERP-System.git দিয়ে সবসময় GitHub থেকে সরাসরি সর্বশেষ কোড নিয়ে এখানে update করে নাও — কখনো পুরনো memory/summary কে সত্য ধরে নিয়ে কাজ শুরু কোরো না।
রিসেন্ট পরিবর্তন যাচাই করো


