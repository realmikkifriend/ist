export interface TimeButtonConfig {
    value?: number;
    height?: string;
    text?: string;
    styling?: string;
    stylingButton?: string;
    ms?: number;
}

export interface DeferButtonConfig {
    tomorrow: TimeButtonConfig;
    minutes: TimeButtonConfig[];
    hours: TimeButtonConfig[];
}
