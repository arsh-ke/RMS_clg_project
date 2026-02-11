"""
NEXA EATS - Node.js Backend Launcher
This file is a wrapper to launch the Node.js backend from the Python supervisor
"""
import subprocess
import os
import sys

# Get the directory of this script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Run the Node.js server
try:
    process = subprocess.Popen(
        ['node', 'src/server.js'],
        cwd=script_dir,
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    process.wait()
except KeyboardInterrupt:
    process.terminate()
except Exception as e:
    print(f"Error starting Node.js server: {e}")
    sys.exit(1)
