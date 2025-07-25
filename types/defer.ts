export interface ButtonConfig {
    value?: number;
    height?: string;
    text?: string;
    ms?: number;
}

export interface TimeButtonConfig extends ButtonConfig {
    styling?: string;
    stylingButton?: string;
}

export interface DateButtonConfig extends ButtonConfig {
    count?: number | string;
    priority?: number | string;
    time?: string;
}

export interface DeferButtonConfig {
    tomorrow: TimeButtonConfig;
    minutes: TimeButtonConfig[];
    hours: TimeButtonConfig[];
}
