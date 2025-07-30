
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
            // Updated pattern to support multi-letter columns (A-ZZ)
            const pattern = /^[a-zA-Z]+\d+-[a-zA-Z]+\d+$/;
            if (!pattern.test(range)) {
                setRangeError('Invalid format. Use format like A1-B10 or AA1-ZZ10000000');
                return false;
            }

            const [start, end] = range.split('-');

            // Extract column letters and row numbers
            const startMatch = start.match(/^([a-zA-Z]+)(\d+)$/);
            const endMatch = end.match(/^([a-zA-Z]+)(\d+)$/);

            if (!startMatch || !endMatch) {
                setRangeError('Invalid format. Letters must be followed by numbers');
                return false;
            }

            const startCol = startMatch[1].toUpperCase();
            const startNum = parseInt(startMatch[2]);
            const endCol = endMatch[1].toUpperCase();
            const endNum = parseInt(endMatch[2]);

            // Validate column letters (A-ZZ range)
            const isValidColumn = (col: string): boolean => {
                if (col.length === 0 || col.length > 2) return false;
                return /^[A-Z]+$/.test(col);
            };

            if (!isValidColumn(startCol) || !isValidColumn(endCol)) {
                setRangeError('Invalid column letters. Use A-Z or AA-ZZ format');
                return false;
            }

            // Convert column letters to numbers for comparison (A=1, B=2, ..., Z=26, AA=27, etc.)
            const colToNum = (col: string): number => {
                let result = 0;
                for (let i = 0; i < col.length; i++) {
                    result = result * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
                }
                return result;
            };

            const startColNum = colToNum(startCol);
            const endColNum = colToNum(endCol);

            // Validate row numbers
            if (isNaN(startNum) || isNaN(endNum) || startNum < 1 || endNum < 1) {
                setRangeError('Row numbers must be positive integers');
                return false;
            }

            // Validate range limits (up to ZZ10000000)
            const maxColNum = colToNum('ZZ'); // 702
            const maxRowNum = 10000000;

            if (startColNum > maxColNum || endColNum > maxColNum) {
                setRangeError('Column range exceeds maximum (ZZ)');
                return false;
            }

            if (startNum > maxRowNum || endNum > maxRowNum) {
                setRangeError('Row number exceeds maximum (10000000)');
                return false;
            }

            // Check if start is before end (either by column or by row if same column)
            if (startColNum > endColNum || (startColNum === endColNum && startNum > endNum)) {
                setRangeError('Start cell must be before or same as end cell');
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
        return ["import pandas as pd", "import json", "import numpy as np"];
    }

    public generateComponentCode({ config, inputName, outputName }): string {
        const ranges = Array.isArray(config.ranges) ? config.ranges : [];

        let rangeProcessingCode = `
# Extract dictionary from input
pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)

# Store the original input DataFrame for later combination
original_input = ${inputName}.copy()

${outputName}_dict = ${inputName}['json_data'].iloc[0]

print(f"Total keys in input: {len(${outputName}_dict)}")

# Create helper function for range comparison
def in_range(key, ranges):
    if not key or len(key) < 2:
        return False
    
    # Extract letter and number parts for multi-letter columns
    import re
    match = re.match(r'^([A-Z]+)(\\d+)$', key.upper())
    if not match:
        return False
    
    key_letters = match.group(1)
    key_num = int(match.group(2))

    for range_str in ranges:
        if '-' not in range_str:
            continue

        start, end = range_str.split('-')
        if len(start) < 2 or len(end) < 2:
            continue

        # Extract letter and number parts for start and end
        start_match = re.match(r'^([A-Z]+)(\\d+)$', start.upper())
        end_match = re.match(r'^([A-Z]+)(\\d+)$', end.upper())
        
        if not start_match or not end_match:
            continue

        start_letters = start_match.group(1)
        start_num = int(start_match.group(2))
        end_letters = end_match.group(1)
        end_num = int(end_match.group(2))

        # Convert multi-letter columns to numeric values for comparison
        def column_to_num(col_str):
            result = 0
            for char in col_str:
                result = result * 26 + (ord(char) - ord('A') + 1)
            return result

        key_col_num = column_to_num(key_letters)
        start_col_num = column_to_num(start_letters)
        end_col_num = column_to_num(end_letters)

        # Check if key is within the column range
        if start_col_num <= key_col_num <= end_col_num:
            # Check if key is within the row range
            if start_num <= key_num <= end_num:
                return True
    
    return False

# Filter by ranges
${outputName}_filtered = {
    k: v for k, v in ${outputName}_dict.items()
    if in_range(k, ${JSON.stringify(ranges)})
}

# Add missing columns with null values for each range
def num_to_column(num):
    result = ""
    while num > 0:
        num -= 1
        result = chr(num % 26 + ord('A')) + result
        num //= 26
    return result

def column_to_num(col_str):
    result = 0
    for char in col_str:
        result = result * 26 + (ord(char) - ord('A') + 1)
    return result

for range_str in ${JSON.stringify(ranges)}:
    if '-' not in range_str:
        continue
   
    start, end = range_str.split('-')
    if len(start) < 2 or len(end) < 2:
        continue
    
    import re
    start_match = re.match(r'^([A-Z]+)(\\d+)$', start.upper())
    end_match = re.match(r'^([A-Z]+)(\\d+)$', end.upper())
    
    if not start_match or not end_match:
        continue
    
    start_letters = start_match.group(1)
    end_letters = end_match.group(1)
    start_num = int(start_match.group(2))
    end_num = int(end_match.group(2))
    
    start_col_num = column_to_num(start_letters)
    end_col_num = column_to_num(end_letters)
    
    # For each column in the range
    for col_num in range(start_col_num, end_col_num + 1):
        col_letters = num_to_column(col_num)
        
        # Check if any key exists for this column in the range
        col_exists = any(k.upper().startswith(col_letters) for k in ${outputName}_filtered.keys())
        
        if not col_exists:
            # Add a null entry for this column
            null_key = f"{col_letters}{start_num}"
            ${outputName}_filtered[null_key] = np.nan
            print(f"Added missing column: {null_key} with null value")

# Convert all values to strings, use NaN for empty or NaN values
#${outputName}_str = {k: str(v) if v is not None and not pd.isna(v) else np.nan for k, v in ${outputName}_filtered.items()}

print(f"Filtered keys: {len(${outputName}_filtered)}")
print(f"Filtered keys list: {list(${outputName}_filtered.keys())}")

# Create DataFrame with cell references as index
${outputName}_intermediate = pd.DataFrame(${outputName}_filtered, index=[0]).T

print("KEY VALUE TRANSFORMS: Generating component code for KEY VALUE")
print(f"KEY VALUE TRANSFORMS: Input Name: ${outputName}_intermediate")
print(f"KEY VALUE TRANSFORMS: Output Name: ${outputName}")

# Apply TransformToTable logic
def wide_transform(input_df):
    df = input_df.reset_index() 
    df.columns = ['cell', 'value'] 
    df['col_letter'] = df['cell'].str.extract(r'([A-ZZ]+)', expand=False) 
    df['col_num'] = df['cell'].str.extract(r'(\\d+)', expand=False).astype(int)

    output = df.pivot(index='col_num', columns='col_letter', values='value')

    # Retain only alphabetic columns
    output = output[[col for col in output.columns if col.isalpha()]]

    output.index = [f"{idx}" for idx in output.index]
    output = output.where(pd.notna(output), np.nan)
    return output

${outputName} = wide_transform(${outputName}_intermediate)

${outputName}['CUST_CODE'] = None  # Initialize with None or set a default value
${outputName}['FILE_ID'] = None   # Initialize with None or set a default value
${outputName}['VERSION'] = None   # Initialize with None or set a default value

# Add context variables as new columns if they exist
try:
    # Try to access pipeline_cust_code variable
    ${outputName}['CUST_CODE'] = pipeline_cust_code
    print(f"Added CUST_CODE column with value: {pipeline_cust_code}")
except NameError:
    # If variable doesn't exist, set to None or a default value
    ${outputName}['CUST_CODE'] = None
    print("Warning: pipeline_cust_code variable not found, setting CUST_CODE to None")

try:
    # Try to access pipeline_file_id variable  
    ${outputName}['FILE_ID'] = str(pipeline_file_id)
    print(f"Added FILE_ID column with value: {pipeline_file_id}")
except NameError:
    # If variable doesn't exist, set to None or a default value
    ${outputName}['FILE_ID'] = None
    print("Warning: pipeline_file_id variable not found, setting VERSION to None")     

try:
    # Try to access pipeline_version variable  
    ${outputName}['VERSION'] = pipeline_version
    print(f"Added VERSION column with value: {pipeline_version}")
except NameError:
    # If variable doesn't exist, set to None or a default value
    ${outputName}['VERSION'] = None
    print("Warning: pipeline_version variable not found, setting VERSION to None")   

print(f"KEY VALUE TRANSFORMS SNIPPET CODE: Applied wide_transform to ${outputName}_intermediate")


print(f"Final DataFrame shape: {${outputName}.shape}")
print(f"Final DataFrame columns: {list(${outputName}.columns)}")

`;

        return rangeProcessingCode;
    }

}


// # Create DataFrame from filtered data
// ${outputName} = pd.DataFrame(${outputName}_filtered, index=[0]).T

// # Add column 'A' with values from previous dataframe's 'id' column
// if not ${inputName}.empty and 'id' in ${inputName}.columns:
//     # Get the 'id' values from the input dataframe
//     id_values = ${inputName}['id'].tolist()
    
//     # Add 'A' column to the output dataframe
//     # If we have multiple id values, we'll concatenate them with '||' separator
//     if len(id_values) > 1:
//         ${outputName}['A'] = '||'.join(map(str, id_values))
//     elif len(id_values) == 1:
//         ${outputName}['A'] = str(id_values[0])
//     else:
//         ${outputName}['A'] = None
// else:
//     # If no input data or no 'id' column, set 'A' to None
//     ${outputName}['A'] = None


// # Create DataFrame from filtered data
// filtered_df = pd.DataFrame(${outputName}_filtered, index=[0]).T

// # Add column "A" with values from the "id" column of the previous DataFrame
// if 'id' in original_input.columns:
//     # Get the id value from the first row (assuming single row input)
//     id_value = original_input['id'].iloc[0] if len(original_input) > 0 else None
    
//     # Add "A" column to filtered DataFrame with the id value for all rows
//     filtered_df['A'] = id_value
//     print(f"Added column 'A' with value: {id_value}")
// else:
//     print("Warning: 'id' column not found in previous DataFrame")
//     filtered_df['A'] = None

// # Set the final output to the filtered DataFrame with the new "A" column
// ${outputName} = filtered_df


 

// # Debug information
// #print(f"Input ranges: ${JSON.stringify(ranges)}")
// #print(f"Total input keys: {len(${outputName}_dict)}")
// print(f"Filtered keys count: {len(${outputName}_filtered)}")
// print(f"Filtered keys: {sorted(${outputName}_filtered.keys())}")



// # Create DataFrame from filtered data
// filtered_df = pd.DataFrame(${outputName}_filtered, index=[0]).T

// # Combine original input with filtered data
// # Method 1: Concatenate along columns (side by side)
// ${outputName} = pd.concat([original_input, filtered_df], axis=1)



// # Alternative Method 2: If you want to merge on index/specific column
// # ${outputName} = original_input.merge(filtered_df, left_index=True, right_index=True, how='outer')

// # Alternative Method 3: If you want to append rows instead of columns
// # ${outputName} = pd.concat([original_input, filtered_df], axis=0, ignore_index=True)

// print(f"Final DataFrame shape: {${outputName}.shape}")
// print(f"Final DataFrame columns: {list(${outputName}.columns)}")





// # Create DataFrame from filtered data
// ${outputName}_new = pd.DataFrame(${outputName}_filtered, index=[0]).T

// # Combine with input data from previous component
// if not ${inputName}.empty and not ${outputName}_new.empty:
//     # Reset index for proper concatenation
//     ${inputName}_reset = ${inputName}.reset_index(drop=True)
//     ${outputName}_new_reset = ${outputName}_new.reset_index(drop=True)
    
//     # Concatenate horizontally (side by side)
//     ${outputName} = pd.concat([${inputName}_reset, ${outputName}_new_reset], axis=1, ignore_index=False)
// elif not ${inputName}.empty:
//     # If no filtered data, return original input
//     ${outputName} = ${inputName}.copy()
// elif not ${outputName}_new.empty:
//     # If no input data, return filtered data only
//     ${outputName} = ${outputName}_new.copy()
// else:
//     # If both are empty, return empty DataFrame
//     ${outputName} = pd.DataFrame()