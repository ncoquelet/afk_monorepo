package routes

import (
	"context"
	"fmt"
	"net/http"

	"github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/core"
	routeutils "github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/routes/utils"
)

func InitCanvasRoutes() {
	http.HandleFunc("/init-canvas", initCanvas)
	http.HandleFunc("/get-canvas", getCanvas)
}

func initCanvas(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to initialize canvas
	if routeutils.AdminMiddleware(w, r) {
		return
	}

	roundNumber := core.AFKBackend.CanvasConfig.Round
	canvasKey := fmt.Sprintf("canvas-%s", roundNumber)

	if core.AFKBackend.Databases.Redis.Exists(context.Background(), canvasKey).Val() == 0 {
		totalBitSize := core.AFKBackend.CanvasConfig.Canvas.Width * core.AFKBackend.CanvasConfig.Canvas.Height * core.AFKBackend.CanvasConfig.ColorsBitWidth
		totalByteSize := (totalBitSize / 8)
		if totalBitSize%8 != 0 {
			// Round up to nearest byte
			totalByteSize += 1
		}

		// Create canvas
		canvas := make([]byte, totalByteSize)
		ctx := context.Background()
		err := core.AFKBackend.Databases.Redis.Set(ctx, canvasKey, canvas, 0).Err()
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to initialize canvas")
			return
		}

		routeutils.WriteResultJson(w, fmt.Sprintf("Canvas for round %s initialized", roundNumber))
	} else {
		routeutils.WriteErrorJson(w, http.StatusConflict, fmt.Sprintf("Canvas for round %s already initialized", roundNumber))
	}
}

func getCanvas(w http.ResponseWriter, r *http.Request) {
	routeutils.SetupAccessHeaders(w)

	// Get round number from query params, default to config round
	roundNumber := r.URL.Query().Get("round")
	if roundNumber == "" {
		roundNumber = core.AFKBackend.CanvasConfig.Round
	}

	canvasKey := fmt.Sprintf("canvas-%s", roundNumber)

	ctx := context.Background()
	val, err := core.AFKBackend.Databases.Redis.Get(ctx, canvasKey).Result()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get canvas")
		return
	}

	w.Write([]byte(val))
}
