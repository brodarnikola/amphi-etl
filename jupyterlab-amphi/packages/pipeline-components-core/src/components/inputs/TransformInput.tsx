import { ComponentItem, PipelineComponent, onChange, renderComponentUI, renderHandle, CodeTextarea, SelectColumns, SelectRegular, createZoomSelector } from '@amphi/pipeline-components-manager';
import React, { useContext, useEffect, useCallback, useState, useRef } from 'react';
import type { GetRef, InputRef, message } from 'antd';
import { CloseOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { Form, Table, ConfigProvider, Card, Input, Select, Row, Button, Typography, Modal, Col, Flex, Divider, Space, Checkbox, Dropdown } from 'antd';
import { Handle, Position, useReactFlow, useStore, useStoreApi, NodeToolbar } from 'reactflow';
import { sumIcon, settingsIcon, playCircleIcon } from '../../icons';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-xcode";
import "ace-builds/src-noconflict/ext-language_tools";

export class TransformInput extends PipelineComponent<ComponentItem>() {

    public _name = "JSON Range Input";
    public _id = "jsonRangeInput";
    public _type = "pandas_df_processor";
    public _category = "transforms";
    public _description = "Input JSON data and specify ranges to transform.";
    public _icon = sumIcon;
    public _default = {
        jsonData: `{
  "data": {
    "A1": "Value 1",
    "A2": "Value 2",
    "A3": "Value 3",
    "B1": "Value 4",
    "B2": "Value 5",
    "C1": "Value 6"
  }
}`,
        ranges: []
    };
    public _form = {};

    public static ConfigForm = ({
        nodeId,
        data,
        context,
        componentService,
        manager,
        commands,
        store,
        setNodes,
        handleChange,
        modalOpen,
        setModalOpen
    }) => {
        const [ranges, setRanges] = useState(data.ranges || []);
        const [currentRange, setCurrentRange] = useState('');
        const rangeInputRef = useRef<InputRef>(null);

        // Inside your component
        const [rangeError, setRangeError] = useState('');

        useEffect(() => {
            setRanges(data.ranges || []);
        }, [data]);

        const validateRange = (range: string): boolean => {
            const pattern = /^[a-zA-Z]\d+-[a-zA-Z]\d+$/;
            if (!pattern.test(range)) {
                setRangeError('Invalid format. Use format like A1-B10');
                return false;
            }

            const [start, end] = range.split('-');
            const startLetter = start[0].toUpperCase();
            const endLetter = end[0].toUpperCase();

            // if (startLetter !== endLetter) {
            //   setRangeError('Range must be within same letter group (e.g., A1-A10)');
            //   return false;
            // }

            const startNum = parseInt(start.slice(1));
            const endNum = parseInt(end.slice(1));

            if (isNaN(startNum) || isNaN(endNum)) {
                setRangeError('Numbers must follow the letter');
                return false;
            }

            if (startNum >= endNum) {
                setRangeError('Start number must be less than end number');
                return false;
            }

            setRangeError('');
            return true;
        };

        const handleAddRange = () => {
            const trimmedRange = currentRange.trim();
            if (!trimmedRange) return;

            if (!validateRange(trimmedRange)) {
                //message.error(rangeError);
                return;
            }

            // Convert to uppercase for consistency
            const formattedRange = trimmedRange.toUpperCase();

            if (ranges.includes(formattedRange)) {
                //message.warning('This range already exists');
                return;
            }

            const newRanges = [...ranges, formattedRange];
            const updatedData = { ...data, ranges: newRanges };

            handleChange(updatedData);
            setCurrentRange('');
            setTimeout(() => rangeInputRef.current?.focus(), 0);
            // if (currentRange.trim()) {
            //     const newRanges = [...(data.ranges || []), currentRange.trim()];
            //     const updatedData = {
            //         ...data,
            //         ranges: newRanges
            //     };
            //     handleChange(updatedData);
            //     setCurrentRange('');
            //     setTimeout(() => rangeInputRef.current?.focus(), 0);
            // }
        };

        const handleRemoveRange = (index) => {
            const newRanges = ranges.filter((_, i) => i !== index);
            setRanges(newRanges);
            handleChange({ ...data, ranges: newRanges });
        };

        return (
            <ConfigProvider theme={{ token: { colorPrimary: '#5F9B97' } }}>
                <Modal
                    title="JSON Range Input"
                    open={modalOpen}
                    onOk={() => {
                        const updatedData = {
                            ...data,
                            ranges: ranges
                        };
                        setModalOpen(false);
                        handleChange(updatedData);
                    }}
                    onCancel={() => setModalOpen(false)}
                    width={800} // Reduced width since we removed the editor
                    footer={(_, { OkBtn }) => (<OkBtn />)}
                >
                    <div style={{ padding: 16 }}>
                        <Divider>Range Specifications</Divider>

                        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                            <Input
                                ref={rangeInputRef}
                                placeholder="Enter range (e.g., A5-B8)"
                                value={currentRange}
                                onChange={(e) => setCurrentRange(e.target.value)}
                                onPressEnter={handleAddRange}
                            />
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAddRange}
                            />
                        </Space.Compact>
                        {rangeError && (
                            <div style={{ color: 'red', marginBottom: 16 }}>
                                {rangeError}
                            </div>
                        )}

                        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                            {ranges.map((range, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: 8,
                                    padding: 8,
                                    background: '#f5f5f5',
                                    borderRadius: 4
                                }}>
                                    <span style={{ flex: 1 }}>{range}</span>
                                    <Button
                                        danger
                                        icon={<MinusOutlined />}
                                        onClick={() => handleRemoveRange(index)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal>
            </ConfigProvider>
        );
    };

    public UIComponent({ id, data, context, componentService, manager, commands, settings }) {
        const { setNodes, deleteElements, setViewport } = useReactFlow();
        const store = useStoreApi();

        const deleteNode = useCallback(() => {
            deleteElements({ nodes: [{ id }] });
        }, [id, deleteElements]);

        const zoomSelector = createZoomSelector();
        const showContent = useStore(zoomSelector);

        const selector = (s) => ({
            nodeInternals: s.nodeInternals,
            edges: s.edges,
        });

        const { nodeInternals, edges } = useStore(selector);
        const nodeId = id;
        const internals = { nodeInternals, edges, nodeId, componentService }

        const handleElement = React.createElement(renderHandle, {
            type: TransformInput.Type,
            Handle: Handle,
            Position: Position,
            internals: internals
        });

        const handleChange = useCallback((newData: any) => {

            // Ensure ranges is always an array
            const updatedData = {
                ...newData,
                ranges: Array.isArray(newData.ranges) ? newData.ranges : []
            };

            // Force update the node data
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === nodeId) {
                        return {
                            ...node,
                            data: updatedData
                        };
                    }
                    return node;
                })
            );
        }, [nodeId, setNodes]);

        const isSelected = useStore((state) => !!state.nodeInternals.get(id)?.selected);

        const executeUntilComponent = () => {
            // Get the absolute latest data directly from the store
            const nodes = store.getState().nodeInternals;
            const currentNode = nodes.get(nodeId);

            if (!currentNode) {
                console.error("Node not found in store");
                return;
            }

            console.log("Executing with node data:", currentNode.data);

            commands.execute('pipeline-editor:run-pipeline-until', {
                nodeId: nodeId,
                context: context,
                nodeData: currentNode.data // Use the exact data from the store
            });

            // Update last executed timestamp
            handleChange({
                ...currentNode.data,
                lastExecuted: Date.now()
            });
        };

        const [modalOpen, setModalOpen] = useState(false);
        let enableExecution = settings.get('enableExecution').composite as boolean;

        return (
            <>
                {renderComponentUI({
                    id: id,
                    data: data,
                    context: context,
                    manager: manager,
                    commands: commands,
                    name: TransformInput.Name,
                    ConfigForm: TransformInput.ConfigForm,
                    configFormProps: {
                        nodeId: id,
                        data,
                        context,
                        componentService,
                        manager,
                        commands,
                        store,
                        setNodes,
                        handleChange,
                        modalOpen,
                        setModalOpen
                    },
                    Icon: TransformInput.Icon,
                    showContent: showContent,
                    handle: handleElement,
                    deleteNode: deleteNode,
                    setViewport: setViewport,
                    handleChange,
                    isSelected
                })}
                {(showContent || isSelected) && (
                    <NodeToolbar isVisible position={Position.Bottom}>
                        <button onClick={() => setModalOpen(true)}><settingsIcon.react /></button>
                        {(TransformInput.Type.includes('input') || TransformInput.Type.includes('processor') || TransformInput.Type.includes('output')) && (
                            <button onClick={() => executeUntilComponent()} disabled={!enableExecution}
                                style={{ opacity: enableExecution ? 1 : 0.5, cursor: enableExecution ? 'pointer' : 'not-allowed' }}>
                                <playCircleIcon.react />
                            </button>
                        )}
                    </NodeToolbar>
                )}
            </>
        );
    }

    public provideImports({ config }): string[] {
        return ["import pandas as pd", "import json"];
    }

    public generateComponentCode({ config, inputName, outputName }): string {
        const ranges = Array.isArray(config.ranges) ? config.ranges : [];

        let rangeProcessingCode = `
# Extract dictionary from input
${outputName}_dict = ${inputName}['json_data'].iloc[0]
    
# Create helper function for range comparison
def in_range(key, ranges):
    if not key or len(key) < 2 or not key[0].isalpha() or not key[1:].isdigit():
        return False
            
    for range_str in ranges:
        if '-' not in range_str:
            continue
                
        start, end = range_str.split('-')
        if len(start) < 2 or len(end) < 2:
            continue
                
        # Extract letter and number parts
        key_letter = key[0].upper()
        key_num = int(key[1:])
            
        start_letter = start[0].upper()
        start_num = int(start[1:]) if start[1:].isdigit() else 0
            
        end_letter = end[0].upper()
        end_num = int(end[1:]) if end[1:].isdigit() else float('inf')
            
        # Convert letters to ASCII values for comparison
        key_ord = ord(key_letter)
        start_ord = ord(start_letter)
        end_ord = ord(end_letter)
            
        # Check if key is within the letter range
        if start_ord <= key_ord <= end_ord:
            # For same-letter ranges, check number
            if key_letter == start_letter and key_letter == end_letter:
                if start_num <= key_num <= end_num:
                    return True
            # For start letter, check if number >= start
            elif key_letter == start_letter:
                if key_num >= start_num:
                    return True
            # For end letter, check if number <= end
            elif key_letter == end_letter:
                if key_num <= end_num:
                    return True
            # For letters between start and end, include all numbers
            else:
                return True
                    
    return False
    
# Filter by ranges
${outputName}_filtered = {
    k: v for k, v in ${outputName}_dict.items()
    if in_range(k, ${JSON.stringify(ranges)})
}
    
# Create DataFrame
${outputName} = pd.DataFrame(${outputName}_filtered, index=[0]).T
`;

        return rangeProcessingCode;
    }

}