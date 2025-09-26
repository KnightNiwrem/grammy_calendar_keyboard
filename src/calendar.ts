import type { InlineKeyboardMarkup } from "./deps.deno.ts";
import type { MarkInfo, MarkOptions, UnmarkOptions } from "./types.ts";

const CALLBACK_PREFIX = "calendar";
const TELEGRAM_CALLBACK_LIMIT = 64;
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type InlineKeyboardButton = InlineKeyboardMarkup["inline_keyboard"][number][number];

type SerializedMarkInfo = {
    timestamp: number;
    label: string;
    reason?: string;
};

export type CalendarSerialized = {
    version?: 1;
    defaultLabel?: string;
    viewDate: string;
    marks?: SerializedMarkInfo[];
};

export type CalendarConfig = {
    defaultLabel?: string;
};

export class Calendar {
    private viewDate: Date;
    private markedTimestamps: Map<number, MarkInfo>;
    private defaultLabel: string = '✅';

    constructor(config?: CalendarConfig) {
        this.viewDate = new Date();
        this.markedTimestamps = new Map();
        if (config?.defaultLabel) {
            this.defaultLabel = config.defaultLabel;
        }
        // ... more config setup
    }

    public static revive(serialized: unknown): Calendar | undefined {
        if (serialized instanceof Calendar) {
            return serialized;
        }

        try {
            return Calendar.fromJSON(serialized);
        } catch (_error) {
            return undefined;
        }
    }

    public static fromJSON(serialized: unknown): Calendar {
        const data = typeof serialized === "string"
            ? JSON.parse(serialized) as unknown
            : serialized;

        if (!Calendar.isSerializedCalendar(data)) {
            throw new TypeError("Cannot parse calendar from provided data");
        }

        const calendar = new Calendar({
            defaultLabel: data.defaultLabel ?? '✅',
        });

        const normalizedViewDate = new Date(data.viewDate);
        if (!Number.isFinite(normalizedViewDate.getTime())) {
            throw new TypeError("Invalid viewDate in serialized calendar");
        }
        calendar.viewDate = calendar.normalizeDate(normalizedViewDate);
        calendar.markedTimestamps.clear();

        const marks = Array.isArray(data.marks) ? data.marks : [];
        for (const mark of marks) {
            const markDate = new Date(mark.timestamp);
            if (!Number.isFinite(markDate.getTime())) {
                continue;
            }
            const markInfo: MarkInfo = {
                label: mark.label,
                reason: mark.reason,
                date: markDate,
            };
            calendar.markedTimestamps.set(markDate.getTime(), markInfo);
        }

        return calendar;
    }

    public static isSerializedCalendar(value: unknown): value is CalendarSerialized {
        if (!value || typeof value !== "object") {
            return false;
        }

        const record = value as Record<string, unknown>;
        if (typeof record.viewDate !== "string") {
            return false;
        }

        if ("defaultLabel" in record && typeof record.defaultLabel !== "string") {
            return false;
        }

        if (!("marks" in record)) {
            return true;
        }

        if (!Array.isArray(record.marks)) {
            return false;
        }

        return record.marks.every((entry) => Calendar.isSerializedMark(entry));
    }

    private static isSerializedMark(value: unknown): value is SerializedMarkInfo {
        if (!value || typeof value !== "object") {
            return false;
        }
        const record = value as Record<string, unknown>;
        if (typeof record.timestamp !== "number" || !Number.isFinite(record.timestamp)) {
            return false;
        }
        if (typeof record.label !== "string") {
            return false;
        }
        if ("reason" in record && record.reason !== undefined && typeof record.reason !== "string") {
            return false;
        }
        return true;
    }

    public getMonthView(date?: Date): InlineKeyboardMarkup {
        if (date) this.viewDate = new Date(date);
        this.viewDate = this.normalizeDate(this.viewDate);

        const current = this.viewDate;
        const year = current.getFullYear();
        const month = current.getMonth();

        const prevMonth = new Date(year, month - 1, 1);
        const nextMonth = new Date(year, month + 1, 1);

        const monthFormatter = new Intl.DateTimeFormat(undefined, {
            month: "long",
            year: "numeric",
        });

        const inline_keyboard: InlineKeyboardButton[][] = [];

        inline_keyboard.push([
            {
                text: "◀️",
                callback_data: this.buildCallback("month", this.formatMonth(prevMonth)),
            },
            {
                text: monthFormatter.format(current),
                callback_data: this.buildCallback("ignore"),
            },
            {
                text: "▶️",
                callback_data: this.buildCallback("month", this.formatMonth(nextMonth)),
            },
        ]);

        inline_keyboard.push(
            WEEKDAY_LABELS.map<InlineKeyboardButton>((label) => ({
                text: label,
                callback_data: this.buildCallback("ignore"),
            })),
        );

        const firstOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const offset = (firstOfMonth.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

        let dayCounter = 1;
        for (let cell = 0; cell < totalCells; cell++) {
            if (cell % 7 === 0) {
                inline_keyboard.push([]);
            }
            const row = inline_keyboard[inline_keyboard.length - 1];

            if (cell < offset || dayCounter > daysInMonth) {
                row.push({
                    text: " ",
                    callback_data: this.buildCallback("ignore"),
                });
                continue;
            }

            const dateForDay = new Date(year, month, dayCounter);
            const marks = this.getMarksForDate(dateForDay);

            let buttonText = `${dayCounter}`;
            if (marks.length === 1) {
                buttonText = `${marks[0].label} ${dayCounter}`;
            } else if (marks.length > 1) {
                buttonText = `${marks[0].label} ${dayCounter} (+${marks.length - 1})`;
            }

            row.push({
                text: buttonText,
                callback_data: this.buildCallback("day", this.formatDate(dateForDay)),
            });

            dayCounter += 1;
        }

        return { inline_keyboard };
    }

    public getDayView(date?: Date): InlineKeyboardMarkup {
        const targetDate = this.normalizeDate(date ? new Date(date) : this.viewDate);
        this.viewDate = targetDate;

        const prevDay = new Date(targetDate);
        prevDay.setDate(prevDay.getDate() - 1);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const dayFormatter = new Intl.DateTimeFormat(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });

        const timeFormatter = new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        });

        const inline_keyboard: InlineKeyboardButton[][] = [];

        inline_keyboard.push([
            {
                text: "◀️",
                callback_data: this.buildCallback("day", this.formatDate(prevDay)),
            },
            {
                text: dayFormatter.format(targetDate),
                callback_data: this.buildCallback("ignore"),
            },
            {
                text: "▶️",
                callback_data: this.buildCallback("day", this.formatDate(nextDay)),
            },
        ]);

        const marks = this.getMarksForDate(targetDate);
        if (marks.length === 0) {
            inline_keyboard.push([
                {
                    text: "No marks",
                    callback_data: this.buildCallback("ignore"),
                },
            ]);
        } else {
            for (const mark of marks) {
                const timeLabel = timeFormatter.format(mark.date);
                const reasonSuffix = mark.reason ? ` • ${this.truncate(mark.reason, 24)}` : "";
                inline_keyboard.push([
                    {
                        text: `${timeLabel} ${mark.label}${reasonSuffix}`.trim(),
                        callback_data: this.buildCallback("mark", `${mark.date.getTime()}`),
                    },
                ]);
            }
        }

        inline_keyboard.push([
            {
                text: "Back to month",
                callback_data: this.buildCallback("month", this.formatMonth(targetDate)),
            },
        ]);

        return { inline_keyboard };
    }

    public toJSON(): CalendarSerialized {
        const marks = Array.from(this.markedTimestamps.values())
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map<SerializedMarkInfo>((mark) => {
                const serialized: SerializedMarkInfo = {
                    timestamp: mark.date.getTime(),
                    label: mark.label,
                };
                if (mark.reason !== undefined) {
                    serialized.reason = mark.reason;
                }
                return serialized;
            });

        return {
            version: 1,
            defaultLabel: this.defaultLabel,
            viewDate: this.viewDate.toISOString(),
            marks,
        };
    }

    private normalizeDate(date: Date): Date {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    private formatMonth(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
    }

    private getMarksForDate(date: Date): MarkInfo[] {
        const target = this.normalizeDate(date);
        const marks: MarkInfo[] = [];
        for (const mark of this.markedTimestamps.values()) {
            if (this.isSameDay(mark.date, target)) {
                marks.push(mark);
            }
        }
        return marks.sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    private isSameDay(a: Date, b: Date): boolean {
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
    }

    private truncate(value: string, maxLength: number): string {
        if (value.length <= maxLength) return value;
        return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
    }

    private buildCallback(action: string, payload?: string): string {
        const base = `${CALLBACK_PREFIX}:${action}`;
        if (!payload) {
            return base.length <= TELEGRAM_CALLBACK_LIMIT
                ? base
                : base.slice(0, TELEGRAM_CALLBACK_LIMIT);
        }
        const data = `${base}:${payload}`;
        return data.length <= TELEGRAM_CALLBACK_LIMIT
            ? data
            : data.slice(0, TELEGRAM_CALLBACK_LIMIT);
    }

    public mark(options: MarkOptions = {}): void {
        const { date = new Date(), label = this.defaultLabel, reason } = options;
        this.markedTimestamps.set(date.getTime(), { label, reason, date });
    }

    public unmark(options: UnmarkOptions = {}): void {
        const { date: _date = new Date(), granularity: _granularity = 'day' } = options;
        // ... logic to iterate over the map and delete entries
        // that match the date and granularity.
    }

    public getMarked(): MarkInfo[] {
        return Array.from(this.markedTimestamps.values());
    }
}
