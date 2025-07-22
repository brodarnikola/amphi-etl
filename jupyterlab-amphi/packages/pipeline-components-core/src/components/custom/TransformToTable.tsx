import { codeIcon } from '../../icons';
import { BaseCoreComponent } from '../BaseCoreComponent'; 
export interface Flow {
  nodes: Node[]; 
}

export interface Node {
  id: string;
  type: string;
  data: any;
  [key: string]: any; // To include other properties with unknown names
} 

export class TransformToTable extends BaseCoreComponent {
  constructor() {
    const defaultConfig = { code: "output = input" };
    const form = {
      idPrefix: "component__form",
      fields: [
        {
          type: "info",
          label: "Instructions",
          id: "instructions",
          text: "Write Python code with 'input' being the input dataframe, and 'output' the output dataframe.",
        }
      ],
    };

    const description = "Use custom Python code to apply Pandas operations on the input DataFrame, transforming it to produce the desired output DataFrame. You can also use this component as either an input or an output.";

    super("Transform To Table", "transformToTable", description, "pandas_df_processor", [], "transforms", codeIcon, defaultConfig, form);
  }

  public provideDependencies({ config }): string[] {
    let deps: string[] = [];
    if (Array.isArray(config.librariesToInstall)) {
      deps.push(...config.librariesToInstall);
    }
    return deps;
  }

  public provideImports({ config }): string[] {
    const imports: string[] = [];

    // Always include 'import pandas as pd'
    imports.push("import pandas as pd");
    imports.push("import numpy as np");
    imports.push("import os");

    // Backward compatibility: if config.imports exists, parse it too
    if (config.imports) {
      const importLinesFromImports = config.imports
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('import ') || line.startsWith('from '));
      imports.push(...importLinesFromImports);
    }

    // Now parse any import lines in config.code
    if (config.code) {
      const importLinesFromCode = config.code
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('import ') || line.startsWith('from '));
      imports.push(...importLinesFromCode);
    }

    return imports;
  }

  public getEnvironmentVariableSuffix(flow: Flow): string {
    let envFileNode = null;
    let envVariablesNode = null;

    // Check for environment components
    flow.nodes.forEach(node => {

      if( node.type === "envFile" ) {
        envFileNode = node;
      } 
      if( node.type === "envVariables" ) {
        envVariablesNode = node;
      }   
    });

    let variableName = '';
    if(envFileNode) { 
      for(const variable of envFileNode.data.variables) {
        if( variable.name === "ENV_VARIABLE_CUST_CODE" ) {
          variableName = "_" + variable.value || '';
          break;
        }
      }
      return variableName;  
    }

    if(envVariablesNode) { 
      for(const variable of envVariablesNode.data.variables) {
        if( variable.name === "ENV_VARIABLE_CUST_CODE" ) {
          variableName = "_" + variable.value || "_" + variable.default || '';
          break;
        }
      }
      return variableName;  
    }

    return '';
  }

  public generateComponentCode({ config, inputName, outputName }): string {
    // We only remove import lines from config.code, as config.imports is backward-compat

    console.log("KEY VALUE TRANSFORMS: Generating component code for KEY VALUE");
    console.log("KEY VALUE TRANSFORMS: config:", config);
    console.log("KEY VALUE TRANSFORMS: Input Name:", inputName);
    console.log("KEY VALUE TRANSFORMS: Output Name:", outputName);
 
    //const flow = PipelineService.filterPipeline(pipelineJson);
    //const envSuffix = this.getEnvironmentVariableSuffix(flow);

    let snippetCode = `pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None) 

# Read environment variable
env_variable_cust_code = os.getenv('ENV_VARIABLE_CUST_CODE', 'default_value')

def wide_transform(${inputName}):

  df = ${inputName}.reset_index() 
  df.columns = ['cell', 'value'] 
  df['col_letter'] = df['cell'].str.extract(r'([A-Z]+)', expand=False) 
  df['col_num'] = df['cell'].str.extract(r'(\\d+)', expand=False).astype(int)

  output = df.pivot(index='col_num', columns='col_letter', values='value')

  # Retain only alphabetic columns
  output = output[[col for col in output.columns if col.isalpha()]]

  output.index = [f"{idx}" for idx in output.index]
  #print(f"Transformed output: {output}")
  output = output.where(pd.notna(output), np.nan)
  #print(f"Transformed output with NaN handling: {output}")  
  #output = output.fillna(None)

  print(f"Transformed env_variable_cust_code: {env_variable_cust_code}")
  
  # Add CUST_CODE column with environment variable value
  output['CUST_CODE'] = env_variable_cust_code    
      
  return output

output = wide_transform(${inputName})
`;

    snippetCode = snippetCode 
      .replace(/output/g, outputName);


    console.log("KEY VALUE TRANSFORMS SNIPPET CODE:", snippetCode);

    return `\n${snippetCode}`;
  }



}