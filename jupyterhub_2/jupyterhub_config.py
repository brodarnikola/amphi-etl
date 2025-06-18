c = get_config()

# Use JupyterLab as the default interface
c.Spawner.default_url = '/lab'

# Fix login redirect issue
c.JupyterHub.default_url = '/hub/spawn'

# Authentication configuration
c.JupyterHub.authenticator_class = 'jupyterhub.auth.DummyAuthenticator'
c.DummyAuthenticator.check_password = True
c.DummyAuthenticator.password = ""  # BLOCK fallback (empty string)

c.DummyAuthenticator.user_hashes = {
    'user1': 'argon2:$argon2id$v=19$m=10240,t=10,p=8$P192ULVp9slQtlCLno6HHg$m0Df94tMazy29PZOpjjNnICUNjTf633QXldUdNLJtAo',
    'user2': 'argon2:$argon2id$v=19$m=10240,t=10,p=8$kbUOHEpEfMMObM6ieehsRw$pwFhKPs4AgQLOxZhvi/PP29+Yn/eXzjaBmwZ72L31Ps',
    'admin': 'argon2:$argon2id$v=19$m=10240,t=10,p=8$zZCBod0sMhnW4FKv59vYRA$a+Ls/bBvbaKF7xx7KV9iCKoxwwb6EiEwGFv7YpNKPF8'
}

# Spawner configuration
c.JupyterHub.spawner_class = 'jupyterhub.spawner.SimpleLocalProcessSpawner'

# Set the notebook directory to the workspace
c.Spawner.notebook_dir = '/home/amphi/workspace'

# Ensure the spawner can find the correct Python environment and Amphi extension
c.Spawner.environment = {
    'PATH': '/home/amphi/.local/bin:/usr/local/bin:/usr/bin:/bin',
    'PYTHONPATH': '/home/amphi/.local/lib/python3.10/site-packages',
    'JUPYTER_CONFIG_DIR': '/home/amphi/.local/etc/jupyter',
    'JUPYTER_DATA_DIR': '/home/amphi/.local/share/jupyter'
}

# Specify the command to start single-user servers with explicit JupyterLab
c.Spawner.cmd = ['/home/amphi/.local/bin/jupyter-labhub']

# Alternative: If jupyter-labhub doesn't work, use this instead:
# c.Spawner.cmd = ['/home/amphi/.local/bin/jupyterhub-singleuser']
# c.Spawner.args = ['--SingleUserNotebookApp.default_url=/lab']

# Network configuration
c.JupyterHub.port = 8000
c.JupyterHub.ip = '0.0.0.0'
c.JupyterHub.hub_ip = '0.0.0.0'
c.JupyterHub.hub_port = 8081

# User management
c.Authenticator.allowed_users = {'user1', 'user2'}
c.Authenticator.admin_users = {'admin'}

# Timeout settings to help with debugging
c.Spawner.start_timeout = 60
c.Spawner.http_timeout = 30

# Ensure proper lab interface
c.Spawner.args = [
    '--allow-root',
    '--ServerApp.allow_origin=*',
    '--ServerApp.disable_check_xsrf=True'
]

# Enable debug logging
c.JupyterHub.log_level = 'DEBUG'
c.Spawner.debug = True

# Additional JupyterLab configuration
c.JupyterHub.tornado_settings = {
    'headers': {
        'Content-Security-Policy': "frame-ancestors 'self' *"
    }
}

c.LabBuildApp.minimize = False
c.LabBuildApp.dev_build = True