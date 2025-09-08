# Architecture

This document describes the internal design of the **grammY Calendar Keyboard**
plugin and explains how it is used from a bot built with
[grammY](https://grammy.dev/).

## Overview

The plugin provides calendar management as a middleware. When installed on a
bot, it injects a `calendar` helper on the grammY context (`ctx`). This helper
allows handlers to retrieve and store `Calendar` instances whose state is
persisted via a user supplied `StorageAdapter`. Each `Calendar` can render an
inline keyboard that represents a monthly calendar.

## Middleware Installation

```ts
import { Bot } from "grammy";
import { calendarMiddleware } from "grammy_calendar_keyboard";
import { adapter } from "./adapter.ts"; // implements StorageAdapter

const bot = new Bot("TOKEN");
bot.use(calendarMiddleware({ storage: adapter }));
```

The middleware is a factory function. The storage adapter is required so that
the plugin can persist calendar state across updates.

## `ctx.calendar` Helper

Inside handlers `ctx.calendar` acts as a control panel for stored calendars:

- `get(key: string): Promise<Calendar | undefined>` – loads a calendar from the
  adapter. When a stored calendar state is found, the plugin rehydrates it into
  a `Calendar` instance.
- `set(key: string, cal: Calendar): Promise<void>` – serializes the calendar to
  plain data and asks the adapter to persist it.

If `get` returns `undefined`, a new `Calendar` can be created and persisted via
the same control panel:

```ts
let cal = await ctx.calendar.get(key);
if (!cal) {
  cal = new Calendar();
  await ctx.calendar.set(key, cal);
}
```

The helper enables bots to manage multiple calendars keyed by any string. The
middleware itself holds no global state.

## `Calendar` Object

A `Calendar` instance encapsulates all information required to render a calendar
keyboard and to navigate between months or select dates. Important members
include:

- `render(): InlineKeyboardMarkup` – produces an inline keyboard representing
  the current month. Navigation buttons are included so users can move between
  months.
- navigation helpers such as `nextMonth()` and `previousMonth()`.
- `toState()` – converts the calendar into a JSON serializable `CalendarState`.
- `static fromState(state: CalendarState): Calendar` – restores an instance from
  stored state.

## Storage Adapter

The plugin relies on grammY's `StorageAdapter` contract. Any implementation may
be supplied by the application. The adapter must provide asynchronous `get` and
`set` methods that operate on plain JSON data. This makes the plugin agnostic to
storage backends such as in memory, Redis, or databases.

## Data Flow

1. A handler requests a calendar: `const cal = await ctx.calendar.get(key)`.
2. If a calendar was previously stored, the adapter returns its serialized
   `CalendarState`; otherwise `undefined` is returned and a new `Calendar` should
   be instantiated before continuing.
3. The handler manipulates the calendar, possibly changing the month or selected
   date, and renders it with `cal.render()`.
4. The updated calendar is saved using `await ctx.calendar.set(key, cal)` so the
   state survives later updates.

## Environment Support

The source is written in TypeScript for Deno. A build step (`deno2node`) emits
Node.js compatible JavaScript in `dist/`. Published packages therefore support
both Deno and Node runtimes.

## Behavior Summary

- Middleware is lightweight and only attaches helpers on the context.
- Calendars are serializable and rehydratable, keeping plugin logic purely in
  user land.
- Rendering returns an `InlineKeyboardMarkup` that resembles a traditional
  calendar with weekday headings, navigation buttons, and day cells.
- Asynchronous storage operations keep the bot's event loop unblocked.
