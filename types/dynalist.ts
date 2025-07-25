export interface DynalistCountData {
    total?: number;
    current?: number;
    date?: string;
}

export interface DynalistContent {
    id: string;
    file_id: string;
    [key: string]: unknown;
}
