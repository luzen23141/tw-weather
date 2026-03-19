package adapter

import (
	"context"
	"os"
	"path/filepath"
	"runtime"

	"proxy_golang/pkg/model"
)

// mockUpstreamClient injects fixture data as upstream responses.
type mockUpstreamClient struct {
	doFn func(ctx context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error)
}

func (m *mockUpstreamClient) Do(ctx context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
	if m.doFn != nil {
		return m.doFn(ctx, req)
	}
	return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{}`)}, nil
}

// fixtureClient returns a client that always responds with a fixture file.
func fixtureClient(filename string) *mockUpstreamClient {
	return &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			data := mustReadFixture(filename)
			return &model.UpstreamResponse{StatusCode: 200, Body: data}, nil
		},
	}
}

// errorClient returns a client that always returns an error.
func errorClient(err error) *mockUpstreamClient {
	return &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return nil, err
		},
	}
}

// badJSONClient returns a client that returns invalid JSON.
func badJSONClient() *mockUpstreamClient {
	return &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{invalid}`)}, nil
		},
	}
}

func mustReadFixture(name string) []byte {
	_, file, _, _ := runtime.Caller(0)
	dir := filepath.Dir(file)
	data, err := os.ReadFile(filepath.Join(dir, "testdata", name))
	if err != nil {
		panic("cannot read fixture " + name + ": " + err.Error())
	}
	return data
}

func mustReadProjectFixture(relPath string) []byte {
	_, file, _, _ := runtime.Caller(0)
	root := filepath.Join(filepath.Dir(file), "..", "..")
	data, err := os.ReadFile(filepath.Join(root, relPath))
	if err != nil {
		panic("cannot read project fixture " + relPath + ": " + err.Error())
	}
	return data
}
