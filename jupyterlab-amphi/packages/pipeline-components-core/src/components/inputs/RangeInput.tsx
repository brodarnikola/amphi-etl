import React, { useState } from 'react';
import { Input, Button, Space, List } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react'; // Import ReactNode if not already globally available

// Define props type for better type safety
interface RangeInputProps {
    field: { id: string; placeholder?: string };
    value?: string[];
    handleChange: (value: string[], fieldId: string) => void;
}

export const RangeInput: React.FC<RangeInputProps> = ({ field, value, handleChange }) => {
    // Explicitly type the ranges state as string[]
    const [ranges, setRanges] = useState<string[]>(value || []);
    const [currentRange, setCurrentRange] = useState<string>('');

    const addRange = () => {
        if (currentRange.trim()) {
            const newRanges = [...ranges, currentRange.trim()];
            setRanges(newRanges);
            handleChange(newRanges, field.id);
            setCurrentRange('');
        }
    };

    const removeRange = (index: number) => {
        const newRanges = ranges.filter((_, i) => i !== index);
        setRanges(newRanges);
        handleChange(newRanges, field.id);
    };

    return (
        <div>
            <Space.Compact style={{ width: '100%', marginBottom: '16px' }}>
                <Input
                    placeholder={field.placeholder}
                    value={currentRange}
                    onChange={(e) => setCurrentRange(e.target.value)}
                    onPressEnter={addRange}
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={addRange}
                />
            </Space.Compact>

            <List
                size="small"
                dataSource={ranges}
                // Explicitly type item as string and index as number
                renderItem={(item: string, index: number): ReactNode => (
                    <List.Item
                        actions={[
                            <Button
                                danger
                                icon={<MinusOutlined />}
                                onClick={() => removeRange(index)}
                            />
                        ]}
                    >
                        {item}
                    </List.Item>
                )}
            />
        </div>
    );
};
