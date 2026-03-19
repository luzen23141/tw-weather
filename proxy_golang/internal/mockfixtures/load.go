package mockfixtures

import (
	"embed"
	"path"
)

//go:embed *.json
var fs embed.FS

func Load(name string) string {
	b, err := fs.ReadFile(path.Join(name))
	if err != nil {
		return `{}`
	}
	return string(b)
}
