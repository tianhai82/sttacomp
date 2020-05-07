package main

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

// func drawGetRestHandler(w http.ResponseWriter, r *http.Request) {
// 	params := mux.Vars(r)
// 	rounds, _ := strconv.Atoi(params["rounds"])
// 	winners, _ := strconv.Atoi(params["winners"])
// 	runnerups, _ := strconv.Atoi(params["runnerups"])
// 	byes := rounds - winners - runnerups
// 	if (byes < 0) || (rounds < winners) || (rounds < runnerups) || (rounds < (runnerups + winners)) {
// 		http.Error(w, "Ensure that your inputs are valid", http.StatusInternalServerError)
// 		return
// 	}
// 	pos := make([]int, rounds, rounds)
// 	for i := 0; i < len(pos); i++ {
// 		pos[i] = i + 1
// 	}
// 	seeds := PrintSeeds(pos)
// 	var byelist []int
// 	var err error = nil
// 	var runnerList []int
// 	all := NewIntArray(seeds)
// 	if runnerups > 0 {
// 		if byes > winners {
// 			byelist, err = PrintByesForWinners(seeds, winners)
// 			if err != nil {
// 				http.Error(w, err.Error(), http.StatusInternalServerError)
// 				return
// 			}
// 			all.Remove(seeds[:winners]...)
// 			all.Remove(byelist...)
// 			runnerList = append(runnerList, all.array[:runnerups]...)
// 			all.Remove(runnerList...)
// 			byelist = append(byelist, all.array...)
// 		} else {
// 			byelist = GetByes(pos)[:byes]
// 			all.Remove(seeds[:winners]...)
// 			all.Remove(byelist...)
// 			runnerList = append(runnerList, all.array[:runnerups]...)
// 		}

// 	} else {
// 		all.Remove(seeds[0:winners]...)
// 		byelist = all.array
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	enc := json.NewEncoder(w)
// 	if err := enc.Encode(map[string][]int{"winners": seeds[0:winners], "runnerups": runnerList, "byes": byelist}); err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

func PrintByesForWinners(pos []int, bye int) ([]int, error) {
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

func PrintSeeds(pos []int) []int {
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
		k[i] = PrintSeeds(a[i])
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
