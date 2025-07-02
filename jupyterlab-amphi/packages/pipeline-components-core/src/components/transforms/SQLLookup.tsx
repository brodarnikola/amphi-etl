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
      sqlQuery: "SELECT * FROM table_name;\n\n-- Add more queries separated by semicolons\n-- Use input.DataFrame({'ColumnName'}) to reference data from previous component" 
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
          label: "SQL Queries",
          height: 200,
          mode: "sql",
          placeholder: '-- Enter multiple SQL queries separated by semicolons\n-- Use input.DataFrame({\'ColumnName\'}) to reference previous component data\nSELECT * FROM table1 WHERE id = input.DataFrame({\'UserId\'});\n\nINSERT INTO table2 VALUES (input.DataFrame({\'Name\'}), input.DataFrame({\'Email\'}));',
          id: "sqlQuery",
          tooltip: 'Enter multiple SQL queries separated by semicolons. Use input.DataFrame({\'ColumnName\'}) to reference data from the previous component. All queries will be executed sequentially.'
        }
      ],
    };

    const description = "Execute multiple SQL queries against a database connection. Separate queries with semicolons. Use input.DataFrame({'ColumnName'}) to reference data from previous components.";

    super("SQL Lookup", "sqlLookup", description, "pandas_df_processor", [], "processors.Databases", postgresIcon, defaultConfig, form);
  }

  public provideDependencies({ config }): string[] {
    return ['sqlalchemy'];
  }
  
  public provideImports({ config }): string[] {
    return [
      "import pandas as pd",
      "import sqlalchemy",
      "from IPython.display import display, HTML",
      "import re"
    ];
  }

  public generateDatabaseConnectionCode({ config, connectionName }): string {
    return `
# Construct SQLAlchemy connection string for PostgreSQL
${connectionName}_url = f"postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.databaseName}"
engine = sqlalchemy.create_engine(${connectionName}_url)
`;
  }

  public generateComponentCode({ config, outputName }): string {
    const connParamsName = `${outputName}`;
  
    return `
print("=== SQL Lookup Component Starting ===")
print(f"Output name: ${outputName}")
print(f"Config: ${config}")
print(f"Config code: ${config.code}")

${this.generateDatabaseConnectionCode({ config, connectionName: connParamsName })}

print("=== Database Connection Created ===")

# Check if input_df exists and log its info
if 'input_df' in locals():
    print(f"✓ Input DataFrame found with shape: {input_df.shape}")
    print(f"✓ Input DataFrame columns: {list(input_df.columns)}")
    print("✓ Input DataFrame preview:")
    print(input_df.head())
else:
    print("⚠️  No input_df found in locals()")
    input_df = None

# Function to process input DataFrame references in SQL queries
def process_sql_with_input_references(query, input_df):
    """
    Replace input.DataFrame({'ColumnName'}) references with actual values from the input DataFrame
    """
    print(f"\\n=== Processing SQL Query ===")
    print(f"Original query: {query}")
    print(f"Input DataFrame is None: {input_df is None}")
    
    if input_df is None:
        print("⚠️  Input DataFrame is None, returning original query")
        return [query]
    
    if input_df.empty:
        print("⚠️  Input DataFrame is empty, returning original query")
        return [query]
    
    print(f"✓ Input DataFrame has {len(input_df)} rows and {len(input_df.columns)} columns")
    
    # Find all input.DataFrame references in the query
    pattern = r"input\\.DataFrame\\(\\{'([^']+)'\\}\\)"
    matches = re.findall(pattern, query)
    print(f"Found {len(matches)} input.DataFrame references: {matches}")
    
    if not matches:
        print("No input.DataFrame references found, returning original query")
        return [query]  # No references found, return original query
    
    # Generate queries for each row in the input DataFrame
    processed_queries = []
    print(f"\\nGenerating {len(input_df)} queries (one per input row)...")
    
    for index, row in input_df.iterrows():
        print(f"\\n--- Processing row {index} ---")
        processed_query = query
        
        for column_name in matches:
            print(f"Looking for column '{column_name}'...")
            if column_name in input_df.columns:
                # Get the value for this row and column
                value = row[column_name]
                print(f"✓ Found value: {value} (type: {type(value)})")
                
                # Handle different data types for SQL
                if pd.isna(value):
                    sql_value = "NULL"
                    print("  → Converted to SQL: NULL")
                elif isinstance(value, str):
                    # Escape single quotes in strings
                    escaped_value = str(value).replace("'", "''")
                    sql_value = f"'{escaped_value}'"
                    print(f"  → Converted to SQL: {sql_value}")
                elif isinstance(value, (int, float)):
                    sql_value = str(value)
                    print(f"  → Converted to SQL: {sql_value}")
                else:
                    # Convert to string and escape
                    escaped_value = str(value).replace("'", "''")
                    sql_value = f"'{escaped_value}'"
                    print(f"  → Converted to SQL: {sql_value}")
                
                # Replace the placeholder with the actual value
                placeholder = f"input.DataFrame({{'{column_name}'}})"
                processed_query = processed_query.replace(placeholder, sql_value)
                print(f"  → Replaced '{placeholder}' with '{sql_value}'")
            else:
                print(f"❌ Column '{column_name}' not found in input DataFrame!")
                print(f"   Available columns: {list(input_df.columns)}")
                display(HTML(f"<div style='color:orange'>Warning: Column '{column_name}' not found in input DataFrame. Available columns: {list(input_df.columns)}</div>"))
        
        print(f"Final processed query: {processed_query}")
        processed_queries.append(processed_query)
    
    print(f"\\n✓ Generated {len(processed_queries)} processed queries")
    return processed_queries

# Execute multiple SQL statements
print("\\n=== Starting SQL Execution ===")
execution_info = []
results = []

try:
    print("Creating database connection...")
    with engine.begin() as connection:
        print("✓ Database connection established")
        
        # Split queries by semicolon and clean them
        raw_sql = """${config.sqlQuery}"""
        print(f"\\nRaw SQL input: {raw_sql}")
        
        raw_queries = [q.strip() for q in raw_sql.split(';') 
                      if q.strip() and not q.strip().startswith('--')]
        print(f"✓ Split into {len(raw_queries)} raw queries: {raw_queries}")
        
        query_counter = 1
        
        for i, raw_query in enumerate(raw_queries):
            print(f"\\n=== Processing Raw Query {i+1}/{len(raw_queries)} ===")
            print(f"Raw query: {raw_query}")
            
            try:
                # Process each query to handle input DataFrame references
                processed_queries = process_sql_with_input_references(raw_query, input_df)
                print(f"✓ Generated {len(processed_queries)} processed queries")
                
                for j, processed_query in enumerate(processed_queries):
                    print(f"\\n--- Executing Processed Query {j+1}/{len(processed_queries)} (Overall #{query_counter}) ---")
                    print(f"Query to execute: {processed_query}")
                    
                    try:
                        display(HTML(f"<h4>Executing Query {query_counter}:</h4>"))
                        display(HTML(f"<pre style='background-color:#f5f5f5; padding:10px; border-radius:5px;'>{processed_query}</pre>"))
                        
                        print("Executing SQL...")
                        result = connection.execute(sqlalchemy.text(processed_query))
                        print("✓ SQL executed successfully")
                        
                        if result.returns_rows:
                            print("Query returns rows, fetching data...")
                            df = pd.DataFrame(result.fetchall(), columns=result.keys()) 
                            print(f"✓ Fetched {len(df)} rows")
                            
                            if not df.empty:
                                display(HTML(f"<h4>Query {query_counter} Results ({len(df)} rows):</h4>"))
                                display(df)
                                results.append(df)
                                print("✓ Results displayed and stored")
                            else:
                                display(HTML(f"<div style='color:blue'>Query {query_counter} executed successfully but returned no rows.</div>"))
                                results.append(pd.DataFrame())
                                print("ℹ️  Query returned no rows")
                            
                            execution_info.append({
                                'query_number': query_counter,
                                'query': processed_query[:100] + '...' if len(processed_query) > 100 else processed_query,
                                'status': 'success',
                                'rows_affected': len(df),
                                'message': f"Returned {len(df)} rows"
                            })
                        else:
                            rows_affected = result.rowcount
                            print(f"✓ Query affected {rows_affected} rows")
                            display(HTML(f"<div style='color:green'>Query {query_counter} executed successfully. Affected {rows_affected} rows.</div>"))
                            execution_info.append({
                                'query_number': query_counter,
                                'query': processed_query[:100] + '...' if len(processed_query) > 100 else processed_query,
                                'status': 'success',
                                'rows_affected': rows_affected,
                                'message': f"Affected {rows_affected} rows"
                            })
                            
                    except Exception as e:
                        print(f"❌ Query {query_counter} failed with error: {str(e)}")
                        print(f"❌ Error type: {type(e)}")
                        import traceback
                        print(f"❌ Full traceback: {traceback.format_exc()}")
                        
                        results.append(None)
                        display(HTML(f"<h4 style='color:red'>Query {query_counter} Failed:</h4>"))
                        display(HTML(f"<pre style='color:red; background-color:#ffebee; padding:10px; border-radius:5px;'>{str(e)}</pre>"))
                        execution_info.append({
                            'query_number': query_counter,
                            'query': processed_query[:100] + '...' if len(processed_query) > 100 else processed_query,
                            'status': 'failed',
                            'rows_affected': 0,
                            'message': str(e)
                        })
                    
                    query_counter += 1
                    
            except Exception as e:
                print(f"❌ Error processing raw query {i+1}: {str(e)}")
                print(f"❌ Error type: {type(e)}")
                import traceback
                print(f"❌ Full traceback: {traceback.format_exc()}")
                
                display(HTML(f"<h4 style='color:red'>Error processing query {i+1}:</h4>"))
                display(HTML(f"<pre style='color:red; background-color:#ffebee; padding:10px; border-radius:5px;'>{str(e)}</pre>"))
                
                execution_info.append({
                    'query_number': query_counter,
                    'query': raw_query[:100] + '...' if len(raw_query) > 100 else raw_query,
                    'status': 'failed',
                    'rows_affected': 0,
                    'message': f"Processing error: {str(e)}"
                })
                query_counter += 1
    
    print("\\n=== Creating Summary ===")
    # Create summary DataFrame
    ${outputName} = pd.DataFrame(execution_info)
    print(f"✓ Created summary with {len(execution_info)} entries")
    
    if not ${outputName}.empty:
        display(HTML("<h3>Execution Summary:</h3>"))
        display(${outputName})
        print("✓ Summary displayed")
    
    # If there are successful SELECT results, combine them or return the last one
    successful_results = [r for r in results if r is not None and not r.empty]
    print(f"Found {len(successful_results)} successful results")
    
    if successful_results:
        # Return the last successful result as the main output
        ${outputName}_data = successful_results[-1]
        print(f"✓ Set output data to last successful result with shape {${outputName}_data.shape}")
    else:
        ${outputName}_data = pd.DataFrame()
        print("⚠️  No successful results, returning empty DataFrame")

except Exception as e:
    print(f"❌ CRITICAL ERROR in SQL execution: {str(e)}")
    print(f"❌ Error type: {type(e)}")
    import traceback
    print(f"❌ Full traceback: {traceback.format_exc()}")
    
    display(HTML(f"<h3 style='color:red'>Critical Error:</h3>"))
    display(HTML(f"<pre style='color:red; background-color:#ffebee; padding:10px; border-radius:5px;'>{str(e)}\\n\\n{traceback.format_exc()}</pre>"))
    
    # Create error summary
    ${outputName} = pd.DataFrame([{
        'query_number': 1,
        'query': 'CRITICAL_ERROR',
        'status': 'failed',
        'rows_affected': 0,
        'message': str(e)
    }])
    ${outputName}_data = pd.DataFrame()

finally:
    print("\\n=== Cleanup ===")
    try:
        engine.dispose()
        print("✓ Database engine disposed")
    except Exception as e:
        print(f"⚠️  Error disposing engine: {str(e)}")

print("\\n=== SQL Lookup Component Completed ===")
`;
  }
}