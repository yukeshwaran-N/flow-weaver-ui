from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import subprocess
import sys
import tempfile
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for the local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str

@app.post("/execute")
async def execute_python(request: CodeRequest):
    try:
        # Create a temporary file to store the code
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as f:
            f.write(request.code.encode())
            temp_file_path = f.name

        # Execute the code using the current python interpreter
        result = subprocess.run(
            [sys.executable, temp_file_path],
            capture_output=True,
            text=True,
            timeout=10 # 10 second timeout
        )

        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exit_code": result.returncode,
            "success": result.returncode == 0
        }
    except subprocess.TimeoutExpired:
        return {"error": "Execution timed out", "success": False}
    except Exception as e:
        return {"error": str(e), "success": False}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
