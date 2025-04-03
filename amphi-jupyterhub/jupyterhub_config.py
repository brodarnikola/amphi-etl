c = get_config()

# Use the JupyterLab interface for each user
c.Spawner.default_url = '/lab'

# Set Spawner to use JupyterLab
c.Spawner.cmd = ['jupyter-lab']

# Allow running as root (not recommended for production)
c.ServerApp.allow_root = True
c.Spawner.environment = {
    'JUPYTER_ENABLE_LAB': 'yes',
    'JUPYTER_PATH': '/usr/local/share/jupyter'
}

# Authentication
c.JupyterHub.authenticator_class = 'jupyterhub.auth.DummyAuthenticator'
c.DummyAuthenticator.password = "password"  # For testing only

# Set notebook directory to a location that exists
c.Spawner.notebook_dir = '/data'

# Network configuration
c.JupyterHub.hub_ip = '0.0.0.0'
c.JupyterHub.ip = '0.0.0.0'

# Allow all users (for testing)
c.Authenticator.allow_all = True

# Increase timeout to give more time for spawning
c.Spawner.http_timeout = 15

# Disable the PyPI extension manager to avoid the httpx error
c.LabApp.extension_manager_class = 'jupyterlab.extensions.manager.ReadOnlyExtensionManager'

# c = get_config()

# # Use the JupyterLab interface for each user
# c.Spawner.default_url = '/lab'

# # Set Spawner to use JupyterLab
# c.Spawner.cmd = ['jupyter-lab']  # Changed from jupyter-labhub

# # Authentication
# #c.JupyterHub.authenticator_class = 'jupyterhub.auth.PAMAuthenticator'

# # Use a simpler authenticator (DummyAuthenticator for testing)
# c.JupyterHub.authenticator_class = 'jupyterhub.auth.DummyAuthenticator'
# c.DummyAuthenticator.password = "password"  # Set a simple password for testing

# # For production, use one of these instead:
# # c.JupyterHub.authenticator_class = 'jupyterhub.auth.LocalAuthenticator'
# # c.LocalAuthenticator.create_system_users = True

# # If you want to use a specific directory for each user
# c.Spawner.notebook_dir = '/data' # '/home/{username}/notebooks'
 

# # Use this instead
# c.Spawner.environment = {
#     'JUPYTER_PATH': '/usr/local/share/jupyter'
# }

# # c.Spawner.env = {
# #     'JUPYTER_PATH': '/usr/local/share/jupyter'
# # }

# c.JupyterHub.hub_ip = '0.0.0.0'
# c.JupyterHub.ip = '0.0.0.0'


# c.Authenticator.allow_all = True
# c.ServerApp.allow_root = True