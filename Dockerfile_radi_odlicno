# Multi-stage build for even smaller final image
FROM ubuntu:22.04 as builder

ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies
RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        python3-full \
        python3-dev \
        python3-pip \
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

# Copy source code
COPY --chown=amphi:amphi ./amphi-etl /home/amphi/amphi-etl
COPY --chown=amphi:amphi ./jupyterlab-amphi /home/amphi/jupyterlab-amphi

# Build jupyterlab-amphi
WORKDIR /home/amphi/jupyterlab-amphi
RUN python3 -m pip install --user --no-cache-dir jupyterlab && \
    export PATH=$HOME/.local/bin:$PATH && \
    jlpm install && \
    jlpm run build && \
    python3 -m pip install --user --no-cache-dir .

# Build amphi-etl  
WORKDIR /home/amphi/amphi-etl
RUN cp requirements.txt requirements.txt.backup && \
    sed -i 's|jupyterlab-amphi==.*|../jupyterlab-amphi|g' requirements.txt && \
    python3 -m pip install --user --no-cache-dir -r requirements.txt && \
    python3 -m pip install --user --no-cache-dir . && \
    cp requirements.txt.backup requirements.txt

# Final stage - runtime only
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Zagreb

# Install only runtime dependencies
RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        python3 \
        python3-pip \
        libpq5 \
        nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create user
RUN useradd -ms /bin/bash amphi && \
    mkdir -p /home/amphi/workspace && \
    chown -R amphi:amphi /home/amphi

USER amphi
WORKDIR /home/amphi

# Copy built application from builder stage
COPY --from=builder --chown=amphi:amphi /home/amphi/.local /home/amphi/.local
COPY --from=builder --chown=amphi:amphi /home/amphi/amphi-etl /home/amphi/amphi-etl
COPY --from=builder --chown=amphi:amphi /home/amphi/jupyterlab-amphi /home/amphi/jupyterlab-amphi

# Create startup script
RUN echo '#!/bin/bash' > /home/amphi/start-amphi.sh && \
    echo 'export PATH=$HOME/.local/bin:$PATH' >> /home/amphi/start-amphi.sh && \
    echo 'cd /home/amphi/workspace' >> /home/amphi/start-amphi.sh && \
    echo 'if command -v amphi &> /dev/null; then' >> /home/amphi/start-amphi.sh && \
    echo '    amphi start -w /home/amphi/workspace -i 0.0.0.0 -p 8888' >> /home/amphi/start-amphi.sh && \
    echo 'else' >> /home/amphi/start-amphi.sh && \
    echo '    jupyter lab --notebook-dir=/home/amphi/workspace --ip=0.0.0.0 --port=8888 --no-browser --allow-root --ContentManager.allow_hidden=True' >> /home/amphi/start-amphi.sh && \
    echo 'fi' >> /home/amphi/start-amphi.sh && \
    chmod +x /home/amphi/start-amphi.sh

EXPOSE 8888
VOLUME ["/home/amphi/workspace"]

ENTRYPOINT ["/home/amphi/start-amphi.sh"]