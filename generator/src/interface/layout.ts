export interface Layout {
    comments: string;
    type: string;
    disposition?: string;
    name?: string;
    signedness?: string;
    size?: number | string;
    value?: number | string;
    element_disposition?: {
        signedness: string;
        size: number;
    };
    sort_key?: string;
    condition?: string;
    condition_operation?: string;
    condition_value?: string;
}
