import React, { useCallback, useEffect, useRef } from 'react';
export const useDropzone = (props) => {
    const rootRef = useRef(null);
    const handleEvent = useCallback((e) => {
        var _a, _b, _c, _d;
        e.preventDefault();
        e.stopPropagation();
        switch (e.type) {
            case 'lm-dragenter':
                (_a = props.onDragEnter) === null || _a === void 0 ? void 0 : _a.call(props, e);
                break;
            case 'lm-dragleave':
                (_b = props.onDragLeave) === null || _b === void 0 ? void 0 : _b.call(props, e);
                break;
            case 'lm-dragover':
                e.dropAction = e.proposedAction;
                (_c = props.onDragOver) === null || _c === void 0 ? void 0 : _c.call(props, e);
                break;
            case 'lm-drop':
                (_d = props.onDrop) === null || _d === void 0 ? void 0 : _d.call(props, e);
                break;
        }
    }, [props]);
    useEffect(() => {
        const node = rootRef.current;
        node === null || node === void 0 ? void 0 : node.addEventListener('lm-dragenter', handleEvent);
        node === null || node === void 0 ? void 0 : node.addEventListener('lm-dragleave', handleEvent);
        node === null || node === void 0 ? void 0 : node.addEventListener('lm-dragover', handleEvent);
        node === null || node === void 0 ? void 0 : node.addEventListener('lm-drop', handleEvent);
        return () => {
            node === null || node === void 0 ? void 0 : node.removeEventListener('lm-dragenter', handleEvent);
            node === null || node === void 0 ? void 0 : node.removeEventListener('lm-dragleave', handleEvent);
            node === null || node === void 0 ? void 0 : node.removeEventListener('lm-dragover', handleEvent);
            node === null || node === void 0 ? void 0 : node.removeEventListener('lm-drop', handleEvent);
        };
    }, [handleEvent]);
    return {
        getRootProps: () => ({
            ref: rootRef
        })
    };
};
export const Dropzone = ({ children, ...rest }) => {
    const { getRootProps } = useDropzone(rest);
    return (React.createElement("div", { style: { height: '100%' }, ...getRootProps() }, children));
};
