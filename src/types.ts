export type MarkInfo = {
    label: string;
    reason?: string;
    date: Date;
};

export type MarkOptions = Partial<MarkInfo>;

export type DateGranularity = 'exact' | 'hour' | 'day' | 'month';

export type UnmarkOptions = {
    date?: Date;
    granularity?: DateGranularity;
}
