# Nexi - MCP Builder & AI Integration Platform

## Overview

Nexi is a platform that allows businesses (starting with hotels) to expose their existing backend APIs as MCP (Model Context Protocol) endpoints that AI agents can call. The platform provides a visual, interactive interface (like a canvas) for creating and managing MCP tools, making it easy to connect AI agents (e.g., ChatGPT Custom GPTs) to backend systems without coding.

### Key Goals

* Provide a no-code/low-code interface for creating MCP tools.
* Allow AI agents to query hotel systems or other booking platforms directly.
* Ensure trust, security, and reliability for AI-driven bookings or actions.
* Make the solution hackathon-ready with a working demo using ChatGPT and MCP.

## Core Features

* **MCP Adapter:** A backend server that exposes MCP `/tools` metadata and handles tool invocations.
* **Canvas UI:** Drag-and-drop interface for creating MCP tools, mapping them to backend endpoints.
* **Supabase Database:** Stores tool configurations, hotel/API data, and logs.
* **Custom GPT Integration:** Connects the MCP endpoint to a Custom GPT in ChatGPT for demo purposes.
* **Sandbox Mode:** Demo environment for bookings with no real payments.

## Suggested Architecture

```
[User / Hotel Admin]
       |
       v
[Canvas UI / Frontend (Next.js)]
       |
       v
[Supabase (DB for tools, configs, logs)]
       |
       v
[MCP Adapter (Next.js API Routes / Node.js server)]
       |
       v
[Hotel Backend API / PMS]
       |
       v
[Optional: Stripe Sandbox / Payment]
       |
       v
[ChatGPT Custom GPT / AI Agents]
```

### Components

1. **Frontend (Next.js)**

   * Canvas-based UI for MCP creation (drag-and-drop similar to n8n).
   * Forms for endpoint mapping, authentication, parameters.
   * Preview and test tool invocations.

2. **Backend (Next.js API routes)**

   * Expose `/tools` endpoint returning MCP metadata.
   * Accept `/call_tool` requests and map to hotel backend endpoints.
   * Handle authentication, logging, and error handling.

3. **Database (Supabase)**

   * Store MCP tool configurations.
   * Log agent calls and responses.
   * Store demo user info, sandbox bookings, and sample credentials.

4. **Integration with AI Agents**

   * Custom GPT in ChatGPT calls the MCP Adapter.
   * MCP adapter returns structured JSON responses from the hotel backend.

## Implementation Plan (Hackathon MVP)

**Phase 1: Setup (0–3 hours)**

* Scaffold Next.js project with Supabase integration.
* Prepare a demo hotel backend with endpoints: `/availability`, `/book`, `/rooms/:id`.
* Setup Supabase tables: `tools`, `logs`, `bookings`.

**Phase 2: Backend MCP Adapter (3–6 hours)**

* Implement `/tools` returning metadata for MCP tools.
* Implement `/call_tool` endpoint mapping to hotel backend.
* Include basic input validation and error handling.

**Phase 3: Canvas UI (6–10 hours)**

* Build drag-and-drop UI to create tools and map endpoints.
* Allow setting parameters, authentication, and tool metadata.
* Add preview/test tool invocation feature.

**Phase 4: Custom GPT Integration (10–12 hours)**

* Create a Custom GPT in ChatGPT connected to your MCP adapter.
* Test end-to-end flow: availability query → booking → confirmation.
* Show logs and signed booking proofs for the demo.

**Phase 5: Polishing & Demo (12–14 hours)**

* Add sandbox payments or mock payment logic.
* Highlight security features and audit logs.
* Prepare a short 2–3 minute demo flow.

## Security & Reliability Measures

* API key authentication between ChatGPT / AI agent and MCP adapter.
* Two-phase booking (reserve → confirm) to avoid double bookings.
* Signed JWT receipts for verification.
* Human fallback for high-value or ambiguous bookings.
* Logging all agent interactions and actions for audit.

## Notes

* Focus on hackathon MVP: core functionality over fancy UI features.
* The canvas UI can be simplified for MVP but demonstrate drag-and-drop creation.
* Use Supabase for fast prototyping and real-time updates.
* Custom GPT demo will showcase end-to-end capability: AI agent interacts with MCP tools to query and book.

## Next Steps

* Implement backend MCP adapter routes.
* Design canvas UI for creating and testing MCP tools.
* Deploy MCP adapter and connect to demo Custom GPT.
* Populate Supabase with sample hotel data and logs.
* Prepare demo script showing interactive AI agent booking via Nexi.
