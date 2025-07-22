export interface TimeButtonConfig {
    value?: number;
    height?: string;
    text?: string;
    styling?: string;
    stylingButton?: string;
    ms?: number;
}

export interface ButtonConfig {
    tomorrow: TimeButtonConfig;
    minutes: TimeButtonConfig[];
    hours: TimeButtonConfig[];
}
