package api

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/tianhai82/sttacomp/draw"
)

type DrawApiController struct{}

func (ctl *DrawApiController) AddAPIs(router *gin.RouterGroup) {
	router.GET("/draw/winners/:winners/runnerups/:runnerups", ctl.CalculateDraw)
}

func (ctl *DrawApiController) CalculateDraw(c *gin.Context) {
	winners := c.Param("winners")
	runnerUps := c.Param("runnerups")
	winnersCount, err := strconv.Atoi(winners)
	if err != nil {
		c.AbortWithError(http.StatusBadRequest, err)
		c.Data(http.StatusBadRequest, "text/plain", []byte("Invalid input"))
		return
	}
	runnerUpsCount, err := strconv.Atoi(runnerUps)
	if err != nil {
		c.AbortWithError(http.StatusBadRequest, err)
		c.Data(http.StatusBadRequest, "text/plain", []byte("Invalid input"))
		return
	}
	if winnersCount < runnerUpsCount {
		c.AbortWithError(http.StatusBadRequest, errors.New("runner ups cannot be more than winners"))
		c.Data(http.StatusBadRequest, "text/plain", []byte("No of runner ups cannot be more than winners"))
		return
	}
	rounds, err := draw.CalcRound(winnersCount + runnerUpsCount)
	if err != nil {
		c.AbortWithError(http.StatusBadRequest, err)
		c.Data(http.StatusBadRequest, "text/plain", []byte(err.Error()))
		return
	}
	byesCount := rounds - winnersCount - runnerUpsCount
	pos := make([]int, rounds, rounds)
	for i := 0; i < len(pos); i++ {
		pos[i] = i + 1
	}
	seedingOrder := draw.GetSeedingOrder(pos)
	runnerUpsList, byeList, err := draw.GetRunnerupsAndByes(pos, seedingOrder, runnerUpsCount, winnersCount, byesCount)

	c.JSON(200, gin.H{
		"winners":   seedingOrder[:winnersCount],
		"runnerups": runnerUpsList,
		"byes":      byeList,
		"rounds":    rounds,
	})
}
