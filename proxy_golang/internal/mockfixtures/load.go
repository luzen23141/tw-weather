// Package mockfixtures provides embedded JSON payloads for proxy tests.
package mockfixtures

import (
	"embed"
	"path"
)

//go:embed *.json
var fs embed.FS

// Load reads an embedded fixture by file name and falls back to an empty object.
func Load(name string) string {
	b, err := fs.ReadFile(path.Join(name))
	if err != nil {
		return `{}`
	}
	return string(b)
}
