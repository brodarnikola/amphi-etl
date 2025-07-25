// ================================================
// CodeGeneratorDagster.ts - Fixed Version
// ================================================

import {
  PipelineService, Node, Flow
} from './PipelineService';
import { BaseCodeGenerator, NodeObject } from './BaseCodeGenerator';


export class CodeGeneratorDagster extends BaseCodeGenerator {
  static generateDagsterCode(
    pipelineJson: string,
    commands: any,
    componentService: any,
    variablesAutoNaming: boolean
  ): string {
    console.log("Inside generateDagsterCode method");

    const flow = PipelineService.filterPipeline(pipelineJson);
    const { nodesToTraverse, nodesMap, nodeDependencies } = this.computeNodesToTraverse(
      flow,
      'none',
      componentService
    );

    console.log("Nodes to traverse:", nodesToTraverse);
    console.log("flow 2:", flow);
    console.log("componentService:", componentService);

    const dagsterImports = [
      'import dagster',
      'from dagster import op, job, Out, In, Nothing'
    ];

    const envVariablesCode = this.getEnvironmentVariableCode(pipelineJson, componentService);
    const connectionsCode = this.getConnectionCode(pipelineJson, componentService);

    const opDefinitions: string[] = [];
    const uniqueImports = new Set<string>();
    const uniqueDependencies = new Set<string>();
    const uniqueFunctions = new Set<string>();

    // Track default component names and their counts
    const defaultNameCounts = new Map<string, number>();
    const usedOpNames = new Set<string>();
    const nodeToOpName = new Map<string, string>();
    const variableNames = new Map<string, string>();

    // Collect imports, dependencies, and functions
    for (const nodeId of nodesToTraverse) {
      const node = nodesMap.get(nodeId);
      if (!node) continue;
      const config: any = node.data;
      const component = componentService.getComponent(node.type);
      component.provideImports({ config }).forEach(imp => uniqueImports.add(imp));
      if (typeof component.provideDependencies === 'function') {
        component.provideDependencies({ config }).forEach(d => uniqueDependencies.add(d));
      }
      if (typeof component.provideFunctions === 'function') {
        component.provideFunctions({ config }).forEach(f => uniqueFunctions.add(f));
      }
    }

    // First pass: Count how many times each default name appears
    for (const nodeId of nodesToTraverse) {
      const node = nodesMap.get(nodeId);
      if (!node) continue;
      const config: any = node.data as any;
      
      // Only count components that use default naming (no custom title)
      if (!config.customTitle || config.customTitle.trim() === '') {
        const defaultName = this.generateReadableName(node.type);
        defaultNameCounts.set(defaultName, (defaultNameCounts.get(defaultName) || 0) + 1);
      }
    }

    // Generate op definitions with unique names
    const defaultNameCounters = new Map<string, number>();
    let envSuffix = "";
    
    for (const nodeId of nodesToTraverse) {
      const node = nodesMap.get(nodeId);
      if (!node) continue;

      const config: any = node.data as any;
      const component = componentService.getComponent(node.type);
      const componentType = component._type;

      let opName: string;
      let variableName: string;
      
      const flow = PipelineService.filterPipeline(pipelineJson);
      envSuffix = this.getEnvironmentSuffix(flow);

      console.log(`envSuffix: ${envSuffix}`);

      // Check if this component has a custom title
      if (config.customTitle && config.customTitle.trim() !== '') {
        // For custom titles, use the custom title directly (no numbering)
        opName = this.generateReadableName(config.customTitle);
        
        // Ensure uniqueness for custom titles
        let counter = 1;
        let finalOpName = opName;
        while (usedOpNames.has(finalOpName)) {
          finalOpName = opName.replace('Op', '') + counter + 'Op';
          counter++;
        }
        opName = finalOpName + envSuffix; // Append environment suffix if needed
        variableName = finalOpName;
      } else {
        // For default naming, apply numbering logic based on default name
        const defaultName = this.generateReadableName(node.type);
        const totalCount = defaultNameCounts.get(defaultName) || 1;
        
        if (totalCount === 1) {
          // If there's only one instance with this default name, use base name
          opName = defaultName + envSuffix; // Append environment suffix if needed
          variableName = defaultName;
        } else {
          // If there are multiple instances, number them starting from 1
          const currentCounter = (defaultNameCounters.get(defaultName) || 0) + 1;
          defaultNameCounters.set(defaultName, currentCounter);
          // Fixed: Keep the full name and add number before "Op"
          opName = defaultName.replace('Op', '') + currentCounter + 'Op' + envSuffix;
          variableName = defaultName.replace('Op', '') + currentCounter + 'Op';
        }
      }
      
      usedOpNames.add(opName);
      nodeToOpName.set(nodeId, opName);
      variableNames.set(nodeId, variableName);

      // Determine inputs and outputs based on component type
      let opInputs: string[] = [];
      let opOutputs: string[] = [];
      let opCode: string = '';

      // Handle different component types
      switch (componentType) {
        case 'pandas_df_processor':
        case 'documents_processor':
        case 'ibis_df_processor':
        case 'pandas_df_to_documents_processor': {
          opInputs.push('input_data: pd.DataFrame');
          opOutputs.push('result: pd.DataFrame');

          const originalCode = component.generateComponentCode({
            config,
            inputName: 'input_data',
            outputName: 'result'
          });

          //opCode = originalCode;
          
          // Remove the first comment line if it exists
          opCode = originalCode.split('\n').filter(line => !line.trim().startsWith('#')).join('\n');
          break;
        }

        case 'ibis_df_double_processor':
        case 'pandas_df_double_processor': {
          opInputs.push('input_data1: pd.DataFrame');
          opInputs.push('input_data2: pd.DataFrame');
          opOutputs.push('result: pd.DataFrame');

          const originalCode = component.generateComponentCode({
            config,
            inputName1: 'input_data1',
            inputName2: 'input_data2',
            outputName: 'result'
          });

          opCode = originalCode;
          break;
        }

        case 'ibis_df_multi_processor':
        case 'pandas_df_multi_processor': {
          const inputIds = PipelineService.findMultiplePreviousNodeIds(flow, nodeId);
          for (let i = 0; i < inputIds.length; i++) {
            opInputs.push(`input_data${i + 1}: pd.DataFrame`);
          }
          opOutputs.push('result: pd.DataFrame');

          const inputNames = inputIds.map((_, i) => `input_data${i + 1}`);
          const originalCode = component.generateComponentCode({
            config,
            inputNames,
            outputName: 'result'
          });

          opCode = originalCode;
          break;
        }

        case 'pandas_df_input':
        case 'documents_input':
        case 'ibis_df_input': {
          opOutputs.push('result: pd.DataFrame');

          const originalCode = component.generateComponentCode({
            config,
            outputName: 'result'
          });

          opCode = originalCode;
          break;
        }

        case 'ibis_df_output':
        case 'pandas_df_output':
        case 'documents_output': {
          opInputs.push('input_data: pd.DataFrame');

          const originalCode = component.generateComponentCode({
            config,
            inputName: 'input_data'
          });

          opCode = originalCode;
          break;
        }

        default:
          console.warn(`Unsupported component type: ${componentType} for Dagster export`);
          continue;
      }

      const opDef = `@op
def ${opName}(${opInputs.join(', ')}):
  """ ${config.customTitle || node.type} """
  print("Starting ${opName}")
${opCode.split('\n').filter(line => line.trim() && !line.trim().startsWith('#')).map(line => '  ' + line).join('\n')}
  ${opOutputs.length > 0 ? 'return result' : 'return'}

`;

      opDefinitions.push(opDef);
    } 

    // Build job definition using the unique op names
    const jobDefinition = this.generateDagsterJobDefinition(
      flow,
      nodesMap,
      nodeDependencies,
      nodesToTraverse,
      nodeToOpName, // Pass the mapping of nodeId to opName
      variableNames, // Pass the mapping
      envSuffix
    );

    // Combine all parts
    const now = new Date();
    const dateString = now.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const dateComment = `# Source code generated by Amphi for Dagster\n# Date: ${dateString}\n`;
    const additionalDeps = `# Additional dependencies: dagster, ${Array.from(uniqueDependencies).join(', ')}\n`;

    const dagsterCode = [
      dateComment,
      additionalDeps,
      dagsterImports.join('\n'),
      '\n',
      Array.from(uniqueImports).join('\n'),
      '\n',
      envVariablesCode,
      '\n',
      connectionsCode,
      ...Array.from(uniqueFunctions),
      ...opDefinitions,
      jobDefinition
    ].join('');

    return this.formatVariables(dagsterCode);
  }

  static generateDagsterJobDefinition(
    flow: Flow,
    nodesMap: Map<string, Node>,
    nodeDependencies: Map<string, string[]>,
    nodesToTraverse: string[],
    nodeToOpName: Map<string, string>, // New parameter for node to op name mapping
    variableNames: Map<string, string>,
    envSuffix: string
  ): string {
    const processedNodes = new Set<string>();
    const resultVar = new Map<string, string>();

    // Create result variable names based on the actual op names
    for (const nodeId of nodesToTraverse) {
      const opName = variableNames.get(nodeId);
      if (!opName) continue;
      
      const rVar = opName.replace('Op', 'Result');
      resultVar.set(nodeId, rVar);
    }

    let jobCode =  `\n\n@job\ndef dagster_pipeline_${envSuffix}():\n`;
    const dependencyGraph = new Map<string, string[]>();
    
    for (const edge of flow.edges) {
      if (!nodeToOpName.has(edge.source) || !nodeToOpName.has(edge.target)) continue;
      if (!dependencyGraph.has(edge.target)) {
        dependencyGraph.set(edge.target, []);
      }
      dependencyGraph.get(edge.target)!.push(edge.source);
    }

    const startingNodes = nodesToTraverse.filter(id =>
      !dependencyGraph.has(id) || dependencyGraph.get(id)!.length === 0
    );
    
    for (const nodeId of startingNodes) {
      const op = nodeToOpName.get(nodeId);
      const r = resultVar.get(nodeId);
      if (!op || !r) continue;
      jobCode += `    ${r} = ${op}()\n`;
      processedNodes.add(nodeId);
    }

    for (const nodeId of nodesToTraverse) {
      if (processedNodes.has(nodeId)) continue;
      const op = nodeToOpName.get(nodeId);
      const r = resultVar.get(nodeId)!;
      const deps = dependencyGraph.get(nodeId) || [];

      if (!op) continue;
      if (deps.length === 0) {
        jobCode += `    ${r} = ${op}()\n`;
      } else if (deps.length === 1) {
        const src = resultVar.get(deps[0])!;
        jobCode += `    ${r} = ${op}(${src})\n`;
      } else {
        const srcList = deps.map(d => resultVar.get(d)!).join(', ');
        jobCode += `    ${r} = ${op}(${srcList})\n`;
      }
      processedNodes.add(nodeId);
    }
    return jobCode;
  }

  static generateReadableName(rawName: string): string {
    // Clean the name: remove special characters, replace spaces with underscores
    const cleanName = rawName
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

    // Convert to camelCase
    const camelCaseName = cleanName
      .split('_')
      .map((word, index) => {
        if (word.length === 0) return '';
        return index === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');

    // Ensure it starts with a letter (add 'op' prefix if it starts with a number)
    const validName = /^[a-zA-Z]/.test(camelCaseName) 
      ? camelCaseName 
      : 'op' + camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1);

    return validName + 'Op';
  }

  static getEnvironmentSuffix(flow: Flow): string {
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
        if( variable.name === "OP_SUFFIX" ) {
          variableName = "_" + variable.value || '';
          break;
        }
      }
      return variableName;  
    }

    if(envVariablesNode) { 
      for(const variable of envVariablesNode.data.variables) {
        if( variable.name === "OP_SUFFIX" ) {
          variableName = "_" + variable.value || "_" + variable.default || '';
          break;
        }
      }
      return variableName;  
    }

    return '';
  }


}