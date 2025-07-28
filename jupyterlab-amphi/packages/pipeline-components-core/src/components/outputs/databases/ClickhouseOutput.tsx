
import { calendarIcon } from '../../../icons';
import { BaseCoreComponent } from '../../BaseCoreComponent';

export class ClickhouseOutput extends BaseCoreComponent {
  constructor() {
    const defaultConfig = {
      host: "localhost",
      port: "8123",
      databaseName: "default",
      tableName: "",
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
          //type: "input",
          type: "table",
          label: "Table Name",
          query: `SELECT name FROM system.tables where database='{{database}}';`,
          id: "tableName",
          connection: "ClickHouse",
          placeholder: "Enter table name",
          advanced: true
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
          imports: ["clickhouse_connect"],
          drivers: "clickhouse_driver",
          query: `SHOW COLUMNS FROM {{table}};`,
          pythonExtraction: `column_info = schema[["field", "type"]]\nformatted_output = ", ".join([f"{row['field']} ({row['type']})" for _, row in column_info.iterrows()])\nprint(formatted_output)`,
          //pythonExtraction: `print("Available columns in ClickHouse table:")`,
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
          advanced: true
        }
      ],
    };

    const description = "Use ClickHouse Output to insert data into a ClickHouse table by specifying a data mapping between the incoming data and the existing table schema."

    super("ClickHouse Output", "clickhouseOutput", description, "pandas_df_output", [], "outputs.Databases", calendarIcon, defaultConfig, form);
  }

  public provideDependencies({ config }): string[] {
    //return ['clickhouse-connect'];
    return ['clickhouse_connect', 'clickhouse_driver'];
  }

  public provideImports({ config }): string[] {
    return ["import pandas as pd", "import clickhouse_connect"];
  }

  public generateDatabaseConnectionCode({ config, connectionName }): string { 

   const port = parseInt(config.port, 10);
   const safePort = isNaN(port) ? 8123 : port;
   console.log("safePort 22", safePort);  
   // # Connect to ClickHouse 
   return `clickhouse_connect.get_client(
  host='${config.host}', port=${safePort}, username='${config.username}', password='${config.password}', database='${config.databaseName}'
)
`;
  } 

  public generateComponentCode({ config, inputName }): string {

    const uniqueEngineName = `${inputName}Client`;

    const port = parseInt(config.port, 10);
    const safePort = isNaN(port) ? 8123 : port;

    console.log("config.port 00", config.port);
    console.log("config.port 11", safePort);

    let mappingsCode = "";
    let columnsCode = "";

    // Handle column mapping if provided
    if (config.mapping && config.mapping.length > 0) {
      const renameMap = config.mapping
        .filter(map => map.input && (map.input.value || typeof map.input.value === 'number') && map.value)
        .map(map => {
          if (map.input.value !== map.value) {
            if (map.input.named) {
              return `"${map.input.value}": "${map.value}"`;
            } else {
              return `${map.input.value}: "${map.value}"`;
            }
          }
          return null;
        })
        .filter(value => value !== null);

      if (renameMap.length > 0) {
        mappingsCode = `
# Rename columns based on the mapping
${inputName} = ${inputName}.rename(columns={${renameMap.join(", ")}})
`;
      }

      const selectedColumns = config.mapping
        .filter(map => map.value !== null && map.value !== undefined && map.value !== "")
        .map(map => `"${map.value}"`)
        .join(', ');

      if (selectedColumns) {
        columnsCode = `
# Select only mapped columns
${inputName} = ${inputName}[[${selectedColumns}]]
`;
      }
    }

    const tableName = config.tableName.value || config.tableName;
    const ifExistsAction = config.ifTableExists;

    return `
# Connect to ClickHouse 
print(f"OLE OLE Connecting to ClickHouse at ${config.host}:${safePort} with database '${config.databaseName}'")
${inputName}Client = ${this.generateDatabaseConnectionCode({ config, connectionName: uniqueEngineName })}
print(f"Connected to ClickHouse client: {${inputName}Client}")

${mappingsCode}${columnsCode}
# Write DataFrame to ClickHouse
try:
    if "${ifExistsAction}" == "replace":
        # Drop table if exists
        try:
            ${inputName}Client.command(f"DROP TABLE IF EXISTS ${tableName}")
        except Exception as e:
            print(f"Warning: Could not drop table: {e}")

    # Insert data using ClickHouse native method
    ${inputName}Client.insert_df("${tableName}", ${inputName})
    print(f"Successfully inserted {len(${inputName})} rows into ClickHouse table '${tableName}'")

except Exception as e:
    print(f"Error inserting data into ClickHouse: {e}")
    raise
finally:
    ${inputName}Client.close()
`;
  }

  //Override the table query generation for ClickHouse-specific handling
  public generateTableQueryCode({ config, query }): string {
    const port = parseInt(config.port, 10);
    const safePort = isNaN(port) ? 8123 : port;

    return `
# Query ClickHouse tables using native client
client = clickhouse_connect.get_client(
    host="${config.host}",
    port=${safePort},
    username="${config.username}",
    password="${config.password}",
    database="${config.databaseName}"
)

try:
    # Use ClickHouse native query_df method
    tables = client.query_df("${query}")
    if len(tables) > 0:
        tables.iloc[:, 0] = tables.iloc[:, 0].astype(str).str.strip()
        formatted_output = ", ".join(tables.iloc[:, 0].tolist())
    else:
        formatted_output = ""
    print(formatted_output)
except Exception as e:
    print(f"Error querying ClickHouse: {e}")
    formatted_output = ""
finally:
    client.close()
`;
  }
}
