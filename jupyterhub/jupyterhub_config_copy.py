# # jupyterhub_config.py
# from jupyterhub.auth import DummyAuthenticator

# from ldapauthenticator import LDAPAuthenticator

# # For password hashing (alternative method if notebook.auth still fails)
# #from jupyterhub.utils import hash_password
# from notebook import passwd

# # # Generate hashes (run in Python shell)
# print("new password is 11: " +  passwd('password123'))  # Copy the sha1:... output
# print("new password is 22: " +passwd('secure456'))

# jupyterhub_config.py
c = get_config()

# Use JupyterLab as the default interface
c.Spawner.default_url = '/lab'

# c.JupyterHub.authenticator_class = LDAPAuthenticator

# # LDAP server (localhost)
# c.LDAPAuthenticator.server_address = 'ldap://localhost'
# c.LDAPAuthenticator.server_port = 389
# c.LDAPAuthenticator.bind_dn_template = [
#     "uid={username},ou=users,dc=example,dc=com"
# ]
# c.Authenticator.allowed_users = set()
# c.Authenticator.admin_users = {'user1'}  # Make user1 an admin

# Allow multiple users
c.JupyterHub.authenticator_class = 'firstuseauthenticator.FirstUseAuthenticator'
c.FirstUseAuthenticator.create_users = True

# c.JupyterHub.authenticator_class = DummyAuthenticator
# c.DummyAuthenticator.password = "default_password"  # Default fallback
# c.DummyAuthenticator.users = {
#     "user1": "password123",
#     "user2": "secure456",
#     "admin": "admin789"
# }

# c.DummyAuthenticator.user_hashes = {
#     'user1': 'sha1:...',  # Paste hash from step 1
#     'user2': 'sha1:...',
#     'admin': 'sha1:...'
# }


# For local development, use the simple spawner
c.JupyterHub.spawner_class = 'simple'

# Or if you installed systemdspawner:
# c.JupyterHub.spawner_class = 'systemdspawner.SystemdSpawner'

# The port the hub will listen on
c.JupyterHub.hub_port = 8000

# The interface the hub will bind to
c.JupyterHub.hub_ip = '127.0.0.1'

# Whitelist users (optional)
c.Authenticator.allowed_users = {'user1', 'user2'}

# Admin users
c.Authenticator.admin_users = {'admin'}

# Data persistence
#c.JupyterHub.cookie_secret_file = '/jupyterhub_cookie_secret'
#c.JupyterHub.db_url = '/jupyterhub.sqlite'