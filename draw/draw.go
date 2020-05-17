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

func GetRunnerupsAndByes(pos, seedingOrder []int, runnerUpsCount, winnersCount, byesCount int) ([]int, []int, error) {
	var byelist []int
	var err error = nil
	runnerList := make([]int, 0)
	all := NewIntArray(seedingOrder)
	if runnerUpsCount > 0 {
		if byesCount >= winnersCount {
			byelist, err = GetByesFromWinnerAdjacent(seedingOrder, winnersCount)
			if err != nil {
				return nil, nil, err
			}
			all.Remove(seedingOrder[:winnersCount]...)
			all.Remove(byelist...)
			runnerList = append(runnerList, all.array[:runnerUpsCount]...)
			all.Remove(runnerList...)
			byelist = append(byelist, all.array...)
		} else {
			byelist = GetByes(pos)[:byesCount]
			all.Remove(seedingOrder[:winnersCount]...)
			all.Remove(byelist...)
			runnerList = append(runnerList, all.array[:runnerUpsCount]...)
		}

	} else {
		all.Remove(seedingOrder[0:winnersCount]...)
		byelist = all.array
	}
	return runnerList, byelist, nil
}

func GetByesFromWinnerAdjacent(pos []int, bye int) ([]int, error) {
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
