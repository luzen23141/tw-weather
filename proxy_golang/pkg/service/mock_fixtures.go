package service

import (
	"embed"
	"path"
)

//go:embed mock_fixtures/*
var mockFixturesFS embed.FS

func loadMockFixture(name string) string {
	b, err := mockFixturesFS.ReadFile(path.Join("mock_fixtures", name))
	if err != nil {
		return `{}`
	}
	return string(b)
}
