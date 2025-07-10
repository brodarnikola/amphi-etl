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

    print(f"=== SQL LOOKUP DEBUG INFO ===")
    print(f"Original query: {query}")
    print(f"Input DataFrame shape: {input_df.shape if input_df is not None else 'None'}")
    print(f"Input DataFrame columns: {list(input_df.columns) if input_df is not None else 'None'}")

    if "input.DataFrame" not in query:
        print("No input.DataFrame placeholders found. Returning original query.")
        return [query]

    if input_df is not None and not input_df.empty:
        print(f"Input DataFrame head (first 3 rows):")
        print(input_df.head(3).to_string())

    if input_df is None or input_df.empty:
        print("Warning: No input data available")
        return [query]

    pattern = r"input\.DataFrame\(([^)]+)\)"
    matches = re.findall(pattern, query)

    print(f"Raw matches 2: {matches}")

    # Extract just the column names from tuples if needed
    if matches and isinstance(matches[0], tuple):
        matches = [match[0].strip('(') for match in matches]

    print(f"Raw matches 3: {matches}")

    # Clean up matches - remove parentheses, quotes, and whitespace
    cleaned_matches = []
    for match in matches:
        clean_match = match.strip().strip('(').strip('"').strip("'")
        cleaned_matches.append(clean_match)
    print(f"Cleaned matches: {cleaned_matches}")

    if not cleaned_matches:
        # No input references, return original query
        return [query]

    # Generate one query per row in input DataFrame
    processed_queries = []

    for index, row in input_df.iterrows():
        processed_query = query

        print(f"processed_query: {processed_query}")
        print(f"index: {index}")
        print(f"row: {row}")

        print(f"row values: {row.values}")  # Shows all values as an array
        print(f"row values as list: {row.tolist()}")  # Converts to a list

        for column_name in matches:
          column_name = column_name.strip()  # Remove extra whitespace
          if column_name in input_df.columns:
              value = row[column_name]
              # Handle SQL escaping and NULLs
              if pd.isna(value):
                  sql_value = "NULL"
              elif isinstance(value, str):
                  escaped_value = value.replace("'", "''")
                  sql_value = f"'{escaped_value}'"
              else:
                  sql_value = str(value)
              
              # Replace input.DataFrame(ColumnName) with the actual value
              placeholder = f"input.DataFrame({column_name})"
              processed_query = processed_query.replace(placeholder, sql_value)
          else:
              print(f"Warning: Column '{column_name}' not found in input data")

        processed_queries.append(processed_query)

    return processed_queries

# Process the SQL query
raw_query = """${config.sqlQuery}"""
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