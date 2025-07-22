from dagster import job, op, Out, Output
import subprocess
from typing import Tuple

@op
def run_applescript_with_params(context, name: str, age: int):
    result = subprocess.run(
        ["osascript", "advanced_greeting.applescript", name, str(age)],
        check=True, text=True, capture_output=True
    )
    return result.stdout.strip()

@job
def advanced_applescript_job():
    run_applescript_with_params()

if __name__ == "__main__":
    result = advanced_applescript_job.execute_in_process(run_config={
        "ops": {
            "run_applescript_with_params": {
                "inputs": {"name": "Jasson", "age": 80}
            }
        }
    })