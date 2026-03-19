package router

import "github.com/gin-gonic/gin"

func serviceGinModeAccessor() string {
	return gin.Mode()
}
