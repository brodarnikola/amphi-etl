from ldapauthenticator import LDAPAuthenticator


# jupyterhub_config.py
c = get_config()

# Use JupyterLab as the default interface
 

c.JupyterHub.authenticator_class = 'ldapauthenticator.LDAPAuthenticator'
c.LDAPAuthenticator.server_address = 'ldap://localhost'
c.LDAPAuthenticator.bind_dn_template = ['cn={username},dc=example,dc=org']  # Default in Docker LDAP 
c.LDAPAuthenticator.use_ssl = False  # ← Critical fix
#c.LDAPAuthenticator.tls_required = False  # ← Critical fix
c.LDAPAuthenticator.tls_strategy = 'insecure'  # Disable TLS completely



c.Spawner.default_url = '/lab'
# For local development, use the simple spawner
c.JupyterHub.spawner_class = 'simple'
 
# The port the hub will listen on
c.JupyterHub.hub_port = 8000

# The interface the hub will bind to
c.JupyterHub.hub_ip = '127.0.0.1'

# Whitelist users (optional)
c.Authenticator.allowed_users = {'user2', 'user3', 'admin'}

# Admin users
c.Authenticator.admin_users = {'admin'}

# Data persistence
#c.JupyterHub.cookie_secret_file = '/jupyterhub_cookie_secret'
#c.JupyterHub.db_url = '/jupyterhub.sqlite'