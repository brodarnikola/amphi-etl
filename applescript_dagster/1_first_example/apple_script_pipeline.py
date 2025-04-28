from dagster import job, op
import subprocess

@op
def run_applescript(context):
    script_path = "hello.applescript"
    
    try:
        # Run the AppleScript using osascript command
        result = subprocess.run(
            ["osascript", script_path],
            check=True,
            text=True,
            capture_output=True
        )
        context.log.info(f"AppleScript executed successfully: {result.stdout}")
    except subprocess.CalledProcessError as e:
        context.log.error(f"AppleScript failed: {e.stderr}")
        raise

@job
def applescript_job():
    run_applescript()

if __name__ == "__main__":
    result = applescript_job.execute_in_process()