import { ComponentItem, PipelineComponent, onChange, renderComponentUI, renderHandle, CodeTextarea, SelectColumns, SelectRegular, createZoomSelector } from '@amphi/pipeline-components-manager';
import React, { useContext, useEffect, useCallback, useState, useRef } from 'react';
import type { GetRef, InputRef } from 'antd';
import { CloseOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { Form, Table, ConfigProvider, Card, Input, Select, Row, Button, Typography, Modal, Col, Flex, Divider, Space, Checkbox, Dropdown } from 'antd';
import { Handle, Position, useReactFlow, useStore, useStoreApi, NodeToolbar } from 'reactflow';
import { sumIcon, settingsIcon, playCircleIcon } from '../../icons';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-xcode";
import "ace-builds/src-noconflict/ext-language_tools";

export class TransformInput2 extends PipelineComponent<ComponentItem>() {

    public _name = "JSON Range Input 2";
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
    
        useEffect(() => {
            setRanges(data.ranges || []);
        }, [data]);
     
        const handleAddRange = () => {
            if (currentRange.trim()) {
                const newRanges = [...(data.ranges || []), currentRange.trim()];
                const updatedData = {
                    ...data,
                    ranges: newRanges
                };
                handleChange(updatedData);
                setCurrentRange('');
                setTimeout(() => rangeInputRef.current?.focus(), 0);
            }
        };
    
        const handleRemoveRange = (index) => {
            const newRanges = ranges.filter((_, i) => i !== index);
            setRanges(newRanges);
            handleChange({ ...data, ranges: newRanges });
        };
    
        return (
            <ConfigProvider theme={{ token: { colorPrimary: '#5F9B97' } }}> 
                <Modal
                    title="JSON Range Input 2"
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
            type: TransformInput2.Type,
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
                    name: TransformInput2.Name,
                    ConfigForm: TransformInput2.ConfigForm,
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
                    Icon: TransformInput2.Icon,
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
                        {(TransformInput2.Type.includes('input') || TransformInput2.Type.includes('processor') || TransformInput2.Type.includes('output')) && (
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

    public generateComponentCode({ config, inputName, outputName }): string {
        const ranges = Array.isArray(config.ranges) ? config.ranges : [];
        
        let rangeProcessingCode = `
# Extract dictionary from input
${outputName}_dict = ${inputName}['json_data'].iloc[0]
    
# Debug print input keys
print("All keys in input:", sorted(${outputName}_dict.keys()))
    
# Create helper function for range comparison
def in_range(key, ranges):
    for range_str in ranges:
        if '-' not in range_str:
            continue
        start, end = range_str.split('-')
        # Check if key matches the letter pattern (e.g., C11)
        if len(key) >= 1 and key[0].isalpha():
            letter = key[0]
            # Check if the rest is numeric
            if key[1:].isdigit():
                num = int(key[1:])
                # Check if letter matches range
                if letter == start[0] and letter == end[0]:
                    start_num = int(start[1:]) if start[1:].isdigit() else 0
                    end_num = int(end[1:]) if end[1:].isdigit() else float('inf')
                    if start_num <= num <= end_num:
                        return True
    return False
    
# Filter by ranges
${outputName}_filtered = {
    k: v for k, v in ${outputName}_dict.items()
    if in_range(k, ${JSON.stringify(ranges)})
}
    
# Debug print filtered keys
print("Filtered keys:", sorted(${outputName}_filtered.keys()))
   
# Create DataFrame
${outputName} = pd.DataFrame(${outputName}_filtered, index=[0]).T
    
# Debug final result
print("Final DataFrame:")
print(${outputName})
`;
    
        return rangeProcessingCode;
    }

    public provideImports({ config }): string[] {
        return ["import pandas as pd", "import json"];
    }

}