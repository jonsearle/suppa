FROM alpine:latest

# Install PocketBase
RUN apk add --no-cache wget ca-certificates
RUN wget -O /tmp/pocketbase.zip https://github.com/pocketbase/pocketbase/releases/download/v0.20.4/pocketbase_0.20.4_linux_amd64.zip && \
    unzip /tmp/pocketbase.zip -d /pb && \
    chmod +x /pb/pocketbase && \
    rm /tmp/pocketbase.zip

WORKDIR /pb

# Expose port
EXPOSE 8090

# Start PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
