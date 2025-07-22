from dagster import job, op
import subprocess
import os

@op
def rename_files(context, folder_path: str):
    script_path = os.path.join(os.path.dirname(__file__), "rename_files.applescript")
    clean_path = folder_path.rstrip('/')  # Remove trailing slash
    
    try:
        subprocess.run([
            "osascript", script_path,
            clean_path, "text", "file"
        ], check=True)
        context.log.info(f"Renamed files in {clean_path}")
    except subprocess.CalledProcessError as e:
        context.log.error(f"Failed to rename files: {e}")
        raise

@job
def rename_job():
    rename_files()

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    rename_job.execute_in_process(run_config={
        "ops": {
            "rename_files": {
                "inputs": {"folder_path": current_dir}
            }
        }
    })