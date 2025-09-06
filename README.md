# grammY Calendar Middleware

A middleware plugin for [grammY](https://grammy.dev/) that attaches a `calendar` helper to `ctx` for managing and rendering calendar keyboards. Data is persisted through any storage adapter implementing grammY's `StorageAdapter`.

## Features

- 🗃 Pluggable storage via `StorageAdapter`
- ⚙️ `ctx.calendar.get` and `ctx.calendar.set` for retrieving and saving calendars
- 📅 Calendar instances expose navigation helpers and a `render` method returning an inline keyboard

## Installation

### Deno

```ts
import { calendarMiddleware } from "https://deno.land/x/grammy_calendar_keyboard/mod.ts";
```

### Node.js

```bash
npm install grammy_calendar_keyboard
```

```ts
import { calendarMiddleware } from "grammy_calendar_keyboard";
```

## Quick Start

```ts
import { Bot } from "grammy";
import { Calendar, calendarMiddleware } from "grammy_calendar_keyboard";
import { myAdapter } from "./adapter.ts"; // user-provided StorageAdapter

const bot = new Bot("YOUR_BOT_TOKEN");
bot.use(calendarMiddleware({ storage: myAdapter }));

bot.command("pick", async (ctx) => {
  let cal = await ctx.calendar.get("demo");
  if (!cal) cal = new Calendar();

  await ctx.reply("Choose a date", {
    reply_markup: cal.render(),
  });

  await ctx.calendar.set("demo", cal);
});

bot.start();
```

## API

### `ctx.calendar`

Control panel for calendar instances.

- `get(key: string): Promise<Calendar | undefined>`
- `set(key: string, calendar: Calendar): Promise<void>`

### `Calendar` object

Represents calendar state.

- Helpers for navigating months and selecting days
- `render(): InlineKeyboardMarkup` – renders an inline keyboard that looks like a monthly calendar

## Development

1. Clone the repository
2. Install Deno
3. Run tests: `deno task test`
4. Format code: `deno fmt`
5. Check linting: `deno lint`

## License

MIT © [Contributors](LICENSE)
