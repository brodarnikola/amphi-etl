s‚# Extract Context Variables - Usage Example

## Overview

The `ExtractContextVars` component extracts values from the first row of a DataFrame and stores them as global variables that can be accessed throughout the pipeline execution. This is safer than using environment variables as it's scoped to the current pipeline run.

## Components

### 1. Extract Context Variables
- **Purpose**: Extracts `cust_code` and `version` (or other values) from the first row of a DataFrame
- **Location**: Transforms category
- **Icon**: Extract icon (crop)

### 2. Use Context Variables  
- **Purpose**: Demonstrates how to access and use the extracted context variables
- **Location**: Transforms category
- **Icon**: Code icon

## Usage Example

### Step 1: Create sample data
```
input_data = pd.DataFrame({
    'cust_code': ['CUST123'],
    'version': ['v2.1'], 
    'other_data': ['sample']
})
```

### Step 2: Extract Context Variables
1. Add the "Extract Context Variables" component
2. Configure:
   - **Customer Code Column**: Select `cust_code`
   - **Version Column**: Select `version`
   - **Customer Code Variable Name**: `pipeline_cust_code` (default)
   - **Version Variable Name**: `pipeline_version` (default)

This will generate code like:
```python
# Extract context variables from first row
pipeline_cust_code = input_data.iloc[0]['cust_code']
print(f"Extracted customer code: {pipeline_cust_code}")
pipeline_version = input_data.iloc[0]['version']  
print(f"Extracted version: {pipeline_version}")

# Pass through the DataFrame unchanged
output = input_data.copy()
```

### Step 3: Use Context Variables Later
1. Add the "Use Context Variables" component anywhere later in the pipeline
2. Configure:
   - **Add as columns to DataFrame**: Check to add variables as new columns
   - **Print context variables**: Check to debug/verify values

This will generate code like:
```python
# Use context variables
output = input_data.copy()

# Print context variables for debugging
try:
    print(f"Customer Code: {pipeline_cust_code}")
except NameError:
    print("Customer code variable not found. Run Extract Context Variables component first.")

# Add context variables as columns
try:
    output['customer_code'] = pipeline_cust_code
except NameError:
    output['customer_code'] = 'NOT_FOUND'
    print("Warning: Customer code variable not found")
```

## Benefits

1. **Scoped to Pipeline Run**: Variables exist only for the current execution
2. **No Cross-Contamination**: Unlike environment variables, these don't persist between runs
3. **Error Handling**: Built-in try/catch blocks handle missing variables gracefully
4. **Flexible**: Can extract any columns, not just cust_code and version
5. **Pass-through**: DataFrame continues unchanged through the pipeline

## Custom Usage

You can also manually reference these variables in any Custom Transformations component:

```python
# Use the extracted context variables
output = input.copy()
output['file_name'] = f"data_{pipeline_cust_code}_{pipeline_version}.csv"
```

## Notes

- The Extract component must run before any Use components
- Variables are global within the Python execution scope
- If a variable doesn't exist, error handling provides meaningful messages
- The DataFrame passes through unchanged, maintaining your data pipeline flow 