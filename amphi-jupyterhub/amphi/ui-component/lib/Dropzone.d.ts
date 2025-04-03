import { Drag } from '@lumino/dragdrop';
import React from 'react';
declare global {
    interface HTMLElementEventMap {
        'lm-dragenter': Drag.Event;
        'lm-dragleave': Drag.Event;
        'lm-dragover': Drag.Event;
        'lm-drop': Drag.Event;
    }
}
interface IRootProps {
    ref: React.RefObject<HTMLDivElement>;
}
interface IProps {
    onDragEnter?: (e: Drag.Event) => any;
    onDragLeave?: (e: Drag.Event) => any;
    onDragOver?: (e: Drag.Event) => any;
    onDrop?: (e: Drag.Event) => any;
    children?: React.ReactNode;
}
interface IReturn {
    getRootProps: () => IRootProps;
}
export declare const useDropzone: (props: IProps) => IReturn;
export declare const Dropzone: React.FC<IProps>;
export {};
