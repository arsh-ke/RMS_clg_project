"""
Python wrapper to launch Node.js server for supervisor compatibility.
The supervisor is configured to run uvicorn server:app, but NEXA EATS uses Node.js/Express.
This script acts as a bridge by launching the Node.js server as a subprocess.
"""
import subprocess
import sys
import os
import signal

# Path to the Node.js server
NODE_SERVER_PATH = os.path.join(os.path.dirname(__file__), 'src', 'server.js')

# Start the Node.js process
process = None

def signal_handler(signum, frame):
    """Handle termination signals gracefully"""
    global process
    if process:
        process.terminate()
        process.wait()
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

if __name__ == '__main__':
    # Change to the backend directory
    os.chdir(os.path.dirname(__file__))
    
    # Start Node.js server
    process = subprocess.Popen(
        ['node', NODE_SERVER_PATH],
        stdout=sys.stdout,
        stderr=sys.stderr,
        env={**os.environ}
    )
    
    # Wait for the process to complete
    process.wait()
