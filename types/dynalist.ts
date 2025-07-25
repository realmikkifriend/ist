export interface DynalistCountData {
    total: number;
    current: number;
    date?: string;
}

export interface DynalistContent {
    id: string;
    file_id: string;
    [key: string]: unknown;
}

export interface DynalistNode extends DynalistContent {
    checked?: boolean;
    children?: DynalistNode[] | string[];
    note?: string;
    content?: string;
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

export interface DynalistDocumentData {
    file_id: string;
    nodes: DynalistNode[];
}

export type LabelInfo = {
    label: string;
    classes: string;
};

export type DynalistTaskType = "read" | "checklist" | "count" | "rotating" | "crossoff";

export type DynalistChange =
    | {
          action: "move";
          node_id: string;
          parent_id: string;
          index: number;
      }
    | {
          action: "edit";
          node_id: string;
          note: string;
      };

export interface DynalistStoreState {
    dynalistObject?: DynalistContent;
    selectedType: DynalistTaskType | "";
    error?: string;
}
