FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    curl \
    wget \
    vim \
    jq \
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Supabase CLI
RUN npm install -g supabase

# Install Vercel CLI
RUN npm install -g vercel

# Set working directory
WORKDIR /workspaces/b_qRvYZb3eZrv-1771704101499

# Switch to node user
USER node
