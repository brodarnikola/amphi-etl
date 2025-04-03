FROM python:3.11-slim

# Install dependencies
RUN apt-get update && \
    apt-get install -y nodejs npm && \ 
    npm install -g configurable-http-proxy && \
    rm -rf /var/lib/apt/lists/*

# Install JupyterHub and JupyterLab
RUN pip install jupyterhub jupyterlab==4.2.5 jupyterlab-amphi==0.8.1

# Create directories and set permissions
RUN mkdir -p /data /home/root/notebooks && \
    chmod 777 /data /home/root/notebooks

# Create jupyterhub config
RUN mkdir -p /etc/jupyterhub
COPY jupyterhub_config.py /etc/jupyterhub/jupyterhub_config.py

# Create notebooks directory for the root user
RUN mkdir -p /home/root/notebooks && chown -R root:root /home/root

# Expose the JupyterHub port
EXPOSE 8000

# Command to run JupyterHub
CMD ["jupyterhub", "--config", "/etc/jupyterhub/jupyterhub_config.py"]

# FROM python:3.11-slim

# # Install dependencies
# RUN apt-get update && \
#     apt-get install -y nodejs npm && \
#     rm -rf /var/lib/apt/lists/*

# # Install JupyterHub and JupyterLab
# RUN pip install jupyterhub jupyterlab==4.2.5 jupyterlab-amphi==0.8.1

# # Copy Amphi customizations
# COPY amphi/theme-light /usr/local/share/jupyter/labextensions/@amphi/theme-light
# COPY amphi/ui-component /usr/local/share/jupyter/labextensions/@amphi/ui-component

# #COPY extensions/theme-light /usr/local/share/jupyter/labextensions/@amphi/theme-light
# #COPY extensions/ui-component /usr/local/share/jupyter/labextensions/@amphi/ui-component

# COPY config/labconfig/page_config.json /etc/jupyter/labconfig/page_config.json
# COPY config/settings/overrides.json /usr/local/share/jupyter/lab/settings/overrides.json

# # Create jupyterhub config
# RUN mkdir -p /etc/jupyterhub
# COPY jupyterhub_config.py /etc/jupyterhub/jupyterhub_config.py

# # Expose the JupyterHub port
# EXPOSE 8000

# # Command to run JupyterHub
# CMD ["jupyterhub", "--config", "/etc/jupyterhub/jupyterhub_config.py"]