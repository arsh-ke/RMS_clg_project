# #!/usr/bin/env python3
# """
# NEXA EATS Node.js Launcher

# This script replaces the Python/uvicorn process with Node.js.
# The supervisor config calls: uvicorn server:app
# When uvicorn imports this module, we exec() to Node.js before uvicorn binds to port 8001.
# """
# import os
# import sys

# # This runs immediately when module is imported (before uvicorn setup)
# def launch_node():
#     """Replace current process with Node.js"""
#     backend_dir = os.path.dirname(os.path.abspath(__file__))
#     server_path = os.path.join(backend_dir, 'src', 'server.js')
    
#     # Build environment with .env file variables
#     env = os.environ.copy()
#     env_file = os.path.join(backend_dir, '.env')
#     if os.path.exists(env_file):
#         with open(env_file, 'r') as f:
#             for line in f:
#                 line = line.strip()
#                 if line and not line.startswith('#') and '=' in line:
#                     key, _, value = line.partition('=')
#                     env[key.strip()] = value.strip()
    
#     os.chdir(backend_dir)
    
#     # Replace this process with Node.js
#     # os.execvpe replaces the current process entirely
#     os.execvpe('node', ['node', server_path], env)

# # Execute immediately on import - this happens before uvicorn binds to port
# launch_node()

# # Code below never executes because execvpe replaces the process
# app = None
