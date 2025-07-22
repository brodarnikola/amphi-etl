import { codeIcon } from '../../icons';
import { BaseCoreComponent } from '../BaseCoreComponent';

export class UseContextVars extends BaseCoreComponent {
  constructor() {
    const defaultConfig = { 
      custCodeVarName: "pipeline_cust_code",
      versionVarName: "pipeline_version",
      outputColumns: true,
      outputPrint: true
    };
    const form = {
      idPrefix: "component__form",
      fields: [
        {
          type: "info",
          label: "Instructions",
          id: "instructions",
          text: "Use context variables that were extracted earlier in the pipeline. This componentstes how to access and use the global variables.",
          advanced: false
        },
        {
          type: "input",
          label: "Customer Code Variable Name",
          id: "custCodeVarName",
          placeholder: "pipeline_cust_code",
          tooltip: "Name of the global variable containing the customer code"
        },
        {
          type: "input",
          label: "Version Variable Name", 
          id: "versionVarName",
          placeholder: "pipeline_version",
          tooltip: "Name of the global variable containing the version"
        },
        {
          type: "boolean",
          label: "Add as columns to DataFrame",
          id: "outputColumns",
          tooltip: "Add the context variables as new columns to the DataFrame",
          advanced: true
        },
        {
          type: "boolean",
          label: "Print context variables",
          id: "outputPrint",
          tooltip: "Print the context variables to console for debugging",
          advanced: true
        }
      ],
    };
    const description = "Use context variables that were extracted earlier in the pipeline. Optionally add them as columns to the DataFrame or print them for debugging.";

    super("Use Context Variables", "useContextVars", description, "pandas_df_processor", [], "transforms", codeIcon, defaultConfig, form);
  }

  public provideImports({ config }): string[] {
    return [];
  }

  public generateComponentCode({ config, inputName, outputName }): string {
    const custCodeVarName = config.custCodeVarName || "pipeline_cust_code";
    const versionVarName = config.versionVarName || "pipeline_version";
    
    let code = `# Use context variables\n`;
    code += `${outputName} = ${inputName}.copy()\n\n`;
    
    if (config.outputPrint) {
      code += `# Print context variables for debugging\n`;
      code += `try:\n`;
      code += `    print(f"Customer Code: {${custCodeVarName}}")\n`;
      code += `except NameError:\n`;
      code += `    print("Customer code variable not found. Run Extract Context Variables component first.")\n`;
      code += `try:\n`;
      code += `    print(f"Version: {${versionVarName}}")\n`;
      code += `except NameError:\n`;
      code += `    print("Version variable not found. Run Extract Context Variables component first.")\n\n`;
    }
    
    if (config.outputColumns) {
      code += `# Add context variables as columns\n`;
      code += `try:\n`;
      code += `    ${outputName}['customer_code'] = ${custCodeVarName}\n`;
      code += `except NameError:\n`;
      code += `    ${outputName}['customer_code'] = 'NOT_FOUND'\n`;
      code += `    print("Warning: Customer code variable not found")\n`;
      code += `try:\n`;
      code += `    ${outputName}['version'] = ${versionVarName}\n`;
      code += `except NameError:\n`;
      code += `    ${outputName}['version'] = 'NOT_FOUND'\n`;
      code += `    print("Warning: Version variable not found")\n\n`;
    }
    
    return code;
  }
} 