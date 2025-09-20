import type { InlineKeyboardMarkup } from "./deps.deno.ts";
import type { MarkInfo, MarkOptions, UnmarkOptions } from "./types.ts";

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

    public getMonthView(date?: Date): InlineKeyboardMarkup {
        if (date) this.viewDate = new Date(date);
        // ... logic to render keyboard for this.viewDate
    }

    public getDayView(date?: Date): InlineKeyboardMarkup {
        const targetDate = date || this.viewDate;
        // ... logic to render keyboard for targetDate
    }

    public mark(options: MarkOptions = {}): void {
        const { date = new Date(), label = this.defaultLabel, reason } = options;
        this.markedTimestamps.set(date.getTime(), { label, reason, date });
    }

    public unmark(options: UnmarkOptions = {}): void {
        const { date = new Date(), granularity = 'day' } = options;
        // ... logic to iterate over the map and delete entries
        // that match the date and granularity.
    }

    public getMarked(): MarkInfo[] {
        return Array.from(this.markedTimestamps.values());
    }
}
