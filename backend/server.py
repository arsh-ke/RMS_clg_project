"""
Python script to run Node.js server.
This file exists because the supervisor is configured to run:
  uvicorn server:app --host 0.0.0.0 --port 8001

This script handles the uvicorn import but immediately launches Node.js
to take over port 8001 instead.

SOLUTION: We start Node.js BEFORE uvicorn can bind to port 8001.
The Python process will exit after starting Node.js, and supervisor
will see it running.
"""
import subprocess
import sys
import os
import time

def main():
    """Start the Node.js server"""
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    server_path = os.path.join(backend_dir, 'src', 'server.js')
    
    # Load environment variables from .env file
    env = os.environ.copy()
    env_file = os.path.join(backend_dir, '.env')
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env[key.strip()] = value.strip()
    
    # Start Node.js server and wait for it (blocking)
    process = subprocess.Popen(
        ['node', server_path],
        stdout=sys.stdout,
        stderr=sys.stderr,
        env=env,
        cwd=backend_dir
    )
    
    # Wait for the process to complete (this keeps the script running)
    try:
        process.wait()
    except KeyboardInterrupt:
        process.terminate()
        process.wait()

# When uvicorn imports this module, it will try to find 'app'
# We need to handle this differently - run Node.js directly instead

if __name__ == '__main__':
    main()
else:
    # This is imported by uvicorn looking for 'app'
    # We can't run Node.js here because uvicorn will bind to 8001
    # Instead, create a dummy app that tells users to check Node.js
    
    # Start Node.js in background thread
    import threading
    import signal
    import atexit
    
    node_process = None
    
    def start_node():
        global node_process
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        server_path = os.path.join(backend_dir, 'src', 'server.js')
        
        # Load environment
        env = os.environ.copy()
        env_file = os.path.join(backend_dir, '.env')
        if os.path.exists(env_file):
            with open(env_file) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env[key.strip()] = value.strip()
        
        # Use a different port for Node since uvicorn takes 8001
        # NO - we need Node on 8001. Let's just exec to Node directly.
        
        # Replace current process with Node.js
        os.chdir(backend_dir)
        os.execvpe('node', ['node', server_path], env)
    
    # Execute Node.js, replacing this Python process
    start_node()
