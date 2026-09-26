import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol';
export declare const TYPERT: {
    package: string;
    face: string;
    schemas: never[];
    invocations: readonly InvocationDescriptor[];
    model: {
        services: {
            description: string;
            summary: string;
            tags: never[];
            jsDoc: string;
            key: string;
            exportName: string;
            members: {
                kind: string;
                name: string;
                signature: string;
                summary: string;
                jsDoc: string;
            }[];
            types: {
                name: string;
                declaration: string;
            }[];
        }[];
        events: never[];
        objects: never[];
    };
};
export default TYPERT;
