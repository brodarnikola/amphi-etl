import { extractIcon } from '../../icons';
import { BaseCoreComponent } from '../BaseCoreComponent';

export class ExtractContextVars extends BaseCoreComponent {
  constructor() {
    const defaultConfig = { 
      custCodeColumn: "",
      versionColumn: "",
      fileIdColumn: "", // 
      custCodeVarName: "pipeline_cust_code",
      versionVarName: "pipeline_version",
      fileIdVarName: "pipeline_file_id", 
      manualVariables: []
    };
    const form = {
      idPrefix: "component__form", 
      fields: [
        {
          type: "info",
          label: "Instructions",
          id: "instructions",
          text: "Extract context variables from DataFrame columns and/or define manual variables. All variables are stored as global variables accessible throughout the pipeline.",
          advanced: false
        },
        // ===================== DATAFRAME EXTRACTION SECTION =====================
        {
          type: "info",
          label: "📊 Extract from Input DataFrame",
          id: "dfSection",
          text: "Extract values from the first row of the input DataFrame and store them as global variables:",
          advanced: true
        },
        {
          type: "column",
          label: "Customer Code Column",
          id: "custCodeColumn",
          placeholder: "Select column containing customer code",
          tooltip: "Select the column that contains the customer code value",
          advanced: true
        },
        {
          type: "column",
          label: "File ID Column", 
          id: "fileIdColumn",
          placeholder: "Select column containing file ID",
          tooltip: "Select the column that contains the file ID value",
          advanced: true
        },
        {
          type: "column", 
          label: "Version Column",
          id: "versionColumn",
          placeholder: "Select column containing version",
          tooltip: "Select the column that contains the version value",
          advanced: true
        },
        {
          type: "input",
          label: "Customer Code Variable Name",
          id: "custCodeVarName",
          placeholder: "pipeline_cust_code",
          tooltip: "Name for the global variable (pipeline_ prefix will be added automatically if not present)",
          advanced: true
        },
        {
          type: "input",
          label: "File ID Variable Name", 
          id: "fileIdVarName",
          placeholder: "pipeline_file_id",
          tooltip: "Name for the global variable (pipeline_ prefix will be added automatically if not present)",
          advanced: true
        },
        {
          type: "input",
          label: "Version Variable Name", 
          id: "versionVarName",
          placeholder: "pipeline_version",
          tooltip: "Name for the global variable (pipeline_ prefix will be added automatically if not present)",
          advanced: true
        },
        // ===================== MANUAL VARIABLES SECTION =====================
        {
          type: "info",
          label: "✋ Custom Context Variables",
          id: "manualSection",
          text: "Define variables manually with custom names and values. Use this for static values or configuration that doesn't come from the DataFrame:",
          advanced: true
        },
        {
          type: "keyvalue",
          label: "Manual Variables",
          id: "manualVariables",
          placeholders: { key: "variable name", value: "variable value" },
          tooltip: "Add custom variables with their values. The pipeline_ prefix will be added automatically to variable names.",
          advanced: true
        }
      ],
    };
    const description = "Extract context variables from DataFrame columns and/or define manual variables. All variables are stored as global variables accessible throughout the pipeline. The DataFrame passes through unchanged.";

    super("Extract Context Variables", "extractContextVars", description, "pandas_df_processor", [], "transforms", extractIcon, defaultConfig, form);
  }

  private ensurePipelinePrefix(varName: string): string {
    if (!varName) return "pipeline_";
    const trimmed = varName.trim();
    return trimmed.startsWith("pipeline_") ? trimmed : `pipeline_${trimmed}`;
  }

  public provideImports({ config }): string[] {
    return [];
  }

  public generateComponentCode({ config, inputName, outputName }): string {
    let code = "";
    let hasDataFrameExtraction = false;
    let hasManualVariables = false;

    // Section 1: Extract from DataFrame
    if (
      (config.custCodeColumn && config.custCodeColumn.value) ||
      (config.versionColumn && config.versionColumn.value) ||
      (config.fileIdColumn && config.fileIdColumn.value) 
    ) {
      hasDataFrameExtraction = true;
      code += `# Extract context variables from input DataFrame\n`;
      
      // Handle customer code column
      if (config.custCodeColumn && config.custCodeColumn.value) {
        const custCodeColumnName = config.custCodeColumn.value;
        const custCodeColumnIsNamed = config.custCodeColumn.named;
        const custCodeColumnRef = custCodeColumnIsNamed ? `'${custCodeColumnName}'` : custCodeColumnName;
        const custCodeVarName = this.ensurePipelinePrefix(config.custCodeVarName || "cust_code");
        
        code += `${custCodeVarName} = ${inputName}.iloc[0][${custCodeColumnRef}]\n`;
        code += `print(f"Extracted customer code: {${custCodeVarName}}")\n`;
      }

      // Handle file ID column
      if (config.fileIdColumn && config.fileIdColumn.value) { // 
        const fileIdColumnName = config.fileIdColumn.value;
        const fileIdColumnIsNamed = config.fileIdColumn.named;
        const fileIdColumnRef = fileIdColumnIsNamed ? `'${fileIdColumnName}'` : fileIdColumnName;
        const fileIdVarName = this.ensurePipelinePrefix(config.fileIdVarName || "file_id");
        
        code += `${fileIdVarName} = ${inputName}.iloc[0][${fileIdColumnRef}]\n`;
        code += `print(f"Extracted file id: {${fileIdVarName}}")\n`;
      }
      
      // Handle version column  
      if (config.versionColumn && config.versionColumn.value) {
        const versionColumnName = config.versionColumn.value;
        const versionColumnIsNamed = config.versionColumn.named;
        const versionColumnRef = versionColumnIsNamed ? `'${versionColumnName}'` : versionColumnName;
        const versionVarName = this.ensurePipelinePrefix(config.versionVarName || "version");
        
        code += `${versionVarName} = ${inputName}.iloc[0][${versionColumnRef}]\n`;
        code += `print(f"Extracted version: {${versionVarName}}")\n`;
      }
    }

    // Section 2: Manual Variables
    if (config.manualVariables && config.manualVariables.length > 0) {
      hasManualVariables = true;
      if (hasDataFrameExtraction) {
        code += `\n`;
      }
      code += `# Define custom context variables\n`;
      
      config.manualVariables.forEach(variable => {
        if (variable.key && variable.value !== undefined) {
          const varName = this.ensurePipelinePrefix(variable.key);
          // Handle different value types
          let valueStr;
          if (typeof variable.value === 'string') {
            valueStr = `"${variable.value}"`;
          } else {
            valueStr = String(variable.value);
          }
          
          code += `${varName} = ${valueStr}\n`;
          code += `print(f"Set custom variable: ${varName} = {${varName}}")\n`;
        }
      });
    }

    // If no variables are defined, add a comment
    if (!hasDataFrameExtraction && !hasManualVariables) {
      code += `# No context variables defined\n`;
    }
    
    code += `\n# Pass through the DataFrame unchanged\n`;
    code += `${outputName} = ${inputName}.copy()\n`;
    
    return code;
  }
}
