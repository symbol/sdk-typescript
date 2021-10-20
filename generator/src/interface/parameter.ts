import { Layout } from './layout';

export interface Parameter extends Layout {
    generatedName: string;
    type: string;
    actualSize?: number;
    declarable: boolean;
    inlineClass: string;
}
