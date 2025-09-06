# Product Requirements Document: grammY Calendar Middleware

## Overview

This project provides a middleware plugin for [grammy](https://grammy.dev/), the Telegram bot framework. The plugin adds calendar management capabilities to a bot by attaching a `calendar` helper to the context (`ctx`) object. This helper acts as a control panel for retrieving and persisting calendar instances through a storage adapter compatible with the `StorageAdapter` defined in the public `grammyjs/grammy` repository. Each calendar instance exposes methods for manipulating and rendering calendar state.

## Goals

- Allow bots built with grammY to render an inline calendar keyboard for a given month.
- Support persistent calendar data through a pluggable storage layer.
- Offer a simple API (`get`, `set`) available from `ctx.calendar` for managing multiple calendar instances.
- Provide a calendar object with methods for manipulating and rendering calendar state, including `render`.

## Non‑Goals

- Implement a full scheduling or event management system.
- Provide storage implementations; users supply their own adapter that meets the `StorageAdapter` interface.
- Handle timezone conversions or localization beyond what is provided by the caller.

## User Stories

1. **Bot developer** wants to display an interactive calendar so that users can pick dates from inline keyboard buttons.
2. **Bot developer** wants to persist the calendar state across updates using an existing storage adapter.
3. **Bot developer** wants an easy API to access and update calendar data inside middleware handlers.

## Functional Requirements

### Middleware

- Exposes a factory to create the calendar middleware. The middleware accepts a storage adapter.
- On execution, the middleware installs a `calendar` object onto `ctx`.

### `ctx.calendar` API

- `get(key: string)` – retrieves a calendar object from storage using the supplied key.
- `set(key: string, calendar: Calendar)` – saves the provided calendar object using the storage adapter.

### Calendar Object

- Encapsulates state such as current month, selected date, and navigation context.
- Provides manipulation helpers (e.g., move to next/previous month, select a day).
- Exposes a `render` method that returns an `InlineKeyboardMarkup` whose buttons form a calendar for the specified month.

## UX Requirements

- Rendered inline keyboard resembles a standard monthly calendar with weekday headers and selectable date buttons.
- Navigation buttons allow moving to previous or next months.
- Non‑interactive days (e.g., outside `minDate`/`maxDate`) should appear disabled.

## Performance Considerations

- Middleware should be lightweight and not significantly increase update handling time.
- Storage operations should be asynchronous to avoid blocking the event loop.

## Milestones

1. **Storage integration** – accept any `StorageAdapter` and persist calendar objects.
2. **Context helper** – provide `ctx.calendar` with `get` and `set` methods.
3. **Calendar rendering** – generate inline keyboard layouts for monthly calendars.
4. **Manipulation methods** – support navigation and selection on calendar objects.

## Open Questions

- Should the plugin include helper functions for common storage adapters (e.g., memory, Redis)?
- What hooks or events should be exposed for extending calendar behavior?
