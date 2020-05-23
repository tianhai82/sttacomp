package draw

import (
	"errors"
)

type IntArray struct {
	array []int
}

func NewIntArray(a []int) IntArray {
	newArray := append([]int{}, a...)
	return IntArray{newArray}
}

func (a *IntArray) Remove(ia ...int) {
	for _, v := range ia {
		for j := len(a.array) - 1; j >= 0; j-- {
			if a.array[j] == v {
				copy(a.array[j:], a.array[j+1:])
				a.array[len(a.array)-1] = 0 // or the zero value of T
				a.array = a.array[:len(a.array)-1]
				break
			}
		}
	}

}

func CalcRound(players int) (int, error) {
	if players <= 2 {
		return 0, errors.New("Total no. of players must be more than 2")
	}
	round := 2
	for {
		if round >= players {
			return round, nil
		}
		round *= 2
	}
}

func GetWinnersRunnerupsAndByes(pos, seedingOrder []int, runnerUpsCount, winnersCount, byesCount int) ([]int, []int, []int, error) {
	var byelist []int
	var err error
	runnerList := make([]int, 0)
	winnerList := make([]int, 0)
	all := NewIntArray(seedingOrder)
	if runnerUpsCount > 0 {
		byelist = GetByes(pos)[:byesCount]
		all.Remove(seedingOrder[:winnersCount]...)
		all.Remove(byelist...)
		runnerList = append(runnerList, all.array[:runnerUpsCount]...)
		winnerList = seedingOrder[:winnersCount]

		if anyGotBye(runnerList, byelist) && !allGotBye(seedingOrder[:winnersCount], byelist) {
			/**
			the code below gives each winner a bye if enough.
			Remove the winners and byes from all the positions.
			The rest of the positions are for runnerups
			*/
			all = NewIntArray(seedingOrder)
			runnerList = make([]int, 0)
			byelist, err = GetAdjacentPositions(winnerList, smallerOf(winnersCount, byesCount))
			if err != nil {
				return nil, nil, nil, err
			}
			all.Remove(winnerList...)
			all.Remove(byelist...)
			runnerList = append(runnerList, all.array[:runnerUpsCount]...)
			all.Remove(runnerList...)
			byelist = append(byelist, all.array...)
			/** -- the below commented code follows ITTF bye position --
			all := NewIntArray(seedingOrder)
			byesRanked := GetByes(pos)
			winnerList, err = GetAdjacentPositions(byesRanked, winnersCount)
			if err != nil {
				return nil, nil, nil, err
			}
			byeList := byesRanked[:byesCount]
			all.Remove(winnerList...)
			all.Remove(byeList...)
			runnerList = all.array
			*/
		}

	} else {
		all.Remove(seedingOrder[0:winnersCount]...)
		byelist = all.array
	}
	return winnerList, runnerList, byelist, nil
}

func smallerOf(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func anyGotBye(pos []int, byes []int) bool {
	for i := range pos {
		bye := 0
		if (pos[i] % 2) == 0 {
			bye = pos[i] - 1
		} else {
			bye = pos[i] + 1
		}
		if containsInt(byes, bye) {
			return true
		}
	}
	return false
}
func allGotBye(pos []int, byes []int) bool {
	for i := range pos {
		bye := 0
		if (pos[i] % 2) == 0 {
			bye = pos[i] - 1
		} else {
			bye = pos[i] + 1
		}
		if !containsInt(byes, bye) {
			return false
		}
	}
	return true
}
func containsInt(arr []int, a int) bool {
	for _, b := range arr {
		if b == a {
			return true
		}
	}
	return false
}

func GetAdjacentPositions(pos []int, bye int) ([]int, error) {
	if bye > len(pos) {
		return nil, errors.New("Bye positions more than total number of positions in first round")
	}
	byes := make([]int, bye, bye)
	for i, _ := range byes {
		if (pos[i] % 2) == 0 {
			byes[i] = pos[i] - 1
		} else {
			byes[i] = pos[i] + 1
		}
	}
	return byes, nil
}

func GetSeedingOrder(pos []int) []int {
	if len(pos) == 4 {
		final := []int{pos[0], pos[3], pos[2], pos[1]}
		return final
	} else if len(pos) == 8 {
		final := []int{pos[0], pos[7], pos[4], pos[3], pos[5], pos[2], pos[6], pos[1]}
		return final
	}
	playerPerQ := len(pos) / 4
	a := make([][]int, 4, 4)

	for q := 0; q < 4; q++ {
		a[q] = make([]int, playerPerQ, playerPerQ)
		copy(a[q], pos[q*playerPerQ:(q+1)*playerPerQ])
		if (q % 2) != 0 {
			for i, j := 0, len(a[q])-1; i < j; i, j = i+1, j-1 {
				a[q][i], a[q][j] = a[q][j], a[q][i]
			}
		}
	}

	k := make([][]int, 4, 4)
	for i := 0; i < 4; i++ {
		k[i] = GetSeedingOrder(a[i])
	}
	final := make([]int, len(pos), len(pos))
	for i := 0; i < len(pos)/4; i++ {
		if i == 0 {
			final[0] = k[0][0]
			final[1] = k[3][0]
			final[2] = k[2][0]
			final[3] = k[1][0]
		} else {
			final[4*i] = k[2][i]
			final[4*i+1] = k[1][i]
			final[4*i+2] = k[3][i]
			final[4*i+3] = k[0][i]
		}
	}
	return final
}

func GetByes(pos []int) []int {
	if len(pos) == 4 {
		final := []int{pos[1], pos[2]}
		return final
	} else if len(pos) == 8 {
		final := []int{pos[1], pos[6], pos[2], pos[5]}
		return final
	}
	playerPerQ := len(pos) / 4
	a := make([][]int, 4, 4)

	for q := 0; q < 4; q++ {
		a[q] = make([]int, playerPerQ, playerPerQ)
		copy(a[q], pos[q*playerPerQ:(q+1)*playerPerQ])
		if (q % 2) != 0 {
			for i, j := 0, len(a[q])-1; i < j; i, j = i+1, j-1 {
				a[q][i], a[q][j] = a[q][j], a[q][i]
			}
		}
	}

	k := make([][]int, 4, 4)
	for i := 0; i < 4; i++ {
		k[i] = GetByes(a[i])
	}
	final := make([]int, len(pos)/2, len(pos)/2)
	for i := 0; i < len(pos)/8; i++ {
		final[4*i] = k[0][i]
		final[4*i+1] = k[3][i]
		final[4*i+2] = k[1][i]
		final[4*i+3] = k[2][i]
	}
	return final
}
