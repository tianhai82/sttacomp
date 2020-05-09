package draw

import (
	"testing"
)

func TestGetByes(t *testing.T) {
	round := 4
	maxRound := 1024
	for round <= maxRound {
		pass := testGetByesRound(round)
		if !pass {
			t.Error(round)
		}
		t.Log(round, "Passed")
		round *= 2
	}
}

func testGetByesRound(round int) bool {
	pos := getPos(round)
	byes := GetByes(pos)
	seeds := GetSeedingOrder(pos)[len(pos)/2:]
	return isReverse(seeds, byes)
}

func isReverse(seeds, byes []int) bool {
	if len(seeds) != len(byes) {
		return false
	}
	for i := 0; i < len(seeds)/2-1; i++ {
		s := seeds[i]
		b := byes[len(seeds)-i-1]
		if s != b {
			return false
		}
	}
	return true
}

func getPos(round int) []int {
	pos := make([]int, round, round)
	for i := 0; i < len(pos); i++ {
		pos[i] = i + 1
	}
	return pos
}
