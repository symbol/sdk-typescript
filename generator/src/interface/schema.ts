import { Layout } from './layout';

export interface Schema {
    comments: string;
    name: string;
    type: string;
    signedness: string;
    values: [
        {
            comments: string;
            name: string;
            value: number;
        },
    ];
    size?: number;
    layout: Layout[];
}
