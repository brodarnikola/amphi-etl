import os
import secrets
c = get_config()

# Use JupyterLab as the default interface
c.Spawner.default_url = '/lab'

# Authentication configuration
c.JupyterHub.authenticator_class = 'jupyterhub.auth.DummyAuthenticator'
c.DummyAuthenticator.check_password = True
c.DummyAuthenticator.password = ""

c.DummyAuthenticator.user_hashes = {
    'user1': 'argon2:$argon2id$v=19$m=10240,t=10,p=8$P192ULVp9slQtlCLno6HHg$m0Df94tMazy29PZOpjjNnICUNjTf633QXldUdNLJtAo',
    'user2': 'argon2:$argon2id$v=19$m=10240,t=10,p=8$kbUOHEpEfMMObM6ieehsRw$pwFhKPs4AgQLOxZhvi/PP29+Yn/eXzjaBmwZ72L31Ps',
    'admin': 'argon2:$argon2id$v=19$m=10240,t=10,p=8$zZCBod0sMhnW4FKv59vYRA$a+Ls/bBvbaKF7xx7KV9iCKoxwwb6EiEwGFv7YpNKPF8'
}

# Use SimpleSpawner for better Windows compatibility
c.JupyterHub.spawner_class = 'jupyterhub.spawner.SimpleLocalProcessSpawner'
c.Spawner.notebook_dir = '/home/amphi/workspace'

# WINDOWS/WSL2 FIX: Generate cookie secret in memory instead of using file
# This avoids file permission issues on Windows filesystems
c.JupyterHub.cookie_secret = secrets.token_bytes(32)

# Alternative: Use environment variable for cookie secret
# c.JupyterHub.cookie_secret = os.environ.get('JUPYTERHUB_COOKIE_SECRET', secrets.token_bytes(32))

# WINDOWS/WSL2 FIX: Use in-memory database instead of file-based
# This also avoids permission issues
c.JupyterHub.db_url = 'sqlite:///:memory:'

# Network configuration
c.JupyterHub.port = 8000
c.JupyterHub.ip = '0.0.0.0'
c.JupyterHub.hub_ip = '0.0.0.0'
c.JupyterHub.hub_port = 8081

# User management
c.Authenticator.allowed_users = {'user1', 'user2'}
c.Authenticator.admin_users = {'admin'}

# Additional Windows/WSL2 compatibility settings
c.JupyterHub.tornado_settings = {
    'slow_spawn_timeout': 60,  # Increase timeout for slower Windows startup
}

# Disable SSL for local development (Windows often has SSL issues)
c.JupyterHub.ssl_key = ''
c.JupyterHub.ssl_cert = ''