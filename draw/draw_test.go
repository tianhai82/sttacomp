package draw

import (
	"sort"
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

type req struct {
	Winner   int
	Runnerup int
}
type resp struct {
	Winners   []int
	Runnerups []int
	Byes      []int
}

var expected = map[req]resp{
	{2, 1}: {
		[]int{1, 4},
		[]int{3},
		[]int{2},
	},
	{2, 2}: {
		[]int{1, 4},
		[]int{2, 3},
		[]int{},
	},
	{3, 2}: {
		[]int{1, 5, 8},
		[]int{3, 4},
		[]int{2, 6, 7},
	},
	{3, 3}: {
		[]int{1, 5, 8},
		[]int{3, 4, 6},
		[]int{2, 7},
	},
	{4, 3}: {
		[]int{1, 8, 5, 4},
		[]int{3, 7, 6},
		[]int{2},
	},
	{4, 4}: {
		[]int{1, 8, 5, 4},
		[]int{2, 3, 7, 6},
		[]int{},
	},
	{5, 4}: {
		[]int{1, 8, 9, 12, 16},
		[]int{4, 5, 6, 13},
		[]int{2, 3, 7, 10, 11, 14, 15},
	},
	{5, 5}: {
		[]int{1, 8, 9, 12, 16},
		[]int{4, 5, 6, 13, 14},
		[]int{2, 3, 7, 10, 11, 15},
	},
	{6, 5}: {
		[]int{1, 5, 8, 9, 12, 16},
		[]int{3, 4, 11, 13, 14},
		[]int{2, 7, 6, 10, 15},
	},
	{6, 6}: {
		[]int{1, 5, 8, 9, 12, 16},
		[]int{3, 4, 6, 11, 13, 14},
		[]int{2, 7, 10, 15},
	},
	{7, 6}: {
		[]int{1, 5, 8, 9, 12, 13, 16},
		[]int{3, 4, 6, 10, 11, 14},
		[]int{2, 7, 15},
	},
	{7, 7}: {
		[]int{1, 5, 8, 9, 12, 13, 16},
		[]int{3, 4, 6, 7, 10, 11, 14},
		[]int{2, 15},
	},
	{8, 7}: {
		[]int{1, 4, 5, 8, 9, 12, 13, 16},
		[]int{3, 6, 7, 10, 11, 14, 15},
		[]int{2},
	},
	{8, 8}: {
		[]int{1, 4, 5, 8, 9, 12, 13, 16},
		[]int{2, 3, 6, 7, 10, 11, 14, 15},
		[]int{},
	},
}

// func Test2ndMethod(t *testing.T) {
// 	for winner := 9; winner <= 16; winner++ {
// 		for runnerup := winner - 1; runnerup <= winner; runnerup++ {
// 			request := req{
// 				Winner:   winner,
// 				Runnerup: runnerup,
// 			}
// 			_, method, err := testReqCal(request)
// 			if err != nil {
// 				t.Log(err.Error())
// 				continue
// 			}
// 			t.Logf("Winner: %d. RunnerUp: %d. Method: %d\n", winner, runnerup, method)
// 		}
// 	}
// }

func TestCalc(t *testing.T) {
	for request, expectedResponse := range expected {
		calResp, err := testReqCal(request)
		if err != nil {
			t.Error(err)
		}
		if !respIsEqual(expectedResponse, calResp) {
			sort.Ints(calResp.Runnerups)
			sort.Ints(calResp.Winners)
			sort.Ints(calResp.Byes)
			t.Error("\n", request, "\nexpected\t", expectedResponse, "\ngotten\t\t", calResp)
		}
	}
}

func respIsEqual(resp1 resp, resp2 resp) bool {
	if !sameInts(resp1.Byes, resp2.Byes) {
		return false
	}
	if !sameInts(resp1.Winners, resp2.Winners) {
		return false
	}
	if !sameInts(resp1.Runnerups, resp2.Runnerups) {
		return false
	}
	return true
}

func sameInts(a []int, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	sort.Ints(a)
	sort.Ints(b)
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func testReqCal(request req) (resp, error) {
	rounds, err := CalcRound(request.Winner + request.Runnerup)
	if err != nil {
		return resp{}, err
	}
	byesCount := rounds - request.Winner - request.Runnerup
	pos := make([]int, rounds, rounds)
	for i := 0; i < len(pos); i++ {
		pos[i] = i + 1
	}
	seedingOrder := GetSeedingOrder(pos)
	_, runnerUpsList, byeList, err := GetWinnersRunnerupsAndByes(pos, seedingOrder, request.Runnerup, request.Winner, byesCount)
	if err != nil {
		return resp{}, err
	}
	return resp{
		Byes:      byeList,
		Runnerups: runnerUpsList,
		Winners:   seedingOrder[:request.Winner],
	}, nil
}

func testGetByesRound(round int) bool {
	pos := getPos(round)
	byes := GetByes(pos)
	seeds := GetSeedingOrder(pos)
	seeds = seeds[len(pos)/2:]
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
