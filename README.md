# grammY Calendar Keyboard

A customizable calendar keyboard plugin for [grammY](https://grammy.dev/) Telegram bots. This plugin allows you to easily create interactive calendar keyboards for date selection in your Telegram bot conversations.

## Features

- 📅 Interactive calendar interface
- 🎨 Customizable appearance and behavior
- 🌐 Multi-language support
- 📱 Mobile-friendly inline keyboards
- ⚡ Built specifically for grammY framework
- 🔧 TypeScript support with full type definitions

## Installation

### For Deno

```typescript
import { CalendarKeyboard } from "https://deno.land/x/grammy_calendar_keyboard/mod.ts";
```

### For Node.js

```bash
npm install grammy_calendar_keyboard
```

```typescript
import { CalendarKeyboard } from "grammy_calendar_keyboard";
```

## Quick Start

```typescript
import { Bot } from "grammy";
import { CalendarKeyboard } from "grammy_calendar_keyboard";

const bot = new Bot("YOUR_BOT_TOKEN");

// Create a calendar keyboard instance
const calendar = new CalendarKeyboard();

// Handle the /calendar command
bot.command("calendar", (ctx) => {
  return ctx.reply("Please select a date:", {
    reply_markup: calendar.createKeyboard(),
  });
});

// Handle calendar interactions
bot.use(calendar.middleware());

bot.start();
```

## API Reference

### CalendarKeyboard

The main class for creating calendar keyboards.

#### Constructor Options

```typescript
interface CalendarOptions {
  // Calendar appearance options
  monthNames?: string[];
  weekDayNames?: string[];
  
  // Behavior options
  minDate?: Date;
  maxDate?: Date;
  
  // Styling options
  navigationButtons?: {
    prev: string;
    next: string;
  };
}
```

#### Methods

- `createKeyboard(date?: Date)` - Creates a calendar keyboard for the specified month
- `middleware()` - Returns grammY middleware for handling calendar interactions
- `onDateSelect(callback)` - Registers a callback for date selection events

## Examples

### Basic Usage

```typescript
import { Bot } from "grammy";
import { CalendarKeyboard } from "grammy_calendar_keyboard";

const bot = new Bot("YOUR_BOT_TOKEN");
const calendar = new CalendarKeyboard();

bot.command("schedule", (ctx) => {
  return ctx.reply("When would you like to schedule this?", {
    reply_markup: calendar.createKeyboard(),
  });
});

calendar.onDateSelect((ctx, date) => {
  return ctx.editMessageText(`You selected: ${date.toDateString()}`);
});

bot.use(calendar.middleware());
bot.start();
```

### Custom Configuration

```typescript
const calendar = new CalendarKeyboard({
  monthNames: ["Jan", "Feb", "Mar", /* ... */],
  weekDayNames: ["S", "M", "T", "W", "T", "F", "S"],
  minDate: new Date(),
  maxDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // One year from now
  navigationButtons: {
    prev: "⬅️",
    next: "➡️"
  }
});
```

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository
2. Install Deno
3. Run tests: `deno task test`
4. Format code: `deno fmt`
5. Check linting: `deno lint`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/KnightNiwrem/grammy_calendar_keyboard#readme)
- 🐛 [Report Issues](https://github.com/KnightNiwrem/grammy_calendar_keyboard/issues)
- 💬 [grammY Community](https://grammy.dev/guide/introduction.html)

## Related Projects

- [grammY](https://grammy.dev/) - The main grammY framework
- [grammY plugins](https://grammy.dev/plugins/) - Official grammY plugins