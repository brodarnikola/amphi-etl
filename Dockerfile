# Multi-stage build for even smaller final image
FROM ubuntu:22.04 as builder

ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies
RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        python3-full \
        python3-dev \
        python3-pip \
        python3-venv \
        libpq-dev \
        build-essential \
        curl \
        ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create user and directories
RUN useradd -ms /bin/bash amphi
USER amphi
WORKDIR /home/amphi

# Create and activate virtual environment
RUN python3 -m venv /home/amphi/venv
ENV PATH="/home/amphi/venv/bin:$PATH"

# Install core packages
RUN pip install --no-cache-dir jupyterhub jupyterlab notebook

# Copy source code
COPY --chown=amphi:amphi ./amphi-etl /home/amphi/amphi-etl
COPY --chown=amphi:amphi ./jupyterlab-amphi /home/amphi/jupyterlab-amphi

# Build jupyterlab-amphi
WORKDIR /home/amphi/jupyterlab-amphi
RUN jlpm install && \
    jlpm run build && \
    pip install --no-cache-dir .

# Build amphi-etl  
WORKDIR /home/amphi/amphi-etl
RUN cp requirements.txt requirements.txt.backup && \
    sed -i 's|jupyterlab-amphi==.*|../jupyterlab-amphi|g' requirements.txt && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir . && \
    cp requirements.txt.backup requirements.txt

# Final stage - runtime only
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Zagreb

# Install runtime dependencies
RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        python3 \
        python3-pip \
        python3-venv \
        libpq5 \
        curl \
        ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create user
RUN useradd -ms /bin/bash amphi && \
    mkdir -p /home/amphi/workspace && \
    chown -R amphi:amphi /home/amphi

# Install configurable-http-proxy globally (as root)
RUN npm install -g configurable-http-proxy

USER amphi
WORKDIR /home/amphi

# Copy virtual environment from builder stage
COPY --from=builder --chown=amphi:amphi /home/amphi/venv /home/amphi/venv
COPY --from=builder --chown=amphi:amphi /home/amphi/amphi-etl /home/amphi/amphi-etl
COPY --from=builder --chown=amphi:amphi /home/amphi/jupyterlab-amphi /home/amphi/jupyterlab-amphi

# Copy JupyterHub configuration
COPY --chown=amphi:amphi ./jupyterhub_2/jupyterhub_config.py /home/amphi/jupyterhub_config.py

# Create startup script with correct environment
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