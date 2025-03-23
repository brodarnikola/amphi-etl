import { editIcon } from '../../icons';
import { BaseCoreComponent } from '../BaseCoreComponent';

export class InlineInput extends BaseCoreComponent {
    constructor() {

        const inlineDataDefault: string = `FirstName,LastName,Age
John,Doe,28
Jane,Smith,34
Emily,Jones,45
Michael,Brown,22
Sarah,Wilson,30`;

        const defaultConfig = { inlineData: inlineDataDefault };
        const form = {
            idPrefix: "component__form",
            fields: [
                {
                    type: "codeTextarea",
                    label: "Inline Data",
                    id: "inlineData",
                    placeholder: "Enter your CSV data here",
                    tooltip: "Type your CSV-like data directly. First line is header. For example:\nID,brand,criteria,assesement\n123,abc,Q9,Y\n145,abc,Q9,Y",
                    aiInstructions: "Generate mock CSV-like data for demonstration purposes.\nIMPORTANT: Output only raw CSV text. Limit to 20 rows unless specified otherwise by the user.",
                    aiGeneration: true,
                    aiDataSample: false,
                    aiPromptExamples: [
                      "Generate fake user data with columns: id, name, email, signup_date.",
                      "Create product inventory with fields: sku, name, category, price, in_stock.",
                      "Mock order data with: order_id, customer_id, product_id, quantity, order_date.",
                      "Generate survey results with: respondent_id, age, gender, Q1, Q2, Q3."
                    ],
                    advanced: true
                }
            ],
        };
        const description = "Use Inline Input to manually enter data you can use in the pipeline using a CSV-like format."
        super("Inline Input", "inlineInput", description, "pandas_df_input", [], "inputs", editIcon, defaultConfig, form);
    }

    public provideImports({ config }): string[] {
        return ["import pandas as pd", "from io import StringIO"];
    }

    public generateComponentCode({ config, outputName }): string {
        const inlineData = config.inlineData.trim();

        if (!inlineData) {
            throw new Error("No inline data provided.");
        }

        const code = `
${outputName}_data = """${inlineData}
"""
${outputName} = pd.read_csv(StringIO(${outputName}_data)).convert_dtypes()
`;
        return code;
    }

}
