FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Zagreb

# Install dependencies, build, and clean up in one layer
RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        python3-full \
        python3-dev \
        python3-pip \
        python3-venv \
        libpq-dev \
        libpq5 \
        build-essential \
        curl \
        ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g configurable-http-proxy && \
    # Create user early so we can use it for building
    useradd -ms /bin/bash amphi && \
    mkdir -p /home/amphi/workspace && \
    chown -R amphi:amphi /home/amphi && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

USER amphi
WORKDIR /home/amphi

# Create virtual environment
RUN python3 -m venv /home/amphi/venv
ENV PATH="/home/amphi/venv/bin:$PATH"

# Install Python packages
RUN pip install --no-cache-dir jupyterhub jupyterlab notebook

# Copy and build applications
COPY --chown=amphi:amphi ./amphi-etl /home/amphi/amphi-etl
COPY --chown=amphi:amphi ./jupyterlab-amphi /home/amphi/jupyterlab-amphi

# Build jupyterlab-amphi
WORKDIR /home/amphi/jupyterlab-amphi
RUN jlpm install && jlpm run build && pip install --no-cache-dir .

# Build amphi-etl
WORKDIR /home/amphi/amphi-etl
RUN cp requirements.txt requirements.txt.backup && \
    sed -i 's|jupyterlab-amphi==.*|../jupyterlab-amphi|g' requirements.txt && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir . && \
    cp requirements.txt.backup requirements.txt

# Clean up build artifacts as non-root user
RUN rm -rf /home/amphi/jupyterlab-amphi/node_modules \
           /home/amphi/jupyterlab-amphi/lib \
           /home/amphi/.npm \
           /home/amphi/.cache

# Switch back to root to remove build dependencies
USER root
RUN apt-get remove -y \
        python3-dev \
        build-essential \
        curl && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Switch back to amphi user
USER amphi
WORKDIR /home/amphi

# Copy configuration and create startup script
COPY --chown=amphi:amphi ./jupyterhub_2/jupyterhub_config.py /home/amphi/jupyterhub_config.py

RUN echo '#!/bin/bash' > /home/amphi/start-amphi.sh && \
    echo 'source /home/amphi/venv/bin/activate' >> /home/amphi/start-amphi.sh && \
    echo 'export PATH=/home/amphi/venv/bin:/usr/local/bin:/usr/bin:/bin' >> /home/amphi/start-amphi.sh && \
    echo 'cd /home/amphi/workspace' >> /home/amphi/start-amphi.sh && \
    echo 'echo "Starting JupyterHub with Amphi integration..."' >> /home/amphi/start-amphi.sh && \
    echo 'jupyterhub --config=/home/amphi/jupyterhub_config.py --ip=0.0.0.0 --port=8000' >> /home/amphi/start-amphi.sh && \
    chmod +x /home/amphi/start-amphi.sh

EXPOSE 8000
VOLUME ["/home/amphi/workspace"]

ENTRYPOINT ["/home/amphi/start-amphi.sh"] 