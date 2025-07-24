import { extractIcon } from '../../icons';
import { BaseCoreComponent } from '../BaseCoreComponent';

export class ExtractContextVars extends BaseCoreComponent {
  constructor() {
    const defaultConfig = { 
      custCodeColumn: "",
      versionColumn: "",
      fileIdColumn: "",
      custCodeVarName: "pipeline_cust_code",
      versionVarName: "pipeline_version",
      fileIdVarName: "pipeline_file_id"
    };
    const form = {
      idPrefix: "component__form",
      fields: [
        {
          type: "info",
          label: "Instructions",
          id: "instructions",
          text: "Extract values from the first row and store them as global variables accessible throughout the pipeline.",
          advanced: false
        },
        {
          type: "column",
          label: "Customer Code Column",
          id: "custCodeColumn",
          placeholder: "Select column containing customer code",
          tooltip: "Select the column that contains the customer code value"
        },
        {
          type: "column",
          label: "File ID Column",
          id: "fileIdColumn",
          placeholder: "Select column containing file ID",
          tooltip: "Select the column that contains the file ID value"
        },
        {
          type: "column", 
          label: "Version Column",
          id: "versionColumn",
          placeholder: "Select column containing version",
          tooltip: "Select the column that contains the version value"
        },
        {
          type: "input",
          label: "Customer Code Variable Name",
          id: "custCodeVarName",
          placeholder: "pipeline_cust_code",
          tooltip: "Name for the global variable that will store the customer code",
          advanced: true
        },
        {
          type: "input",
          label: "File Id Variable Name", 
          id: "fileIdVarName",
          placeholder: "pipeline_file_id",
          tooltip: "Name for the global variable that will store the file ID",
          advanced: true
        },
        {
          type: "input",
          label: "Version Variable Name", 
          id: "versionVarName",
          placeholder: "pipeline_version",
          tooltip: "Name for the global variable that will store the version",
          advanced: true
        }
      ],
    };
    const description = "Extract customer code and version from the first row of the DataFrame and store them as global variables for use throughout the pipeline. The DataFrame passes through unchanged.";

    super("Extract Context Variables", "extractContextVars", description, "pandas_df_processor", [], "transforms", extractIcon, defaultConfig, form);
  }

  public provideImports({ config }): string[] {
    return [];
  }

  public generateComponentCode({ config, inputName, outputName }): string {
    let code = `# Extract context variables from first row\n`;
    
    // Handle customer code column
    if (config.custCodeColumn && config.custCodeColumn.value) {
      const custCodeColumnName = config.custCodeColumn.value;
      const custCodeColumnIsNamed = config.custCodeColumn.named;
      const custCodeColumnRef = custCodeColumnIsNamed ? `'${custCodeColumnName}'` : custCodeColumnName;
      const custCodeVarName = config.custCodeVarName || "pipeline_cust_code";
      
      code += `${custCodeVarName} = ${inputName}.iloc[0][${custCodeColumnRef}]\n`;
      code += `print(f"Extracted customer code: {${custCodeVarName}}")\n`;
    }
    
    // Handle version column  
    if (config.versionColumn && config.versionColumn.value) {
      const versionColumnName = config.versionColumn.value;
      const versionColumnIsNamed = config.versionColumn.named;
      const versionColumnRef = versionColumnIsNamed ? `'${versionColumnName}'` : versionColumnName;
      const versionVarName = config.versionVarName || "pipeline_version";
      
      code += `${versionVarName} = ${inputName}.iloc[0][${versionColumnRef}]\n`;
      code += `print(f"Extracted version: {${versionVarName}}")\n`;
    }

    // Handle file id column  
    if (config.fileIdColumn && config.fileIdColumn.value) {
      const fileIdColumnName = config.fileIdColumn.value;
      const fileIdColumnIsNamed = config.fileIdColumn.named;
      const fileIdColumnRef = fileIdColumnIsNamed ? `'${fileIdColumnName}'` : fileIdColumnName;
      const fileIdVarName = config.fileIdVarName || "pipeline_file_id";
      
      code += `${fileIdVarName} = ${inputName}.iloc[0][${fileIdColumnRef}]\n`;
      code += `print(f"Extracted file id: {${fileIdVarName}}")\n`;
    }
    
    code += `\n# Pass through the DataFrame unchanged\n`;
    code += `${outputName} = ${inputName}.copy()\n`;
    
    return code;
  }
} 