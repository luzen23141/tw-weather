package router

import (
	"context"

	"github.com/gin-gonic/gin"

	"proxy_golang/pkg/model"
)

func serviceGinModeAccessor() string {
	return gin.Mode()
}

type weatherServiceStub interface {
	GetCurrentWeather(context.Context, *model.WeatherQuery) (*model.WeatherResponse, error)
	GetHourlyWeather(context.Context, *model.WeatherQuery) (*model.WeatherResponse, error)
	GetDailyWeather(context.Context, *model.WeatherQuery) (*model.WeatherResponse, error)
	GetHistoryWeather(context.Context, *model.WeatherQuery) (*model.WeatherResponse, error)
}
