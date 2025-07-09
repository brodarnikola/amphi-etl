import { postgresIcon } from '../../icons';
import { BaseCoreComponent } from '../BaseCoreComponent';

export class SQLLookup extends BaseCoreComponent {
  constructor() {
    const defaultConfig = { 
      host: "localhost", 
      port: "5432", 
      databaseName: "", 
      username: "", 
      password: "", 
      schema: "public", 
      sqlQuery: "SELECT * FROM table_name WHERE column = input.DataFrame({'Username'});" 
    };

    const form = {
      fields: [
        {
          type: "input",
          label: "Host",
          id: "host",
          placeholder: "Enter database host",
          connection: "Postgres",
          advanced: true
        },
        {
          type: "input",
          label: "Port",
          id: "port",
          placeholder: "Enter database port",
          connection: "Postgres",
          advanced: true
        },
        {
          type: "input",
          label: "Database Name",
          id: "databaseName",
          placeholder: "Enter database name",
          connection: "Postgres",
          advanced: true
        },
        {
          type: "input",
          label: "Username",
          id: "username",
          placeholder: "Enter username",
          connection: "Postgres",
          advanced: true
        },
        {
          type: "input",
          label: "Password",
          id: "password",
          placeholder: "Enter password",
          connection: "Postgres",
          inputType: "password",
          advanced: true
        },
        {
          type: "input",
          label: "Schema",
          id: "schema",
          placeholder: "Enter schema name",
          advanced: true
        },
        {
          type: "codeTextarea",
          label: "SQL Query",
          height: 200,
          mode: "sql",
          placeholder: "SELECT * FROM table_name WHERE column = input.DataFrame({'Username'});",
          id: "sqlQuery",
          tooltip: 'Use input.DataFrame({\'ColumnName\'}) to reference data from the previous component.'
        }
      ],
    };

    const description = "Execute SQL queries against a database connection using data from the previous component. Use input.DataFrame({'ColumnName'}) to reference input data.";

    super("SQL Lookup", "sqlLookup", description, "pandas_df_processor", [], "processors.Databases", postgresIcon, defaultConfig, form);
  }

  public provideDependencies({ config }): string[] {
    return ['sqlalchemy', 'psycopg2-binary'];
  }

  public provideImports({ config }): string[] {
    return [
      "import pandas as pd",
      "import sqlalchemy",
      "import re"
    ];
  }

  public generateDatabaseConnectionCode({ config, connectionName }): string {
    return `
# Create database connection
${connectionName} = sqlalchemy.create_engine(
    f"postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.databaseName}"
)`;
  }

  public generateComponentCode({ config, inputName, outputName }): string {
    const connParamsName = `${outputName}_engine`;

    return `
${this.generateDatabaseConnectionCode({ config, connectionName: connParamsName })}

def process_sql_with_input_data(query, input_df):
    """
    Replace input.DataFrame({'ColumnName'}) references with actual values from the input DataFrame
    """
    import re

    if input_df is None or input_df.empty:
        print("Warning: No input data available")
        return [query]

    # Find all input.DataFrame references - support both formats
    # Pattern 1: input.DataFrame({'ColumnName'}) - with quotes and braces
    pattern1 = r"input\\.DataFrame\\(\\{['\"]([^'\"]+)['\"]\\}\\)"
    matches1 = re.findall(pattern1, query)

    # Pattern 2: input.DataFrame(ColumnName) - without quotes and braces
    pattern2 = r"input\\.DataFrame\\(([A-Za-z_][A-Za-z0-9_]*)\\)"
    matches2 = re.findall(pattern2, query)

    # Combine matches from both patterns
    matches = matches1 + matches2

    print(f"Pattern 1 matches: {matches1}")
    print(f"Pattern 2 matches: {matches2}")
    print(f"Combined column references: {matches}")

    if not matches:
        # No input references, return original query
        return [query]

    # Generate one query per row in input DataFrame
    processed_queries = []

    for index, row in input_df.iterrows():
        processed_query = query

        for column_name in matches:
            if column_name in input_df.columns:
                value = row[column_name]

                # Handle different data types for SQL
                if pd.isna(value):
                    sql_value = "NULL"
                elif isinstance(value, str):
                    # Escape single quotes in strings
                    escaped_value = str(value).replace("'", "''")
                    sql_value = f"'{escaped_value}'"
                elif isinstance(value, (int, float)):
                    sql_value = str(value)
                else:
                    # Convert to string and escape
                    escaped_value = str(value).replace("'", "''")
                    sql_value = f"'{escaped_value}'"

                # Replace the placeholder with the actual value
                placeholder = f"input.DataFrame({{'{column_name}'}})"
                processed_query = processed_query.replace(placeholder, sql_value)
            else:
                print(f"Warning: Column '{column_name}' not found in input data")

        processed_queries.append(processed_query)

    return processed_queries

# Process the SQL query
raw_query = \"\"\"${config.sqlQuery}\"\"\"
processed_queries = process_sql_with_input_data(raw_query, ${inputName})

# Execute queries and collect results
all_results = []

try:
    with ${connParamsName}.connect() as connection:
        for i, query in enumerate(processed_queries):
            print(f"Executing query {i+1}/{len(processed_queries)}: {query}")

            try:
                result = pd.read_sql(query, connection)
                if not result.empty:
                    all_results.append(result)
                    print(f"Query {i+1} returned {len(result)} rows")
                else:
                    print(f"Query {i+1} returned no rows")
            except Exception as e:
                print(f"Error executing query {i+1}: {str(e)}")
                continue

    # Combine all results
    if all_results:
        ${outputName} = pd.concat(all_results, ignore_index=True).convert_dtypes()
        print(f"Combined results: {len(${outputName})} total rows")
    else:
        ${outputName} = pd.DataFrame()
        print("No successful query results")

finally:
    ${connParamsName}.dispose()
`;
  }
}