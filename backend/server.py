"""
Python ASGI wrapper to launch Node.js server for supervisor/uvicorn compatibility.
The supervisor runs uvicorn server:app, which imports this module.
This wrapper starts the Node.js Express server as a subprocess.
"""
import subprocess
import sys
import os
import signal
import atexit
import asyncio
from threading import Thread

# Global process reference
node_process = None

def start_node_server():
    """Start the Node.js server as a subprocess"""
    global node_process
    
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    server_path = os.path.join(backend_dir, 'src', 'server.js')
    
    # Change to backend directory
    os.chdir(backend_dir)
    
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
    
    # Start Node.js server
    node_process = subprocess.Popen(
        ['node', server_path],
        stdout=sys.stdout,
        stderr=sys.stderr,
        env=env,
        cwd=backend_dir
    )
    
    print(f"Node.js server started with PID: {node_process.pid}")
    return node_process

def cleanup():
    """Cleanup function to terminate Node.js process"""
    global node_process
    if node_process:
        print("Terminating Node.js server...")
        node_process.terminate()
        try:
            node_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            node_process.kill()

# Register cleanup handlers
atexit.register(cleanup)

def handle_signal(signum, frame):
    """Handle termination signals"""
    cleanup()
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_signal)
signal.signal(signal.SIGINT, handle_signal)

# Start Node.js server immediately when this module is imported
start_node_server()

# Create a minimal ASGI app that uvicorn can load
# The actual requests go to Node.js via the same port
async def app(scope, receive, send):
    """
    Minimal ASGI application placeholder.
    The actual server is Node.js running on port 8001.
    This app just keeps uvicorn running.
    """
    if scope['type'] == 'lifespan':
        while True:
            message = await receive()
            if message['type'] == 'lifespan.startup':
                await send({'type': 'lifespan.startup.complete'})
            elif message['type'] == 'lifespan.shutdown':
                cleanup()
                await send({'type': 'lifespan.shutdown.complete'})
                return
    else:
        # For HTTP requests, return a redirect message
        # (though these should go to Node.js directly)
        await send({
            'type': 'http.response.start',
            'status': 200,
            'headers': [[b'content-type', b'text/plain']],
        })
        await send({
            'type': 'http.response.body',
            'body': b'NEXA EATS Node.js Backend is running',
        })
