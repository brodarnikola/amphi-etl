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
        // Initialize state directly from data with fallbacks
        const [jsonData, setJsonData] = useState(data.jsonData || '');
        const [ranges, setRanges] = useState(data.ranges || []);
        const [currentRange, setCurrentRange] = useState(''); 

        const rangeInputRef = useRef<InputRef>(null);

        // Keep local state in sync with component data
        useEffect(() => {
            setJsonData(data.jsonData || '');
            setRanges(data.ranges || []);
        }, [data]);
 
        // This function updates the local state first, then uses handleChange to update component data
        const handleAddRange = () => {
            console.log("Adding range:", currentRange);
            console.log("Current ranges:", ranges);
            
            if (currentRange.trim()) {
                const newRanges = [...(data.ranges || []), currentRange.trim()];
                const updatedData = {
                    ...data,
                    ranges: newRanges
                };
                
                // Use the handleChange from props
                handleChange(updatedData);
                setCurrentRange('');
                
                setTimeout(() => rangeInputRef.current?.focus(), 0);
            }
        };

        const handleRemoveRange = (index) => {
            console.log("Removing range at index:", index);
            console.log("Current ranges:", ranges);
            
            // Create a new array without the range at the specified index
            const newRanges = ranges.filter((_, i) => i !== index);
            console.log("New ranges after removal:", newRanges);
            
            // Update local state first
            setRanges(newRanges);
            
            // Update component data using handleChange
            handleChange({ ...data, ranges: newRanges }, undefined);
        };

        const handleJsonChange = (value) => {
            // Update local state
            setJsonData(value);
            
            // Update component data using handleChange
            handleChange({ ...data, jsonData: value }, undefined);
        };

        // Debug current data
        useEffect(() => {
            console.log("Current data in ConfigForm:", data);
        }, [data]);

        return (
            <ConfigProvider theme={{ token: { colorPrimary: '#5F9B97' } }}> 
                <Modal
                title="JSON Range Input"
                open={modalOpen}
                onOk={() => {
                    // Force a final update of the component data before closing

                    console.log("Finalizing ranges before closing modal:", ranges);
                    // Ensure ranges is always an array
                    if (!Array.isArray(ranges)) {
                        console.warn("Ranges is not an array, defaulting to empty array");
                    }
                    console.log("Updating component data:", data);
                    const updatedData = {
                        ...data,
                        ranges: ranges // Use the current local state
                    };
                    console.log("updatedData:", updatedData);
                    setModalOpen(false);
                    handleChange(updatedData, undefined);
                }}
                onCancel={() => setModalOpen(false)}
                width={1200}
                footer={(_, { OkBtn }) => (<OkBtn />)}>
                    
                    <Flex style={{ height: 500 }}>
                        <div style={{ width: '50%', paddingRight: 16 }}>
                            <AceEditor
                                width="100%"
                                height="100%"
                                placeholder="Enter your JSON data here"
                                mode="json"
                                theme="xcode"
                                name="jsonEditor"
                                onChange={handleJsonChange}
                                fontSize={14}
                                lineHeight={19}
                                showPrintMargin
                                showGutter
                                highlightActiveLine
                                value={jsonData}
                                setOptions={{
                                    enableBasicAutocompletion: true,
                                    enableLiveAutocompletion: true,
                                    enableSnippets: true,
                                    showLineNumbers: true,
                                    tabSize: 2,
                                }}
                            />
                        </div>

                        <div style={{ width: '50%', paddingLeft: 16 }}>
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

                            <div style={{ maxHeight: 350, overflowY: 'auto' }}>
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
                            
                            {/* Debug display */}
                            <div style={{ marginTop: 20, padding: 10, background: '#f0f0f0', borderRadius: 4 }}>
                                <Typography.Text strong>Debug Info:</Typography.Text>
                                <div>Current ranges: {JSON.stringify(ranges)}</div>
                                <div>Data ranges: {JSON.stringify(data.ranges)}</div>
                            </div>
                        </div>
                    </Flex>
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
            console.log("Updating node data:", newData);
            
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

        // Debug whenever data changes
        useEffect(() => {
            console.log("UIComponent data updated:", data);
        }, [data]);

        useEffect(() => {
            const unsubscribe = store.subscribe(
                (state) => {
                    const nodeData = state.nodeInternals.get(nodeId)?.data;
                    console.log("Current node data in store:", nodeData);
                }
            );
            return () => unsubscribe();
        }, [nodeId, store]);

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

    public provideImports({ config }): string[] {
        return ["import pandas as pd", "import json"];
    }

    // ALMOST WORKING .. IT DOES NOT WORK WITH MULTIPLE RANGES
    // public generateComponentCode({ config, inputName, outputName }): string {
    //     const jsonData = config.jsonData.trim();
    //     const ranges = Array.isArray(config.ranges) ? config.ranges : [];
    
    //     if (!jsonData) {
    //         throw new Error("No JSON data provided.");
    //     }
    
    //     let rangeFilterCode = '';
    //     if (ranges.length > 0) {
    //         // Create list comprehension to filter keys
    //         rangeFilterCode = ranges.map(range => {
    //             if (!range || typeof range !== 'string' || !range.includes('-')) {
    //                 return `# Invalid range specification: ${range}`;
    //             }
                
    //             const [start, end] = range.split('-');
    //             return `# Filter range ${range}
    // ${outputName}_filtered = {k: v for k, v in ${outputName}_data['data'].items() 
    //                          if '${start}' <= k <= '${end}'}`;
    //         }).join('\n\n');
            
    //         // Combine all filtered ranges
    //         rangeFilterCode += `\n\n# Combine all filtered ranges
    // ${outputName}_combined = ${outputName}_data.copy()
    // ${outputName}_combined['data'] = {k: v for r in [${ranges.map(r => `'${r}'`).join(', ')}] 
    //                                for k, v in ${outputName}_data['data'].items() 
    //                                if '${ranges[0].split('-')[0]}' <= k <= '${ranges[0].split('-')[1]}'}`;
    //     }
    
    //     return `
    // import pandas as pd
    // import json
    
    // ${outputName}_json = """${jsonData}
    // """
    // ${outputName}_data = json.loads(${outputName}_json)
    
    // ${rangeFilterCode || '# No ranges specified, using all data'}
    
    // # Create final DataFrame
    // ${outputName} = pd.DataFrame.from_dict(${
    //     ranges.length > 0 ? `${outputName}_combined['data']` : `${outputName}_data['data']`
    // }, orient='index', columns=['value'])
    
    // print("Final DataFrame:")
    // print(${outputName})
    // `;
    // }

    public generateComponentCode({ config, inputName, outputName }): string {
        const jsonData = config.jsonData.trim();
        const ranges = Array.isArray(config.ranges) ? config.ranges : [];
    
        if (!jsonData) {
            throw new Error("No JSON data provided.");
        }
    
        let rangeProcessingCode = '';
        let combinedFilterCode = '';
    
        if (ranges.length > 0) {
            // Generate individual range filters
            rangeProcessingCode = ranges.map((range, i) => {
                if (!range || typeof range !== 'string' || !range.includes('-')) {
                    return `# Invalid range specification: ${range}`;
                }
                
                const [start, end] = range.split('-');
                return `# Filter for range ${range}
    ${outputName}_range_${i} = {k: v for k, v in ${outputName}_data['data'].items() 
                             if '${start}' <= k <= '${end}'}`;
            }).join('\n\n');
    
            // Generate combined filter that includes all specified ranges
            const rangeConditions = ranges.map(range => {
                const [start, end] = range.split('-');
                return `('${start}' <= k <= '${end}')`;
            }).join(' or ');
    
            combinedFilterCode = `\n# Combine all specified ranges
    ${outputName}_combined = {
        'data': {k: v for k, v in ${outputName}_data['data'].items() 
                 if ${rangeConditions}}
    }`;
        }

        // return `
        // import pandas as pd
        // import json
        
    
        return ` 
    
    ${outputName}_json = """${jsonData}
    """
    ${outputName}_data = json.loads(${outputName}_json)
    
    ${rangeProcessingCode}
    
    ${ranges.length > 0 ? combinedFilterCode : '# No ranges specified, using all data'}
    
    # Create final DataFrame from ${ranges.length > 0 ? 'filtered' : 'all'} data
    ${outputName} = pd.DataFrame.from_dict(${
        ranges.length > 0 ? `${outputName}_combined['data']` : `${outputName}_data['data']`
    }, orient='index', columns=['value'])
    
    print("Final DataFrame with ${ranges.length} range(s) applied:")
    print(${outputName})
    `;
    }
}