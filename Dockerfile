# Use the official Golang image to create a build artifact.
# This is based on Debian and sets the GOPATH to /go.
# https://hub.docker.com/_/golang
FROM golang:1.13 as builder

# Create and change to the app directory.
WORKDIR /app

# Retrieve application dependencies.
# This allows the container build to reuse cached dependencies.
COPY go.* ./
RUN go mod download

# Copy local code to the container image.
COPY . ./

# Build the binary.
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -mod=readonly -v -o server

# FROM node:10.10-alpine as web-builder
# WORKDIR /app/web
# COPY ./web ./
# RUN node ./.yarn/releases/yarn-rc.js
# RUN node ./.yarn/releases/yarn-rc.js build

# Use the official Alpine image for a lean production container.

FROM alpine:3
RUN apk add --no-cache ca-certificates

# Copy the binary to the production image from the builder stage.
COPY --from=builder /app/server /server

# Run the web service on container startup.
CMD ["/server"]