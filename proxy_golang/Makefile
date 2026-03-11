.PHONY: build run test test-unit test-integration lint fmt clean

# Build
build:
	go build -o bin/proxy-server ./cmd/proxy

run: build
	./bin/proxy-server

# Test
test:
	go test ./... -v -count=1

test-unit:
	go test ./... -v -count=1 -short

test-integration:
	go test ./... -v -count=1 -run Integration

test-coverage:
	go test ./... -coverprofile=coverage.out -covermode=atomic
	go tool cover -html=coverage.out -o coverage.html

# Lint
lint:
	golangci-lint run ./...

lint-fix:
	golangci-lint run --fix ./...

# Format
fmt:
	gofumpt -l -w .

# Clean
clean:
	rm -rf bin/ coverage.out coverage.html
