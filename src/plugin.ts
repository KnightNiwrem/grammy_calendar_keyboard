import { MemorySessionStorage } from "./deps.deno.ts";
import type {
    Context,
    MiddlewareFn,
    NextFunction,
    StorageAdapter,
} from "./deps.deno.ts";
import { Calendar, type CalendarConfig } from "./calendar.ts";

export type CalendarStorageAdapter = StorageAdapter<Calendar>;

export interface CalendarControlPanel {
    get(id: string): Promise<Calendar | undefined>;
    set(id: string, calendar: Calendar): Promise<Calendar>;
    create(id: string, config?: CalendarConfig): Promise<Calendar>;
    delete(id: string): Promise<void>;
}

export type CalendarContextFlavor = {
    calendar: CalendarControlPanel;
};

export type CalendarContext<C extends Context = Context> = C & CalendarContextFlavor;

export interface CalendarPluginOptions {
    storage?: CalendarStorageAdapter;
    defaultLabel?: string;
}

const createDefaultStorage = (): CalendarStorageAdapter => {
    return new MemorySessionStorage<Calendar>();
};

export function createCalendarPlugin<C extends Context = Context>(
    options: CalendarPluginOptions = {},
): MiddlewareFn<CalendarContext<C>> {
    const storage = options.storage ?? createDefaultStorage();
    const defaultLabel = options.defaultLabel;

    const ensureConfig = (config?: CalendarConfig): CalendarConfig | undefined => {
        if (!defaultLabel) return config;
        if (config?.defaultLabel) return config;
        return { ...(config ?? {}), defaultLabel: defaultLabel };
    };

    const readCalendar = async (id: string): Promise<Calendar | undefined> => {
        const stored = await storage.read(id) as unknown;
        return Calendar.revive(stored);
    };

    const controlPanel: CalendarControlPanel = {
        get: async (id) => await readCalendar(id),
        set: async (id, calendar) => {
            await storage.write(id, calendar);
            return calendar;
        },
        create: async (id, config) => {
            const existing = await readCalendar(id);
            if (existing) return existing;
            const created = new Calendar(ensureConfig(config));
            await storage.write(id, created);
            return created;
        },
        delete: async (id) => {
            await storage.delete(id);
        },
    };

    return async (ctx: CalendarContext<C>, next: NextFunction) => {
        if (!Object.prototype.hasOwnProperty.call(ctx, "calendar")) {
            Object.defineProperty(ctx, "calendar", {
                value: controlPanel,
                enumerable: false,
                configurable: false,
                writable: false,
            });
        }
        await next();
    };
}
