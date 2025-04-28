from dagster import job, op
import subprocess
import os

@op
def rename_with_csharp(context, folder_path: str):
    try:
        result = subprocess.run(
            ["dotnet", "run", "--project", "DagsterDemo", "--", folder_path, "Dagster"],
            check=True,
            text=True,
            capture_output=True
        )
        context.log.info(f"Renamed files: {result.stdout}")
    except subprocess.CalledProcessError as e:
        context.log.error(f"Failed: {e.stderr}")
        raise

@job
def rename_job():
    rename_with_csharp()

if __name__ == "__main__":
    rename_job.execute_in_process(run_config={
        "ops": {
            "rename_with_csharp": {
                "inputs": {"folder_path": os.path.dirname(__file__)}
            }
        }
    })