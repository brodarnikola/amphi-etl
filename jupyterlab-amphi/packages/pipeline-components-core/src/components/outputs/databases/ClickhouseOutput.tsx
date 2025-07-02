import { calendarIcon } from '../../../icons';
import { BaseCoreComponent } from '../../BaseCoreComponent';

export class ClickhouseOutput extends BaseCoreComponent {
  constructor() {
    const defaultConfig = {
      host: "localhost",
      port: "8123",
      databaseName: "default",
      username: "default",
      password: "",
      ifTableExists: "fail",
      mode: "insert"
    };
    const form = {
      idPrefix: "component__form",
      fields: [
        {
          type: "input",
          label: "Host",
          id: "host",
          placeholder: "Enter ClickHouse host",
          connection: "ClickHouse",
          advanced: true
        },
        {
          type: "input",
          label: "Port",
          id: "port",
          placeholder: "Enter ClickHouse port (usually 8123 or 9000)",
          connection: "ClickHouse",
          advanced: true
        },
        {
          type: "input",
          label: "Database Name",
          id: "databaseName",
          connection: "ClickHouse",
          placeholder: "Enter database name (default: 'default')"
        },
        {
          type: "table",
          label: "Table Name",
          query: "SELECT name FROM system.tables WHERE database = '{{databaseName}}'",
          id: "tableName",
          placeholder: "Enter table name",
          clickhouseNative: true // Flag to indicate native ClickHouse query handling
        },
        {
          type: "input",
          label: "Username",
          id: "username",
          placeholder: "Enter username (default: 'default')",
          connection: "ClickHouse",
          advanced: true
        },
        {
          type: "input",
          inputType: "password",
          label: "Password",
          id: "password",
          connection: "ClickHouse",
          placeholder: "Enter password",
          advanced: true
        },
        {
          type: "radio",
          label: "If Table Exists",
          id: "ifTableExists",
          options: [
            { value: "fail", label: "Fail" },
            { value: "replace", label: "Replace" },
            { value: "append", label: "Append" }
          ],
          advanced: true
        },
        {
          type: "radio",
          label: "Mode",
          id: "mode",
          options: [
            { value: "insert", label: "INSERT" }
          ],
          advanced: true
        },
        {
          type: "dataMapping",
          label: "Mapping",
          id: "mapping",
          tooltip: "By default the mapping is inferred from the input data. By specifying a schema you override the incoming schema.",
          outputType: "relationalDatabase",
          imports: ["clickhouse-driver"],
          drivers: "clickhouse",
          query: "SELECT name AS field, type AS type FROM system.columns WHERE database = '{{databaseName}}' AND table = '{{tableName}}'",
          pythonExtraction: "column_info = [{'Field': row[0], 'Type': row[1]} for row in result]\nformatted_output = \", \".join([f\"{row['Field']} ({row['Type']})\" for row in column_info])\nprint(formatted_output)",
          typeOptions: [
            { value: "UInt8", label: "UInt8" },
            { value: "UInt16", label: "UInt16" },
            { value: "UInt32", label: "UInt32" },
            { value: "UInt64", label: "UInt64" },
            { value: "Int8", label: "Int8" },
            { value: "Int16", label: "Int16" },
            { value: "Int32", label: "Int32" },
            { value: "Int64", label: "Int64" },
            { value: "Float32", label: "Float32" },
            { value: "Float64", label: "Float64" },
            { value: "Decimal", label: "Decimal" },
            { value: "Boolean", label: "Boolean" },
            { value: "String", label: "String" },
            { value: "FixedString", label: "FixedString" },
            { value: "UUID", label: "UUID" },
            { value: "Date", label: "Date" },
            { value: "DateTime", label: "DateTime" },
            { value: "DateTime64", label: "DateTime64" },
            { value: "Enum8", label: "Enum8" },
            { value: "Enum16", label: "Enum16" },
            { value: "Array", label: "Array" },
            { value: "Tuple", label: "Tuple" },
            { value: "Nested", label: "Nested" },
            { value: "Nullable", label: "Nullable" },
            { value: "LowCardinality", label: "LowCardinality" },
            { value: "SimpleAggregateFunction", label: "SimpleAggregateFunction" },
            { value: "AggregateFunction", label: "AggregateFunction" }
          ],
          advanced: true,
          clickhouseNative: true
        }
      ],
    };
    const description = "Use ClickHouse Output to insert data into a ClickHouse table by specifying a data mapping between the incoming data and the existing table schema."

    super("ClickHouse Output", "clickhouseOutput", description, "pandas_df_output", [], "outputs.Databases", calendarIcon, defaultConfig, form);
  }

  public provideDependencies({ config }): string[] {
    return ['clickhouse-connect'];
    //return ['clickhouse-driver'];
  }

  public provideImports({ config }): string[] {
    return [
      "import pandas as pd",
      "import clickhouse_connect"
    ];
    //return ["import pandas as pd", "from clickhouse_driver import Client"];
  }

  public generateDatabaseConnectionCode({ config, connectionName }): string {
    
    const port = parseInt(config.port, 10);
    const safePort = isNaN(port) ? 8123 : port; // default to 8123 if not a number
    return `# Connect to ClickHouse using clickhouse-connect
${connectionName} = clickhouse_connect.get_client(
    host="${config.host}",
    port=${safePort},
    username="${config.username}",
    password="${config.password}",
    database="${config.databaseName}"
)
`;
  }

  public generateComponentCode({ config, inputName }): string {
    const uniqueClientName = `${inputName}Client`;
    let mappingsCode = "";
    let columnsCode = "";

    if (config.mapping && config.mapping.length > 0) {
      const renameMap = config.mapping
        .filter(map => map.input && (map.input.value || typeof map.input.value === 'number'))
        .map(map => {
          if (map.input.value != map.value) {
            if (map.input.named) {
              return `"${map.input.value}": "${map.value}"`;
            } else {
              return `${map.input.value}: "${map.value}"`;
            }
          }
          return undefined;
        })
        .filter(value => value !== undefined);

      if (renameMap.length > 0) {
        mappingsCode = `# Rename columns based on the mapping
${inputName} = ${inputName}.rename(columns={${renameMap.join(", ")}})
`;
      }

      const selectedColumns = config.mapping
        .filter(map => map.value !== null && map.value !== undefined)
        .map(map => `"${map.value}"`)
        .join(', ');

      if (selectedColumns) {
        columnsCode = `# Only keep relevant columns
${inputName} = ${inputName}[[${selectedColumns}]]
`;
      }
    }

    const connectionCode = this.generateDatabaseConnectionCode({ config, connectionName: uniqueClientName });

    // Handle different table existence behaviors
    let tableExistsHandling = "";
    if (config.ifTableExists === "replace") {
      tableExistsHandling = `
# Drop table if it exists (replace mode)
try:
    ${uniqueClientName}.execute(f"DROP TABLE IF EXISTS ${config.databaseName}.${config.tableName.value}")
except Exception as e:
    print(f"Warning: Could not drop table: {e}")
`;
    } else if (config.ifTableExists === "fail") {
      tableExistsHandling = `
# Check if table exists (fail mode)
table_exists = ${uniqueClientName}.execute(f"EXISTS TABLE ${config.databaseName}.${config.tableName.value}")
if table_exists and table_exists[0][0]:
    raise ValueError(f"Table ${config.tableName.value} already exists and ifTableExists is set to 'fail'")
`;
    }

    return `${connectionCode}
${mappingsCode}${columnsCode}${tableExistsHandling}
# Prepare data for ClickHouse insert
data = ${inputName}.to_dict('records')
columns = list(${inputName}.columns)

# Write DataFrame to ClickHouse
try:
    ${uniqueClientName}.execute(
        f"INSERT INTO ${config.databaseName}.${config.tableName.value} ({', '.join(columns)}) VALUES",
        data,
        types_check=True
    )
    print(f"Successfully inserted {len(data)} rows into ${config.tableName.value}")
finally:
    ${uniqueClientName}.disconnect()
`;
  }

  // Override the query execution for ClickHouse native client
  public generateQueryExecutionCode({ config, query }): string {
    
    const port = parseInt(config.port, 10);
    const safePort = isNaN(port) ? 8123 : port; // default to 8123 if not a number
    return `# Execute ClickHouse query using clickhouse-connect


print("  Port:", ${config.port})    
client = clickhouse_connect.get_client(
    host="${config.host}",
    port=${safePort},
    username="${config.username}",
    password="${config.password}",
    database="${config.databaseName}"
)
  
try:
    df = client.query_df("${query}")
    formatted_output = ", ".join(df.iloc[:, 0].astype(str).tolist())
    formatted_output
finally:
    client.close()
`;
  }
}
