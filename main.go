package main

import (
	"github.com/gin-gonic/gin"
	"github.com/tianhai82/sttacomp/api"
)

func main() {
	r := gin.Default()
	apiRouter := r.Group("/api")
	drawCtl := &api.DrawApiController{}
	drawCtl.AddAPIs(apiRouter)
	r.Run()
}
