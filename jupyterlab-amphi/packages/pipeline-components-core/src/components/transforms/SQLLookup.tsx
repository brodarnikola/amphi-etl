
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
    return ['sqlalchemy'];
  }
  
  public provideImports({ config }): string[] {
    return [
      "import pandas as pd",
      "import sqlalchemy",
      "from IPython.display import display, HTML"
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
  ${this.generateDatabaseConnectionCode({ config, connectionName: connParamsName })}
  
# Execute multiple SQL statements
execution_info = []
results = []
  
try:
    with engine.begin() as connection:
        queries = [q.strip() for q in """${config.sqlQuery}""".split(';') 
                   if q.strip() and not q.strip().startswith('--')]
 
        for i, query in enumerate(queries):
            try:
                result = connection.execute(sqlalchemy.text(query))
                  
                if result.returns_rows:
                    df = pd.DataFrame(result.fetchall(), columns=result.keys()) 
                    if not df.empty:
                        display(HTML(f"<h3>Query {i+1} Results:</h3>"))
                        display(df)
                    execution_info.append({
                        'query': query,
                        'status': 'success',
                        'rows_affected': len(df),
                        'message': f"Returned {len(df)} rows"
                    })
                else:
                    rows_affected = result.rowcount
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
  
    # Summary table
    ${outputName} = pd.DataFrame(execution_info)
  
finally:
    engine.dispose()
`;
  }


}
