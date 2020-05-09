package api

import "github.com/gin-gonic/gin"

type ApiController interface {
	AddAPIs(router *gin.RouterGroup)
}
