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

export interface DynalistApiResultBase {
    error?: string;
    data?: unknown;
    message?: string;
}

export interface FetchDynalistDocumentResult extends DynalistApiResultBase {
    data?: DynalistContent | null;
    dynalistSubItem?: string;
    jsonError?: boolean;
}

export interface ValidateDynalistTokenResult extends DynalistApiResultBase {
    success: boolean;
}
