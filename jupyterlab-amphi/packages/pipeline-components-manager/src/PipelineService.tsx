import { PathExt } from '@jupyterlab/coreutils';

export class PipelineService {

  static filterPipeline(pipelineJson: string) {

    const pipeline = JSON.parse(pipelineJson);
    const pipelineFlow = pipeline.pipelines[0].flow;
    const filteredNodes = pipelineFlow.nodes.map(({ id, type, data }) => ({ id, type, data }));
    const filteredEdges = pipelineFlow.edges.map(({ id, source, target, targetHandle }) => ({ id, source, target, targetHandle }));

    const flow: Flow = {
      "nodes": filteredNodes,
      "edges": filteredEdges
    };
    return flow;
  }

  static findStartNode = (flow: Flow, componentService: any): string | null => {
    const targetMap = new Set<string>();
    flow.edges.forEach(edge => targetMap.add(edge.target));

    for (const node of flow.nodes) {
      const nodeType = componentService.getComponent(node.type)._type;
      if (!targetMap.has(node.id) && (nodeType === "pandas_df_input" || nodeType === "ibis_df_input")) {
        return node.id;
      }
    }

    return null;
  }

  static getNodeById = (pipelineJson: string, nodeId: string): any => {
    const pipeline = JSON.parse(pipelineJson);
    const pipelineFlow = pipeline.pipelines[0].flow;
    const node = pipelineFlow.nodes.find((n) => n.id === nodeId);

    if (!node) {
      return null; // Return null if the node is not found
    }

    return node;
  }

  static findStartNodes = (flow: Flow, componentService: any): string[] => {
    const targetMap = new Set<string>();
    flow.edges.forEach(edge => targetMap.add(edge.target));

    const startNodes: string[] = [];

    for (const node of flow.nodes) {
      const nodeType = componentService.getComponent(node.type)._type;

      if (!targetMap.has(node.id) && nodeType === "pandas_df_input") {
        startNodes.push(node.id);

        if (startNodes.length === 2) {
          // If we've found two start nodes, assume it's the double processor case
          return startNodes;
        }
      }
    }

    if (startNodes.length === 1) {
      // If there's only one start node, return it as an array
      return startNodes;
    }

    // If no start nodes are found, return an empty array
    return [];
  };

  static findPreviousNodeId = (flow, nodeId): string => {
    // Find the ID of the previous node
    let previousNodeId = '';
    flow.edges.forEach(edge => {
      if (edge.target === nodeId) {
        previousNodeId = edge.source;
      }
    });
    return previousNodeId;
  }

  static findMultiplePreviousNodeIds = (flow, nodeId) => {
    const previousNodesMap = new Map();

    // Group incoming edges by targetHandle
    flow.edges.forEach(edge => {
      if (edge.target === nodeId) {
        const handle = edge.targetHandle || 'default'; // Fallback to 'default' if no handle
        if (!previousNodesMap.has(handle)) {
          previousNodesMap.set(handle, []);
        }
        previousNodesMap.get(handle).push(edge.source);
      }
    });

    // Sort the map by targetHandle and flatten the result
    const sortedPreviousNodeIds = Array.from(previousNodesMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, nodeIds]) => nodeIds)
      .reduce((acc, val) => acc.concat(val), []);
    return sortedPreviousNodeIds;
  }

  static findTwoPreviousNodeIds = (flow, nodeId) => {
    let previousNodeIds = [];
    flow.edges.forEach(edge => {
      if (edge.target === nodeId) {
        previousNodeIds.push(edge.source);
      }
    });
    if (previousNodeIds.length !== 2) {
      throw new Error("Exactly two previous nodes are not found.");
    }
    return previousNodeIds;
  };

  // Function to retrieve the names of packages
  static extractPackageNames(imports: string[]): string[] {
    const standardLibraries = new Set(['json', 'pandas']);
    return imports.map((imp) => {
      let packageName = "";
      if (imp.startsWith("import ")) {
        packageName = imp.split(" ")[1].split(" as ")[0]; // For "import packageName" format
      } else if (imp.startsWith("from ")) {
        packageName = imp.split(" ")[1]; // For "from packageName import something" format
      } else {
        packageName = imp; // Assuming direct package name
      }
      if (!standardLibraries.has(packageName)) {
        return packageName;
      }
      return ""; // Return an empty string for packages in the standardLibraries set
    }).filter((pkgName, index, self) => pkgName && self.indexOf(pkgName) === index); // Removing empty strings, duplicates
  }

  static findNextNodeIds(flow: Flow, nodeId: string): string[] {
    return flow.edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
  }

  // Function to generate pip install commands from a list of package names
  static getInstallCommandsFromPackageNames(packageNames: string[]): string[] {
    return packageNames
      .filter(pkgName => pkgName.trim() !== '')
      .map(pkgName => {
        if (pkgName.includes('[')) {
          // Direct pip install for packages with extras (e.g., `ibis-framework[snowflake]`)
          return `!pip install ${pkgName} -q -q`;
        } else {
          // Standard check for regular packages
          return `
try:
    __import__("${pkgName}")
    print('${pkgName} is already installed')
except ImportError:
    !pip install ${pkgName} -q -q`;
        }
      });
  }

  static extractPythonImportPackages(code: string): string[] {
    // Regular expression to match Python import statements
    const importRegex = /^(import .+|from .+? import .+)/gm;
    let matches = code.match(importRegex) || [];
    // Process each match to format correctly
    return matches.map((importStatement) => {
      if (importStatement.startsWith('from')) {
        // If the statement starts with 'from', extract the package part before the first dot
        return importStatement.split(' ')[1].split('.')[0];
      } else {
        // Otherwise, it's a regular import, extract everything after 'import '
        return importStatement.split(' ')[1];
      }
    });
  }

  /**
   * Check if a given file is allowed to be added to the pipeline
   * @param item
   */

  static getPipelineRelativeNodePath(
    pipelinePath: string,
    nodePath: string
  ): string {
    const relativePath: string = PathExt.relative(
      PathExt.dirname(pipelinePath),
      nodePath
    );
    return relativePath;
  }

  static getComponentIdForFileExtension(
    fileExtension: string,
    componentService: any,
    defaultEngineBackend: string
  ): { id: string | null, default: any | null } {
    // Extract file extension from item.name
    if (!fileExtension) return { id: null, default: null }; // Return nulls if there is no file extension

    // Retrieve all components
    const components = componentService.getComponents();

    // List to store matching components
    const matchingComponents = [];

    // Iterate through all components
    for (const component of components) {
      // Check if the component has the _fileDrop attribute and it contains the file extension
      if (component._fileDrop && component._fileDrop.includes(fileExtension.toLowerCase())) {
        // Store the component in the list if the file extension matches
        matchingComponents.push(component);
      }
    }

    if (matchingComponents.length === 1) {
      const component = matchingComponents[0];
      return { id: component._id, default: component._default || null };
    }

    // If multiple matching components are found, check for the one with backend.engine matching defaultEngineBackend
    for (const component of matchingComponents) {
      console.log("Component._default?.backend?.engine: %o", component._default?.backend?.engine);

      if (component._default?.backend?.engine === defaultEngineBackend) {
        return { id: component._id, default: component._default || null };
      }
    }

    // If no match is found for defaultEngineBackend, return the first matching component
    if (matchingComponents.length > 0) {
      const component = matchingComponents[0];
      return { id: component._id, default: component._default || null };
    }

    // Return nulls if no matching component is found
    return { id: null, default: null };
  }


  static getLastUpdatedInPath(flow: Flow, targetId: string): string[] {
    const visited = new Set<string>();
    const lastUpdatedList: string[] = [];

    const findNodesInPath = (nodeId: string) => {
      if (visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);

      const node = flow.nodes.find(n => n.id === nodeId);
      if (node && node.data && node.data.lastUpdated) {
        lastUpdatedList.push(node.data.lastUpdated);
      }

      const dependencies = flow.edges
        .filter(edge => edge.target === nodeId)
        .map(edge => edge.source);

      dependencies.forEach(dependency => {
        findNodesInPath(dependency);
      });
    };

    findNodesInPath(targetId);

    return lastUpdatedList;
  }

  static getRelativePath(pipelinePath: string, selectedFilePath: string): string {
    const pipelineDir = PathExt.dirname(pipelinePath);
    const relativePath = PathExt.relative(pipelineDir, selectedFilePath);
    return relativePath;
  }

  static getEnvironmentVariables(pipelineJson: string): string[] {
    const flow = PipelineService.filterPipeline(pipelineJson);
    const envNodes = flow.nodes.filter(node => node.type === 'envVariables' || node.type === 'envFile');

    const variablesList = envNodes.reduce((acc, node) => {
      const variables = node.data.variables || [];
      return acc.concat(variables.map(variable => variable.name));
    }, []);

    return variablesList;
  }

  static getConnections(pipelineJson: string): any[] {
    const flow = PipelineService.filterPipeline(pipelineJson);
    const connectionsNodes = flow.nodes.filter(node => node.type === 'connection');

    const connectionsList = connectionsNodes.reduce((acc, node) => {
      return acc.concat(node.data || []);
    }, []);
    // const envFileNodes = flow.nodes.filter(node => node.type === 'envFile' );
    return connectionsList;
  }

  static extractConnections(componentService: any): Connection[] {
    const components = componentService.getComponents();
    const connectionMap: { [key: string]: ConnectionField[] } = {};

    components.forEach(component => {
      if (component._form && component._form.fields) {
        component._form.fields.forEach(field => {
          if (field.connection && !field.ignoreConnection) {
            if (!connectionMap[field.connection]) {
              connectionMap[field.connection] = [];
            }
            const existingField = connectionMap[field.connection].find(f => f.id === field.id);
            if (!existingField) {
              connectionMap[field.connection].push({ id: field.id, label: field.label });
            }
          }
        });
      }
    });

    return Object.keys(connectionMap).map(connection => ({
      connection,
      fields: connectionMap[connection]
    }));
  }

  static formatVarName = (input: string): string => {
    return input.replace(/([a-z])([A-Z])/g, '$1_$2') // Add underscore before capital letters
      .toUpperCase() // Convert to uppercase
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .replace(/\./g, '_'); // Replace dots with underscore
  };

}

export interface Node {
  id: string;
  type: string;
  data: any;
  [key: string]: any; // To include other properties with unknown names
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  data: any;
  className?: string;
  [key: string]: any; // To include other properties with unknown names
}

export interface Flow {
  nodes: Node[];
  edges: Edge[];
}

export interface Connection {
  connection: string;
  fields: ConnectionField[];
}

export interface ConnectionField {
  id: string;
  label: string;
}

export interface Pipeline {
  flow: Flow;
}
