# AI Chat Demo

A production-quality AI chat application demonstrating **streaming responses**, **robust UX states**, and **accessible React architecture**.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue?style=for-the-badge)](https://ashwannasleep.github.io/AI-chat-demo/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/ashwannasleep/AI-chat-demo)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## Overview

This project demonstrates how to build a modern AI chat UI that remains predictable and usable under real-world conditions:

explicit empty / loading / error / retry states

clear user control during async requests

message-level recovery instead of global failure

accessibility-first interaction design

The default experience runs in Demo (local) mode with instant replies.
Smart (API) mode is optional and clearly surfaces configuration errors.

## Architecture (High-level)

React frontend models a full message lifecycle (id, role, content, status)

Centralized chat state coordinates async actions, retries, and feedback

Demo transport returns structured UX-review templates for common flows

Express backend proxies OpenAI requests when configured and fails loudly when not

## Frontend highlights

UX-focused system prompt keeps responses concise, structured, and actionable

Demo replies use tailored templates (checkout, search, onboarding, chat, forms), each including:

summary

UX recommendations

microcopy suggestion

suggested the next step to guide follow-ups

Example chips and quick actions reduce typing and maintain flow

Status bar and toasts separate app state from transient feedback

Retry appears only on the most recent failed assistant message

## Backend

POST /api/chat calls OpenAI only when OPENAI_API_KEY is set

Returns 401 { error: "OpenAI API key not configured" } when missing

Static serving is production-only; local dev uses a Vite proxy

## Why this project

Most chat demos only show the happy path.
This project focuses on how UI behaves when things go wrong — misconfiguration, failed requests, and recovery — and how to communicate those states clearly without misleading the user.

The emphasis is on engineering judgment and UX state modeling, not feature count.

## Final note

This demo is designed to be:

easy to try (no setup required)

honest about failure

readable in under a minute

That restraint is intentional.
