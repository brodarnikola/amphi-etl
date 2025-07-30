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
          height: 50,
          mode: "sql",
          placeholder: "SELECT * FROM table_name WHERE column = input.DataFrame({'Username'});",
          id: "sqlQuery",
          tooltip: 'Use input.DataFrame({\'ColumnName\'}) to reference data from the previous component. Use ({\'ENV_VAR_NAME\'}) to reference environment variables.'
        }
      ],
    };

    const description = "Execute SQL queries against a database connection using data from the previous component. Use input.DataFrame({'ColumnName'}) to reference input data.";

    super("Database Lookup", "sqlLookup", description, "pandas_df_processor", [], "processors.Databases", postgresIcon, defaultConfig, form);
  }

  public provideDependencies({ config }): string[] {
    return ['sqlalchemy', 'psycopg2-binary'];
  }

  public provideImports({ config }): string[] {
    return [
      "import pandas as pd",
      "import sqlalchemy",
      "import re",
      "import os",
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
    and replace environment variable references like {'ENV_VAR_NAME'} with their values
    """

    print(f"=== SQL LOOKUP DEBUG INFO ===")
    print(f"Original query: {query}")
    print(f"Input dataframe data are 1: {input_df}")
    print(f"Input DataFrame shape: {input_df.shape if input_df is not None else 'None'}")
    print(f"Input DataFrame columns: {list(input_df.columns) if input_df is not None else 'None'}")

    # First, replace environment variables in the query
    env_pattern = r"\{'([^']+)'\}"
    env_matches = re.findall(env_pattern, query)

    print(f"Enviroment pattern: {env_pattern}")
    print(f"Environment variable matches: {env_matches}")
    
    processed_query = query
    if env_matches:
      for env_var in env_matches:
        env_value = os.getenv(env_var, f"ENV_VAR_{env_var}_NOT_FOUND")
        placeholder = f"{'{'}'{env_var}'{'}'}'"
        processed_query = processed_query.replace(placeholder, f"'{env_value}'")
        print(f"Replaced environment variable {env_var} with value: {env_value}")

    if "input.DataFrame" not in processed_query:
        #print("No input.DataFrame placeholders found. Returning original query.")
        return [processed_query]

    #if input_df is not None and not input_df.empty:
    #    print(f"Input DataFrame head (first 3 rows):")
    #    print(input_df.head(3).to_string())

    if input_df is None or input_df.empty:
        #print("Warning: No input data available")
        return [processed_query]

    pattern = r"input\.DataFrame\(([^)]+)\)"
    matches = re.findall(pattern, processed_query)

    #print(f"Raw matches 2: {matches}")

    # Extract just the column names from tuples if needed
    if matches and isinstance(matches[0], tuple):
        matches = [match[0].strip('(') for match in matches]

    #print(f"Raw matches 3: {matches}")

    # Clean up matches - remove parentheses, quotes, and whitespace
    cleaned_matches = []
    for match in matches:
        clean_match = match.strip().strip('(').strip('"').strip("'")
        cleaned_matches.append(clean_match)
    print(f"Cleaned matches: {cleaned_matches}")

    if not cleaned_matches:
        # No input references, return original query
        return [processed_query]

    # Generate one query per row in input DataFrame
    processed_queries = []    

    for index, row in input_df.iterrows():
        #processed_query = query
        row_query = processed_query

        print(f"processed_query: {row_query}")
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
              row_query = row_query.replace(placeholder, sql_value)
          else:
              print(f"Warning: Column '{column_name}' not found in input data")

        processed_queries.append(row_query)

    return processed_queries

# Process the SQL query
raw_query = """${config.sqlQuery}"""

# First, replace environment variables in the query
# Get all environment variables
all_env_vars = dict(os.environ)
print(f"All environment variables: {all_env_vars}")
print(f"Raw query before replacement: {os.environ.items()}")

# Replace literal string values that match environment variable names
for env_var, env_value in all_env_vars.items():
    # Look for 'ENV_VAR_NAME' (including quotes) and replace with 'env_value'
    placeholder = f"{env_var}"
    placeholder2 = f"'{env_var}'"
    print(f"Checking for placeholder: {placeholder} in query")
    print(f"Raw query before replacement: {placeholder2}")
    if placeholder in raw_query:
        raw_query = raw_query.replace(placeholder, f"'{env_value}'")
        print(f"Replaced '{env_var}' with '{env_value}' in query")

# check if the query starts with SELECT
if(not raw_query.upper().startswith("SELECT")):
    print("SQL query must start with SELECT statement.")
    raise ValueError("SQL query must start with SELECT statement.")

processed_queries = process_sql_with_input_data(raw_query, ${inputName})

# Check if this is a lookup query (has placeholders)
is_lookup_query = "input.DataFrame" in raw_query

# Execute queries and collect results
all_results = []

# Create a copy of input data for result building
result_df = ${inputName}.copy()

try:
    with ${connParamsName}.connect() as connection:
        if is_lookup_query:
            # For lookup queries: execute one query per row and merge results
            for i, query in enumerate(processed_queries):
                print(f"Executing query {i+1}/{len(processed_queries)}: {query}")

                try:
                    query_result = pd.read_sql(query, connection)
                    if not query_result.empty:
                        # Add row index to track which input row this result belongs to
                        query_result['_input_row_index'] = i
                        all_results.append(query_result)
                        print(f"Query {i+1} returned {len(query_result)} rows")
                    else:
                        print(f"Query {i+1} returned no rows")
                except Exception as e:
                    print(f"Error executing query {i+1}: {str(e)}")
                    continue
                    
            # Combine all query results
            if all_results:
                combined_query_results = pd.concat(all_results, ignore_index=True)
                
                # For each input row, find its corresponding query results
                final_rows = []
                for i in range(len(result_df)):
                    input_row = result_df.iloc[i].copy()
                    
                    # Find query results for this input row
                    matching_results = combined_query_results[combined_query_results['_input_row_index'] == i]
                    
                    if not matching_results.empty:
                        # For each column in query result, concatenate all values with "||" separator
                        for col in matching_results.columns:
                            if col != '_input_row_index':
                                # Get all values for this column, filter out None/null values
                                values = matching_results[col].astype(str).tolist()
                                # Filter out 'None', 'nan', 'null', empty strings
                                filtered_values = [v for v in values if v not in ['None', 'nan', 'null', '', 'NaN']]
                                
                                if filtered_values:
                                    concatenated_value = "||".join(filtered_values)
                                    input_row[col] = concatenated_value
                                else:
                                    input_row[col] = None
                    
                    final_rows.append(input_row)
                
                # Create final result DataFrame
                ${outputName} = pd.DataFrame(final_rows).convert_dtypes()
            else:
                # No query results, return original input
                ${outputName} = result_df.convert_dtypes()
        else:
            # For normal queries: execute once and merge with all input rows
            query = processed_queries[0]  # Should be only one query
            print(f"Executing normal query: {query}")
            
            try:
                query_result = pd.read_sql(query, connection)
                if not query_result.empty:
                    # For each column in query result, concatenate all values with "||" separator
                    for col in query_result.columns:
                        # Get all values for this column, filter out None/null values
                        values = query_result[col].astype(str).tolist()
                        # Filter out 'None', 'nan', 'null', empty strings
                        filtered_values = [v for v in values if v not in ['None', 'nan', 'null', '', 'NaN']]
                        
                        if filtered_values:
                            concatenated_value = "||".join(filtered_values)
                            result_df[col] = concatenated_value
                        else:
                            result_df[col] = None
                    
                    print(f"Normal query returned {len(query_result)} rows")
                else:
                    print("Normal query returned no rows")
            except Exception as e:
                print(f"Error executing normal query: {str(e)}")
            
            ${outputName} = result_df.convert_dtypes()
             
    print(f"Final result: {len(${outputName})} total rows")


finally:
    ${connParamsName}.dispose()
`;
  }
}
