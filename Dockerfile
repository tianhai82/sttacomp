FROM golang:1.23 as builder

WORKDIR /app

COPY go.* ./
RUN go mod download

COPY . ./

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -mod=readonly -v -o server

FROM alpine:3
RUN apk add --no-cache ca-certificates

COPY --from=builder /app/server /server

CMD ["/server"]
