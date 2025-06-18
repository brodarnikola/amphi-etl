c = get_config()

# Use JupyterLab as the default interface
c.Spawner.default_url = '/lab'
#c.spawner.default_url = '/notebooks'  
#c.spawner.default_url = '/projects'  # Set the default URL to the projects page
#c.Spawner.default_url = '/lab/tree/POC_E_CONTROL'  # Set the default URL to a specific notebook

# Allow multiple users
#c.JupyterHub.authenticator_class = 'firstuseauthenticator.FirstUseAuthenticator'
#c.FirstUseAuthenticator.create_users = True

c.JupyterHub.authenticator_class = 'jupyterhub.auth.DummyAuthenticator'

c.DummyAuthenticator.check_password = True  # Enforce password checks
c.DummyAuthenticator.password = ""  # BLOCK fallback (empty string)

c.DummyAuthenticator.user_hashes = {
    'user1': 'argon2:$argon2id$v=19$m=10240,t=10,p=8$P192ULVp9slQtlCLno6HHg$m0Df94tMazy29PZOpjjNnICUNjTf633QXldUdNLJtAo',  # Replace with output from notebook.passwd('password1')
    'user2': 'argon2:$argon2id$v=19$m=10240,t=10,p=8$kbUOHEpEfMMObM6ieehsRw$pwFhKPs4AgQLOxZhvi/PP29+Yn/eXzjaBmwZ72L31Ps',  # Replace with output from notebook.passwd('password2')
    'admin': 'argon2:$argon2id$v=19$m=10240,t=10,p=8$zZCBod0sMhnW4FKv59vYRA$a+Ls/bBvbaKF7xx7KV9iCKoxwwb6EiEwGFv7YpNKPF8'   # Replace with output from notebook.passwd('adminpass')
}
 

# For local development, use the simple spawner
c.JupyterHub.spawner_class = 'simple'


#c.Spawner.notebook_dir = '/Users/nikolabrodar/workspace/POC_E_CONTROL'

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

# # Data persistence
# #c.JupyterHub.cookie_secret_file = '/jupyterhub_cookie_secret'
# #c.JupyterHub.db_url = '/jupyterhub.sqlite'


# c = get_config()
# c.JupyterHub.authenticator_class = 'nativeauthenticator.NativeAuthenticator'

# # ==== DISABLE SIGNUP & RESTRICT LOGINS ====
# c.NativeAuthenticator.open_signup = False  # Block new registrations
# c.NativeAuthenticator.allowed_users = {'user1', 'user2', 'admin'}  # Whitelist users

# # ==== PRE-SET PASSWORDS (HASHED) ====
# c.NativeAuthenticator.hashed_passwords = {
#     'user1': 'argon2:$argon2id$v=19$m=10240,t=10,p=8$P192ULVp9slQtlCLno6HHg$m0Df94tMazy29PZOpjjNnICUNjTf633QXldUdNLJtAo',  # hash for 'password1'
#     'user2': 'argon2:$argon2id$v=19$m=10240,t=10,p=8$kbUOHEpEfMMObM6ieehsRw$pwFhKPs4AgQLOxZhvi/PP29+Yn/eXzjaBmwZ72L31Ps',  # hash for 'password2'
#     'admin': 'argon2:$argon2id$v=19$m=10240,t=10,p=8$zZCBod0sMhnW4FKv59vYRA$a+Ls/bBvbaKF7xx7KV9iCKoxwwb6EiEwGFv7YpNKPF8',  # hash for 'adminpass'
# }

# c.JupyterHub.hub_port = 8000

# # The interface the hub will bind to
# c.JupyterHub.hub_ip = '127.0.0.1'

# # ==== ADMIN PERMISSIONS ====
# c.Authenticator.admin_users = {'admin'} 