
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
      sqlQuery: "SELECT * FROM table_name;\n\n-- Add more queries separated by semicolons" 
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
          height: 300,
          mode: "sql",
          placeholder: '-- Enter multiple SQL queries separated by semicolons\nSELECT * FROM table1;\n\nINSERT INTO table2 VALUES (1, "test");\n\nDELETE FROM table3 WHERE id = 5;',
          id: "sqlQuery",
          tooltip: 'Enter multiple SQL queries separated by semicolons. All queries will be executed sequentially.'
        }
      ],
    };

    const description = "Execute multiple SQL queries against a database connection. Separate queries with semicolons.";

    super("SQL Lookup", "sqlLookup", description, "pandas_df_processor", [], "processors.Databases", postgresIcon, defaultConfig, form);
  }

  public provideDependencies({ config }): string[] {
    return ['psycopg2-binary'];
  }

  public provideImports({ config }): string[] {
    return [
      "import pandas as pd",
      "import psycopg2",
      "from psycopg2 import sql",
      "from IPython.display import display, HTML",
      "import io"
    ];
  }

  public generateDatabaseConnectionCode({ config, connectionName }): string {
    return `
# Create connection parameters
${connectionName} = {
    "host": "${config.host}",
    "port": "${config.port}",
    "database": "${config.databaseName}",
    "user": "${config.username}",
    "password": "${config.password}"
}`;
  }

  public generateComponentCode({ config, outputName }): string {
    const connParamsName = `${outputName}`;

    return `
${this.generateDatabaseConnectionCode({ config, connectionName: connParamsName })}

# Execute multiple SQL statements
execution_info = []
results = []

try:
    # Establish connection
    conn = psycopg2.connect(**${connParamsName})
    conn.autocommit = True  # Ensure DML statements commit immediately
    
    # Split queries by semicolon and filter out empty/comment-only queries
    queries = [q.strip() for q in """${config.sqlQuery}""".split(';') 
              if q.strip() and not q.strip().startswith('--')]
    
    for i, query in enumerate(queries):
        try:
            with conn.cursor() as cursor:
                # Execute the query
                cursor.execute(query)
                
                try:
                    # Try to fetch results (works for SELECT queries)
                    records = cursor.fetchall()
                    colnames = [desc[0] for desc in cursor.description]
                    df = pd.DataFrame(records, columns=colnames)
                    results.append(df)
                    display(HTML(f"<h3>Query {i+1} Results:</h3>"))
                    display(df)
                    execution_info.append({
                        'query': query,
                        'status': 'success',
                        'rows_affected': len(df),
                        'message': f"Returned {len(df)} rows"
                    })
                except psycopg2.ProgrammingError:
                    # No results to fetch (INSERT/UPDATE/DELETE)
                    rows_affected = cursor.rowcount
                    results.append(None)
                    display(HTML(f"<h3>Query {i+1} Execution:</h3>"))
                    display(HTML(f"<p>Rows affected: {rows_affected}</p>"))
                    execution_info.append({
                        'query': query,
                        'status': 'success',
                        'rows_affected': rows_affected,
                        'message': f"Affected {rows_affected} rows"
                    })
        except Exception as e:
            results.append(None)
            display(HTML(f"<h3 style='color:red'>Query {i+1} Failed:</h3>"))
            display(HTML(f"<pre style='color:red'>{str(e)}</pre>"))
            execution_info.append({
                'query': query,
                'status': 'failed',
                'rows_affected': 0,
                'message': str(e)
            })
    
    # Create summary DataFrame
    ${outputName} = pd.DataFrame(execution_info)
    display(HTML("<h2>Execution Summary:</h2>"))
    display(${outputName})
    
finally:
    if 'conn' in locals() and conn:
        conn.close()
`;
  }
}




// import { sqlServerIcon } from '../../icons'; 
// import { BaseCoreComponent } from '../BaseCoreComponent';

// export class SQLLookup  extends BaseCoreComponent {
//   constructor() {
//     const defaultConfig = {
//       connection: "",
//       queries: ""
//     };
    
//     const form = {
//       idPrefix: "component__form",
//       fields: [
//         // {
//         //   type: "select",
//         //   label: "Database Connection",
//         //   id: "connection",
//         //   placeholder: "Select database connection",
//         //   connection: "Database",
//         //   options: []
//         // },
//         {
//           type: "codeTextarea",
//           label: "SQL Queries",
//           id: "queries",
//           placeholder: "Enter your SQL queries (separate multiple queries with semicolons)",
//           mode: "sql",
//           height: 300
//         }
//       ],
//     };
    
//     const description = "Execute multiple SQL queries against a database connection. Separate queries with semicolons.";

//     super("SQL Lookup", "sqlLookup", description, "pandas_df_processor", [], "processors.Databases", sqlServerIcon, defaultConfig, form);
//   }

//   public provideImports({ config }): string[] {
//     return ["import pandas as pd", "import sqlalchemy"];
//   }

//   public generateComponentCode({ config, inputName }): string {
//     // if (!config.connection) {
//     //   return `# No database connection selected\n${inputName} = pd.DataFrame()`;
//     // }

//     const uniqueEngineName = `${inputName}Engine`;
    
//     return `
// # Create database connection
// ${uniqueEngineName} = sqlalchemy.create_engine("${config.connection}")

// # Split queries by semicolon and filter out empty queries
// queries = [q.strip() for q in """${config.queries}""".split(';') if q.strip()]

// results = []
// try:
//     for i, query in enumerate(queries):
//         # Execute each query and store result
//         result = pd.read_sql(query, ${uniqueEngineName})
//         results.append(result)
        
//         # Store each result in a separate variable
//         globals()[f"query_result_{i}"] = result
// finally:
//     ${uniqueEngineName}.dispose()

// # Combine all results into a single DataFrame if needed
// ${inputName} = pd.concat(results, axis=0) if results else pd.DataFrame()
// `;
//   }
// }