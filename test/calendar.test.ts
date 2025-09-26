import { beforeEach, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { Calendar } from "../src/calendar.ts";
import type { InlineKeyboardMarkup } from "../src/deps.deno.ts";

type KeyboardButton = InlineKeyboardMarkup["inline_keyboard"][number][number];
type CallbackButton = Extract<KeyboardButton, { callback_data: string }>;
type CallbackRow = [CallbackButton];

const isCallbackButton = (button: KeyboardButton | undefined): button is CallbackButton => {
    return !!button && typeof (button as CallbackButton).callback_data === "string";
};

const flattenButtons = (markup: ReturnType<Calendar["getMonthView"]>) => {
    return markup.inline_keyboard.flat();
};

describe("Calendar views", () => {
    let calendar: Calendar;

    beforeEach(() => {
        calendar = new Calendar({ defaultLabel: "★" });
    });

    it("generates month view with navigation and marked days", () => {
        const markDate = new Date(2024, 0, 10, 9, 30);
        calendar.mark({ date: markDate, label: "★", reason: "Morning meeting" });

        const markup = calendar.getMonthView(new Date(2024, 0, 1));
        const buttons = flattenButtons(markup);

        const prevButton = buttons.find((button): button is CallbackButton =>
            isCallbackButton(button) && button.text === "◀️"
        );
        expect(prevButton?.callback_data).toBe("calendar:month:2023-12");

        const nextButton = buttons.find((button): button is CallbackButton =>
            isCallbackButton(button) && button.text === "▶️"
        );
        expect(nextButton?.callback_data).toBe("calendar:month:2024-02");

        const dayButton = buttons.find((button): button is CallbackButton =>
            isCallbackButton(button) && button.callback_data === "calendar:day:2024-01-10"
        );
        expect(dayButton).toBeDefined();
        expect(dayButton?.text).toContain("★");
        expect(dayButton?.text).toContain("10");
    });

    it("renders day view details for marked dates", () => {
        const markDate = new Date(2024, 0, 10, 9, 30);
        calendar.mark({ date: markDate, label: "★", reason: "Morning meeting" });

        const markup = calendar.getDayView(new Date(2024, 0, 10));
        const rows = markup.inline_keyboard;

        const prevDayButton = isCallbackButton(rows[0][0]) ? rows[0][0] : undefined;
        const nextDayButton = isCallbackButton(rows[0][2]) ? rows[0][2] : undefined;

        expect(prevDayButton?.callback_data).toBe("calendar:day:2024-01-09");
        expect(nextDayButton?.callback_data).toBe("calendar:day:2024-01-11");

        const markButton = rows.find((row): row is CallbackRow =>
            row.length === 1
            && isCallbackButton(row[0])
            && row[0].callback_data === `calendar:mark:${markDate.getTime()}`
        )?.[0];
        expect(markButton).toBeDefined();
        expect(markButton?.text).toContain("★");
        expect(markButton?.text).toContain("Morning meeting");

        const backRow = rows[rows.length - 1];
        const backButton = isCallbackButton(backRow[0]) ? backRow[0] : undefined;
        expect(backButton?.callback_data).toBe("calendar:month:2024-01");
    });

    it("shows a placeholder when no marks exist for a day", () => {
        const markup = calendar.getDayView(new Date(2024, 0, 15));
        const rows = markup.inline_keyboard;
        const placeholderButton = rows.find((row): row is CallbackRow =>
            row.length === 1
            && row[0].text === "No marks"
            && isCallbackButton(row[0])
        )?.[0];
        expect(placeholderButton).toBeDefined();
        expect(placeholderButton?.callback_data).toBe("calendar:ignore");
    });
});

describe("Calendar serialization", () => {
    it("round-trips through JSON.stringify and Calendar.fromJSON", () => {
        const calendar = new Calendar({ defaultLabel: "★" });
        const viewDate = new Date(2024, 0, 10);
        calendar.getDayView(viewDate);

        const firstMarkDate = new Date(2024, 0, 10, 9, 30);
        const secondMarkDate = new Date(2024, 0, 11, 14, 15);

        calendar.mark({ date: firstMarkDate, reason: "Morning meeting" });
        calendar.mark({ date: secondMarkDate, label: "☆" });

        const serialized = JSON.stringify(calendar);
        const revived = Calendar.fromJSON(JSON.parse(serialized));

        expect(revived).toBeInstanceOf(Calendar);

        const revivedMarks = revived.getMarked();
        expect(revivedMarks).toHaveLength(2);

        const revivedFirst = revivedMarks.find((mark) => mark.date.getTime() === firstMarkDate.getTime());
        const revivedSecond = revivedMarks.find((mark) => mark.date.getTime() === secondMarkDate.getTime());

        expect(revivedFirst).toBeDefined();
        expect(revivedFirst?.label).toBe("★");
        expect(revivedFirst?.reason).toBe("Morning meeting");
        expect(revivedFirst?.date).toBeInstanceOf(Date);

        expect(revivedSecond).toBeDefined();
        expect(revivedSecond?.label).toBe("☆");
        expect(revivedSecond?.reason).toBeUndefined();
        expect(revivedSecond?.date).toBeInstanceOf(Date);

        const revivedSnapshot = revived.toJSON();
        expect(revivedSnapshot).toEqual(JSON.parse(serialized));

        const additionalDate = new Date(2024, 0, 12);
        revived.mark({ date: additionalDate });

        const additionalMark = revived.getMarked().find((mark) => mark.date.getTime() === additionalDate.getTime());
        expect(additionalMark?.label).toBe("★");
    });

    it("revives calendars from serialized strings", () => {
        const calendar = new Calendar({ defaultLabel: "◎" });
        const markDate = new Date(2024, 5, 20, 8, 45);
        calendar.mark({ date: markDate, label: "◎", reason: "Breakfast" });

        const serialized = JSON.stringify(calendar);
        const revived = Calendar.revive(serialized);

        expect(revived).toBeInstanceOf(Calendar);
        const revivedMarks = revived?.getMarked() ?? [];
        expect(revivedMarks).toHaveLength(1);
        expect(revivedMarks[0]?.date.getTime()).toBe(markDate.getTime());
    });
});
